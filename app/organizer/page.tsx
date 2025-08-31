"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface Event {
  id: string;
  title: string;
  category: string;
  startAt: string;
  location: string;
  status: string;
  description: string;
  createdAt: string;
}

interface UserStats {
  totalEvents: number;
  totalRevenue: number;
  loyaltyPoints: number;
  memberSince: string;
}

interface EventBooking {
  id: string;
  bookingId: string;
  quantity: number;
  status: string;
  createdAt: string;
  event: {
    title: string;
    startAt: string;
  };
  ticket: {
    name: string;
    price: number;
  };
}

const OrganizerDashboard = () => {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<EventBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Check authentication and role
    if (!isLoading && !user) {
      router.push('/auth');
      return;
    }

    if (!isLoading && user && user.role !== 'ORGANIZER' && user.role !== 'ADMIN') {
      alert('Access denied. Organizer role required.');
      router.push('/dashboard');
      return;
    }

    if (user) {
      fetchDashboardData();
    }
  }, [user, isLoading, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user events
      const eventsResponse = await fetch('/api/user/events', {
        credentials: 'include',
      });
      
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEvents(eventsData.events || []);
      }

      // Fetch user stats
      const statsResponse = await fetch('/api/user/stats', {
        credentials: 'include',
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats || null);
      }

      // Fetch recent bookings for organizer's events
      const bookingsResponse = await fetch('/api/organizer/bookings', {
        credentials: 'include',
      });
      
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setRecentBookings(bookingsData.bookings || []);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">Manage your events and track performance</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/create-event"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Event
              </Link>
              <button
                onClick={() => router.push('/')}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'events', name: 'My Events' },
              { id: 'analytics', name: 'Analytics' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-semibold">📅</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Events</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalEvents}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-semibold">💰</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-semibold">⭐</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Loyalty Points</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.loyaltyPoints}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Bookings</h3>
              </div>
              <div className="p-6">
                {recentBookings.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No bookings yet</p>
                ) : (
                  <div className="space-y-4">
                    {recentBookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                        <div>
                          <p className="font-medium text-gray-900">{booking.event.title}</p>
                          <p className="text-sm text-gray-500">{booking.ticket.name} × {booking.quantity}</p>
                          <p className="text-xs text-gray-400">{formatDate(booking.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(booking.ticket.price * booking.quantity)}</p>
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                            booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                            booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/create-event"
                  className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors"
                >
                  <h4 className="font-medium text-blue-900">Create New Event</h4>
                  <p className="text-sm text-blue-700 mt-1">Set up a new event and start selling tickets</p>
                </Link>
                
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors text-left"
                >
                  <h4 className="font-medium text-green-900">View Analytics</h4>
                  <p className="text-sm text-green-700 mt-1">Track performance and revenue</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('events')}
                  className="bg-purple-50 border border-purple-200 rounded-lg p-4 hover:bg-purple-100 transition-colors text-left"
                >
                  <h4 className="font-medium text-purple-900">Manage Events</h4>
                  <p className="text-sm text-purple-700 mt-1">Edit and monitor your events</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">My Events</h3>
              <Link
                href="/create-event"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create New Event
              </Link>
            </div>

            {events.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl">📅</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
                <p className="text-gray-500 mb-6">Get started by creating your first event</p>
                <Link
                  href="/create-event"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                >
                  Create Your First Event
                </Link>
              </div>
            ) : (
              <div className="grid gap-6">
                {events.map((event) => (
                  <div key={event.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900">{event.title}</h4>
                        <p className="text-gray-600">{event.category}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          📅 {formatDate(event.startAt)}
                        </p>
                        <p className="text-sm text-gray-500">
                          📍 {event.location}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          event.status === 'PUBLISHED' 
                            ? 'bg-green-100 text-green-800'
                            : event.status === 'DRAFT'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {event.status}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-600 text-sm line-clamp-2">{event.description}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <Link
                        href={`/events/${event.id}`}
                        className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View Event
                      </Link>
                      <Link
                        href={`/create-event?edit=${event.id}`}
                        className="flex-1 bg-gray-600 text-white text-center py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Edit Event
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && stats && (
          <div className="space-y-8">
            <h3 className="text-lg font-medium text-gray-900">Performance Analytics</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Revenue Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Revenue Overview</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Revenue</span>
                    <span className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Events</span>
                    <span className="text-lg font-semibold text-blue-600">{stats.totalEvents}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Loyalty Points</span>
                    <span className="text-lg font-semibold text-purple-600">{stats.loyaltyPoints}</span>
                  </div>
                </div>
              </div>

              {/* Event Performance */}
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Event Statistics</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Member Since</span>
                    <span className="text-lg font-semibold text-gray-700">{stats.memberSince}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Recent Bookings</span>
                    <span className="text-lg font-semibold text-green-600">{recentBookings.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average Revenue per Event</span>
                    <span className="text-lg font-semibold text-purple-600">
                      {stats.totalEvents > 0 ? formatCurrency(stats.totalRevenue / stats.totalEvents) : formatCurrency(0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Events</h4>
              <div className="space-y-3">
                {events.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{event.title}</p>
                      <p className="text-sm text-gray-500">{formatDate(event.startAt)}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.status === 'PUBLISHED' 
                          ? 'bg-green-100 text-green-800'
                          : event.status === 'DRAFT'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizerDashboard;
