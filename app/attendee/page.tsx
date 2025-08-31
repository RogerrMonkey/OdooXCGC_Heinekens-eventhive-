'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  name: string
  email: string
  role: string
  loyaltyPoints: number
}

interface Booking {
  id: string
  bookingId: string
  quantity: number
  status: string
  createdAt: string
  event: {
    id: string
    title: string
    startAt: string
    location: string
  }
  ticket: {
    name: string
    price: number
  }
}

export default function AttendeeDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loyaltyData, setLoyaltyData] = useState<any>({ loyaltyPoints: 0, transactions: [] })
  const [roleUpgradeRequests, setRoleUpgradeRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'bookings' | 'loyalty' | 'role-upgrade'>('bookings')

  useEffect(() => {
    // Check user role
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth/role-based')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role !== 'ATTENDEE') {
        router.push('/auth/role-based')
        return
      }
      setUser(parsedUser)
      fetchDashboardData()
    } catch (error) {
      router.push('/auth/role-based')
    }
  }, [router])

  useEffect(() => {
    if (activeTab === 'role-upgrade') {
      fetchRoleUpgradeRequests()
    } else if (activeTab === 'loyalty') {
      fetchLoyaltyData()
    }
  }, [activeTab])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/user/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.ok) {
        setBookings(data.bookings)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRoleUpgradeRequests = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/role-upgrade', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.ok) {
        setRoleUpgradeRequests(data.requests)
      }
    } catch (error) {
      console.error('Failed to fetch role upgrade requests:', error)
    }
  }

  const fetchLoyaltyData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/loyalty', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.ok) {
        setLoyaltyData(data)
      }
    } catch (error) {
      console.error('Failed to fetch loyalty data:', error)
    }
  }

  const submitRoleUpgradeRequest = async () => {
    const requestedRole = (document.getElementById('requestedRole') as HTMLSelectElement)?.value
    const reason = (document.getElementById('reason') as HTMLTextAreaElement)?.value

    if (!requestedRole || !reason.trim()) {
      alert('Please select a role and provide a reason')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/role-upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          requestedRole,
          reason: reason.trim()
        })
      })

      const data = await response.json()
      if (data.ok) {
        alert('Role upgrade request submitted successfully!')
        // Clear form
        ;(document.getElementById('requestedRole') as HTMLSelectElement).value = ''
        ;(document.getElementById('reason') as HTMLTextAreaElement).value = ''
        // Refresh requests
        fetchRoleUpgradeRequests()
      } else {
        alert(data.error || 'Failed to submit request')
      }
    } catch (error) {
      console.error('Failed to submit role upgrade request:', error)
      alert('Network error. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Attendee Dashboard</h1>
              <p className="text-blue-100">Welcome back, {user.name}!</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-100">Loyalty Points</div>
              <div className="text-2xl font-bold">{user.loyaltyPoints || 0}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-1/4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🎫</span>
                </div>
                <h2 className="font-semibold">{user.name || 'Attendee'}</h2>
                <p className="text-sm text-gray-600">{user.email}</p>
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-2">
                  {user.role}
                </span>
              </div>

              <nav className="space-y-2">
                {['bookings', 'loyalty', 'role-upgrade'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      activeTab === tab
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab === 'role-upgrade' ? 'Role Upgrade' : 
                     tab === 'loyalty' ? 'Loyalty Points' :
                     'My Bookings'}
                  </button>
                ))}
              </nav>

              <div className="mt-6 pt-6 border-t">
                <Link href="/events" className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 text-center block">
                  Browse Events
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'bookings' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">My Bookings</h2>
                
                {bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold">{booking.event.title}</h3>
                            <p className="text-gray-600">{booking.event.location}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(booking.event.startAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded text-xs ${
                              booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                              booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {booking.status}
                            </span>
                            <p className="text-sm text-gray-500 mt-1">
                              {booking.quantity} × {booking.ticket.name}
                            </p>
                            <p className="font-semibold">
                              ₹{(booking.ticket.price * booking.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        
                        {booking.status === 'CONFIRMED' && (
                          <div className="mt-4 flex space-x-2">
                            <Link
                              href={`/ticket/verify/${booking.bookingId}`}
                              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                            >
                              View Ticket
                            </Link>
                            <button className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700">
                              Cancel Booking
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg">
                    <div className="text-6xl mb-4">🎫</div>
                    <h3 className="text-xl font-semibold mb-2">No bookings yet</h3>
                    <p className="text-gray-600 mb-4">Start exploring events and book your first ticket!</p>
                    <Link href="/events" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                      Browse Events
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'loyalty' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Loyalty Points</h2>

                {/* Points Summary */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-2">Your Points Balance</h3>
                  <div className="text-4xl font-bold">{loyaltyData.loyaltyPoints}</div>
                  <p className="text-purple-100 mt-2">Keep booking events to earn more points!</p>
                </div>

                {/* How to Earn */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">How to Earn Points</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 p-2 rounded-full">🎫</div>
                      <div>
                        <h4 className="font-medium">Event Booking</h4>
                        <p className="text-sm text-gray-600">Earn 1 point for every ₹10 spent</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-100 p-2 rounded-full">⬆️</div>
                      <div>
                        <h4 className="font-medium">Role Upgrade</h4>
                        <p className="text-sm text-gray-600">Get 500 bonus points on approval</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transaction History */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
                  {loyaltyData.transactions?.length > 0 ? (
                    <div className="space-y-3">
                      {loyaltyData.transactions.slice(0, 10).map((transaction: any) => (
                        <div key={transaction.id} className="flex justify-between items-center p-3 border rounded">
                          <div>
                            <div className="font-medium">{transaction.reason.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className={`font-semibold ${transaction.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.points > 0 ? '+' : ''}{transaction.points}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No transactions yet. Start booking events to earn points!</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'role-upgrade' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Role Upgrade</h2>

                {/* Request Form */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Request Role Upgrade</h3>
                  <p className="text-gray-600 mb-6">
                    Upgrade your role to access additional features and responsibilities.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Select Role</label>
                      <select 
                        id="requestedRole" 
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Choose a role...</option>
                        <option value="ORGANIZER">Event Organizer - Create and manage events</option>
                        <option value="VOLUNTEER">Volunteer - Help with event operations</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Reason for Request</label>
                      <textarea 
                        id="reason"
                        placeholder="Please explain why you want this role and your relevant experience..."
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={4}
                      />
                    </div>
                    
                    <button 
                      onClick={submitRoleUpgradeRequest}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                    >
                      Submit Request
                    </button>
                  </div>
                </div>

                {/* Request History */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Request History</h3>
                  {roleUpgradeRequests.length > 0 ? (
                    <div className="space-y-4">
                      {roleUpgradeRequests.map((request: any) => (
                        <div key={request.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-medium">Request for {request.requestedRole}</span>
                              <span className={`ml-3 px-2 py-1 rounded text-xs ${
                                request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {request.status}
                              </span>
                            </div>
                            <small className="text-gray-500">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </small>
                          </div>
                          <p className="text-gray-600 text-sm">{request.reason}</p>
                          {request.adminNote && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                              <strong>Admin Note:</strong> {request.adminNote}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No role upgrade requests found.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
