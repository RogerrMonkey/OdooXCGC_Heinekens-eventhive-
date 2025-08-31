'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface Event {
  id: string
  title: string
  startAt: string
  location: string
  status: string
}

interface CheckInData {
  id: string
  bookingId: string
  checkedAt: string
  booking: {
    user: {
      name: string
      email: string
    }
    event: {
      title: string
    }
  }
}

export default function VolunteerDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [recentCheckIns, setRecentCheckIns] = useState<CheckInData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'checkin' | 'events'>('overview')
  const [qrScanResult, setQrScanResult] = useState('')
  const [scanLoading, setScanLoading] = useState(false)

  useEffect(() => {
    // Check user role
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth/role-based')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role !== 'VOLUNTEER' && parsedUser.role !== 'ADMIN') {
        router.push('/auth/role-based')
        return
      }
      setUser(parsedUser)
      fetchDashboardData()
    } catch (error) {
      router.push('/auth/role-based')
    }
  }, [router])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Fetch upcoming events
      const eventsResponse = await fetch('/api/events/list?status=PUBLISHED', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const eventsData = await eventsResponse.json()
      if (eventsData.ok) {
        setEvents(eventsData.events.filter((event: Event) => new Date(event.startAt) >= new Date()))
      }

      // Fetch recent check-ins
      const checkInsResponse = await fetch('/api/checkin?recent=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const checkInsData = await checkInsResponse.json()
      if (checkInsData.ok) {
        setRecentCheckIns(checkInsData.checkIns || [])
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQRScan = async () => {
    if (!qrScanResult.trim()) {
      alert('Please enter a booking ID')
      return
    }

    setScanLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookingId: qrScanResult.trim() })
      })

      const data = await response.json()
      if (data.ok) {
        alert('Check-in successful!')
        setQrScanResult('')
        fetchDashboardData() // Refresh data
      } else {
        alert(data.error || 'Check-in failed')
      }
    } catch (error) {
      console.error('Check-in error:', error)
      alert('Network error. Please try again.')
    } finally {
      setScanLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
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
      <div className="bg-purple-600 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Volunteer Dashboard</h1>
              <p className="text-purple-100">Help make events successful, {user.name}!</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-purple-100">Active Events</div>
              <div className="text-2xl font-bold">{events.length}</div>
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
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🤝</span>
                </div>
                <h2 className="font-semibold">{user.name || 'Volunteer'}</h2>
                <p className="text-sm text-gray-600">{user.email}</p>
                <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full mt-2">
                  {user.role}
                </span>
              </div>

              <nav className="space-y-2">
                {['overview', 'checkin', 'events'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      activeTab === tab
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab === 'checkin' ? 'Check-in' : 
                     tab === 'events' ? 'Events' :
                     'Overview'}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Overview</h2>
                
                {/* Stats Cards */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-blue-100 rounded-full">
                        <span className="text-2xl">📅</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-gray-600 text-sm">Upcoming Events</p>
                        <p className="text-2xl font-bold text-gray-800">{events.length}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-green-100 rounded-full">
                        <span className="text-2xl">✅</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-gray-600 text-sm">Recent Check-ins</p>
                        <p className="text-2xl font-bold text-gray-800">{recentCheckIns.length}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-purple-100 rounded-full">
                        <span className="text-2xl">🎯</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-gray-600 text-sm">Role</p>
                        <p className="text-lg font-bold text-gray-800">Volunteer</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Check-ins */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Check-ins</h3>
                  {recentCheckIns.length > 0 ? (
                    <div className="space-y-3">
                      {recentCheckIns.slice(0, 5).map((checkIn) => (
                        <div key={checkIn.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">{checkIn.booking.user.name}</p>
                            <p className="text-sm text-gray-600">{checkIn.booking.event.title}</p>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(checkIn.checkedAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No recent check-ins</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'checkin' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Attendee Check-in</h2>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Scan QR Code or Enter Booking ID</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Booking ID</label>
                      <input
                        type="text"
                        value={qrScanResult}
                        onChange={(e) => setQrScanResult(e.target.value)}
                        placeholder="Enter booking ID or scan QR code"
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <button
                      onClick={handleQRScan}
                      disabled={scanLoading || !qrScanResult.trim()}
                      className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {scanLoading ? 'Processing...' : 'Check In Attendee'}
                    </button>
                  </div>
                </div>

                {/* Check-in History */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Today's Check-ins</h3>
                  {recentCheckIns.length > 0 ? (
                    <div className="space-y-3">
                      {recentCheckIns.map((checkIn) => (
                        <div key={checkIn.id} className="flex justify-between items-center p-4 border rounded">
                          <div>
                            <p className="font-medium">{checkIn.booking.user.name}</p>
                            <p className="text-sm text-gray-600">{checkIn.booking.user.email}</p>
                            <p className="text-sm text-gray-500">{checkIn.booking.event.title}</p>
                          </div>
                          <div className="text-right">
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                              Checked In
                            </span>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(checkIn.checkedAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No check-ins today</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'events' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Upcoming Events</h2>
                
                {events.length > 0 ? (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div key={event.id} className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold">{event.title}</h3>
                            <p className="text-gray-600">{event.location}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(event.startAt).toLocaleDateString()} at{' '}
                              {new Date(event.startAt).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded text-xs ${
                              event.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {event.status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <Link
                            href={`/events/${event.id}`}
                            className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg">
                    <div className="text-6xl mb-4">📅</div>
                    <h3 className="text-xl font-semibold mb-2">No upcoming events</h3>
                    <p className="text-gray-600">Check back later for events that need volunteers.</p>
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
