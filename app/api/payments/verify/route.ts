import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import rzp from "@/lib/razorpay";
import { generateQrDataUrl, generateTicketPdfBuffer } from "@/lib/ticketUtils";
import { sendEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
      return NextResponse.json({ error: "missing_required_fields" }, { status: 400 });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
    }

    // Find booking
    const booking = await prisma.booking.findFirst({
      where: { bookingId },
      include: { 
        event: true, 
        ticket: true, 
        user: true 
      }
    });

    if (!booking) {
      return NextResponse.json({ error: "booking_not_found" }, { status: 404 });
    }

    // Fetch payment details from Razorpay
    const payment = await rzp.payments.fetch(razorpay_payment_id);

    // Create payment record
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: Number(payment.amount) / 100,
        provider: "razorpay",
        providerPaymentId: razorpay_payment_id,
        status: payment.status,
      }
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CONFIRMED" }
    });

    // Generate QR code and PDF ticket
    const ticketUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/ticket/${booking.bookingId}`;
    const qrDataUrl = await generateQrDataUrl(ticketUrl);
    
    // Generate PDF ticket
    const pdfBuffer = await generateTicketPdfBuffer({
      booking,
      event: booking.event,
      user: booking.user ?? undefined,
      qrDataUrl
    });

    // Store QR code and PDF URLs in booking
    const pdfBase64 = pdfBuffer.toString("base64");
    const pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`;
    
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        qrCodeUrl: qrDataUrl,
        pdfUrl: pdfDataUrl
      }
    });

    // Send confirmation email with ticket
    if (booking.user?.email) {
      try {
        await sendEmail({
          to: booking.user.email,
          subject: `Your EventHive ticket for ${booking.event.title}`,
          text: `Thank you for your booking! Your ticket is attached. You can also view it online at: ${ticketUrl}`,
          attachments: [{
            filename: `ticket-${booking.bookingId}.pdf`,
            content: pdfBuffer,
          }]
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't fail the payment verification if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      bookingId: booking.bookingId,
      ticketUrl
    });

  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json({
      error: "verification_failed",
      message: error.message
    }, { status: 500 });
  }
}
