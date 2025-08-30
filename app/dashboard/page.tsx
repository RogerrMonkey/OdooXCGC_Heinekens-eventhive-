'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
  const [analytics, setAnalytics] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'bookings' | 'analytics'>('overview')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth')
      return
    }
    
    fetchDashboardData()
  }, [])

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
        setAnalytics(data.analytics)
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
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            EventHive
          </Link>
          <div className="flex items-center space-x-6">
            <Link href="/events" className="text-gray-600 hover:text-blue-600">
              Browse Events
            </Link>
            <Link href="/create-event" className="text-gray-600 hover:text-blue-600">
              Create Event
            </Link>
            <div className="flex items-center space-x-3">
              <span className="text-gray-600">Hi, {user.name || 'User'}</span>
              <button 
                onClick={logout}
                className="text-gray-600 hover:text-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

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
                {['overview', 'events', 'bookings', 'analytics'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      activeTab === tab
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
                        <p className="text-2xl font-bold">{analytics.totalEvents || 0}</p>
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
                        <p className="text-2xl font-bold">{analytics.totalBookings || 0}</p>
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
                          {analytics.eventAnalytics?.reduce((sum: number, event: any) => sum + event.totalTicketsSold, 0) || 0}
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
                        <p className="text-sm text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold">
                          ₹{analytics.eventAnalytics?.reduce((sum: number, event: any) => sum + event.totalRevenue, 0) || 0}
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

            {activeTab === 'events' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h1 className="text-3xl font-bold">My Events</h1>
                  <Link 
                    href="/create-event"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    + Create Event
                  </Link>
                </div>

                <div className="grid gap-6">
                  {myEvents.map((event) => (
                    <div key={event.id} className="bg-white rounded-lg shadow p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold">{event.title}</h3>
                          <p className="text-gray-600">📍 {event.location}</p>
                          <p className="text-gray-600">📅 {new Date(event.startAt).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            event.status === 'PUBLISHED' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {event.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Tickets Sold</p>
                          <p className="text-lg font-semibold">
                            {event.bookings?.reduce((sum, booking) => sum + booking.quantity, 0) || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Revenue</p>
                          <p className="text-lg font-semibold">
                            ₹{event.bookings?.reduce((sum, booking) => sum + (booking.quantity * booking.ticket?.price || 0), 0) || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Ticket Types</p>
                          <p className="text-lg font-semibold">{event.ticketTypes?.length || 0}</p>
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <Link 
                          href={`/events/${event.id}`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          View Details
                        </Link>
                        <button className="text-green-600 hover:text-green-700">
                          Edit Event
                        </button>
                        <button className="text-purple-600 hover:text-purple-700">
                          Analytics
                        </button>
                      </div>
                    </div>
                  ))}
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
                            <div className="mt-2 space-y-1">
                              <button className="block text-xs text-blue-600 hover:text-blue-700">
                                Download Ticket
                              </button>
                              <button className="block text-xs text-green-600 hover:text-green-700">
                                View QR Code
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">Analytics</h1>

                {analytics.eventAnalytics?.length > 0 ? (
                  <div className="grid gap-6">
                    {analytics.eventAnalytics.map((eventData: any, index: number) => (
                      <div key={index} className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold mb-4">{eventData.title}</h3>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600">{eventData.totalTicketsSold}</p>
                            <p className="text-sm text-gray-600">Tickets Sold</p>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">₹{eventData.totalRevenue}</p>
                            <p className="text-sm text-gray-600">Revenue</p>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <p className="text-2xl font-bold text-purple-600">{eventData.status}</p>
                            <p className="text-sm text-gray-600">Status</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-xl font-semibold mb-2">No analytics data</h3>
                    <p className="text-gray-600">Create some events to see analytics.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
