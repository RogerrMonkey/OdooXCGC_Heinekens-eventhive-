import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendSms, sendWhatsapp } from "@/lib/twilio";
import { sendEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  console.log('Send OTP API called');
  
  try {
    const body = await req.json();
    console.log('Request body:', body);
    
    const { target, via } = body;
    
    if (!target || !via) {
      console.log('Missing target or via');
      return NextResponse.json({ error: "Target and method are required" }, { status: 400 });
    }

    console.log('Validating input format...');
    // Validate input format
    if (via === 'email' && !target.includes('@')) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }
    
    if ((via === 'sms' || via === 'whatsapp') && !target.match(/^\+?[1-9]\d{1,14}$/)) {
      return NextResponse.json({ error: "Invalid phone format" }, { status: 400 });
    }

    console.log('Generating OTP...');
    // Generate OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = crypto.createHash("sha256").update(code).digest("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    console.log('Saving OTP to database...');
    // Save OTP to database
    try {
      await prisma.oTP.create({ 
        data: { target, codeHash, expiresAt } 
      });
      console.log('OTP saved successfully');
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    console.log('Sending OTP via:', via);
    // Send OTP
    try {
      if (via === "sms") {
        await sendSms(target, `Your EventHive OTP is ${code}. Valid for 5 minutes.`);
      } else if (via === "whatsapp") {
        await sendWhatsapp(target, `Your EventHive OTP is ${code}. Valid for 5 minutes.`);
      } else if (via === "email") {
        await sendEmail({ 
          to: target, 
          subject: "Your EventHive OTP", 
          text: `Your OTP is ${code}. Valid for 5 minutes.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">EventHive OTP Verification</h2>
              <p>Your OTP code is:</p>
              <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; color: #1f2937; border-radius: 8px; margin: 20px 0;">
                ${code}
              </div>
              <p>This code will expire in 5 minutes.</p>
              <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
            </div>
          `
        });
      } else {
        return NextResponse.json({ error: "Invalid method" }, { status: 400 });
      }
      console.log('OTP sent successfully');
    } catch (sendError) {
      console.error("Send error:", sendError);
      return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
    }

    console.log('Returning success response');
    return NextResponse.json({ ok: true, message: "OTP sent successfully" });
    
  } catch (error) {
    console.error("Auth send-otp error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
