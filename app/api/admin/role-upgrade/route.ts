import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

async function verifyAdminAccess(req: Request): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? cookieStore.get("eventhive_token")?.value;
    
    if (!token) return null;
    
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true }
    });
    
    return user?.role === "ADMIN" ? payload.userId : null;
  } catch {
    return null;
  }
}

// Approve or reject role upgrade requests
export async function POST(req: Request) {
  const adminId = await verifyAdminAccess(req);
  
  if (!adminId) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const { requestId, action, adminNote } = await req.json();

    if (!requestId || !action) {
      return NextResponse.json({ error: "Request ID and action are required" }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Use 'approve' or 'reject'" }, { status: 400 });
    }

    // Get the request
    const request = await prisma.roleUpgradeRequest.findUnique({
      where: { id: requestId },
      include: { user: true }
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (request.status !== 'PENDING') {
      return NextResponse.json({ error: "Request has already been processed" }, { status: 400 });
    }

    // Update the request status
    const updatedRequest = await prisma.roleUpgradeRequest.update({
      where: { id: requestId },
      data: {
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        adminNote: adminNote || null,
        reviewedBy: adminId,
        reviewedAt: new Date()
      }
    });

    // If approved, update the user's role
    if (action === 'approve') {
      await prisma.user.update({
        where: { id: request.userId },
        data: { role: request.requestedRole }
      });

      // Award loyalty points for role upgrade
      await prisma.loyaltyTransaction.create({
        data: {
          userId: request.userId,
          points: 500, // Bonus points for role upgrade
          reason: `role_upgrade_to_${request.requestedRole.toLowerCase()}`
        }
      });

      // Update user's total loyalty points
      await prisma.user.update({
        where: { id: request.userId },
        data: {
          loyaltyPoints: {
            increment: 500
          }
        }
      });
    }

    return NextResponse.json({
      ok: true,
      message: `Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      request: updatedRequest
    });

  } catch (error) {
    console.error("Error processing role upgrade request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
