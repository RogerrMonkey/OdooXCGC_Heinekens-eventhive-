import { NextResponse } from "next/server";
import rzp from "@/lib/razorpay";

export async function POST(req: Request) {
  const { amount, currency = "INR", receipt } = await req.json();
  if (!amount || amount <= 0) return NextResponse.json({ error: "invalid_amount" }, { status: 400 });

  const order = await rzp.orders.create({
    amount: Math.round(amount * 100),
    currency,
    receipt: receipt ?? `rcpt_${Date.now()}`,
    payment_capture: true,
  });

  return NextResponse.json(order);
}
