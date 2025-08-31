import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendOTPEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists and has admin role
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (!existingUser) {
      return NextResponse.json({ error: "Admin account not found" }, { status: 404 });
    }

    if (existingUser.role !== 'ADMIN') {
      return NextResponse.json({ error: "Access denied. Admin privileges required." }, { status: 403 });
    }

    // Generate OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = crypto.createHash("sha256").update(code).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    await prisma.oTP.create({
      data: {
        target: email,
        codeHash,
        expiresAt
      }
    });

    // Send OTP email
    try {
      await sendOTPEmail({
        to: email,
        otp: code,
        type: "verification"
      });
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      message: "Admin verification code sent successfully" 
    });

  } catch (error) {
    console.error('Admin OTP error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
