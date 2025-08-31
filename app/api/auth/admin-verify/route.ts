import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and verification code are required" }, { status: 400 });
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

    // Check if user exists and has admin role
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ error: "Admin account not found" }, { status: 404 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Access denied. Admin privileges required." }, { status: 403 });
    }

    // Delete used OTP
    await prisma.oTP.delete({ where: { id: otpRecord.id } });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role }, 
      process.env.JWT_SECRET!, 
      { expiresIn: "30d" }
    );

    // Set secure cookie
    const cookieStore = await cookies();
    cookieStore.set("eventhive_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    return NextResponse.json({
      ok: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      message: "Admin login successful"
    });

  } catch (error) {
    console.error('Admin verification error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
