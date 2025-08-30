import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, eventId, totalAmount } = body

    if (!code || !eventId || !totalAmount) {
      return NextResponse.json({
        ok: false,
        error: 'Code, event ID, and total amount are required'
      }, { status: 400 })
    }

    // Find coupon
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    })

    if (!coupon) {
      return NextResponse.json({
        ok: false,
        error: 'Invalid coupon code'
      }, { status: 400 })
    }

    // Check if coupon is event-specific
    if (coupon.eventId && coupon.eventId !== eventId) {
      return NextResponse.json({
        ok: false,
        error: 'This coupon is not valid for this event'
      }, { status: 400 })
    }

    // Check validity dates
    const now = new Date()
    if (coupon.validFrom && now < coupon.validFrom) {
      return NextResponse.json({
        ok: false,
        error: 'This coupon is not yet valid'
      }, { status: 400 })
    }

    if (coupon.validUntil && now > coupon.validUntil) {
      return NextResponse.json({
        ok: false,
        error: 'This coupon has expired'
      }, { status: 400 })
    }

    // Check usage limit
    if (coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) {
      return NextResponse.json({
        ok: false,
        error: 'This coupon has reached its usage limit'
      }, { status: 400 })
    }

    // Calculate discount
    let discountAmount = 0
    if (coupon.percentOff) {
      discountAmount = (totalAmount * coupon.percentOff) / 100
    } else if (coupon.amountOff) {
      discountAmount = Math.min(coupon.amountOff, totalAmount)
    }

    const finalAmount = Math.max(0, totalAmount - discountAmount)

    return NextResponse.json({
      ok: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        percentOff: coupon.percentOff,
        amountOff: coupon.amountOff
      },
      originalAmount: totalAmount,
      discountAmount,
      finalAmount
    })
  } catch (error) {
    console.error('Error validating coupon:', error)
    return NextResponse.json({
      ok: false,
      error: 'Failed to validate coupon'
    }, { status: 500 })
  }
}
