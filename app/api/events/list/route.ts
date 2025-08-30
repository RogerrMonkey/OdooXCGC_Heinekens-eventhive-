import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { EventStatus } from "@prisma/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const location = searchParams.get("location");
  const featured = searchParams.get("featured");

  const where: {
    status: EventStatus;
    startAt: { gte: Date };
    category?: string;
    location?: { contains: string; mode: "insensitive" };
    featured?: boolean;
  } = {
    status: "PUBLISHED" as EventStatus,
    startAt: { gte: new Date() }
  };

  if (category) where.category = category;
  if (location) where.location = { contains: location, mode: "insensitive" };
  if (featured === "true") where.featured = true;

  const events = await prisma.event.findMany({
    where,
    include: {
      organizer: { select: { id: true, name: true } },
      ticketTypes: { select: { id: true, name: true, price: true, maxQuantity: true, totalSold: true } }
    },
    orderBy: [
      { featured: "desc" },
      { startAt: "asc" }
    ]
  });

  return NextResponse.json({ ok: true, events });
}
