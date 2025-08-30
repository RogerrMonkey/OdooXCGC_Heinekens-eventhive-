import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  const { target, code, name } = await req.json();
  if (!target || !code) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const codeHash = crypto.createHash("sha256").update(code).digest("hex");
  const record = await prisma.oTP.findFirst({
    where: { target, codeHash },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return NextResponse.json({ error: "invalid_otp" }, { status: 400 });
  if (new Date() > record.expiresAt) {
    await prisma.oTP.delete({ where: { id: record.id } });
    return NextResponse.json({ error: "otp_expired" }, { status: 400 });
  }

  // delete used OTP
  await prisma.oTP.delete({ where: { id: record.id } });

  // create or fetch user
  let user = await prisma.user.findFirst({ where: { OR: [{ email: target }, { phone: target }] }});
  if (!user) {
    user = await prisma.user.create({ data: { name: name ?? null, email: target.includes("@") ? target : null, phone: /\d/.test(target) ? target : null }});
  }

  // sign JWT token
  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "30d" });

  const res = NextResponse.json({ ok: true, token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role }});
  
  // set cookie (HttpOnly)
  const cookieStore = await cookies();
  cookieStore.set("eventhive_token", token, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === "production", 
    path: "/", 
    maxAge: 60 * 60 * 24 * 30 
  });
  
  return res;
}
