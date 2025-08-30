import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

async function getUserIdFromReq(req: Request): Promise<string | null> {
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
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { 
      code, 
      percentOff, 
      amountOff, 
      maxUsage, 
      validFrom, 
      validUntil, 
      eventId 
    } = body;

    if (!code) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    if (!percentOff && !amountOff) {
      return NextResponse.json({ error: "Either percentOff or amountOff is required" }, { status: 400 });
    }

    // Check if event belongs to user (if eventId provided)
    if (eventId) {
      const event = await prisma.event.findFirst({
        where: { id: eventId, organizerId: userId }
      });
      
      if (!event) {
        return NextResponse.json({ error: "Event not found or unauthorized" }, { status: 404 });
      }
    }

    // Check if coupon code already exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code }
    });

    if (existingCoupon) {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code,
        percentOff: percentOff ? parseInt(percentOff) : null,
        amountOff: amountOff ? parseFloat(amountOff) : null,
        maxUsage: maxUsage ? parseInt(maxUsage) : null,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        eventId: eventId || null
      }
    });

    return NextResponse.json({ ok: true, coupon });

  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const userId = await getUserIdFromReq(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");

    let where: any = {};
    
    if (eventId) {
      // Verify user owns the event
      const event = await prisma.event.findFirst({
        where: { id: eventId, organizerId: userId }
      });
      
      if (!event) {
        return NextResponse.json({ error: "Event not found or unauthorized" }, { status: 404 });
      }
      
      where.eventId = eventId;
    } else {
      // Get coupons for all events owned by user
      const userEvents = await prisma.event.findMany({
        where: { organizerId: userId },
        select: { id: true }
      });
      
      where.eventId = { in: userEvents.map(e => e.id) };
    }

    const coupons = await prisma.coupon.findMany({
      where,
      include: {
        event: {
          select: { id: true, title: true }
        }
      },
      orderBy: { id: 'desc' }
    });

    return NextResponse.json({ ok: true, coupons });

  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
