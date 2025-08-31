import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

interface RouteParams {
  params: Promise<{ bookingId: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { bookingId } = await params;

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    // Find the booking with minimal data for verification
    const booking = await prisma.booking.findUnique({
      where: { bookingId: bookingId },
      include: {
        event: {
          select: {
            title: true,
            startAt: true,
            endAt: true,
            location: true,
            status: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        },
        ticket: {
          select: {
            name: true,
            price: true
          }
        }
      }
    });

    if (!booking) {
      return NextResponse.json(
        { 
          valid: false,
          error: "Ticket not found" 
        },
        { status: 404 }
      );
    }

    // Check if the event is still active
    const now = new Date();
    const eventStart = new Date(booking.event.startAt);
    const eventEnd = booking.event.endAt ? new Date(booking.event.endAt) : null;

    let ticketStatus = "valid";
    let statusMessage = "Ticket is valid";

    if (booking.status === "CANCELLED") {
      ticketStatus = "cancelled";
      statusMessage = "Ticket has been cancelled";
    } else if (booking.status === "REFUNDED") {
      ticketStatus = "refunded";
      statusMessage = "Ticket has been refunded";
    } else if (booking.event.status === "CANCELLED") {
      ticketStatus = "event_cancelled";
      statusMessage = "Event has been cancelled";
    } else if (eventEnd && now > eventEnd) {
      ticketStatus = "expired";
      statusMessage = "Event has ended";
    } else if (now > eventStart) {
      ticketStatus = "ongoing";
      statusMessage = "Event is currently ongoing";
    } else {
      ticketStatus = "upcoming";
      statusMessage = "Ticket is valid for upcoming event";
    }

    return NextResponse.json({
      valid: ticketStatus === "valid" || ticketStatus === "upcoming" || ticketStatus === "ongoing",
      ticket: {
        bookingId: booking.bookingId,
        status: ticketStatus,
        statusMessage,
        quantity: booking.quantity,
        createdAt: booking.createdAt,
        event: {
          title: booking.event.title,
          startAt: booking.event.startAt,
          endAt: booking.event.endAt,
          location: booking.event.location,
          status: booking.event.status
        },
        user: {
          name: booking.user?.name,
          email: booking.user?.email
        },
        ticketType: {
          name: booking.ticket.name,
          price: booking.ticket.price
        }
      }
    });

  } catch (error) {
    console.error("Ticket verification error:", error);
    return NextResponse.json(
      { 
        valid: false,
        error: "Failed to verify ticket",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// POST method for check-in functionality
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { bookingId } = await params;
    const body = await request.json();
    const { scannerId, action = "checkin" } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    // Get authorization header for scanner authentication
    const authHeader = request.headers.get("authorization");
    let scannerUserId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        scannerUserId = decoded.userId;
      } catch (error) {
        console.log("Scanner token verification failed:", error);
        return NextResponse.json(
          { error: "Unauthorized scanner" },
          { status: 401 }
        );
      }
    }

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { bookingId: bookingId },
      include: {
        event: {
          select: {
            title: true,
            startAt: true,
            endAt: true,
            status: true,
            organizerId: true
          }
        },
        checkIns: true
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Verify scanner has permission (must be organizer or admin)
    if (scannerUserId !== booking.event.organizerId) {
      // You could add admin role check here
      return NextResponse.json(
        { error: "Unauthorized to scan tickets for this event" },
        { status: 403 }
      );
    }

    // Check if ticket is valid for check-in
    if (booking.status !== "CONFIRMED") {
      return NextResponse.json(
        { 
          success: false,
          error: "Ticket is not confirmed",
          status: booking.status
        },
        { status: 400 }
      );
    }

    if (booking.event.status === "CANCELLED") {
      return NextResponse.json(
        { 
          success: false,
          error: "Event has been cancelled"
        },
        { status: 400 }
      );
    }

    if (action === "checkin") {
      // Check if already checked in
      if (booking.checkIns.length > 0) {
        return NextResponse.json(
          { 
            success: false,
            error: "Ticket already used for check-in",
            checkInTime: booking.checkIns[0].checkedAt
          },
          { status: 400 }
        );
      }

      // Create check-in record
      const checkIn = await prisma.checkIn.create({
        data: {
          bookingId: booking.id,
          scannerId: scannerId || scannerUserId
        }
      });

      return NextResponse.json({
        success: true,
        message: "Check-in successful",
        checkIn: {
          id: checkIn.id,
          checkedAt: checkIn.checkedAt,
          scannerId: checkIn.scannerId
        },
        ticket: {
          bookingId: booking.bookingId,
          quantity: booking.quantity,
          event: {
            title: booking.event.title,
            startAt: booking.event.startAt
          }
        }
      });
    }

    return NextResponse.json(
      { error: "Invalid action specified" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to process check-in",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
