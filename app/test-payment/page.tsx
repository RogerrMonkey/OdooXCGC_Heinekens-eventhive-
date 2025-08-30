'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PaymentGateway from '@/components/PaymentGateway'

export default function PaymentTestPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showPayment, setShowPayment] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      router.push('/auth')
      return
    }

    setUser(JSON.parse(userData))
    fetchEvents()
  }, [router])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events/list')
      const data = await response.json()
      
      if (data.ok) {
        setEvents(data.events)
        if (data.events.length > 0) {
          selectEvent(data.events[0])
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  const selectEvent = async (event: any) => {
    setSelectedEvent(event)
    setSelectedTicket(null)
    setShowPayment(false)
    
    // Fetch detailed event info
    try {
      const response = await fetch(`/api/events/${event.id}`)
      const data = await response.json()
      
      if (data.ok) {
        setSelectedEvent(data.event)
        if (data.event.ticketTypes.length > 0) {
          setSelectedTicket(data.event.ticketTypes[0])
        }
      }
    } catch (error) {
      console.error('Error fetching event details:', error)
    }
  }

  const calculateTotal = () => {
    if (!selectedTicket) return 0
    return selectedTicket.price * quantity
  }

  const handlePaymentSuccess = () => {
    alert('Payment successful! 🎉\n\nYour booking has been confirmed. Check your email for the ticket.')
    router.push('/dashboard')
  }

  const handlePaymentError = (error: string) => {
    alert(`Payment failed: ${error}`)
  }

  const quickLogin = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-test-user' })
      })
      
      const data = await response.json()
      if (data.success) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
        fetchEvents()
      }
    } catch (error) {
      console.error('Quick login error:', error)
    }
    setLoading(false)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Payment Test</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to test payments</p>
          
          <div className="space-y-3">
            <button
              onClick={quickLogin}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Creating Test User...' : '🚀 Quick Login'}
            </button>
            
            <button
              onClick={() => router.push('/auth')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
            >
              Login Normally
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Event Selection */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">1. Select Event</h2>
              
              {events.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No events available</p>
                  <button
                    onClick={() => router.push('/create-event')}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Create Test Event
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => selectEvent(event)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedEvent?.id === event.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h3 className="font-semibold">{event.title}</h3>
                      <p className="text-sm text-gray-600">{event.location}</p>
                      <p className="text-sm text-green-600">{event.status}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ticket Selection */}
            {selectedEvent && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">2. Select Ticket</h2>
                
                {selectedEvent.ticketTypes?.length === 0 ? (
                  <p className="text-gray-600">No tickets available for this event</p>
                ) : (
                  <div className="space-y-3">
                    {selectedEvent.ticketTypes?.map((ticket: any) => (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedTicket?.id === ticket.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold">{ticket.name}</h4>
                            <p className="text-xl font-bold text-blue-600">₹{ticket.price}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              {ticket.maxQuantity - ticket.totalSold} available
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quantity Selection */}
            {selectedTicket && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">3. Select Quantity</h2>
                
                <div className="space-y-3">
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="w-full p-3 border rounded-lg"
                  >
                    {[...Array(Math.min(5, selectedTicket.maxQuantity - selectedTicket.totalSold))].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} ticket{i > 0 ? 's' : ''} - ₹{(i + 1) * selectedTicket.price}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={() => setShowPayment(true)}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
                  >
                    Proceed to Payment
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Payment Section */}
          <div className="space-y-6">
            {showPayment && selectedEvent && selectedTicket ? (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">4. Complete Payment</h2>
                
                <PaymentGateway
                  eventId={selectedEvent.id}
                  ticketId={selectedTicket.id}
                  quantity={quantity}
                  totalAmount={calculateTotal()}
                  eventTitle={selectedEvent.title}
                  ticketName={selectedTicket.name}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Payment</h2>
                <p className="text-gray-600">Select an event and ticket to proceed with payment</p>
              </div>
            )}

            {/* Debug Info */}
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h3 className="font-bold text-sm mb-2">🧪 Debug Info</h3>
              <div className="text-xs space-y-1">
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Selected Event:</strong> {selectedEvent?.id || 'None'}</p>
                <p><strong>Selected Ticket:</strong> {selectedTicket?.id || 'None'}</p>
                <p><strong>Quantity:</strong> {quantity}</p>
                <p><strong>Total:</strong> ₹{calculateTotal()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
