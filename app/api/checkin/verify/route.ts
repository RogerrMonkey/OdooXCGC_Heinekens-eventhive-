import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const { bookingId, scannerId } = await req.json();
  if (!bookingId) return NextResponse.json({ error: "missing_bookingId" }, { status: 400 });

  const booking = await prisma.booking.findUnique({ where: { bookingId }, include: { checkIns: true }});
  if (!booking) return NextResponse.json({ error: "booking_not_found" }, { status: 404 });

  if (booking.status !== "CONFIRMED") return NextResponse.json({ error: "booking_not_confirmed" }, { status: 400 });

  // check duplicate
  const exists = await prisma.checkIn.findFirst({ where: { bookingId: booking.id }});
  if (exists) return NextResponse.json({ ok: false, message: "already_checked_in" });

  await prisma.checkIn.create({ data: { bookingId: booking.id, scannerId }});

  return NextResponse.json({ ok: true, message: "checked_in" });
}
