import QRCode from "qrcode";
import PDFDocument from "pdfkit";
import streamBuffers from "stream-buffers";

interface BookingData {
  bookingId: string;
  quantity: number;
}

interface EventData {
  title: string;
  startAt: Date | string;
  location: string;
}

interface UserData {
  name?: string | null;
}

export async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url);
}

export async function generateTicketPdfBuffer({ booking, event, user, qrDataUrl }: {
  booking: BookingData;
  event: EventData;
  user?: UserData;
  qrDataUrl?: string;
}): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const writableStreamBuffer = new streamBuffers.WritableStreamBuffer();

  doc.pipe(writableStreamBuffer);

  doc.fontSize(20).text("EventHive Ticket", { align: "center" });
  doc.moveDown();
  doc.fontSize(14).text(`Event: ${event.title}`);
  doc.text(`Date: ${new Date(event.startAt).toLocaleString()}`);
  doc.text(`Location: ${event.location}`);
  doc.moveDown();
  doc.text(`Attendee: ${user?.name ?? "Guest"}`);
  doc.text(`Booking ID: ${booking.bookingId}`);
  doc.text(`Quantity: ${booking.quantity}`);
  doc.moveDown();

  if (qrDataUrl) {
    const base64 = qrDataUrl.replace(/^data:image\/png;base64,/, "");
    const imgBuffer = Buffer.from(base64, "base64");
    doc.image(imgBuffer, { fit: [150, 150], align: "center" });
  }

  doc.end();

  await new Promise((resolve) => {
    writableStreamBuffer.on("finish", resolve);
  });

  return writableStreamBuffer.getContents() as Buffer;
}
