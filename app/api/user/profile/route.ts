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

    const user = await prisma.user.findUnique({
      where: { id: userInfo.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        loyaltyPoints: true,
        createdAt: true
      }
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json({ ok: true, user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userInfo = await getUserFromReq(request);
    
    if (!userInfo) {
      return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone } = body;

    const updatedUser = await prisma.user.update({
      where: { id: userInfo.userId },
      data: {
        name: name || undefined,
        email: email || undefined,
        phone: phone || undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        loyaltyPoints: true,
        createdAt: true
      }
    });
    
    return NextResponse.json({ ok: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ ok: false, error: 'Failed to update profile' }, { status: 500 });
  }
}
