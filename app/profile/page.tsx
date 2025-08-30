'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import TicketManager from '@/components/TicketManager'

interface User {
  id: string
  name?: string
  email?: string
  phone?: string
  role: string
}

interface Booking {
  id: string
  bookingId: string
  quantity: number
  status: string
  eventId: string
  event: {
    title: string
    startAt: string
    location: string
  }
  ticket: {
    name: string
    price: number
  }
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  })

  useEffect(() => {
    fetchUserProfile()
    fetchUserBookings()
  }, [])

  const fetchUserProfile = async () => {
    try {
      // This would normally get the user from session/auth
      // For demo purposes, we'll use a mock user
      const mockUser = {
        id: 'user_1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+91 98765 43210',
        role: 'ATTENDEE'
      }
      setUser(mockUser)
      setFormData({
        name: mockUser.name || '',
        email: mockUser.email || '',
        phone: mockUser.phone || ''
      })
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserBookings = async () => {
    try {
      const response = await fetch('/api/user/bookings')
      const data = await response.json()
      if (data.ok) {
        setBookings(data.bookings)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      if (data.ok) {
        setUser(prev => prev ? { ...prev, ...formData } : null)
        setEditing(false)
        alert('Profile updated successfully!')
      } else {
        alert(data.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Please log in to view your profile</h2>
          <Link href="/auth" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {user.name ? user.name.charAt(0).toUpperCase() : '👤'}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">{user.name || 'Anonymous User'}</h1>
                  <p className="text-gray-600 text-lg">{user.role}</p>
                </div>
              </div>
              <button
                onClick={() => setEditing(!editing)}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold"
              >
                {editing ? '✕ Cancel' : '✏️ Edit Profile'}
              </button>
            </div>

            {/* Profile Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                {editing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="text-gray-800 text-lg p-3 bg-gray-50 rounded-lg">{user.name || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                {editing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your email"
                  />
                ) : (
                  <p className="text-gray-800 text-lg p-3 bg-gray-50 rounded-lg">{user.email || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                {editing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <p className="text-gray-800 text-lg p-3 bg-gray-50 rounded-lg">{user.phone || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Account Type</label>
                <p className="text-gray-800 text-lg p-3 bg-gray-50 rounded-lg capitalize">{user.role.toLowerCase()}</p>
              </div>
            </div>

            {editing && (
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleSave}
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                >
                  💾 Save Changes
                </button>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{bookings.length}</div>
              <div className="text-gray-600">Total Bookings</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {bookings.filter(b => b.status === 'CONFIRMED').length}
              </div>
              <div className="text-gray-600">Confirmed Events</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                ₹{bookings.reduce((sum, booking) => sum + (booking.ticket.price * booking.quantity), 0).toLocaleString()}
              </div>
              <div className="text-gray-600">Total Spent</div>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="mr-3">🎫</span>
              My Bookings
            </h2>

            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl">🎫</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
                <p className="text-gray-600 mb-6">Start exploring events and book your first ticket!</p>
                <Link href="/events" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  Browse Events
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="border border-gray-200 rounded-xl p-6 hover:border-blue-200 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{booking.event.title}</h3>
                        <p className="text-gray-600">Booking ID: {booking.bookingId}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500 mb-1">Date & Time</div>
                        <div className="font-semibold">{formatDate(booking.event.startAt)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Location</div>
                        <div className="font-semibold">{booking.event.location}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Ticket Type</div>
                        <div className="font-semibold">{booking.ticket.name} × {booking.quantity}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Total Amount</div>
                        <div className="font-semibold text-blue-600">₹{(booking.ticket.price * booking.quantity).toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 pt-4 border-t border-gray-100 gap-4">
                      <Link 
                        href={`/events/${booking.eventId}`}
                        className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                      >
                        View Event →
                      </Link>
                      
                      {/* Integrated Ticket Management */}
                      <div className="w-full sm:w-auto">
                        <TicketManager 
                          bookingId={booking.bookingId}
                          className="w-full sm:w-auto"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
