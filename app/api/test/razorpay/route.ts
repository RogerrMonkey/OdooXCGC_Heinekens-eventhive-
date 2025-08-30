import { NextResponse } from "next/server";
import rzp from "@/lib/razorpay";

export async function GET() {
  try {
    // Test Razorpay connection by fetching API information
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

    if (!keyId || !keySecret) {
      return NextResponse.json({
        success: false,
        error: "Razorpay credentials not configured properly"
      });
    }

    // Test creating a small order
    const testOrder = await rzp.orders.create({
      amount: 100, // ₹1 in paise
      currency: "INR",
      receipt: `test_${Date.now()}`,
      payment_capture: true
    });

    return NextResponse.json({
      success: true,
      message: "Razorpay configuration is working",
      config: {
        keyId: keyId ? keyId.substring(0, 8) + "***" : "Not set",
        keySecret: keySecret ? "***configured***" : "Not set",
        webhookSecret: webhookSecret ? "***configured***" : "Not set",
        publicKey: publicKey ? publicKey.substring(0, 8) + "***" : "Not set"
      },
      testOrder: {
        id: testOrder.id,
        amount: testOrder.amount,
        currency: testOrder.currency,
        status: testOrder.status
      }
    });

  } catch (error: any) {
    console.error('Razorpay test error:', error);
    return NextResponse.json({
      success: false,
      error: "Razorpay test failed",
      message: error.message
    }, { status: 500 });
  }
}
