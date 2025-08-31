'use client'

import { useState, useEffect } from 'react'
import Script from 'next/script'

interface PaymentGatewayProps {
  eventId: string
  ticketId: string
  quantity: number
  totalAmount: number
  eventTitle: string
  ticketName: string
  onSuccess: () => void
  onError: (error: string) => void
}

export default function PaymentGateway({
  eventId,
  ticketId,
  quantity,
  totalAmount,
  eventTitle,
  ticketName,
  onSuccess,
  onError
}: PaymentGatewayProps) {
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)

  useEffect(() => {
    // Check if Razorpay is already loaded
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      setRazorpayLoaded(true)
    }
  }, [])

  const initatePayment = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      onError('Please login first')
      return
    }

    setLoading(true)

    try {
      // Step 1: Create booking
      const bookingResponse = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId,
          ticketId,
          quantity
        })
      })

      const bookingData = await bookingResponse.json()

      if (!bookingData.success) {
        onError(bookingData.message || 'Booking creation failed')
        return
      }

      setBookingId(bookingData.bookingId)

      // Step 2: Create payment order
      const paymentResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: bookingData.pricing.totalAmount,
          bookingId: bookingData.bookingId,
          receipt: `booking_${bookingData.bookingId}`,
          notes: {
            eventTitle,
            ticketType: ticketName,
            quantity
          }
        })
      })

      const paymentData = await paymentResponse.json()

      if (!paymentData.success) {
        console.error('Payment order creation failed:', paymentData)
        onError(paymentData.message || 'Payment order creation failed')
        return
      }

      console.log('Payment order created successfully:', paymentData)

      // Step 3: Open Razorpay checkout
      if (!razorpayLoaded || !(window as any).Razorpay) {
        onError('Payment system not loaded. Please refresh and try again.')
        return
      }

      // Validate Razorpay key
      if (!paymentData.razorpayKeyId) {
        console.error('Razorpay key ID not found in payment response:', paymentData)
        onError('Payment configuration error. Please ensure Razorpay is properly configured.')
        return
      }

      console.log('Initializing Razorpay with key:', paymentData.razorpayKeyId.substring(0, 6) + '...')

      const options = {
        key: paymentData.razorpayKeyId,
        amount: paymentData.order.amount,
        currency: paymentData.order.currency,
        name: 'EventHive',
        description: `Booking for ${eventTitle}`,
        order_id: paymentData.order.id,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: bookingData.bookingId
              })
            })

            const verifyData = await verifyResponse.json()

            if (verifyData.success) {
              onSuccess()
            } else {
              onError('Payment verification failed')
            }
          } catch (error) {
            onError('Payment verification error')
          }
        },
        prefill: {
          name: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).name : '',
          email: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).email : '',
        },
        notes: paymentData.order.notes,
        theme: {
          color: '#2563eb'
        },
        modal: {
          ondismiss: function() {
            setLoading(false)
          }
        }
      }

      try {
        const rzp = new (window as any).Razorpay(options)
        rzp.open()
      } catch (error: any) {
        console.error('Error initializing Razorpay:', error)
        onError('Failed to initialize payment. Please check your configuration and try again.')
        return
      }

    } catch (error: any) {
      onError(error.message || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
        onError={() => onError('Failed to load payment system')}
        strategy="beforeInteractive"
      />
      
      <div className="space-y-4">
        {/* Payment Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Payment Summary</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Event:</span>
              <span>{eventTitle}</span>
            </div>
            <div className="flex justify-between">
              <span>Ticket:</span>
              <span>{ticketName}</span>
            </div>
            <div className="flex justify-between">
              <span>Quantity:</span>
              <span>{quantity}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>Total:</span>
              <span>₹{totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        {!razorpayLoaded && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <div className="flex items-center text-yellow-700">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
              <span className="text-sm">Loading payment system...</span>
            </div>
          </div>
        )}

        {bookingId && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <p className="text-blue-700 text-sm">
              <strong>Booking ID:</strong> {bookingId}
            </p>
          </div>
        )}

        {/* Payment Button */}
        <button
          onClick={initatePayment}
          disabled={loading || !razorpayLoaded}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {loading ? 'Processing...' : 
           !razorpayLoaded ? 'Loading Payment System...' : 
           'Pay Now'}
        </button>

        {/* Test Instructions */}
        <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
          <p className="text-green-700 text-sm">
            <strong>Test Mode:</strong> Use card 4111 1111 1111 1111, CVV: 123, any future expiry
          </p>
        </div>
      </div>
    </>
  )
}
