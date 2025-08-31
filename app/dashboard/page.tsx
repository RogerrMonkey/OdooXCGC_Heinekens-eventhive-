'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TicketManager from '@/components/TicketManager'

interface User {
  id: string
  name: string
  email: string
  phone: string
  role: string
}

interface Event {
  id: string
  title: string
  status: string
  startAt: string
  location: string
  ticketTypes: any[]
  bookings: any[]
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

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [myEvents, setMyEvents] = useState<Event[]>([])
  const [myBookings, setMyBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'role-upgrade' | 'loyalty'>('overview')
  const [roleUpgradeRequests, setRoleUpgradeRequests] = useState<any[]>([])
  const [loyaltyData, setLoyaltyData] = useState<any>({ loyaltyPoints: 0, transactions: [] })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth')
      return
    }
    
    fetchDashboardData()
  }, [])

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
      const response = await fetch('/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.ok) {
        setUser(data.user)
        setMyEvents(data.myEvents)
        setMyBookings(data.myBookings)
      } else if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/auth')
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

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-1/4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">👤</span>
                </div>
                <h2 className="font-semibold">{user.name || 'User'}</h2>
                <p className="text-sm text-gray-600">{user.email}</p>
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-2">
                  {user.role}
                </span>
              </div>

              <nav className="space-y-2">
                {['overview', 'bookings', 'role-upgrade', 'loyalty'].map((tab) => (
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
                     tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">Dashboard Overview</h1>
                
                {/* Stats Cards */}
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <span className="text-2xl">🎪</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">My Events</p>
                        <p className="text-2xl font-bold">{myEvents.length || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <span className="text-2xl">🎫</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">My Bookings</p>
                        <p className="text-2xl font-bold">{myBookings.length || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <span className="text-2xl">👥</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">Total Attendees</p>
                        <p className="text-2xl font-bold">
                          {myBookings.reduce((sum: number, booking: any) => sum + booking.quantity, 0) || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-3 bg-yellow-100 rounded-lg">
                        <span className="text-2xl">💰</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">Total Spent</p>
                        <p className="text-2xl font-bold">
                          ₹{myBookings.reduce((sum: number, booking: any) => sum + (booking.ticket.price * booking.quantity), 0) || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Recent Events */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Events</h3>
                    <div className="space-y-3">
                      {myEvents.slice(0, 3).map((event) => (
                        <div key={event.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{event.title}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(event.startAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            event.status === 'PUBLISHED' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {event.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Bookings */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Bookings</h3>
                    <div className="space-y-3">
                      {myBookings.slice(0, 3).map((booking) => (
                        <div key={booking.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{booking.event.title}</p>
                            <p className="text-sm text-gray-600">
                              {booking.quantity} × {booking.ticket.name}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            booking.status === 'CONFIRMED' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">My Bookings</h1>

                <div className="grid gap-4">
                  {myBookings.map((booking) => (
                    <div key={booking.id} className="bg-white rounded-lg shadow p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">{booking.event.title}</h3>
                          <p className="text-gray-600">📍 {booking.event.location}</p>
                          <p className="text-gray-600">📅 {new Date(booking.event.startAt).toLocaleString()}</p>
                          <div className="mt-2">
                            <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                              {booking.quantity} × {booking.ticket.name} - ₹{booking.ticket.price * booking.quantity}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 mb-2">Booking ID: {booking.bookingId}</p>
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            booking.status === 'CONFIRMED' 
                              ? 'bg-green-100 text-green-800' 
                              : booking.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {booking.status}
                          </span>
                          {booking.status === 'CONFIRMED' && (
                            <div className="mt-3">
                              <TicketManager 
                                bookingId={booking.bookingId}
                                className="text-xs"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'role-upgrade' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">Role Upgrade</h1>

                {user.role === 'ATTENDEE' ? (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Request Role Upgrade</h2>
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
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-green-800 mb-2">Role Upgrade Not Available</h2>
                    <p className="text-green-700">
                      You currently have the <span className="font-semibold">{user.role}</span> role. 
                      Role upgrades are only available for Attendees.
                    </p>
                  </div>
                )}

                {/* Role upgrade requests history */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">Request History</h2>
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

            {activeTab === 'loyalty' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">Loyalty Points</h1>

                {/* Points Summary */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-6">
                  <h2 className="text-2xl font-semibold mb-2">Your Loyalty Points</h2>
                  <div className="text-4xl font-bold">{loyaltyData.loyaltyPoints}</div>
                  <p className="text-purple-100 mt-2">Keep booking events to earn more points!</p>
                </div>

                {/* Points Earning Guide */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">How to Earn Points</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 p-2 rounded-full">🎫</div>
                      <div>
                        <h3 className="font-medium">Event Booking</h3>
                        <p className="text-sm text-gray-600">Earn 1 point for every ₹10 spent</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-100 p-2 rounded-full">⬆️</div>
                      <div>
                        <h3 className="font-medium">Role Upgrade</h3>
                        <p className="text-sm text-gray-600">Get 500 bonus points on approval</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-yellow-100 p-2 rounded-full">🎉</div>
                      <div>
                        <h3 className="font-medium">Special Events</h3>
                        <p className="text-sm text-gray-600">Extra points during promotions</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-purple-100 p-2 rounded-full">👥</div>
                      <div>
                        <h3 className="font-medium">Referrals</h3>
                        <p className="text-sm text-gray-600">Coming soon!</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transaction History */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
                  {loyaltyData.transactions.length > 0 ? (
                    <div className="space-y-3">
                      {loyaltyData.transactions.map((transaction: any) => (
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
                    <p className="text-gray-500">No loyalty transactions found.</p>
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
