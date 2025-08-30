import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const coupons = await prisma.coupon.findMany({
      include: {
        event: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    })

    return NextResponse.json({
      ok: true,
      coupons
    })
  } catch (error) {
    console.error('Error fetching coupons:', error)
    return NextResponse.json({
      ok: false,
      error: 'Failed to fetch coupons'
    }, { status: 500 })
  }
}
