import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Generate ticket PDF (simplified HTML version)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        event: {
          select: {
            title: true,
            description: true,
            startAt: true,
            endAt: true,
            location: true,
            category: true
          }
        },
        user: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        },
        ticket: {
          select: {
            name: true,
            price: true
          }
        }
      }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Generate HTML ticket
    const ticketHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Event Ticket - ${booking.event.title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .ticket {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .ticket-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
        }
        .ticket-header h1 {
            margin: 0;
            font-size: 24px;
        }
        .ticket-header p {
            margin: 5px 0 0 0;
            opacity: 0.9;
        }
        .ticket-body {
            padding: 30px;
        }
        .event-details {
            margin-bottom: 30px;
        }
        .event-details h2 {
            color: #333;
            margin: 0 0 15px 0;
            font-size: 20px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .label {
            font-weight: bold;
            color: #666;
        }
        .value {
            color: #333;
        }
        .qr-section {
            text-align: center;
            margin-top: 30px;
            padding-top: 30px;
            border-top: 2px dashed #ddd;
        }
        .qr-code {
            width: 200px;
            height: 200px;
            margin: 0 auto;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
        }
        .booking-id {
            font-family: monospace;
            font-size: 18px;
            font-weight: bold;
            color: #007bff;
            margin-top: 15px;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        .price-badge {
            background: #28a745;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
        }
        .status-badge {
            background: #17a2b8;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }
        @media print {
            body { background: white; }
            .ticket { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="ticket">
        <div class="ticket-header">
            <h1>🎫 Event Ticket</h1>
            <p>EventHive - Your Gateway to Amazing Events</p>
        </div>
        
        <div class="ticket-body">
            <div class="event-details">
                <h2>${booking.event.title}</h2>
                
                <div class="detail-row">
                    <span class="label">📅 Date & Time:</span>
                    <span class="value">${new Date(booking.event.startAt).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                </div>
                
                ${booking.event.endAt ? `
                <div class="detail-row">
                    <span class="label">🏁 End Time:</span>
                    <span class="value">${new Date(booking.event.endAt).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                </div>
                ` : ''}
                
                <div class="detail-row">
                    <span class="label">📍 Venue:</span>
                    <span class="value">${booking.event.location}</span>
                </div>
                
                <div class="detail-row">
                    <span class="label">🏷️ Category:</span>
                    <span class="value">${booking.event.category}</span>
                </div>
                
                <div class="detail-row">
                    <span class="label">🎫 Ticket Type:</span>
                    <span class="value">${booking.ticket.name}</span>
                </div>
                
                <div class="detail-row">
                    <span class="label">👤 Attendee:</span>
                    <span class="value">${booking.user?.name || 'Guest'}</span>
                </div>
                
                <div class="detail-row">
                    <span class="label">📧 Email:</span>
                    <span class="value">${booking.user?.email || 'N/A'}</span>
                </div>
                
                <div class="detail-row">
                    <span class="label">📱 Phone:</span>
                    <span class="value">${booking.user?.phone || 'N/A'}</span>
                </div>
                
                <div class="detail-row">
                    <span class="label">🔢 Quantity:</span>
                    <span class="value">${booking.quantity} ticket${booking.quantity > 1 ? 's' : ''}</span>
                </div>
                
                <div class="detail-row">
                    <span class="label">💰 Total Price:</span>
                    <span class="value"><span class="price-badge">₹${(booking.ticket.price * booking.quantity).toFixed(2)}</span></span>
                </div>
                
                <div class="detail-row">
                    <span class="label">📋 Status:</span>
                    <span class="value"><span class="status-badge">${booking.status}</span></span>
                </div>
            </div>
            
            <div class="qr-section">
                <h3>🔍 Scan for Check-in</h3>
                ${booking.qrCodeUrl ? `
                    <img src="${booking.qrCodeUrl}" alt="QR Code" class="qr-code" style="background: none; border: none;"/>
                ` : `
                    <div class="qr-code">
                        <div>
                            <div style="font-size: 48px; margin-bottom: 10px;">📱</div>
                            <div>QR Code will be generated</div>
                        </div>
                    </div>
                `}
                <div class="booking-id">Booking ID: ${booking.bookingId}</div>
                <p style="color: #666; font-size: 12px; margin-top: 10px;">
                    Show this QR code at the venue for quick check-in
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Important Instructions:</strong></p>
            <p>• Please arrive 15 minutes before the event start time</p>
            <p>• Present this ticket (digital or printed) at the venue</p>
            <p>• This ticket is non-transferable and non-refundable</p>
            <p>• For support, contact us at support@eventhive.com</p>
            <br>
            <p>Generated on ${new Date().toLocaleDateString('en-IN')} • EventHive</p>
        </div>
    </div>
</body>
</html>`;

    // Return HTML response that can be saved as PDF
    return new Response(ticketHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="ticket-${booking.bookingId}.html"`
      }
    });

  } catch (error) {
    console.error("Error generating ticket PDF:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Update booking with PDF URL
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bookingId, pdfUrl } = body;

    if (!bookingId || !pdfUrl) {
      return NextResponse.json({ error: "Booking ID and PDF URL are required" }, { status: 400 });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { pdfUrl }
    });

    return NextResponse.json({
      ok: true,
      booking: updatedBooking
    });

  } catch (error) {
    console.error("Error updating booking with PDF URL:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
