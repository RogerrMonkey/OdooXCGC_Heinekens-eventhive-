import { NextResponse } from "next/server";
import rzp from "@/lib/razorpay";

export async function POST(req: Request) {
  try {
    const { amount, currency = "INR", receipt, bookingId, notes } = await req.json();
    
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
    }

    if (!bookingId) {
      return NextResponse.json({ error: "booking_id_required" }, { status: 400 });
    }

    const orderData = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: receipt ?? `rcpt_${Date.now()}`,
      payment_capture: true,
      notes: {
        bookingId: bookingId,
        ...notes
      }
    };

    const order = await rzp.orders.create(orderData);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        notes: order.notes
      },
      razorpayKeyId: process.env.RAZORPAY_KEY_ID
    });

  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json({ 
      error: "failed_to_create_order",
      message: error.message 
    }, { status: 500 });
  }
}
