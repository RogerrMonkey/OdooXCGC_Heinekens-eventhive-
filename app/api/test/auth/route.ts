import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { action, phone, code, name } = await req.json();
    
    if (action === 'send-otp') {
      // Create a test OTP for debugging
      const testCode = '123456';
      const codeHash = crypto.createHash("sha256").update(testCode).digest("hex");
      
      // Delete any existing OTP for this phone
      await prisma.oTP.deleteMany({ where: { target: phone } });
      
      // Create new OTP
      await prisma.oTP.create({
        data: {
          target: phone,
          codeHash,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        }
      });
      
      return NextResponse.json({
        success: true,
        message: 'Test OTP sent',
        testCode: testCode // Only for testing!
      });
    }
    
    if (action === 'verify-otp') {
      const codeHash = crypto.createHash("sha256").update(code).digest("hex");
      const record = await prisma.oTP.findFirst({
        where: { target: phone, codeHash },
        orderBy: { createdAt: "desc" },
      });
      
      if (!record) {
        return NextResponse.json({ error: "invalid_otp" }, { status: 400 });
      }
      
      if (new Date() > record.expiresAt) {
        await prisma.oTP.delete({ where: { id: record.id } });
        return NextResponse.json({ error: "otp_expired" }, { status: 400 });
      }
      
      // Delete used OTP
      await prisma.oTP.delete({ where: { id: record.id } });
      
      // Create or fetch user
      let user = await prisma.user.findFirst({ 
        where: { phone: phone }
      });
      
      if (!user) {
        user = await prisma.user.create({ 
          data: { 
            name: name || 'Test User',
            phone: phone,
            role: 'ATTENDEE'
          }
        });
      }
      
      // Sign JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role }, 
        process.env.JWT_SECRET!, 
        { expiresIn: "30d" }
      );
      
      return NextResponse.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      });
    }
    
    if (action === 'create-test-user') {
      // Create a test user directly for debugging
      const user = await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          phone: '+1234567890',
          role: 'ATTENDEE'
        }
      });
      
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role }, 
        process.env.JWT_SECRET!, 
        { expiresIn: "30d" }
      );
      
      return NextResponse.json({
        success: true,
        user,
        token,
        authHeader: `Bearer ${token}`
      });
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    
  } catch (error: any) {
    console.error('Auth test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Auth test failed',
      message: error.message
    }, { status: 500 });
  }
}
