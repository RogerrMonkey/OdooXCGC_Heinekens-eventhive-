import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQrDataUrl, generateTicketPdfBuffer, generateTicketVerificationUrl } from "@/lib/ticketUtils";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");
    const format = searchParams.get("format") || "pdf"; // pdf, json
    
    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    // Get authorization header
    const authHeader = request.headers.get("authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        userId = decoded.userId;
      } catch (error) {
        console.log("Token verification failed:", error);
      }
    }

    // Find the booking with all related data
    const booking = await prisma.booking.findUnique({
      where: { bookingId: bookingId },
      include: {
        event: {
          include: {
            organizer: true
          }
        },
        user: true,
        ticket: true, // This is the TicketType relation
        payment: true
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this booking
    if (userId && booking.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized access to this booking" },
        { status: 403 }
      );
    }

    // Generate verification URL and QR code
    const verificationUrl = generateTicketVerificationUrl(booking.id);
    const qrDataUrl = await generateQrDataUrl(verificationUrl, {
      width: 400,
      margin: 2
    });

    if (format === "json") {
      // Return ticket data as JSON
      return NextResponse.json({
        success: true,
        ticket: {
          booking: {
            bookingId: booking.bookingId,
            quantity: booking.quantity,
            status: booking.status,
            createdAt: booking.createdAt
          },
          event: {
            title: booking.event.title,
            description: booking.event.description || undefined,
            startAt: booking.event.startAt,
            endAt: booking.event.endAt || undefined,
            location: booking.event.location,
            category: booking.event.category,
            organizer: booking.event.organizer ? {
              name: booking.event.organizer.name || "Unknown",
              email: booking.event.organizer.email || "unknown@example.com"
            } : undefined
          },
          user: {
            name: booking.user?.name,
            email: booking.user?.email,
            phone: booking.user?.phone
          },
          ticketType: booking.ticket ? {
            name: booking.ticket.name,
            price: booking.ticket.price
          } : undefined,
          payment: booking.payment ? {
            amount: booking.payment.amount,
            status: booking.payment.status,
            createdAt: booking.payment.createdAt
          } : undefined,
          qrCode: qrDataUrl,
          verificationUrl
        }
      });
    }

    // Generate PDF ticket
    const pdfBuffer = await generateTicketPdfBuffer({
      booking: {
        bookingId: booking.bookingId,
        quantity: booking.quantity,
        status: booking.status,
        createdAt: booking.createdAt
      },
      event: {
        title: booking.event.title,
        description: booking.event.description || undefined,
        startAt: booking.event.startAt,
        endAt: booking.event.endAt || undefined,
        location: booking.event.location,
        category: booking.event.category,
        organizer: booking.event.organizer ? {
          name: booking.event.organizer.name || "Unknown",
          email: booking.event.organizer.email || "unknown@example.com"
        } : undefined
      },
      user: {
        name: booking.user?.name,
        email: booking.user?.email,
        phone: booking.user?.phone
      },
      ticketType: booking.ticket ? {
        name: booking.ticket.name,
        price: booking.ticket.price
      } : undefined,
      payment: booking.payment ? {
        amount: booking.payment.amount,
        status: booking.payment.status,
        createdAt: booking.payment.createdAt
      } : undefined,
      qrDataUrl
    });

    // Return PDF as download
    const filename = `ticket-${booking.bookingId}.pdf`;
    
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error("Ticket download error:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate ticket",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, action, recipient } = body;

    if (!bookingId || !action) {
      return NextResponse.json(
        { error: "Booking ID and action are required" },
        { status: 400 }
      );
    }

    // Get authorization header
    const authHeader = request.headers.get("authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        userId = decoded.userId;
      } catch (error) {
        console.log("Token verification failed:", error);
      }
    }

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { bookingId: bookingId },
      include: {
        event: {
          include: {
            organizer: true
          }
        },
        user: true,
        ticket: true,
        payment: true
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this booking
    if (userId && booking.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized access to this booking" },
        { status: 403 }
      );
    }

    // Generate verification URL and QR code
    const verificationUrl = generateTicketVerificationUrl(booking.id);
    const qrDataUrl = await generateQrDataUrl(verificationUrl);

    if (action === "email") {
      // Send ticket via email
      const { sendTicketEmail } = await import("@/lib/mailer");
      
      const emailRecipient = recipient || booking.user?.email;
      if (!emailRecipient) {
        return NextResponse.json(
          { error: "No email address available" },
          { status: 400 }
        );
      }

      // Generate PDF for email attachment
      const pdfBuffer = await generateTicketPdfBuffer({
        booking: {
          bookingId: booking.bookingId,
          quantity: booking.quantity,
          status: booking.status,
          createdAt: booking.createdAt
        },
        event: {
          title: booking.event.title,
          description: booking.event.description || undefined,
          startAt: booking.event.startAt,
          endAt: booking.event.endAt || undefined,
          location: booking.event.location,
          category: booking.event.category,
          organizer: booking.event.organizer ? {
            name: booking.event.organizer.name || "Unknown",
            email: booking.event.organizer.email || "unknown@example.com"
          } : undefined
        },
        user: {
          name: booking.user?.name,
          email: booking.user?.email,
          phone: booking.user?.phone
        },
        ticketType: booking.ticket ? {
          name: booking.ticket.name,
          price: booking.ticket.price
        } : undefined,
        payment: booking.payment ? {
          amount: booking.payment.amount,
          status: booking.payment.status,
          createdAt: booking.payment.createdAt
        } : undefined,
        qrDataUrl
      });

      await sendTicketEmail({
        to: emailRecipient,
        userName: booking.user?.name || "Guest",
        eventTitle: booking.event.title,
        eventDate: booking.event.startAt,
        eventLocation: booking.event.location,
        bookingId: booking.bookingId,
        ticketPdf: pdfBuffer,
        eventDescription: booking.event.description || undefined,
        eventCategory: booking.event.category || undefined,
        ticketType: booking.ticket?.name,
        quantity: booking.quantity,
        amount: booking.payment?.amount,
        organizerName: booking.event.organizer?.name || undefined,
        organizerEmail: booking.event.organizer?.email || undefined
      });

      return NextResponse.json({
        success: true,
        message: "Ticket sent via email successfully"
      });
    }

    if (action === "whatsapp" || action === "sms") {
      // Send ticket via WhatsApp or SMS
      const { sendWhatsAppMessage, sendSMSMessage } = await import("@/lib/twilio");
      
      const phoneNumber = recipient || booking.user?.phone;
      if (!phoneNumber) {
        return NextResponse.json(
          { error: "No phone number available" },
          { status: 400 }
        );
      }

      if (action === "whatsapp") {
        await sendWhatsAppMessage({
          to: phoneNumber,
          eventTitle: booking.event.title,
          eventDate: booking.event.startAt,
          eventLocation: booking.event.location,
          bookingId: booking.bookingId,
          userName: booking.user?.name || "Guest",
          eventDescription: booking.event.description || undefined,
          ticketType: booking.ticket?.name,
          amount: booking.payment?.amount
        });
        return NextResponse.json({
          success: true,
          message: "Ticket details sent via WhatsApp successfully"
        });
      } else {
        await sendSMSMessage({
          to: phoneNumber,
          eventTitle: booking.event.title,
          eventDate: booking.event.startAt,
          eventLocation: booking.event.location,
          bookingId: booking.bookingId,
          userName: booking.user?.name || "Guest"
        });
        return NextResponse.json({
          success: true,
          message: "Ticket details sent via SMS successfully"
        });
      }
    }

    return NextResponse.json(
      { error: "Invalid action specified" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Ticket action error:", error);
    return NextResponse.json(
      { 
        error: "Failed to process ticket action",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
