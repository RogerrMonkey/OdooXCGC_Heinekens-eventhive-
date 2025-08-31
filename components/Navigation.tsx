"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Navigation() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Show loading state
  if (isLoading) {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-3xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
            EventHive
          </Link>
          <div className="animate-pulse">
            <div className="h-8 w-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-3xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
          EventHive
        </Link>
        
        <nav className="hidden md:flex space-x-8">
          <Link href="/events" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
            Browse Events
          </Link>
          {(user?.role === 'ORGANIZER' || user?.role === 'ADMIN') && (
            <Link href="/create-event" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              Create Event
            </Link>
          )}
          
          {user ? (
            <>
              {user?.role === 'ATTENDEE' && (
                <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                  My Dashboard
                </Link>
              )}
              {user?.role === 'VOLUNTEER' && (
                <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                  Volunteer Dashboard
                </Link>
              )}
              {user?.role === 'ORGANIZER' && (
                <Link href="/organizer" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                  Organizer Dashboard
                </Link>
              )}
              {user?.role === 'ADMIN' && (
                <Link href="/admin" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                  Admin Panel
                </Link>
              )}
              <Link href="/profile" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                Profile
              </Link>
              <div className="flex items-center space-x-4">
                <span className="text-gray-600 text-sm">Hi, {user?.name || 'User'}</span>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {user?.role}
                </span>
                <button 
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600 transition-colors font-medium"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <Link href="/auth" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg">
              Login
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-gray-600 hover:text-blue-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </header>
  );
}