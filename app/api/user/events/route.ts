import { NextRequest, NextResponse } from 'next/server'
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

async function getUserFromReq(req: NextRequest): Promise<{ userId: string; role: string } | null> {
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

export async function GET(request: NextRequest) {
  try {
    const userInfo = await getUserFromReq(request);
    
    if (!userInfo) {
      return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });
    }

    // Only organizers and admins can access this endpoint
    if (userInfo.role !== 'ORGANIZER' && userInfo.role !== 'ADMIN') {
      return NextResponse.json({ ok: false, error: "Access denied" }, { status: 403 });
    }

    const events = await prisma.event.findMany({
      where: userInfo.role === 'ADMIN' ? {} : { organizerId: userInfo.userId },
      select: {
        id: true,
        title: true,
        description: true,
        startAt: true,
        location: true,
        status: true,
        category: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ ok: true, events });
  } catch (error) {
    console.error('Error fetching user events:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch events' }, { status: 500 });
  }
}
