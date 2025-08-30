import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import rzp from "@/lib/razorpay";

export async function POST(req: Request) {
  try {
    console.log('Starting payment flow debug test...');
    
    const { 
      testAuth = true,
      testBooking = true,
      testPayment = true,
      eventId,
      ticketId,
      userToken
    } = await req.json();

    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // Test 1: Check if user is authenticated
    if (testAuth) {
      console.log('Testing authentication...');
      
      if (!userToken) {
        results.tests.auth = {
          success: false,
          error: 'No token provided',
          message: 'User needs to be authenticated first'
        };
      } else {
        try {
          const decoded = jwt.verify(userToken.replace('Bearer ', ''), process.env.JWT_SECRET!) as any;
          const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
          
          results.tests.auth = {
            success: true,
            user: {
              id: user?.id,
              name: user?.name,
              email: user?.email,
              role: user?.role
            },
            tokenValid: true
          };
        } catch (error: any) {
          results.tests.auth = {
            success: false,
            error: 'Invalid token',
            message: error.message
          };
        }
      }
    }

    // Test 2: Check event and ticket availability
    if (testBooking && eventId && ticketId) {
      console.log('Testing booking prerequisites...');
      
      try {
        const event = await prisma.event.findUnique({
          where: { id: eventId },
          include: { organizer: true }
        });
        
        const ticket = await prisma.ticketType.findUnique({
          where: { id: ticketId },
          include: { event: true }
        });
        
        results.tests.booking = {
          success: true,
          event: event ? {
            id: event.id,
            title: event.title,
            status: event.status,
            organizer: event.organizer.name
          } : null,
          ticket: ticket ? {
            id: ticket.id,
            name: ticket.name,
            price: ticket.price,
            maxQuantity: ticket.maxQuantity,
            totalSold: ticket.totalSold,
            available: ticket.maxQuantity - ticket.totalSold
          } : null,
          validForBooking: !!(event && ticket && event.status === 'PUBLISHED')
        };
      } catch (error: any) {
        results.tests.booking = {
          success: false,
          error: 'Database query failed',
          message: error.message
        };
      }
    }

    // Test 3: Check Razorpay integration
    if (testPayment) {
      console.log('Testing payment integration...');
      
      try {
        const testOrder = await rzp.orders.create({
          amount: 100, // ₹1 in paise
          currency: 'INR',
          receipt: `debug_test_${Date.now()}`,
          payment_capture: true,
          notes: {
            test: 'debug_payment_flow'
          }
        });
        
        results.tests.payment = {
          success: true,
          razorpayConnected: true,
          testOrder: {
            id: testOrder.id,
            amount: testOrder.amount,
            currency: testOrder.currency,
            status: testOrder.status
          },
          credentials: {
            keyId: process.env.RAZORPAY_KEY_ID ? 'configured' : 'missing',
            keySecret: process.env.RAZORPAY_KEY_SECRET ? 'configured' : 'missing',
            publicKey: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? 'configured' : 'missing'
          }
        };
      } catch (error: any) {
        results.tests.payment = {
          success: false,
          error: 'Razorpay connection failed',
          message: error.message
        };
      }
    }

    // Test 4: End-to-end flow simulation (if all previous tests pass)
    const allTestsPass = Object.values(results.tests).every((test: any) => test.success);
    
    if (allTestsPass && testAuth && testBooking && testPayment && eventId && ticketId && userToken) {
      console.log('Testing complete payment flow...');
      
      try {
        // Simulate booking creation
        const bookingResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/bookings/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': userToken
          },
          body: JSON.stringify({
            eventId,
            ticketId,
            quantity: 1
          })
        });
        
        const bookingData = await bookingResponse.json();
        
        if (bookingData.success) {
          // Test payment order creation
          const paymentResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: bookingData.pricing.totalAmount,
              bookingId: bookingData.bookingId,
              receipt: `debug_${bookingData.bookingId}`
            })
          });
          
          const paymentData = await paymentResponse.json();
          
          results.tests.endToEnd = {
            success: paymentData.success,
            booking: bookingData.success ? {
              id: bookingData.bookingId,
              totalAmount: bookingData.pricing.totalAmount
            } : null,
            payment: paymentData.success ? {
              orderId: paymentData.order.id,
              amount: paymentData.order.amount
            } : null,
            error: !paymentData.success ? paymentData.message : null
          };
        } else {
          results.tests.endToEnd = {
            success: false,
            error: 'Booking creation failed',
            details: bookingData
          };
        }
      } catch (error: any) {
        results.tests.endToEnd = {
          success: false,
          error: 'End-to-end test failed',
          message: error.message
        };
      }
    }

    // Summary
    results.summary = {
      totalTests: Object.keys(results.tests).length,
      passedTests: Object.values(results.tests).filter((test: any) => test.success).length,
      overallSuccess: Object.values(results.tests).every((test: any) => test.success),
      nextSteps: []
    };

    // Add recommendations based on failed tests
    Object.entries(results.tests).forEach(([testName, testResult]: [string, any]) => {
      if (!testResult.success) {
        switch (testName) {
          case 'auth':
            results.summary.nextSteps.push('User needs to login/authenticate first');
            break;
          case 'booking':
            results.summary.nextSteps.push('Check event/ticket availability and status');
            break;
          case 'payment':
            results.summary.nextSteps.push('Check Razorpay credentials and configuration');
            break;
          case 'endToEnd':
            results.summary.nextSteps.push('Review complete payment flow logs');
            break;
        }
      }
    });

    return NextResponse.json(results);

  } catch (error: any) {
    console.error('Payment debug test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Debug test failed',
      message: error.message
    }, { status: 500 });
  }
}
