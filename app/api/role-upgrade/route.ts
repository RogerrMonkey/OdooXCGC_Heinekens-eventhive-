import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

async function getUserFromReq(req: Request): Promise<{ userId: string; role: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? cookieStore.get("eventhive_token")?.value;
    if (!token) return null;
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

// Submit a role upgrade request
export async function POST(req: Request) {
  const userInfo = await getUserFromReq(req);
  if (!userInfo) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { requestedRole, reason } = await req.json();

    if (!requestedRole || !reason) {
      return NextResponse.json({ error: "Requested role and reason are required" }, { status: 400 });
    }

    const validRoles = ['ORGANIZER', 'VOLUNTEER'];
    if (!validRoles.includes(requestedRole)) {
      return NextResponse.json({ error: "Invalid requested role" }, { status: 400 });
    }

    // Check if user already has a pending request
    const existingRequest = await prisma.roleUpgradeRequest.findFirst({
      where: {
        userId: userInfo.userId,
        status: 'PENDING'
      }
    });

    if (existingRequest) {
      return NextResponse.json({ error: "You already have a pending role upgrade request" }, { status: 400 });
    }

    const request = await prisma.roleUpgradeRequest.create({
      data: {
        userId: userInfo.userId,
        requestedRole: requestedRole,
        currentRole: userInfo.role as Role,
        reason: reason
      }
    });

    return NextResponse.json({
      ok: true,
      request: {
        id: request.id,
        requestedRole: request.requestedRole,
        reason: request.reason,
        status: request.status,
        createdAt: request.createdAt
      }
    });

  } catch (error) {
    console.error("Error creating role upgrade request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Get user's role upgrade requests
export async function GET(req: Request) {
  const userInfo = await getUserFromReq(req);
  if (!userInfo) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requests = await prisma.roleUpgradeRequest.findMany({
      where: {
        userId: userInfo.userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      ok: true,
      requests
    });

  } catch (error) {
    console.error("Error fetching role upgrade requests:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
