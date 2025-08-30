import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

async function getUserIdFromReq(req: Request): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? cookieStore.get("eventhive_token")?.value;
    if (!token) return null;
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    return payload.userId;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const userId = await getUserIdFromReq(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        events: {
          include: {
            ticketTypes: true,
            bookings: {
              where: { status: "CONFIRMED" },
              include: { ticket: true }
            }
          }
        },
        bookings: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                startAt: true,
                location: true
              }
            },
            ticket: {
              select: {
                name: true,
                price: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate analytics for organizer events
    const eventAnalytics = user.events.map(event => {
      const totalTicketsSold = event.bookings.reduce((sum, booking) => sum + booking.quantity, 0);
      const totalRevenue = event.bookings.reduce((sum, booking) => sum + (booking.quantity * booking.ticket.price), 0);
      
      return {
        eventId: event.id,
        title: event.title,
        totalTicketsSold,
        totalRevenue,
        status: event.status
      };
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      myEvents: user.events,
      myBookings: user.bookings,
      analytics: {
        totalEvents: user.events.length,
        totalBookings: user.bookings.length,
        eventAnalytics
      }
    });

  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
