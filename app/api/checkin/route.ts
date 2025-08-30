import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bookingId, qrCode, scannerId } = body;

    if (!bookingId && !qrCode) {
      return NextResponse.json({ error: "Booking ID or QR code required" }, { status: 400 });
    }

    let booking;

    // Find booking by ID or QR code
    if (bookingId) {
      booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          event: true,
          user: {
            select: { name: true, email: true, phone: true }
          },
          ticket: true,
          checkIns: true
        }
      });
    } else if (qrCode) {
      // QR code contains encrypted booking data
      try {
        const decoded = jwt.verify(qrCode, process.env.JWT_SECRET!) as any;
        booking = await prisma.booking.findUnique({
          where: { id: decoded.bookingId },
          include: {
            event: true,
            user: {
              select: { name: true, email: true, phone: true }
            },
            ticket: true,
            checkIns: true
          }
        });
      } catch (error) {
        return NextResponse.json({ error: "Invalid QR code" }, { status: 400 });
      }
    }

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "CONFIRMED") {
      return NextResponse.json({ error: "Booking not confirmed" }, { status: 400 });
    }

    if (booking.checkIns.length > 0) {
      return NextResponse.json({ 
        error: "Already checked in",
        checkedInAt: booking.checkIns[0].checkedAt
      }, { status: 400 });
    }

    // Check if event is today (allow check-in from 2 hours before to 2 hours after start time)
    const now = new Date();
    const eventStart = new Date(booking.event.startAt);
    const checkInWindowStart = new Date(eventStart.getTime() - 2 * 60 * 60 * 1000); // 2 hours before
    const checkInWindowEnd = new Date(eventStart.getTime() + 2 * 60 * 60 * 1000); // 2 hours after

    if (now < checkInWindowStart || now > checkInWindowEnd) {
      return NextResponse.json({ 
        error: "Check-in not available yet or has expired",
        eventStartTime: eventStart.toISOString()
      }, { status: 400 });
    }

    // Create check-in record
    const checkIn = await prisma.checkIn.create({
      data: {
        bookingId: booking.id,
        scannerId: scannerId || null,
        checkedAt: now
      }
    });

    return NextResponse.json({
      ok: true,
      message: "Check-in successful",
      checkIn: {
        id: checkIn.id,
        checkedAt: checkIn.checkedAt,
        quantity: booking.quantity,
        event: {
          title: booking.event.title,
          startAt: booking.event.startAt,
          location: booking.event.location
        },
        user: booking.user
      }
    });

  } catch (error) {
    console.error("Error during check-in:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Get check-in statistics for an event
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        bookings: {
          where: { status: "CONFIRMED" },
          include: {
            user: {
              select: { name: true, email: true }
            },
            checkIns: true
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const totalBookings = event.bookings.length;
    const checkedInBookings = event.bookings.filter(b => b.checkIns.length > 0).length;
    const totalTicketsSold = event.bookings.reduce((sum, b) => sum + b.quantity, 0);
    const totalTicketsCheckedIn = event.bookings
      .filter(b => b.checkIns.length > 0)
      .reduce((sum, b) => sum + b.quantity, 0);

    const checkInRate = totalBookings > 0 ? (checkedInBookings / totalBookings) * 100 : 0;

    // Recent check-ins (last 10)
    const recentCheckIns = event.bookings
      .filter(b => b.checkIns.length > 0)
      .sort((a, b) => new Date(b.checkIns[0].checkedAt).getTime() - new Date(a.checkIns[0].checkedAt).getTime())
      .slice(0, 10)
      .map(booking => ({
        id: booking.id,
        userName: booking.user?.name || 'Unknown',
        userEmail: booking.user?.email || '',
        checkedInAt: booking.checkIns[0].checkedAt,
        quantity: booking.quantity
      }));

    // Check-ins by hour
    const checkInsByHour = event.bookings
      .filter(b => b.checkIns.length > 0)
      .reduce((acc, booking) => {
        const hour = new Date(booking.checkIns[0].checkedAt).getHours();
        acc[hour] = (acc[hour] || 0) + booking.quantity;
        return acc;
      }, {} as Record<number, number>);

    return NextResponse.json({
      ok: true,
      stats: {
        totalBookings,
        checkedInBookings,
        totalTicketsSold,
        totalTicketsCheckedIn,
        checkInRate: Math.round(checkInRate * 100) / 100,
        pendingCheckIns: totalBookings - checkedInBookings
      },
      recentCheckIns,
      checkInsByHour,
      event: {
        id: event.id,
        title: event.title,
        startAt: event.startAt
      }
    });

  } catch (error) {
    console.error("Error fetching check-in stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
