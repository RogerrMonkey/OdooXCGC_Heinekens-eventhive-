import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { email, code, name, requestedRole } = await req.json();

    if (!email || !code || !requestedRole) {
      return NextResponse.json({ error: "Email, code, and role are required" }, { status: 400 });
    }

    // Verify OTP
    const codeHash = crypto.createHash("sha256").update(code).digest("hex");
    const otpRecord = await prisma.oTP.findFirst({
      where: { target: email, codeHash },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    if (new Date() > otpRecord.expiresAt) {
      await prisma.oTP.delete({ where: { id: otpRecord.id } });
      return NextResponse.json({ error: "Verification code expired" }, { status: 400 });
    }

    // Delete used OTP
    await prisma.oTP.delete({ where: { id: otpRecord.id } });

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Create new user with requested role (only allow ATTENDEE for new users)
      if (requestedRole !== 'ATTENDEE') {
        return NextResponse.json({ 
          error: "New users can only register as attendees. Please request a role upgrade after registration." 
        }, { status: 403 });
      }

      user = await prisma.user.create({
        data: {
          name: name || null,
          email: email,
          role: 'ATTENDEE'
        }
      });
    } else {
      // Existing user - check role permissions
      const roleHierarchy = { 'ATTENDEE': 0, 'VOLUNTEER': 1, 'ORGANIZER': 2, 'ADMIN': 3 };
      const currentRoleLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
      const requestedRoleLevel = roleHierarchy[requestedRole as keyof typeof roleHierarchy] || 0;

      if (requestedRoleLevel > currentRoleLevel) {
        // Check if there's an approved role upgrade request
        const approvedRequest = await prisma.roleUpgradeRequest.findFirst({
          where: {
            userId: user.id,
            requestedRole: requestedRole,
            status: 'APPROVED'
          }
        });

        if (!approvedRequest) {
          return NextResponse.json({ 
            error: `Access denied. You need admin approval to access ${requestedRole} role.` 
          }, { status: 403 });
        }

        // Update user's role to the approved role
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: requestedRole }
        });

        // Mark the request as used (optional)
        await prisma.roleUpgradeRequest.update({
          where: { id: approvedRequest.id },
          data: { adminNote: (approvedRequest.adminNote || '') + '\n[Role activated]' }
        });
      } else if (requestedRoleLevel < currentRoleLevel) {
        return NextResponse.json({ 
          error: `You cannot downgrade from ${user.role} to ${requestedRole}` 
        }, { status: 403 });
      }
      // If requestedRoleLevel === currentRoleLevel, allow login
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "30d" }
    );

    // Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("eventhive_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    return NextResponse.json({
      ok: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints
      }
    });

  } catch (error) {
    console.error("Error in role-based verification:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
