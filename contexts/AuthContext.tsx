'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ATTENDEE' | 'ORGANIZER' | 'VOLUNTEER' | 'ADMIN';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
          // Clear localStorage if API says user is not authenticated
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } else {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      // Call logout API to clear server-side session
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
    
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  useEffect(() => {
    // Check localStorage first for immediate UI update
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    // Then verify with server
    refreshUser();
  }, []);

  // Listen for storage changes (user login/logout in other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'token') {
        if (e.newValue === null) {
          setUser(null);
        } else if (e.key === 'user' && e.newValue) {
          try {
            setUser(JSON.parse(e.newValue));
          } catch (error) {
            console.error('Error parsing user data from storage:', error);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
