import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventId, ticketId, quantity = 1, couponCode } = body;

    // Validate required fields
    if (!eventId || !ticketId) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    if (quantity <= 0 || quantity > 10) {
      return NextResponse.json({ error: "invalid_quantity" }, { status: 400 });
    }

    // Get user from JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let userId: string;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({ error: "invalid_token" }, { status: 401 });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    // Get ticket details
    const ticket = await prisma.ticketType.findUnique({
      where: { id: ticketId },
      include: { event: true }
    });

    if (!ticket) {
      return NextResponse.json({ error: "ticket_not_found" }, { status: 404 });
    }

    // Check event status
    if (ticket.event.status !== 'PUBLISHED') {
      return NextResponse.json({ error: "event_not_published" }, { status: 400 });
    }

    // Check sales window
    const now = new Date();
    if (ticket.saleStart && ticket.saleStart > now) {
      return NextResponse.json({ error: "sale_not_started" }, { status: 400 });
    }
    if (ticket.saleEnd && ticket.saleEnd < now) {
      return NextResponse.json({ error: "sale_ended" }, { status: 400 });
    }

    // Check availability
    if (ticket.totalSold + quantity > ticket.maxQuantity) {
      return NextResponse.json({ error: "insufficient_tickets" }, { status: 400 });
    }

    // Calculate base amount
    let baseAmount = ticket.price * quantity;
    let discountAmount = 0;

    // Apply group discount
    const groupDiscountPercent = quantity >= 10 ? 0.2 : quantity >= 5 ? 0.15 : 0;
    const groupDiscountAmount = Math.round(baseAmount * groupDiscountPercent);

    // Validate and apply coupon if provided
    let appliedCoupon = null;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() }
      });

      if (!coupon) {
        return NextResponse.json({ error: "invalid_coupon" }, { status: 400 });
      }

      if (coupon.eventId && coupon.eventId !== eventId) {
        return NextResponse.json({ error: "coupon_not_applicable" }, { status: 400 });
      }

      if (coupon.validFrom && coupon.validFrom > now) {
        return NextResponse.json({ error: "coupon_not_started" }, { status: 400 });
      }

      if (coupon.validUntil && coupon.validUntil < now) {
        return NextResponse.json({ error: "coupon_expired" }, { status: 400 });
      }

      if (coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) {
        return NextResponse.json({ error: "coupon_exhausted" }, { status: 400 });
      }

      // Calculate coupon discount
      const afterGroupDiscount = baseAmount - groupDiscountAmount;
      if (coupon.percentOff) {
        discountAmount = Math.round(afterGroupDiscount * (coupon.percentOff / 100));
      } else if (coupon.amountOff) {
        discountAmount = Math.min(coupon.amountOff, afterGroupDiscount);
      }

      appliedCoupon = coupon;
    }

    // Calculate final amount
    const totalAmount = Math.max(0, baseAmount - groupDiscountAmount - discountAmount);

    // Create booking with PENDING status
    const bookingId = `BH-${nanoid(8)}`;
    const booking = await prisma.booking.create({
      data: {
        bookingId,
        userId,
        eventId,
        ticketId,
        quantity,
        status: "PENDING",
      },
      include: {
        event: true,
        ticket: true,
        user: true
      }
    });

    // Reserve tickets (increment totalSold)
    await prisma.ticketType.update({
      where: { id: ticketId },
      data: { totalSold: { increment: quantity } }
    });

    // Increment coupon usage if applied
    if (appliedCoupon) {
      await prisma.coupon.update({
        where: { id: appliedCoupon.id },
        data: { usedCount: { increment: 1 } }
      });
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.bookingId,
        eventTitle: booking.event.title,
        ticketName: booking.ticket.name,
        quantity: booking.quantity,
        status: booking.status
      },
      pricing: {
        baseAmount,
        groupDiscountAmount,
        couponDiscountAmount: discountAmount,
        totalAmount
      },
      bookingId: booking.bookingId
    });

  } catch (error: any) {
    console.error('Booking creation error:', error);
    return NextResponse.json({
      error: "booking_creation_failed",
      message: error.message
    }, { status: 500 });
  }
}
