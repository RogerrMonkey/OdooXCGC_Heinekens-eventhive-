import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: { id: true, name: true, email: true }
        },
        ticketTypes: {
          select: {
            id: true,
            name: true,
            price: true,
            maxQuantity: true,
            totalSold: true,
            saleStart: true,
            saleEnd: true
          }
        },
        bookings: {
          where: { status: "CONFIRMED" },
          select: { quantity: true }
        },
        coupons: {
          where: {
            AND: [
              { validFrom: { lte: new Date() } },
              { validUntil: { gte: new Date() } },
              { usedCount: { lt: prisma.coupon.fields.maxUsage } }
            ]
          },
          select: {
            id: true,
            code: true,
            percentOff: true,
            amountOff: true,
            maxUsage: true,
            usedCount: true
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Calculate total attendees
    const totalAttendees = event.bookings.reduce((sum, booking) => sum + booking.quantity, 0);

    return NextResponse.json({
      ok: true,
      event: {
        ...event,
        totalAttendees
      }
    });

  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
