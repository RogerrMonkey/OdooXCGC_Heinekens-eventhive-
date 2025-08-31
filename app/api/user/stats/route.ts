import { NextRequest, NextResponse } from 'next/server'
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

async function getUserFromReq(req: NextRequest): Promise<{ userId: string; role: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? cookieStore.get("eventhive_token")?.value;
    if (!token) return null;
    
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
    return payload;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const userInfo = await getUserFromReq(request);
    
    if (!userInfo) {
      return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userInfo.userId },
      select: {
        loyaltyPoints: true,
        createdAt: true,
        role: true
      }
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    let stats: any = {
      loyaltyPoints: user.loyaltyPoints || 0,
      memberSince: user.createdAt.getFullYear().toString()
    };

    // Role-specific stats
    if (user.role === 'ATTENDEE') {
      const bookings = await prisma.booking.findMany({
        where: { userId: userInfo.userId },
        include: {
          ticket: {
            select: { price: true }
          }
        }
      });

      stats.totalBookings = bookings.length;
      stats.totalSpent = bookings.reduce((sum, booking) => 
        sum + (booking.ticket.price * booking.quantity), 0
      );
    }

    if (user.role === 'ORGANIZER' || user.role === 'ADMIN') {
      const events = await prisma.event.findMany({
        where: user.role === 'ADMIN' ? {} : { organizerId: userInfo.userId },
        include: {
          ticketTypes: {
            include: {
              bookings: {
                where: { status: 'CONFIRMED' },
                select: { quantity: true }
              }
            }
          }
        }
      });

      stats.totalEvents = events.length;
      
      // Calculate total revenue from all events
      let totalRevenue = 0;
      for (const event of events) {
        for (const ticketType of event.ticketTypes) {
          const soldTickets = ticketType.bookings.reduce((sum, booking) => sum + booking.quantity, 0);
          totalRevenue += soldTickets * ticketType.price;
        }
      }
      stats.totalRevenue = totalRevenue;
    }

    if (user.role === 'VOLUNTEER') {
      // For volunteers, we could track events they've helped with
      // This would require additional tables to track volunteer activities
      stats.totalEvents = 0; // Events assisted
      stats.totalAttendees = 0; // People helped
    }

    return NextResponse.json({ ok: true, stats });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch stats' }, { status: 500 });
  }
}
