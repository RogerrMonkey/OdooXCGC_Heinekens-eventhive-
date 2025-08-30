import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // In a real app, you'd get the user ID from session/JWT
    // For demo purposes, we'll return mock data
    const mockBookings = [
      {
        id: 'booking_1',
        bookingId: 'BK001',
        quantity: 2,
        status: 'CONFIRMED',
        eventId: 'event_1',
        event: {
          title: 'Tech Conference 2024',
          startAt: '2024-02-15T10:00:00Z',
          location: 'Bangalore Convention Center'
        },
        ticket: {
          name: 'General',
          price: 1500
        }
      },
      {
        id: 'booking_2',
        bookingId: 'BK002',
        quantity: 1,
        status: 'PENDING',
        eventId: 'event_2',
        event: {
          title: 'Music Festival',
          startAt: '2024-03-01T18:00:00Z',
          location: 'Mumbai Garden'
        },
        ticket: {
          name: 'VIP',
          price: 2500
        }
      }
    ]

    return NextResponse.json({
      ok: true,
      bookings: mockBookings
    })
  } catch (error) {
    console.error('Error fetching user bookings:', error)
    return NextResponse.json({
      ok: false,
      error: 'Failed to fetch bookings'
    }, { status: 500 })
  }
}
