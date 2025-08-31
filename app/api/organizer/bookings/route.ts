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

    // Check if user is organizer or admin
    if (userInfo.role !== 'ORGANIZER' && userInfo.role !== 'ADMIN') {
      return NextResponse.json({ ok: false, error: "Access denied" }, { status: 403 });
    }

    // Get events created by this organizer (or all events if admin)
    const events = await prisma.event.findMany({
      where: userInfo.role === 'ADMIN' ? {} : { organizerId: userInfo.userId },
      select: { id: true }
    });

    const eventIds = events.map(event => event.id);

    // Get recent bookings for these events
    const bookings = await prisma.booking.findMany({
      where: {
        event: {
          id: { in: eventIds }
        }
      },
      include: {
        event: {
          select: {
            title: true,
            startAt: true
          }
        },
        ticket: {
          select: {
            name: true,
            price: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to 50 most recent bookings
    });

    return NextResponse.json({ ok: true, bookings });
  } catch (error) {
    console.error('Error fetching organizer bookings:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
