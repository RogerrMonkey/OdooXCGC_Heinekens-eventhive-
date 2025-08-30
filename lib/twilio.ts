import twilio from "twilio";

const sid = process.env.TWILIO_SID!;
const token = process.env.TWILIO_AUTH_TOKEN!;
export const twilioClient = twilio(sid, token);

export async function sendSms(to: string, body: string) {
  return twilioClient.messages.create({
    body,
    from: process.env.TWILIO_SMS_FROM,
    to,
  });
}

export async function sendWhatsapp(to: string, body: string) {
  return twilioClient.messages.create({
    body,
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: `whatsapp:${to}`,
  });
}

// Enhanced functions for ticket delivery
export async function sendSMSMessage({
  to,
  eventTitle,
  eventDate,
  eventLocation,
  bookingId,
  userName
}: {
  to: string;
  eventTitle: string;
  eventDate: Date | string;
  eventLocation: string;
  bookingId: string;
  userName: string;
}) {
  const eventDateFormatted = new Date(eventDate).toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const message = `🎫 EventHive Ticket Confirmation

Hi ${userName}!

Your ticket for "${eventTitle}" is confirmed!

📅 ${eventDateFormatted}
📍 ${eventLocation}
🎟️ Booking ID: ${bookingId}

Your PDF ticket has been sent via email. Please save it to your device and bring the QR code to the venue.

Verify online: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://eventhive.com'}/ticket/verify/${bookingId}

Need help? Reply to this message.

EventHive Team 🎪`;

  return sendSms(to, message);
}

export async function sendWhatsAppMessage({
  to,
  eventTitle,
  eventDate,
  eventLocation,
  bookingId,
  userName,
  eventDescription,
  ticketType,
  amount
}: {
  to: string;
  eventTitle: string;
  eventDate: Date | string;
  eventLocation: string;
  bookingId: string;
  userName: string;
  eventDescription?: string;
  ticketType?: string;
  amount?: number;
}) {
  const eventDateFormatted = new Date(eventDate).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  });

  const eventTimeFormatted = new Date(eventDate).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit'
  });

  const message = `🎫 *EventHive Ticket Confirmation*

Hello *${userName}*! 👋

Your ticket is ready! ✅

🎉 *Event:* ${eventTitle}
${eventDescription ? `📝 *About:* ${eventDescription.slice(0, 100)}${eventDescription.length > 100 ? '...' : ''}` : ''}

📅 *Date:* ${eventDateFormatted}
⏰ *Time:* ${eventTimeFormatted}
📍 *Venue:* ${eventLocation}

🎟️ *Booking Reference:* \`${bookingId}\`
${ticketType ? `🎯 *Ticket Type:* ${ticketType}` : ''}
${amount ? `💰 *Amount Paid:* ₹${amount}` : ''}

📧 *Your PDF ticket has been sent to your email*

*Important:*
• Download the PDF ticket from your email
• Save it to your phone or print it
• Show the QR code at the venue entrance
• Arrive 15-30 minutes early

🔗 *Verify your ticket online:*
${process.env.NEXT_PUBLIC_BASE_URL || 'https://eventhive.com'}/ticket/verify/${bookingId}

🎪 *EventHive Team*
_Making Events Memorable_

*Need help?* Reply to this message anytime!`;

  return sendWhatsapp(to, message);
}
