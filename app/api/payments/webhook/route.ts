import crypto from "crypto";
import prisma from "@/lib/prisma";
import { generateQrDataUrl, generateTicketPdfBuffer } from "@/lib/ticketUtils";
import { sendEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    const bodyText = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(bodyText)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error('Webhook signature verification failed');
      return new Response("invalid signature", { status: 400 });
    }

    const payload = JSON.parse(bodyText);
    console.log('Webhook received:', payload.event);

    // Handle payment.captured event
    if (payload.event === "payment.captured") {
      const paymentEntity = payload.payload.payment.entity;
      const orderId = paymentEntity.order_id;

      // Get booking ID from order notes
      const bookingId = paymentEntity.notes?.bookingId;

      if (!bookingId) {
        console.warn("Webhook: bookingId missing in payment notes");
        return new Response("ok", { status: 200 });
      }

      // Check if payment already processed
      const existingPayment = await prisma.payment.findFirst({
        where: { providerPaymentId: paymentEntity.id }
      });

      if (existingPayment) {
        console.log('Payment already processed:', paymentEntity.id);
        return new Response("ok", { status: 200 });
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
        console.error('Booking not found for ID:', bookingId);
        return new Response("booking_not_found", { status: 404 });
      }

      // Create Payment record
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: Number(paymentEntity.amount) / 100,
          provider: "razorpay",
          providerPaymentId: paymentEntity.id,
          status: paymentEntity.status,
        }
      });

      // Update booking status
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: "CONFIRMED" }
      });

      // Award loyalty points for successful booking (1 point per ₹10 spent)
      if (booking.userId) {
        const loyaltyPoints = Math.floor(paymentEntity.amount / 1000); // Razorpay amount is in paise
        if (loyaltyPoints > 0) {
          await prisma.loyaltyTransaction.create({
            data: {
              userId: booking.userId,
              points: loyaltyPoints,
              reason: "event_booking",
              bookingId: booking.id
            }
          });

          await prisma.user.update({
            where: { id: booking.userId },
            data: {
              loyaltyPoints: {
                increment: loyaltyPoints
              }
            }
          });
        }
      }

      // Generate QR code and PDF ticket if not already generated
      if (!booking.qrCodeUrl || !booking.pdfUrl) {
        const ticketUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/ticket/${booking.bookingId}`;
        const qrDataUrl = await generateQrDataUrl(ticketUrl);
        const pdfBuffer = await generateTicketPdfBuffer({
          booking,
          event: {
            ...booking.event,
            description: booking.event.description || undefined,
            endAt: booking.event.endAt || undefined
          },
          user: booking.user ?? undefined,
          qrDataUrl
        });

        // Store as base64 data URL (in production, consider uploading to S3)
        const pdfBase64 = pdfBuffer.toString("base64");
        const pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`;

        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            qrCodeUrl: qrDataUrl,
            pdfUrl: pdfDataUrl
          }
        });

        // Send confirmation email
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
          }
        }
      }

      console.log('Payment processed successfully:', paymentEntity.id);
      return new Response("ok", { status: 200 });
    }

    // Handle payment.failed event
    if (payload.event === "payment.failed") {
      const paymentEntity = payload.payload.payment.entity;
      const bookingId = paymentEntity.notes?.bookingId;

      if (bookingId) {
        // Mark booking as cancelled and release reserved tickets
        const booking = await prisma.booking.findFirst({
          where: { bookingId },
          include: { ticket: true }
        });

        if (booking) {
          await prisma.booking.update({
            where: { id: booking.id },
            data: { status: "CANCELLED" }
          });

          // Release reserved tickets
          await prisma.ticketType.update({
            where: { id: booking.ticketId },
            data: { totalSold: { decrement: booking.quantity } }
          });
        }
      }

      return new Response("ok", { status: 200 });
    }

    return new Response("event_ignored", { status: 200 });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return new Response("internal_error", { status: 500 });
  }
}
