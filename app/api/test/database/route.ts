import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Check database connectivity and data
    const eventCount = await prisma.event.count();
    const userCount = await prisma.user.count();
    const bookingCount = await prisma.booking.count();
    const paymentCount = await prisma.payment.count();
    
    // Get a sample event for testing
    const sampleEvent = await prisma.event.findFirst({
      include: {
        organizer: true,
        ticketTypes: true,
        _count: {
          select: {
            bookings: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        counts: {
          events: eventCount,
          users: userCount,
          bookings: bookingCount,
          payments: paymentCount
        }
      },
      sampleEvent: sampleEvent ? {
        id: sampleEvent.id,
        title: sampleEvent.title,
        status: sampleEvent.status,
        ticketTypesCount: sampleEvent.ticketTypes.length,
        bookingsCount: sampleEvent._count.bookings,
        organizer: sampleEvent.organizer.name
      } : null,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        jwtSecret: process.env.JWT_SECRET ? 'configured' : 'missing',
        razorpayKeyId: process.env.RAZORPAY_KEY_ID ? 'configured' : 'missing',
        razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ? 'configured' : 'missing',
        publicRazorpayKey: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? 'configured' : 'missing',
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL
      }
    });

  } catch (error: any) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      message: error.message
    }, { status: 500 });
  }
}
