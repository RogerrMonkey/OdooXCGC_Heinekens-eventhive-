'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Script from 'next/script'

interface Event {
  id: string
  title: string
  description: string
  category: string
  location: string
  startAt: string
  endAt?: string
  status: string
  organizer: {
    id: string
    name: string
    email: string
  }
  ticketTypes: {
    id: string
    name: string
    price: number
    maxQuantity: number
    totalSold: number
    saleStart?: string
    saleEnd?: string
  }[]
  totalAttendees: number
}

interface BookingData {
  eventId: string
  ticketId: string
  quantity: number
  couponCode?: string
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [discountAmount, setDiscountAmount] = useState(0)

  useEffect(() => {
    fetchEvent()
  }, [resolvedParams.id])

  const validateCoupon = async () => {
    if (!couponCode.trim() || !selectedTicketData) return

    setCouponLoading(true)
    setCouponError('')
    
    try {
      const totalAmount = selectedTicketData.price * quantity

      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          eventId: event!.id,
          totalAmount
        })
      })

      const data = await response.json()

      if (data.ok) {
        setAppliedCoupon(data.coupon)
        setCouponDiscount(data.discountAmount)
        setDiscountAmount(data.discountAmount)
        setCouponError('')
      } else {
        setCouponError(data.error || 'Invalid coupon code')
        setAppliedCoupon(null)
        setCouponDiscount(0)
        setDiscountAmount(0)
      }
    } catch (error) {
      console.error('Error validating coupon:', error)
      setCouponError('Failed to validate coupon')
      setAppliedCoupon(null)
      setCouponDiscount(0)
      setDiscountAmount(0)
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = () => {
    setCouponCode('')
    setCouponDiscount(0)
    setCouponError('')
    setAppliedCoupon(null)
    setDiscountAmount(0)
  }

  const getGroupDiscount = (qty: number) => {
    if (qty >= 10) return 0.2 // 20% off for 10+ tickets
    if (qty >= 5) return 0.15  // 15% off for 5+ tickets
    return 0
  }

  const calculateTotalAmount = () => {
    if (!selectedTicketData) return 0
    
    const baseAmount = selectedTicketData.price * quantity
    const groupDiscountPercent = getGroupDiscount(quantity)
    const groupDiscountAmount = baseAmount * groupDiscountPercent
    const afterGroupDiscount = baseAmount - groupDiscountAmount
    const finalAmount = Math.max(0, afterGroupDiscount - discountAmount)
    
    return {
      baseAmount,
      groupDiscountAmount,
      couponDiscountAmount: discountAmount,
      finalAmount
    }
  }

  const calculateFinalPrice = () => {
    if (!selectedTicketData) return 0
    
    const baseAmount = selectedTicketData.price * quantity
    
    // Apply group discount
    const groupDiscountPercent = getGroupDiscount(quantity)
    const groupDiscountAmount = Math.round(baseAmount * groupDiscountPercent)
    
    // Apply coupon discount
    const totalDiscount = groupDiscountAmount + couponDiscount
    
    return Math.max(0, baseAmount - totalDiscount)
  }

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${resolvedParams.id}`)
      const data = await response.json()
      
      if (data.ok) {
        setEvent(data.event)
        if (data.event.ticketTypes.length > 0) {
          setSelectedTicket(data.event.ticketTypes[0].id)
        }
      } else {
        router.push('/events')
      }
    } catch (error) {
      console.error('Failed to fetch event:', error)
      router.push('/events')
    } finally {
      setLoading(false)
    }
  }

  const handleBooking = async () => {
    if (!selectedTicket || !event) return

    setBookingLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth')
        return
      }

      // Create booking
      const bookingData: BookingData = {
        eventId: event.id,
        ticketId: selectedTicket,
        quantity: quantity
      }

      if (couponCode) {
        bookingData.couponCode = couponCode
      }

      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      })

      const data = await response.json()
      
      if (data.ok) {
        // Create payment order
        const paymentResponse = await fetch('/api/payments/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: data.totalAmount,
            receipt: `booking_${data.booking.bookingId}`
          })
        })

        const paymentData = await paymentResponse.json()
        
        if (paymentData.id) {
          // Initialize Razorpay
          const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: paymentData.amount,
            currency: paymentData.currency,
            name: 'EventHive',
            description: `Booking for ${event.title}`,
            order_id: paymentData.id,
            handler: function (response: any) {
              // Payment successful
              alert('Payment successful! Check your email for the ticket.')
              router.push('/dashboard')
            },
            prefill: {
              name: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).name : '',
              email: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).email : '',
            },
            notes: {
              bookingId: data.booking.bookingId
            },
            theme: {
              color: '#2563eb'
            }
          }

          if (!razorpayLoaded || !(window as any).Razorpay) {
            alert('Payment system is loading. Please try again in a moment.')
            return
          }

          const rzp = new (window as any).Razorpay(options)
          rzp.open()
        }
      } else {
        alert(data.error || 'Booking failed')
      }
    } catch (error) {
      console.error('Booking error:', error)
      alert('Booking failed')
    } finally {
      setBookingLoading(false)
      setShowBookingModal(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Event not found</h1>
          <Link href="/events" className="text-blue-600 hover:text-blue-700">
            ← Back to Events
          </Link>
        </div>
      </div>
    )
  }

  const selectedTicketData = event.ticketTypes.find(t => t.id === selectedTicket)
  const isEventPast = new Date(event.startAt) < new Date()
  const isEventToday = new Date(event.startAt).toDateString() === new Date().toDateString()

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
        onError={(e) => {
          console.error('Failed to load Razorpay script:', e)
        }}
      />
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            EventHive
          </Link>
          <nav className="space-x-6">
            <Link href="/events" className="text-gray-600 hover:text-blue-600">
              Browse Events
            </Link>
            <Link href="/create-event" className="text-gray-600 hover:text-blue-600">
              Create Event
            </Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-blue-600">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Section */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="h-64 bg-gradient-to-r from-blue-500 to-purple-600"></div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
                    <div className="flex items-center space-x-4 text-gray-600">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                        {event.category}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        event.status === 'PUBLISHED' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                  {isEventToday && (
                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                      🔴 Happening Today!
                    </span>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-semibold mb-2">📅 Date & Time</h3>
                    <p className="text-gray-600">
                      {new Date(event.startAt).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-gray-600">
                      {new Date(event.startAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {event.endAt && ` - ${new Date(event.endAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}`}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">📍 Location</h3>
                    <p className="text-gray-600">{event.location}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold mb-2">About this event</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {event.description || 'No description available.'}
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Organized by</h3>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">👤</span>
                    </div>
                    <div>
                      <p className="font-medium">{event.organizer.name}</p>
                      <p className="text-sm text-gray-600">{event.organizer.email}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Event Stats</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold">{event.totalAttendees}</p>
                      <p className="text-sm text-gray-600">Attendees</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold">{event.ticketTypes.length}</p>
                      <p className="text-sm text-gray-600">Ticket Types</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold">
                        ₹{event.ticketTypes.length > 0 ? Math.min(...event.ticketTypes.map(t => t.price)) : 0}
                      </p>
                      <p className="text-sm text-gray-600">Starting Price</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              {isEventPast ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">⏰</div>
                  <h3 className="text-lg font-semibold mb-2">Event has ended</h3>
                  <p className="text-gray-600">This event has already taken place.</p>
                </div>
              ) : event.status !== 'PUBLISHED' ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🚧</div>
                  <h3 className="text-lg font-semibold mb-2">Event not available</h3>
                  <p className="text-gray-600">This event is not yet published for booking.</p>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold mb-4">Book Tickets</h3>
                  
                  {/* Ticket Selection */}
                  <div className="space-y-3 mb-6">
                    {event.ticketTypes.map((ticket) => {
                      const isAvailable = ticket.totalSold < ticket.maxQuantity
                      const isSaleActive = (!ticket.saleStart || new Date(ticket.saleStart) <= new Date()) &&
                                         (!ticket.saleEnd || new Date(ticket.saleEnd) >= new Date())
                      
                      return (
                        <div 
                          key={ticket.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            selectedTicket === ticket.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          } ${!isAvailable || !isSaleActive ? 'opacity-50' : ''}`}
                          onClick={() => isAvailable && isSaleActive && setSelectedTicket(ticket.id)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">{ticket.name}</h4>
                              <p className="text-2xl font-bold text-blue-600">₹{ticket.price}</p>
                            </div>
                            <div className="text-right">
                              {!isSaleActive ? (
                                <span className="text-red-600 text-sm">Sale not active</span>
                              ) : !isAvailable ? (
                                <span className="text-red-600 text-sm">Sold Out</span>
                              ) : (
                                <span className="text-green-600 text-sm">
                                  {ticket.maxQuantity - ticket.totalSold} left
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {selectedTicketData && (
                    <>
                      {/* Quantity Selection */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Quantity</label>
                        <select 
                          value={quantity} 
                          onChange={(e) => {
                            setQuantity(parseInt(e.target.value))
                            // Clear coupon when quantity changes
                            setCouponCode('')
                            setCouponDiscount(0)
                            setCouponError('')
                          }}
                          className="w-full p-3 border rounded-lg"
                        >
                          {[...Array(Math.min(10, selectedTicketData.maxQuantity - selectedTicketData.totalSold))].map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {i + 1} ticket{i > 0 ? 's' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Group Discount Info */}
                      {quantity >= 5 && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center text-green-700">
                            <span className="text-lg mr-2">🎉</span>
                            <span className="font-medium">
                              {quantity >= 10 ? '20% Group Discount Applied!' : '15% Group Discount Applied!'}
                            </span>
                          </div>
                          <p className="text-sm text-green-600 mt-1">
                            Save ₹{Math.round(selectedTicketData.price * quantity * (quantity >= 10 ? 0.2 : 0.15))} on your group booking!
                          </p>
                        </div>
                      )}

                      {/* Coupon Code */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Coupon Code (optional)</label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            placeholder="Enter coupon code"
                            className="flex-1 p-3 border rounded-lg"
                          />
                          <button
                            onClick={validateCoupon}
                            disabled={!couponCode || couponLoading}
                            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {couponLoading ? '...' : 'Apply'}
                          </button>
                        </div>
                        {couponError && (
                          <p className="text-red-600 text-sm mt-2">{couponError}</p>
                        )}
                        {couponDiscount > 0 && (
                          <div className="flex items-center justify-between mt-2 p-2 bg-green-50 border border-green-200 rounded">
                            <span className="text-green-700 font-medium">Coupon applied!</span>
                            <button
                              onClick={() => {
                                setCouponCode('')
                                setCouponDiscount(0)
                                setCouponError('')
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Total */}
                      <div className="border-t pt-4 mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <span>Subtotal ({quantity} ticket{quantity > 1 ? 's' : ''})</span>
                          <span>₹{selectedTicketData.price * quantity}</span>
                        </div>
                        
                        {/* Group Discount */}
                        {quantity >= 5 && (
                          <div className="flex justify-between items-center mb-2 text-green-600">
                            <span>Group Discount ({quantity >= 10 ? '20%' : '15%'})</span>
                            <span>-₹{Math.round(selectedTicketData.price * quantity * (quantity >= 10 ? 0.2 : 0.15))}</span>
                          </div>
                        )}
                        
                        {/* Coupon Discount */}
                        {couponDiscount > 0 && (
                          <div className="flex justify-between items-center mb-2 text-green-600">
                            <span>Coupon Discount</span>
                            <span>-₹{couponDiscount}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center font-semibold text-lg">
                          <span>Total</span>
                          <span>₹{calculateFinalPrice()}</span>
                        </div>
                        
                        {/* Savings Display */}
                        {(couponDiscount > 0 || quantity >= 5) && (
                          <div className="mt-2 text-green-600 text-sm">
                            You save ₹{(selectedTicketData.price * quantity) - calculateFinalPrice()}!
                          </div>
                        )}
                      </div>

                      {/* Book Now Button */}
                      <button
                        onClick={() => setShowBookingModal(true)}
                        disabled={bookingLoading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
                      >
                        {bookingLoading ? 'Processing...' : 'Book Now'}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Confirmation Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Booking</h3>
            <div className="space-y-2 mb-6">
              <p><strong>Event:</strong> {event.title}</p>
              <p><strong>Ticket:</strong> {selectedTicketData?.name}</p>
              <p><strong>Quantity:</strong> {quantity}</p>
              
              {selectedTicketData && (
                <>
                  <p><strong>Subtotal:</strong> ₹{selectedTicketData.price * quantity}</p>
                  
                  {quantity >= 5 && (
                    <p className="text-green-600">
                      <strong>Group Discount ({quantity >= 10 ? '20%' : '15%'}):</strong> -₹{Math.round(selectedTicketData.price * quantity * (quantity >= 10 ? 0.2 : 0.15))}
                    </p>
                  )}
                  
                  {couponDiscount > 0 && (
                    <p className="text-green-600">
                      <strong>Coupon Discount:</strong> -₹{couponDiscount}
                    </p>
                  )}
                  
                  <div className="border-t pt-2">
                    <p className="text-lg"><strong>Total:</strong> ₹{calculateFinalPrice()}</p>
                  </div>
                </>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBooking}
                disabled={bookingLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {bookingLoading ? 'Processing...' : 'Confirm & Pay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
