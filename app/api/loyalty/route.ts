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

// Get user's loyalty points and transaction history
export async function GET(req: Request) {
  const userId = await getUserIdFromReq(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        loyaltyPoints: true,
        loyaltyTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 50 // Last 50 transactions
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      loyaltyPoints: user.loyaltyPoints,
      transactions: user.loyaltyTransactions
    });

  } catch (error) {
    console.error("Error fetching loyalty points:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Award loyalty points (for internal use - e.g., after successful booking)
export async function POST(req: Request) {
  const userId = await getUserIdFromReq(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { points, reason, bookingId } = await req.json();

    if (!points || !reason) {
      return NextResponse.json({ error: "Points and reason are required" }, { status: 400 });
    }

    // Create loyalty transaction
    const transaction = await prisma.loyaltyTransaction.create({
      data: {
        userId,
        points: parseInt(points),
        reason,
        bookingId: bookingId || null
      }
    });

    // Update user's total loyalty points
    await prisma.user.update({
      where: { id: userId },
      data: {
        loyaltyPoints: {
          increment: parseInt(points)
        }
      }
    });

    return NextResponse.json({
      ok: true,
      transaction
    });

  } catch (error) {
    console.error("Error awarding loyalty points:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
