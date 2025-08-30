import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import QRCode from "qrcode";
import jwt from "jsonwebtoken";

// Generate QR code for a booking
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        event: {
          select: { title: true, startAt: true, location: true }
        },
        user: {
          select: { name: true, email: true }
        },
        ticket: {
          select: { name: true, price: true }
        }
      }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Create QR code data with booking information
    const qrData = jwt.sign(
      {
        bookingId: booking.id,
        eventId: booking.eventId,
        userId: booking.userId,
        quantity: booking.quantity,
        exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year expiry
      },
      process.env.JWT_SECRET!
    );

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      width: 256,
      margin: 1
    });

    // Update booking with QR code URL
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        qrCodeUrl: qrCodeDataUrl
      }
    });

    return NextResponse.json({
      ok: true,
      qrCode: qrCodeDataUrl,
      booking: {
        id: booking.id,
        bookingId: booking.bookingId,
        quantity: booking.quantity,
        event: booking.event,
        user: booking.user,
        ticket: booking.ticket
      }
    });

  } catch (error) {
    console.error("Error generating QR code:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Get QR code for a booking
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        event: {
          select: { title: true, startAt: true, location: true }
        },
        user: {
          select: { name: true, email: true }
        },
        ticket: {
          select: { name: true, price: true }
        }
      }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // If QR code doesn't exist, generate it
    if (!booking.qrCodeUrl) {
      const qrData = jwt.sign(
        {
          bookingId: booking.id,
          eventId: booking.eventId,
          userId: booking.userId,
          quantity: booking.quantity,
          exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)
        },
        process.env.JWT_SECRET!
      );

      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'M',
        width: 256,
        margin: 1
      });

      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          qrCodeUrl: qrCodeDataUrl
        }
      });

      booking.qrCodeUrl = qrCodeDataUrl;
    }

    return NextResponse.json({
      ok: true,
      qrCode: booking.qrCodeUrl,
      booking: {
        id: booking.id,
        bookingId: booking.bookingId,
        quantity: booking.quantity,
        status: booking.status,
        event: booking.event,
        user: booking.user,
        ticket: booking.ticket
      }
    });

  } catch (error) {
    console.error("Error fetching QR code:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
