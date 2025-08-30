import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

async function getUserIdFromReq(req: Request): Promise<string | null> {
  // Simple JWT from cookie or Authorization header:
  try {
    const cookieStore = await cookies();
    const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? cookieStore.get("eventhive_token")?.value;
    if (!token) return null;
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    return payload.userId;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const userId = await getUserIdFromReq(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, category, location, lat, lng, startAt, endAt, ticketTypes, status } = body;

  if (!title || !startAt || !ticketTypes?.length) return NextResponse.json({ error: "missing_fields" }, { status: 400 });

  const event = await prisma.event.create({
    data: {
      organizerId: userId,
      title,
      description,
      category,
      location,
      lat: lat ?? null,
      lng: lng ?? null,
      startAt: new Date(startAt),
      endAt: endAt ? new Date(endAt) : null,
      status: status ?? "DRAFT",
      ticketTypes: { create: ticketTypes.map((t: { 
        name: string; 
        price: number; 
        saleStart?: string; 
        saleEnd?: string; 
        maxQuantity?: number;
      }) => ({
        name: t.name,
        price: Number(t.price),
        saleStart: t.saleStart ? new Date(t.saleStart) : null,
        saleEnd: t.saleEnd ? new Date(t.saleEnd) : null,
        maxQuantity: Number(t.maxQuantity || 9999),
      })) }
    },
    include: { ticketTypes: true }
  });

  return NextResponse.json({ ok: true, event });
}
