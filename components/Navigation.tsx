"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function Navigation() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsLoggedIn(false);
    router.push('/');
  };

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
          <Link href="/create-event" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
            Create Event
          </Link>
          
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                Dashboard
              </Link>
              <Link href="/profile" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                Profile
              </Link>
              {user?.role === 'ADMIN' && (
                <Link href="/admin" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                  Admin
                </Link>
              )}
              {user?.role === 'ORGANIZER' && (
                <Link href="/organizer" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                  Organizer
                </Link>
              )}
              <div className="flex items-center space-x-4">
                <span className="text-gray-600 text-sm">Hi, {user?.name || 'User'}</span>
                <button 
                  onClick={logout}
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