import crypto from "crypto";
import prisma from "@/lib/prisma";
import { generateQrDataUrl, generateTicketPdfBuffer } from "@/lib/ticketUtils";
import { sendEmail } from "@/lib/mailer";
import { writeFileSync } from "fs";
import path from "path";

export async function POST(req: Request) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
  const bodyText = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";

  const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(bodyText).digest("hex");
  if (signature !== expectedSignature) return new Response("invalid signature", { status: 400 });

  const payload = JSON.parse(bodyText);
  // handle payment.authorized or payment.captured events
  if (payload.event === "payment.captured") {
    const paymentEntity = payload.payload.payment.entity;
    // You should attach mapping between receipt and bookingId earlier (use receipt to contain bookingId)

    // If you stored bookingId in order receipt or notes, fetch booking:
    // For simplicity assume you stored bookingId in order receipt field as 'rcpt_<bookingId>'
    const bookingId = paymentEntity.notes?.bookingId ?? null;

    if (!bookingId) {
      console.warn("Webhook: bookingId missing in payment notes");
      return new Response("ok", { status: 200 });
    }

    const booking = await prisma.booking.findFirst({ where: { bookingId }, include: { event: true, ticket: true, user: true }});
    if (!booking) return new Response("booking_not_found", { status: 404 });

    // create Payment record
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: Number(paymentEntity.amount) / 100,
        provider: "razorpay",
        providerPaymentId: paymentEntity.id,
        status: paymentEntity.status,
      }
    });

    // update booking status
    await prisma.booking.update({ where: { id: booking.id }, data: { status: "CONFIRMED" }});

    // generate QR and PDF, store (optionally upload to S3)
    const ticketUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/tickets/${booking.bookingId}`;
    const qrDataUrl = await generateQrDataUrl(ticketUrl);
    const pdfBuffer = await generateTicketPdfBuffer({ booking, event: booking.event, user: booking.user ?? undefined, qrDataUrl });

    // store assets - for demo, write to tmp and update DB with data url or point to S3 if configured
    // NOTE: in Vercel serverless environment writing files to disk isn't persistent; upload to S3 preferred.
    if (process.env.AWS_S3_BUCKET) {
      // TODO: upload pdfBuffer to S3 and set pdfUrl
    } else {
      const filePath = path.join("/tmp", `${booking.bookingId}.pdf`);
      writeFileSync(filePath, pdfBuffer);
      // serve via a dedicated file server or upload to S3; here we'll store base64 url for demo (not ideal for prod)
      const pdfBase64 = pdfBuffer.toString("base64");
      const pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`;
      await prisma.booking.update({ where: { id: booking.id }, data: { qrCodeUrl: qrDataUrl, pdfUrl: pdfDataUrl }});
    }

    // send email
    if (booking.user?.email) {
      await sendEmail({
        to: booking.user.email,
        subject: "Your EventHive ticket",
        text: `Thanks! Your ticket is here: ${ticketUrl}`,
        attachments: [{
          filename: `${booking.bookingId}.pdf`,
          content: pdfBuffer,
        }]
      });
    }

    return new Response("ok", { status: 200 });
  }

  return new Response("ignored_event", { status: 200 });
}
