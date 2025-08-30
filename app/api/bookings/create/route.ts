import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  const body = await req.json();
  const { userId, eventId, ticketId, quantity = 1, couponCode } = body;

  if (!eventId || !ticketId) return NextResponse.json({ error: "missing_fields" }, { status: 400 });

  const ticket = await prisma.ticketType.findUnique({ where: { id: ticketId }, include: { event: true } });
  if (!ticket) return NextResponse.json({ error: "ticket_not_found" }, { status: 404 });

  // check sales window
  const now = new Date();
  if (ticket.saleStart && ticket.saleStart > now) return NextResponse.json({ error: "sale_not_started" }, { status: 400 });
  if (ticket.saleEnd && ticket.saleEnd < now) return NextResponse.json({ error: "sale_ended" }, { status: 400 });

  // availability
  if (ticket.totalSold + quantity > ticket.maxQuantity) return NextResponse.json({ error: "sold_out" }, { status: 400 });

  // coupon validation (if provided)
  let discountAmount = 0;
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    if (!coupon) return NextResponse.json({ error: "invalid_coupon" }, { status: 400 });
    if (coupon.validFrom && coupon.validFrom > now) return NextResponse.json({ error: "coupon_not_started" }, { status: 400 });
    if (coupon.validUntil && coupon.validUntil < now) return NextResponse.json({ error: "coupon_expired" }, { status: 400 });
    if (coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) return NextResponse.json({ error: "coupon_exhausted" }, { status: 400 });
    // compute discount
    if (coupon.percentOff) discountAmount = (ticket.price * quantity) * (coupon.percentOff / 100);
    else if (coupon.amountOff) discountAmount = coupon.amountOff;
  }

  // create booking - status PENDING (await payment)
  const bookingId = `BH-${nanoid(8)}`;
  const booking = await prisma.booking.create({
    data: {
      bookingId,
      userId: userId ?? null,
      eventId,
      ticketId,
      quantity,
      status: "PENDING",
    },
  });

  // reserve quantity by incrementing totalSold tentatively (or use transaction)
  await prisma.ticketType.update({ where: { id: ticketId }, data: { totalSold: { increment: quantity } } });

  // compute total
  const totalAmount = Number((ticket.price * quantity) - discountAmount);

  return NextResponse.json({ ok: true, booking, totalAmount });
}
