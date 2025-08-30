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
