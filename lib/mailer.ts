import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export async function sendEmail({ to, subject, text, html, attachments }: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
}) {
  const info = await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
    attachments,
  });
  return info;
}

export async function sendOTPEmail({
  to,
  otp,
  type = "verification"
}: {
  to: string;
  otp: string;
  type?: "verification" | "reset";
}) {
  const subject = type === "reset" ? "Password Reset OTP" : "Email Verification OTP";
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .otp { font-size: 32px; font-weight: bold; color: #2563eb; text-align: center; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>EventHive</h1>
          </div>
          <div class="content">
            <h2>${subject}</h2>
            <p>Your verification code is:</p>
            <div class="otp">${otp}</div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} EventHive. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject,
    html,
  });
}

export async function sendTicketEmail({
  to,
  userName,
  eventTitle,
  eventDate,
  eventLocation,
  bookingId,
  ticketPdf,
  eventDescription,
  eventCategory,
  ticketType,
  quantity,
  amount,
  organizerName,
  organizerEmail
}: {
  to: string;
  userName: string;
  eventTitle: string;
  eventDate: Date | string;
  eventLocation: string;
  bookingId: string;
  ticketPdf: Buffer;
  eventDescription?: string;
  eventCategory?: string;
  ticketType?: string;
  quantity?: number;
  amount?: number;
  organizerName?: string;
  organizerEmail?: string;
}) {
  const eventDateFormatted = new Date(eventDate).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  });

  const eventTimeFormatted = new Date(eventDate).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const subject = `🎫 Your EventHive Ticket - ${eventTitle}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: #f5f5f5; 
          }
          .email-container { 
            max-width: 650px; 
            margin: 20px auto; 
            background: white; 
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
          }
          .header { 
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
          }
          .header h1 { 
            font-size: 28px; 
            font-weight: 700; 
            margin-bottom: 8px; 
            text-shadow: 0 2px 4px rgba(0,0,0,0.2); 
          }
          .header p { 
            font-size: 16px; 
            opacity: 0.9; 
            font-weight: 300; 
          }
          .content { 
            padding: 40px 30px; 
            background: white; 
          }
          .greeting { 
            font-size: 18px; 
            margin-bottom: 25px; 
            color: #2563eb; 
            font-weight: 600; 
          }
          .intro { 
            font-size: 16px; 
            margin-bottom: 30px; 
            color: #555; 
            line-height: 1.7; 
          }
          .ticket-card { 
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); 
            border: 2px solid #e2e8f0; 
            border-radius: 12px; 
            padding: 30px; 
            margin: 30px 0; 
            position: relative; 
            overflow: hidden; 
          }
          .ticket-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 6px;
            height: 100%;
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
          }
          .event-title { 
            font-size: 24px; 
            font-weight: 700; 
            color: #1e293b; 
            margin-bottom: 20px; 
            line-height: 1.3; 
          }
          .event-details { 
            display: grid; 
            gap: 15px; 
            margin-bottom: 25px; 
          }
          .detail-item { 
            display: flex; 
            align-items: center; 
            gap: 12px; 
          }
          .detail-icon { 
            font-size: 18px; 
            width: 24px; 
            text-align: center; 
          }
          .detail-label { 
            font-weight: 600; 
            color: #475569; 
            min-width: 100px; 
          }
          .detail-value { 
            color: #1e293b; 
            font-weight: 500; 
          }
          .booking-id-section { 
            background: #f1f5f9; 
            border: 2px dashed #cbd5e1; 
            border-radius: 8px; 
            padding: 20px; 
            text-align: center; 
            margin: 25px 0; 
          }
          .booking-id-label { 
            font-size: 14px; 
            color: #64748b; 
            margin-bottom: 8px; 
            font-weight: 600; 
            text-transform: uppercase; 
            letter-spacing: 0.5px; 
          }
          .booking-id { 
            font-family: 'Monaco', 'Courier New', monospace; 
            font-size: 20px; 
            font-weight: 700; 
            color: #2563eb; 
            background: white; 
            padding: 12px 20px; 
            border-radius: 6px; 
            border: 1px solid #e2e8f0; 
            display: inline-block; 
            letter-spacing: 1px; 
          }
          .important-info { 
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); 
            border-left: 4px solid #f59e0b; 
            border-radius: 8px; 
            padding: 25px; 
            margin: 30px 0; 
          }
          .important-info h3 { 
            color: #92400e; 
            font-size: 18px; 
            margin-bottom: 15px; 
            display: flex; 
            align-items: center; 
            gap: 8px; 
          }
          .important-info ul { 
            list-style: none; 
            color: #78350f; 
          }
          .important-info li { 
            margin: 12px 0; 
            padding-left: 20px; 
            position: relative; 
          }
          .important-info li::before { 
            content: '✓'; 
            position: absolute; 
            left: 0; 
            color: #059669; 
            font-weight: bold; 
          }
          .cta-section { 
            text-align: center; 
            margin: 35px 0; 
            padding: 30px; 
            background: #f8fafc; 
            border-radius: 8px; 
          }
          .cta-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
            color: white; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600; 
            font-size: 16px; 
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); 
            transition: all 0.3s ease; 
          }
          .steps { 
            background: #f8fafc; 
            border-radius: 8px; 
            padding: 25px; 
            margin: 30px 0; 
          }
          .steps h3 { 
            color: #1e293b; 
            margin-bottom: 20px; 
            font-size: 18px; 
          }
          .steps ol { 
            color: #475569; 
            padding-left: 20px; 
          }
          .steps li { 
            margin: 10px 0; 
            line-height: 1.6; 
          }
          .ticket-details { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            margin: 20px 0; 
          }
          .ticket-detail-item { 
            background: white; 
            padding: 15px; 
            border-radius: 6px; 
            border: 1px solid #e2e8f0; 
          }
          .ticket-detail-label { 
            font-size: 12px; 
            color: #64748b; 
            text-transform: uppercase; 
            font-weight: 600; 
            letter-spacing: 0.5px; 
            margin-bottom: 5px; 
          }
          .ticket-detail-value { 
            font-size: 16px; 
            font-weight: 600; 
            color: #1e293b; 
          }
          .organizer-info { 
            background: #f1f5f9; 
            border-radius: 8px; 
            padding: 20px; 
            margin: 25px 0; 
          }
          .organizer-info h4 { 
            color: #475569; 
            margin-bottom: 10px; 
            font-size: 14px; 
            text-transform: uppercase; 
            letter-spacing: 0.5px; 
          }
          .footer { 
            background: #f8fafc; 
            text-align: center; 
            color: #64748b; 
            font-size: 14px; 
            padding: 30px; 
            border-top: 1px solid #e2e8f0; 
          }
          .footer-logo { 
            font-size: 18px; 
            font-weight: 700; 
            color: #2563eb; 
            margin-bottom: 10px; 
          }
          .social-links { 
            margin: 20px 0; 
          }
          .social-links a { 
            color: #2563eb; 
            text-decoration: none; 
            margin: 0 10px; 
          }
          @media (max-width: 600px) {
            .email-container { margin: 10px; }
            .content { padding: 25px 20px; }
            .ticket-details { grid-template-columns: 1fr; }
            .header { padding: 30px 20px; }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>🎫 Your Event Ticket</h1>
            <p>EventHive Digital Ticket Management</p>
          </div>
          
          <div class="content">
            <div class="greeting">Hello ${userName}! 👋</div>
            
            <div class="intro">
              Congratulations! Your ticket has been successfully generated and is ready for use. 
              You'll find your official PDF ticket attached to this email.
            </div>
            
            <div class="ticket-card">
              <div class="event-title">${eventTitle}</div>
              
              ${eventDescription ? `
              <div style="color: #64748b; margin-bottom: 20px; line-height: 1.6;">
                ${eventDescription}
              </div>
              ` : ''}
              
              <div class="event-details">
                <div class="detail-item">
                  <span class="detail-icon">📅</span>
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${eventDateFormatted}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-icon">⏰</span>
                  <span class="detail-label">Time:</span>
                  <span class="detail-value">${eventTimeFormatted}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-icon">📍</span>
                  <span class="detail-label">Venue:</span>
                  <span class="detail-value">${eventLocation}</span>
                </div>
                ${eventCategory ? `
                <div class="detail-item">
                  <span class="detail-icon">🏷️</span>
                  <span class="detail-label">Category:</span>
                  <span class="detail-value">${eventCategory}</span>
                </div>
                ` : ''}
              </div>

              ${(ticketType || quantity || amount) ? `
              <div class="ticket-details">
                ${ticketType ? `
                <div class="ticket-detail-item">
                  <div class="ticket-detail-label">Ticket Type</div>
                  <div class="ticket-detail-value">${ticketType}</div>
                </div>
                ` : ''}
                ${quantity ? `
                <div class="ticket-detail-item">
                  <div class="ticket-detail-label">Quantity</div>
                  <div class="ticket-detail-value">${quantity} ${quantity === 1 ? 'Ticket' : 'Tickets'}</div>
                </div>
                ` : ''}
                ${amount ? `
                <div class="ticket-detail-item">
                  <div class="ticket-detail-label">Total Paid</div>
                  <div class="ticket-detail-value">₹${amount}</div>
                </div>
                ` : ''}
                <div class="ticket-detail-item">
                  <div class="ticket-detail-label">Status</div>
                  <div class="ticket-detail-value" style="color: #059669;">✅ Confirmed</div>
                </div>
              </div>
              ` : ''}
            </div>

            <div class="booking-id-section">
              <div class="booking-id-label">Your Booking Reference</div>
              <div class="booking-id">${bookingId}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 10px;">
                Save this reference number for your records
              </div>
            </div>

            <div class="important-info">
              <h3>🚨 Important Instructions</h3>
              <ul>
                <li><strong>Download the PDF:</strong> Save the attached ticket to your device or print it out</li>
                <li><strong>Arrive Early:</strong> Come 15-30 minutes before the event starts</li>
                <li><strong>Bring Your Ticket:</strong> Show the QR code on your ticket at the entrance</li>
                <li><strong>Keep This Email:</strong> Save this confirmation email as backup</li>
                <li><strong>Valid ID:</strong> Bring a government-issued photo ID if required</li>
              </ul>
            </div>

            <div class="cta-section">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://eventhive.com'}/ticket/verify/${bookingId}" class="cta-button">
                🔍 Verify Your Ticket Online
              </a>
              <div style="margin-top: 15px; font-size: 14px; color: #64748b;">
                Click to verify your ticket anytime
              </div>
            </div>

            <div class="steps">
              <h3>📋 What to Do Next</h3>
              <ol>
                <li><strong>Download & Save:</strong> Download the PDF ticket and save it to your phone or print it</li>
                <li><strong>Set Reminders:</strong> Add the event to your calendar with location details</li>
                <li><strong>Plan Your Journey:</strong> Check traffic and parking information for the venue</li>
                <li><strong>Prepare for Entry:</strong> Have your QR code ready at the entrance</li>
                <li><strong>Enjoy the Event:</strong> Have an amazing time! 🎉</li>
              </ol>
            </div>

            ${(organizerName || organizerEmail) ? `
            <div class="organizer-info">
              <h4>Event Organizer Contact</h4>
              ${organizerName ? `<div><strong>Organizer:</strong> ${organizerName}</div>` : ''}
              ${organizerEmail ? `<div><strong>Email:</strong> <a href="mailto:${organizerEmail}" style="color: #2563eb;">${organizerEmail}</a></div>` : ''}
              <div style="font-size: 12px; color: #64748b; margin-top: 8px;">
                Contact the organizer for event-specific questions
              </div>
            </div>
            ` : ''}

            <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b;">
              <p><strong>Need Help?</strong> Contact our support team if you have any questions about your ticket or the event.</p>
              <p style="margin-top: 10px;">Thank you for choosing EventHive - We're excited to see you at the event! 🚀</p>
            </div>
          </div>
          
          <div class="footer">
            <div class="footer-logo">🎪 EventHive</div>
            <p>Making Events Memorable</p>
            <div class="social-links">
              <a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a> | <a href="#">Support</a>
            </div>
            <p>&copy; ${new Date().getFullYear()} EventHive. All rights reserved.</p>
            <p style="margin-top: 10px; font-size: 12px;">
              This email was sent regarding your ticket purchase for ${eventTitle}.<br>
              Please keep this email for your records and event entry.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject,
    html,
    attachments: [
      {
        filename: `ticket-${bookingId}.pdf`,
        content: ticketPdf,
        contentType: 'application/pdf'
      }
    ]
  });
}

export async function sendBookingConfirmationEmail({
  to,
  userName,
  eventTitle,
  eventDate,
  eventLocation,
  bookingId,
  quantity,
  amount,
  ticketTypeName
}: {
  to: string;
  userName: string;
  eventTitle: string;
  eventDate: Date | string;
  eventLocation: string;
  bookingId: string;
  quantity: number;
  amount: number;
  ticketTypeName: string;
}) {
  const eventDateFormatted = new Date(eventDate).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const subject = `Booking Confirmed - ${eventTitle}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 8px 8px; }
          .success-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin-bottom: 20px; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
          .total-row { font-weight: bold; font-size: 18px; border-top: 2px solid #10b981; padding-top: 15px; margin-top: 15px; }
          .cta-button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Booking Confirmed!</h1>
            <p>Your payment has been processed successfully</p>
          </div>
          <div class="content">
            <div class="success-badge">🎉 Payment Successful</div>
            
            <p>Hello ${userName},</p>
            <p>Great news! Your booking has been confirmed and your payment has been processed successfully.</p>
            
            <div class="booking-details">
              <h3>📋 Booking Details</h3>
              <div class="detail-row">
                <span>🎪 Event:</span>
                <span>${eventTitle}</span>
              </div>
              <div class="detail-row">
                <span>📅 Date & Time:</span>
                <span>${eventDateFormatted}</span>
              </div>
              <div class="detail-row">
                <span>📍 Location:</span>
                <span>${eventLocation}</span>
              </div>
              <div class="detail-row">
                <span>🎟️ Ticket Type:</span>
                <span>${ticketTypeName}</span>
              </div>
              <div class="detail-row">
                <span>📊 Quantity:</span>
                <span>${quantity} ticket(s)</span>
              </div>
              <div class="detail-row">
                <span>🆔 Booking ID:</span>
                <span><strong>${bookingId}</strong></span>
              </div>
              <div class="detail-row total-row">
                <span>💰 Total Paid:</span>
                <span>₹${amount}</span>
              </div>
            </div>

            <h3>🎫 Your Tickets</h3>
            <p>Your digital tickets will be sent to this email address shortly. You can also download them anytime from your dashboard.</p>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/ticket/download?bookingId=${bookingId}" class="cta-button">
                📥 Download Tickets
              </a>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard" class="cta-button">
                📊 View Dashboard
              </a>
            </div>

            <h3>📱 What's Next?</h3>
            <ol>
              <li><strong>Check your email</strong> for the ticket PDF (arriving soon)</li>
              <li><strong>Save the Booking ID:</strong> ${bookingId}</li>
              <li><strong>Download tickets</strong> from the link above</li>
              <li><strong>Arrive early</strong> at the venue with your QR code</li>
            </ol>

            <p>Thank you for choosing EventHive! We hope you have a wonderful time at ${eventTitle}.</p>
          </div>
          <div class="footer">
            <p>🎪 EventHive - Making Events Memorable</p>
            <p>&copy; ${new Date().getFullYear()} EventHive. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject,
    html,
  });
}
