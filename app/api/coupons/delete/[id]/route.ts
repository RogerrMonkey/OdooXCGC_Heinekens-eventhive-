import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const couponId = params.id

    // Check if coupon exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id: couponId }
    })

    if (!existingCoupon) {
      return NextResponse.json({
        ok: false,
        error: 'Coupon not found'
      }, { status: 404 })
    }

    // Delete coupon
    await prisma.coupon.delete({
      where: { id: couponId }
    })

    return NextResponse.json({
      ok: true,
      message: 'Coupon deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting coupon:', error)
    return NextResponse.json({
      ok: false,
      error: 'Failed to delete coupon'
    }, { status: 500 })
  }
}
