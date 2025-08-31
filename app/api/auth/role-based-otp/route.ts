import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const { email, requestedRole } = await req.json();

    if (!email || !requestedRole) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Check if user exists and their current role
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    // If user exists and is trying to access a role higher than their current role
    if (existingUser && requestedRole !== 'ATTENDEE') {
      const roleHierarchy = { 'ATTENDEE': 0, 'VOLUNTEER': 1, 'ORGANIZER': 2, 'ADMIN': 3 };
      const currentRoleLevel = roleHierarchy[existingUser.role as keyof typeof roleHierarchy] || 0;
      const requestedRoleLevel = roleHierarchy[requestedRole as keyof typeof roleHierarchy] || 0;

      if (requestedRoleLevel > currentRoleLevel) {
        // Check if there's an approved role upgrade request
        const approvedRequest = await prisma.roleUpgradeRequest.findFirst({
          where: {
            userId: existingUser.id,
            requestedRole: requestedRole,
            status: 'APPROVED'
          }
        });

        if (!approvedRequest) {
          return NextResponse.json({ 
            error: `Access denied. You need admin approval to access ${requestedRole} role. Please request a role upgrade first.` 
          }, { status: 403 });
        }
      }
    }

    // Store OTP
    await prisma.oTP.create({
      data: {
        target: email,
        codeHash,
        expiresAt
      }
    });

    // Send email with OTP
    await sendEmail({
      to: email,
      subject: `EventHive - ${requestedRole} Login Verification`,
      text: `Your verification code for ${requestedRole} access is: ${otp}\n\nThis code expires in 10 minutes.`
    });

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error("Error sending role-based OTP:", error);
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 });
  }
}
