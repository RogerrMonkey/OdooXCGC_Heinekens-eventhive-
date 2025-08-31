import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, percentOff, amountOff, maxUsage, validFrom, validUntil, eventId } = body

    // Validate input
    if (!code) {
      return NextResponse.json({
        ok: false,
        error: 'Coupon code is required'
      }, { status: 400 })
    }

    if (!percentOff && !amountOff) {
      return NextResponse.json({
        ok: false,
        error: 'Either percentage off or amount off is required'
      }, { status: 400 })
    }

    // Check if coupon code already exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    })

    if (existingCoupon) {
      return NextResponse.json({
        ok: false,
        error: 'Coupon code already exists'
      }, { status: 400 })
    }

    // Create coupon
    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        percentOff: percentOff || null,
        amountOff: amountOff || null,
        maxUsage: maxUsage || null,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        eventId: eventId || null
      },
      include: {
        event: {
          select: {
            title: true
          }
        }
      }
    })

    return NextResponse.json({
      ok: true,
      coupon
    })
  } catch (error) {
    console.error('Error creating coupon:', error)
    return NextResponse.json({
      ok: false,
      error: 'Failed to create coupon'
    }, { status: 500 })
  }
}
