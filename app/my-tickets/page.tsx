"use client";

import React, { useState, useEffect } from 'react';
import TicketManager from '@/components/TicketManager';
import Link from 'next/link';

interface Booking {
  bookingId: string;
  status: string;
  quantity: number;
  createdAt: string;
  event: {
    title: string;
    startAt: string;
    location: string;
  };
  ticketType?: {
    name: string;
    price: number;
  };
  payment?: {
    amount: number;
    status: string;
  };
}

export default function MyTicketsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [testMode, setTestMode] = useState(false);
  const [manualBookingId, setManualBookingId] = useState('');

  useEffect(() => {
    fetchUserBookings();
  }, []);

  const fetchUserBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/user/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isAuthenticated = typeof window !== 'undefined' && localStorage.getItem('token');

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🎫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Your Tickets</h1>
          <p className="text-gray-600 mb-6">Please log in to view and manage your event tickets.</p>
          <div className="space-y-3">
            <Link 
              href="/auth" 
              className="block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Login to View Tickets
            </Link>
            <Link 
              href="/" 
              className="block text-blue-600 hover:text-blue-700 transition-colors"
            >
              Browse Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Tickets</h1>
              <p className="text-gray-600 mt-2">Manage your event tickets and bookings</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setTestMode(!testMode)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  testMode 
                    ? 'bg-orange-100 text-orange-800 border border-orange-200' 
                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                }`}
              >
                {testMode ? 'Exit Test Mode' : 'Test Mode'}
              </button>
              <Link
                href="/events"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Events
              </Link>
            </div>
          </div>
        </div>

        {/* Test Mode Section */}
        {testMode && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-orange-900 mb-4">Test Ticket Management</h2>
            <p className="text-orange-800 mb-4">Enter any booking ID to test the ticket management features:</p>
            <div className="flex gap-4">
              <input
                type="text"
                value={manualBookingId}
                onChange={(e) => setManualBookingId(e.target.value)}
                placeholder="Enter booking ID (e.g., BH-12345678)"
                className="flex-1 px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                onClick={() => setSelectedBooking(manualBookingId)}
                disabled={!manualBookingId}
                className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400"
              >
                Test Ticket
              </button>
            </div>
            {manualBookingId && (
              <div className="mt-4 p-3 bg-orange-100 rounded text-sm">
                <strong>Note:</strong> This will test ticket generation for booking ID: {manualBookingId}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your tickets...</p>
          </div>
        ) : bookings.length === 0 && !testMode ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🎫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Tickets Yet</h2>
            <p className="text-gray-600 mb-6">You haven't booked any events yet. Start exploring events to get your first ticket!</p>
            <Link
              href="/events"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Bookings List */}
            {bookings.map((booking) => (
              <div key={booking.bookingId} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{booking.event.title}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Date:</span> {formatDate(booking.event.startAt)}
                        </div>
                        <div>
                          <span className="font-medium">Location:</span> {booking.event.location}
                        </div>
                        <div>
                          <span className="font-medium">Booking ID:</span> {booking.bookingId}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                      <button
                        onClick={() => setSelectedBooking(selectedBooking === booking.bookingId ? null : booking.bookingId)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        {selectedBooking === booking.bookingId ? 'Hide Options' : 'Manage Ticket'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Quantity:</span>
                      <div>{booking.quantity} ticket(s)</div>
                    </div>
                    {booking.ticketType && (
                      <div>
                        <span className="font-medium text-gray-700">Type:</span>
                        <div>{booking.ticketType.name}</div>
                      </div>
                    )}
                    {booking.payment && (
                      <div>
                        <span className="font-medium text-gray-700">Amount:</span>
                        <div>Rs. {booking.payment.amount.toLocaleString()}</div>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-700">Booked:</span>
                      <div>{new Date(booking.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>

                {/* Ticket Manager Component */}
                {selectedBooking === booking.bookingId && (
                  <div className="border-t bg-gray-50 p-6">
                    <TicketManager 
                      bookingId={booking.bookingId}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            ))}

            {/* Test Booking Display */}
            {testMode && selectedBooking === manualBookingId && (
              <div className="bg-white rounded-lg shadow-sm border border-orange-200">
                <div className="bg-orange-50 p-4 border-b border-orange-200">
                  <h3 className="text-lg font-semibold text-orange-900">Test Ticket Management</h3>
                  <p className="text-orange-800 text-sm">Testing ticket features for booking ID: {manualBookingId}</p>
                </div>
                <div className="p-6">
                  <TicketManager 
                    bookingId={manualBookingId}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/events"
              className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 text-center transition-colors"
            >
              <div className="text-2xl mb-2">🎪</div>
              <div className="font-medium text-blue-900">Browse Events</div>
              <div className="text-sm text-blue-700">Discover new events</div>
            </Link>
            <Link
              href="/dashboard"
              className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 text-center transition-colors"
            >
              <div className="text-2xl mb-2">📊</div>
              <div className="font-medium text-green-900">Dashboard</div>
              <div className="text-sm text-green-700">View your activity</div>
            </Link>
            <Link
              href="/create-event"
              className="bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg p-4 text-center transition-colors"
            >
              <div className="text-2xl mb-2">✨</div>
              <div className="font-medium text-purple-900">Create Event</div>
              <div className="text-sm text-purple-700">Host your own event</div>
            </Link>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Need Help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-blue-900 mb-2">Ticket Management Features:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Download PDF tickets for printing</li>
                <li>• Email tickets to yourself or others</li>
                <li>• Share tickets via WhatsApp</li>
                <li>• Send ticket details via SMS</li>
                <li>• Verify tickets with QR codes</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-2">Ticket Verification:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Each ticket has a unique QR code</li>
                <li>• Present QR code at venue entrance</li>
                <li>• Venue staff can scan for verification</li>
                <li>• Check ticket status online anytime</li>
                <li>• Keep booking ID for reference</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
