'use client'

import { useState } from 'react'

export default function PaymentDebugPage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [testUser, setTestUser] = useState<any>(null)
  const [eventData, setEventData] = useState<any>(null)

  // Test 1: Create test user
  const createTestUser = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-test-user' })
      })
      const data = await response.json()
      setTestUser(data)
      
      // Store in localStorage for other tests
      if (data.success) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
      }
      
      setResults(prev => ({ ...prev, userCreation: data }))
    } catch (error) {
      console.error('Error creating test user:', error)
    }
    setLoading(false)
  }

  // Test 2: Check database
  const testDatabase = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test/database')
      const data = await response.json()
      setEventData(data)
      setResults(prev => ({ ...prev, database: data }))
    } catch (error) {
      console.error('Error testing database:', error)
    }
    setLoading(false)
  }

  // Test 3: Test Razorpay
  const testRazorpay = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test/razorpay')
      const data = await response.json()
      setResults(prev => ({ ...prev, razorpay: data }))
    } catch (error) {
      console.error('Error testing Razorpay:', error)
    }
    setLoading(false)
  }

  // Test 4: Test booking creation
  const testBooking = async () => {
    if (!testUser || !eventData?.sampleEvent) {
      alert('Please create test user and check database first')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUser.token}`
        },
        body: JSON.stringify({
          eventId: eventData.sampleEvent.id,
          ticketId: 'test-ticket-id', // This might need to be fetched from event
          quantity: 1
        })
      })
      const data = await response.json()
      setResults(prev => ({ ...prev, booking: data }))
    } catch (error) {
      console.error('Error testing booking:', error)
    }
    setLoading(false)
  }

  // Test 5: Test payment order
  const testPaymentOrder = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 100,
          bookingId: 'test-booking-123',
          receipt: 'test-receipt-123'
        })
      })
      const data = await response.json()
      setResults(prev => ({ ...prev, paymentOrder: data }))
    } catch (error) {
      console.error('Error testing payment order:', error)
    }
    setLoading(false)
  }

  // Test 6: Comprehensive payment flow
  const testPaymentFlow = async () => {
    if (!testUser || !eventData?.sampleEvent) {
      alert('Please run previous tests first')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/test/payment-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: eventData.sampleEvent.id,
          ticketId: 'test-ticket-id',
          userToken: `Bearer ${testUser.token}`
        })
      })
      const data = await response.json()
      setResults(prev => ({ ...prev, paymentFlow: data }))
    } catch (error) {
      console.error('Error testing payment flow:', error)
    }
    setLoading(false)
  }

  const runAllTests = async () => {
    await createTestUser()
    await testDatabase()
    await testRazorpay()
    await testPaymentOrder()
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Payment Gateway Debug Dashboard</h1>
        
        {/* Test Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={createTestUser}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            1. Create Test User
          </button>
          
          <button
            onClick={testDatabase}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            2. Test Database
          </button>
          
          <button
            onClick={testRazorpay}
            disabled={loading}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            3. Test Razorpay
          </button>
          
          <button
            onClick={testBooking}
            disabled={loading}
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
          >
            4. Test Booking
          </button>
          
          <button
            onClick={testPaymentOrder}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
          >
            5. Test Payment Order
          </button>
          
          <button
            onClick={testPaymentFlow}
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            6. Full Payment Flow
          </button>
        </div>

        <button
          onClick={runAllTests}
          disabled={loading}
          className="bg-gray-800 text-white px-6 py-3 rounded hover:bg-gray-900 disabled:opacity-50 mb-8"
        >
          Run All Tests
        </button>

        {/* Current User Status */}
        {testUser && (
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h3 className="font-bold text-lg mb-2">Test User Created</h3>
            <p><strong>ID:</strong> {testUser.user?.id}</p>
            <p><strong>Name:</strong> {testUser.user?.name}</p>
            <p><strong>Token:</strong> {testUser.token?.substring(0, 20)}...</p>
          </div>
        )}

        {/* Event Data */}
        {eventData?.sampleEvent && (
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h3 className="font-bold text-lg mb-2">Sample Event Found</h3>
            <p><strong>Title:</strong> {eventData.sampleEvent.title}</p>
            <p><strong>Status:</strong> {eventData.sampleEvent.status}</p>
            <p><strong>Tickets:</strong> {eventData.sampleEvent.ticketTypesCount}</p>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Test Results</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-bold mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => window.open('/api/test/razorpay', '_blank')}
              className="block bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
            >
              Open Razorpay Test in New Tab
            </button>
            <button
              onClick={() => window.open('/api/test/database', '_blank')}
              className="block bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
            >
              Open Database Test in New Tab
            </button>
            <button
              onClick={() => {
                localStorage.clear()
                setTestUser(null)
                setResults(null)
                setEventData(null)
              }}
              className="block bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
            >
              Clear All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
