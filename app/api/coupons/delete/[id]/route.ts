import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: couponId } = await params

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
