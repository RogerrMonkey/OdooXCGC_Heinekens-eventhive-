import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

async function getUserFromReq(req: Request): Promise<{ userId: string; role: string } | null> {
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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userInfo = await getUserFromReq(req);
  
  if (!userInfo) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, category, location, lat, lng, startAt, endAt, status, featured, ticketTypes } = body;

    // Check if user owns this event or is admin
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      select: { organizerId: true }
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (existingEvent.organizerId !== userInfo.userId && userInfo.role !== 'ADMIN') {
      return NextResponse.json({ error: "Not authorized to edit this event" }, { status: 403 });
    }

    // Update event in transaction
    const updatedEvent = await prisma.$transaction(async (tx) => {
      // Update main event data
      const event = await tx.event.update({
        where: { id },
        data: {
          title,
          description,
          category,
          location,
          lat: lat || null,
          lng: lng || null,
          startAt: new Date(startAt),
          endAt: endAt ? new Date(endAt) : null,
          status,
          featured: featured || false
        }
      });

      // Delete existing ticket types
      await tx.ticketType.deleteMany({
        where: { eventId: id }
      });

      // Create new ticket types
      if (ticketTypes && ticketTypes.length > 0) {
        await tx.ticketType.createMany({
          data: ticketTypes.map((ticket: any) => ({
            eventId: id,
            name: ticket.name,
            price: ticket.price,
            maxQuantity: ticket.maxQuantity,
            saleStart: ticket.saleStart ? new Date(ticket.saleStart) : null,
            saleEnd: ticket.saleEnd ? new Date(ticket.saleEnd) : null,
            totalSold: 0
          }))
        });
      }

      return event;
    });

    // Fetch updated event with ticket types
    const eventWithDetails = await prisma.event.findUnique({
      where: { id },
      include: {
        ticketTypes: true,
        organizer: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({ ok: true, event: eventWithDetails });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
