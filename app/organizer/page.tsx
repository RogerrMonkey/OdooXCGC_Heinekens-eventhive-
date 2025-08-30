"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Event {
  id: string;
  title: string;
  category: string;
  startAt: string;
  location: string;
  status: string;
  ticketTypes: Array<{
    name: string;
    price: number;
    totalSold: number;
    maxQuantity: number;
  }>;
  bookings: Array<{
    quantity: number;
    status: string;
    checkIns: Array<{ checkedAt: string }>;
  }>;
}

interface DashboardStats {
  totalEvents: number;
  activeEvents: number;
  totalRevenue: number;
  totalTicketsSold: number;
  totalAttendees: number;
  averageTicketPrice: number;
}

const OrganizerDashboard = () => {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard?type=organizer');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
        setStats(data.stats || null);
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

  const getEventStats = (event: Event) => {
    const totalBookings = event.bookings.length;
    const confirmedBookings = event.bookings.filter(b => b.status === 'CONFIRMED');
    const totalTicketsSold = confirmedBookings.reduce((sum, b) => sum + b.quantity, 0);
    const totalCheckedIn = confirmedBookings.filter(b => b.checkIns.length > 0).length;
    const totalRevenue = event.ticketTypes.reduce((sum, t) => sum + (t.price * t.totalSold), 0);
    
    return {
      totalBookings,
      confirmedBookings: confirmedBookings.length,
      totalTicketsSold,
      totalCheckedIn,
      totalRevenue,
      checkInRate: confirmedBookings.length > 0 ? (totalCheckedIn / confirmedBookings.length) * 100 : 0
    };
  };

  if (loading) {
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-semibold">✅</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Events</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.activeEvents}</p>
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
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-semibold">🎫</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Tickets Sold</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalTicketsSold}</p>
                  </div>
                </div>
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
                {events.map((event) => {
                  const eventStats = getEventStats(event);
                  return (
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

                      {/* Event Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{eventStats.totalBookings}</p>
                          <p className="text-xs text-gray-500">Total Bookings</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{eventStats.totalTicketsSold}</p>
                          <p className="text-xs text-gray-500">Tickets Sold</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">{formatCurrency(eventStats.totalRevenue)}</p>
                          <p className="text-xs text-gray-500">Revenue</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-600">{eventStats.totalCheckedIn}</p>
                          <p className="text-xs text-gray-500">Checked In</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-600">{Math.round(eventStats.checkInRate)}%</p>
                          <p className="text-xs text-gray-500">Check-in Rate</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-3">
                        <Link
                          href={`/events/${event.id}`}
                          className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View Event
                        </Link>
                        <button
                          onClick={() => window.open(`/api/checkin?eventId=${event.id}`, '_blank')}
                          className="flex-1 bg-green-600 text-white text-center py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Check-in Stats
                        </button>
                        <button
                          onClick={() => window.open(`/api/analytics?eventId=${event.id}`, '_blank')}
                          className="flex-1 bg-purple-600 text-white text-center py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Analytics
                        </button>
                      </div>
                    </div>
                  );
                })}
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
                    <span className="text-gray-600">Average Ticket Price</span>
                    <span className="text-lg font-semibold text-blue-600">{formatCurrency(stats.averageTicketPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Tickets Sold</span>
                    <span className="text-lg font-semibold text-purple-600">{stats.totalTicketsSold}</span>
                  </div>
                </div>
              </div>

              {/* Event Performance */}
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Event Performance</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Active Events</span>
                    <span className="text-2xl font-bold text-blue-600">{stats.activeEvents}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Attendees</span>
                    <span className="text-lg font-semibold text-green-600">{stats.totalAttendees}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Success Rate</span>
                    <span className="text-lg font-semibold text-purple-600">
                      {stats.totalEvents > 0 ? Math.round((stats.activeEvents / stats.totalEvents) * 100) : 0}%
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
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(getEventStats(event).totalRevenue)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {getEventStats(event).totalTicketsSold} tickets
                      </p>
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
