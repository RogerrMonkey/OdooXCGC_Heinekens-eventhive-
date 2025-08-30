import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import { sendSms, sendWhatsapp } from "@/lib/twilio";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, eventId, message, subject } = body;

    if (!type || !eventId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get event with bookings
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        bookings: {
          where: { status: "CONFIRMED" },
          include: {
            user: {
              select: { name: true, email: true, phone: true }
            }
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const attendees = event.bookings.map(booking => booking.user).filter(Boolean);
    const results = { sent: 0, failed: 0, errors: [] as string[] };

    for (const attendee of attendees) {
      if (!attendee) continue;

      try {
        switch (type) {
          case 'email':
            if (attendee.email) {
              await sendEmail({
                to: attendee.email,
                subject: subject || `Update about ${event.title}`,
                text: message,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">${subject || `Update about ${event.title}`}</h2>
                    <p>Hi ${attendee.name || 'there'},</p>
                    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      ${message.replace(/\n/g, '<br>')}
                    </div>
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                      <p><strong>Event Details:</strong></p>
                      <p><strong>${event.title}</strong></p>
                      <p>📅 ${new Date(event.startAt).toLocaleDateString()} at ${new Date(event.startAt).toLocaleTimeString()}</p>
                      <p>📍 ${event.location}</p>
                    </div>
                    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                      This is an automated message from EventHive. Please do not reply to this email.
                    </p>
                  </div>
                `
              });
              results.sent++;
            }
            break;

          case 'sms':
            if (attendee.phone) {
              const smsMessage = `${message}\n\nEvent: ${event.title}\nDate: ${new Date(event.startAt).toLocaleDateString()}\nVenue: ${event.location}`;
              await sendSms(attendee.phone, smsMessage);
              results.sent++;
            }
            break;

          case 'whatsapp':
            if (attendee.phone) {
              const whatsappMessage = `*${subject || `Update about ${event.title}`}*\n\n${message}\n\n*Event Details:*\n${event.title}\n📅 ${new Date(event.startAt).toLocaleDateString()}\n📍 ${event.location}`;
              await sendWhatsapp(attendee.phone, whatsappMessage);
              results.sent++;
            }
            break;

          default:
            results.errors.push(`Unknown notification type: ${type}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to send to ${attendee.email || attendee.phone}: ${error}`);
      }
    }

    return NextResponse.json({
      ok: true,
      results: {
        totalAttendees: attendees.length,
        sent: results.sent,
        failed: results.failed,
        errors: results.errors
      }
    });

  } catch (error) {
    console.error("Error sending notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Automated reminder system
export async function GET(req: Request) {
  try {
    const now = new Date();
    
    // Find events starting in 24 hours
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfter = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    
    const eventsIn24Hours = await prisma.event.findMany({
      where: {
        startAt: {
          gte: tomorrow,
          lte: dayAfter
        },
        status: "PUBLISHED"
      },
      include: {
        bookings: {
          where: { status: "CONFIRMED" },
          include: {
            user: {
              select: { name: true, email: true, phone: true }
            }
          }
        }
      }
    });

    // Find events starting in 1 hour
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const oneHourFifteenLater = new Date(now.getTime() + 75 * 60 * 1000);
    
    const eventsIn1Hour = await prisma.event.findMany({
      where: {
        startAt: {
          gte: oneHourLater,
          lte: oneHourFifteenLater
        },
        status: "PUBLISHED"
      },
      include: {
        bookings: {
          where: { status: "CONFIRMED" },
          include: {
            user: {
              select: { name: true, email: true, phone: true }
            }
          }
        }
      }
    });

    let remindersSent = 0;

    // Send 24-hour reminders
    for (const event of eventsIn24Hours) {
      for (const booking of event.bookings) {
        if (booking.user?.email) {
          try {
            await sendEmail({
              to: booking.user.email,
              subject: `Reminder: ${event.title} is tomorrow!`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #2563eb;">Event Reminder</h2>
                  <p>Hi ${booking.user.name || 'there'},</p>
                  <p>This is a friendly reminder that you have an event tomorrow!</p>
                  <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0;">${event.title}</h3>
                    <p style="margin: 5px 0;">📅 ${new Date(event.startAt).toLocaleDateString()} at ${new Date(event.startAt).toLocaleTimeString()}</p>
                    <p style="margin: 5px 0;">📍 ${event.location}</p>
                  </div>
                  <p>We look forward to seeing you there!</p>
                  <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                    This is an automated reminder from EventHive.
                  </p>
                </div>
              `
            });
            remindersSent++;
          } catch (error) {
            console.error("Failed to send 24h reminder:", error);
          }
        }
      }
    }

    // Send 1-hour reminders
    for (const event of eventsIn1Hour) {
      for (const booking of event.bookings) {
        if (booking.user?.email) {
          try {
            await sendEmail({
              to: booking.user.email,
              subject: `Starting Soon: ${event.title}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #dc2626;">🚨 Starting Soon!</h2>
                  <p>Hi ${booking.user.name || 'there'},</p>
                  <p><strong>${event.title}</strong> is starting in about 1 hour!</p>
                  <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Event:</strong> ${event.title}</p>
                    <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date(event.startAt).toLocaleTimeString()}</p>
                    <p style="margin: 5px 0;"><strong>Location:</strong> ${event.location}</p>
                  </div>
                  <p>Make sure to arrive on time. Don't forget your ticket!</p>
                  <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                    This is an automated reminder from EventHive.
                  </p>
                </div>
              `
            });
            remindersSent++;
          } catch (error) {
            console.error("Failed to send 1h reminder:", error);
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      remindersSent,
      eventsIn24Hours: eventsIn24Hours.length,
      eventsIn1Hour: eventsIn1Hour.length
    });

  } catch (error) {
    console.error("Error in automated reminders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
