import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const bookingId = resolvedParams.id;

    const booking = await prisma.booking.findFirst({
      where: { bookingId },
      include: {
        event: {
          include: {
            organizer: true
          }
        },
        ticket: true,
        user: true,
        payment: true
      }
    });

    if (!booking) {
      return NextResponse.json({ error: "ticket_not_found" }, { status: 404 });
    }

    // Return ticket information
    return NextResponse.json({
      success: true,
      ticket: {
        bookingId: booking.bookingId,
        status: booking.status,
        quantity: booking.quantity,
        qrCodeUrl: booking.qrCodeUrl,
        pdfUrl: booking.pdfUrl,
        event: {
          title: booking.event.title,
          description: booking.event.description,
          location: booking.event.location,
          startAt: booking.event.startAt,
          endAt: booking.event.endAt,
          organizer: {
            name: booking.event.organizer.name,
            email: booking.event.organizer.email
          }
        },
        ticketType: {
          name: booking.ticket.name,
          price: booking.ticket.price
        },
        user: booking.user ? {
          name: booking.user.name,
          email: booking.user.email
        } : null,
        payment: booking.payment ? {
          amount: booking.payment.amount,
          status: booking.payment.status,
          createdAt: booking.payment.createdAt
        } : null,
        createdAt: booking.createdAt
      }
    });

  } catch (error: any) {
    console.error('Ticket retrieval error:', error);
    return NextResponse.json({
      error: "failed_to_retrieve_ticket",
      message: error.message
    }, { status: 500 });
  }
}
