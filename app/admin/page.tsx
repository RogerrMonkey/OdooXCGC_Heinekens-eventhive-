"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
}

interface Event {
  id: string;
  title: string;
  organizer: { name: string; email: string };
  category: string;
  status: string;
  startAt: string;
  createdAt: string;
}

interface AdminStats {
  totalUsers: number;
  totalEvents: number;
  totalRevenue: number;
  totalBookings: number;
  activeEvents: number;
  newUsersThisMonth: number;
}

const AdminPanel = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [roleUpgradeRequests, setRoleUpgradeRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [eventSearch, setEventSearch] = useState('');
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    // Check if user has admin role
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.role !== 'ADMIN') {
        alert('Access denied. Admin role required.');
        router.push('/dashboard');
        return;
      }
    } else {
      router.push('/auth');
      return;
    }
    
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setEvents(data.events || []);
        setStats(data.stats || null);
        setRoleUpgradeRequests(data.roleUpgradeRequests || []);
      } else if (response.status === 403) {
        alert('Access denied. Admin privileges required.');
        router.push('/');
      } else {
        throw new Error('Failed to fetch admin data');
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      alert('Failed to load admin data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch('/api/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      });

      if (response.ok) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ));
        showNotification('success', 'User role updated successfully');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Network error. Please try again.');
    }
  };

  const updateEventStatus = async (eventId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, status: newStatus })
      });

      if (response.ok) {
        setEvents(events.map(event => 
          event.id === eventId ? { ...event, status: newStatus } : event
        ));
        alert('Event status updated successfully');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update event status');
      }
    } catch (error) {
      console.error('Error updating event status:', error);
      alert('Network error. Please try again.');
    }
  };

  const suspendUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to suspend ${userName}? This will demote them to ATTENDEE role.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin?userId=${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: 'ATTENDEE' } : user
        ));
        alert('User suspended successfully');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to suspend user');
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Network error. Please try again.');
    }
  };

  const viewEvent = (eventId: string) => {
    window.open(`/events/${eventId}`, '_blank');
  };

  const deleteEvent = async (eventId: string, eventTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin?eventId=${eventId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(events.filter(event => event.id !== eventId));
        alert(data.message || 'Event processed successfully');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Network error. Please try again.');
    }
  };

  const exportUsers = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Name,Email,Phone,Role,Created Date\n" +
      users.map(user => 
        `"${user.name}","${user.email}","${user.phone || ''}","${user.role}","${formatDate(user.createdAt)}"`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportEvents = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Title,Organizer,Category,Status,Start Date,Created Date\n" +
      events.map(event => 
        `"${event.title}","${event.organizer.name}","${event.category}","${event.status}","${formatDate(event.startAt)}","${formatDate(event.createdAt)}"`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `events_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter functions
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
    event.organizer.name.toLowerCase().includes(eventSearch.toLowerCase()) ||
    event.category.toLowerCase().includes(eventSearch.toLowerCase()) ||
    event.status.toLowerCase().includes(eventSearch.toLowerCase())
  );

  const handleRoleUpgradeRequest = async (requestId: string, action: 'approve' | 'reject', adminNote?: string) => {
    try {
      const response = await fetch('/api/admin/role-upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action, adminNote })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        
        // Remove the processed request from the list
        setRoleUpgradeRequests(roleUpgradeRequests.filter(req => req.id !== requestId));
        
        // If approved, update the user's role in the users list
        if (action === 'approve') {
          const processedRequest = roleUpgradeRequests.find(req => req.id === requestId);
          if (processedRequest) {
            setUsers(users.map(user => 
              user.id === processedRequest.userId 
                ? { ...user, role: processedRequest.requestedRole } 
                : user
            ));
          }
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to process request');
      }
    } catch (error) {
      console.error('Error processing role upgrade request:', error);
      alert('Network error. Please try again.');
    }
  };

  const bulkRejectRequests = async () => {
    if (!confirm(`Are you sure you want to reject all ${roleUpgradeRequests.length} pending requests?`)) {
      return;
    }

    const adminNote = prompt('Enter rejection reason for all requests:');
    if (!adminNote) return;

    for (const request of roleUpgradeRequests) {
      try {
        await fetch('/api/admin/role-upgrade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: request.id, action: 'reject', adminNote })
        });
      } catch (error) {
        console.error('Error rejecting request:', request.id);
      }
    }

    setRoleUpgradeRequests([]);
    alert('All requests have been rejected');
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
      day: 'numeric'
    });
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
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
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center">
            <span className="mr-2">
              {notification.type === 'success' ? '✅' : '❌'}
            </span>
            {notification.message}
            <button 
              onClick={() => setNotification(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="mt-1 text-sm text-gray-500">Manage users, events, and platform settings</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={fetchAdminData}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </button>
              <button
                onClick={() => router.push('/')}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Back to Platform
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
              { id: 'users', name: 'Users' },
              { id: 'events', name: 'Events' },
              { id: 'role-requests', name: 'Role Requests' },
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
                      <span className="text-white font-semibold">👥</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Users</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
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
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-semibold">🎫</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalBookings}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-semibold">🔥</span>
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
                    <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-semibold">📈</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">New Users (Month)</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.newUsersThisMonth}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Users</h3>
                <div className="space-y-3">
                  {users.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                        user.role === 'ORGANIZER' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Events</h3>
                <div className="space-y-3">
                  {events.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{event.title}</p>
                        <p className="text-sm text-gray-500">by {event.organizer.name}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                        event.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {event.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-900">User Management</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Showing {filteredUsers.length} of {users.length} users
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={exportUsers}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  📊 Export CSV
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm text-gray-900">{user.email}</p>
                          <p className="text-sm text-gray-500">{user.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="ATTENDEE">Attendee</option>
                          <option value="ORGANIZER">Organizer</option>
                          <option value="VOLUNTEER">Volunteer</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => suspendUser(user.id, user.name)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          Suspend
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Event Management</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Showing {filteredEvents.length} of {events.length} events
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={exportEvents}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  📊 Export CSV
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organizer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEvents.map((event) => (
                    <tr key={event.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{event.title}</p>
                          <p className="text-sm text-gray-500">{event.id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm text-gray-900">{event.organizer.name}</p>
                          <p className="text-sm text-gray-500">{event.organizer.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {event.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={event.status}
                          onChange={(e) => updateEventStatus(event.id, e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="PUBLISHED">Published</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(event.startAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => viewEvent(event.id)}
                          className="text-blue-600 hover:text-blue-900 mr-3 transition-colors"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => deleteEvent(event.id, event.title)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Role Requests Tab */}
        {activeTab === 'role-requests' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Role Upgrade Requests</h3>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">
                  {roleUpgradeRequests.length} pending requests
                </span>
                {roleUpgradeRequests.length > 0 && (
                  <button
                    onClick={bulkRejectRequests}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                  >
                    Reject All
                  </button>
                )}
              </div>
            </div>
            
            {roleUpgradeRequests.length > 0 ? (
              <div className="space-y-4">
                {roleUpgradeRequests.map((request: any) => (
                  <div key={request.id} className="bg-white border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-lg">
                          {request.user.name || 'Unknown User'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {request.user.email} • {request.user.phone}
                        </p>
                        <div className="flex items-center mt-2 space-x-4">
                          <span className="text-sm">
                            <strong>Current:</strong> {request.currentRole}
                          </span>
                          <span className="text-sm">
                            <strong>Requested:</strong> {request.requestedRole}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <h5 className="font-medium text-sm mb-2">Reason:</h5>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                        {request.reason}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          const adminNote = prompt('Add a note (optional):');
                          handleRoleUpgradeRequest(request.id, 'approve', adminNote || undefined);
                        }}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => {
                          const adminNote = prompt('Add a rejection reason:');
                          if (adminNote) {
                            handleRoleUpgradeRequest(request.id, 'reject', adminNote);
                          }
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-xl font-semibold mb-2">No Pending Requests</h3>
                <p className="text-gray-600">All role upgrade requests have been processed.</p>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && stats && (
          <div className="space-y-8">
            <h3 className="text-lg font-medium text-gray-900">Platform Analytics</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Revenue Analytics</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Platform Revenue</span>
                    <span className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average Event Revenue</span>
                    <span className="text-lg font-semibold text-blue-600">
                      {formatCurrency(stats.totalEvents > 0 ? stats.totalRevenue / stats.totalEvents : 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">User Growth</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Users</span>
                    <span className="text-2xl font-bold text-blue-600">{stats.totalUsers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">New This Month</span>
                    <span className="text-lg font-semibold text-green-600">{stats.newUsersThisMonth}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
