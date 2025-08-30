"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface TicketVerification {
  valid: boolean;
  ticket?: {
    bookingId: string;
    status: string;
    statusMessage: string;
    quantity: number;
    createdAt: string;
    event: {
      title: string;
      startAt: string;
      endAt?: string;
      location: string;
      status: string;
    };
    user: {
      name?: string;
      email?: string;
    };
    ticketType: {
      name: string;
      price: number;
    };
  };
  error?: string;
}

export default function TicketVerifyPage() {
  const params = useParams();
  const bookingId = params.bookingId as string;
  const [verification, setVerification] = useState<TicketVerification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyTicket = async () => {
      try {
        const response = await fetch(`/api/ticket/verify/${bookingId}`);
        const data = await response.json();
        setVerification(data);
      } catch (error) {
        console.error('Error verifying ticket:', error);
        setVerification({
          valid: false,
          error: 'Failed to verify ticket'
        });
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      verifyTicket();
    }
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!verification || verification.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">Verification Failed</h1>
            <p className="text-gray-600 mb-6">
              {verification?.error || 'Unable to verify this ticket'}
            </p>
            <div className="text-sm text-gray-500">
              Booking ID: {bookingId}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { ticket } = verification;
  
  if (!verification.valid || !ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-orange-600 mb-4">Invalid Ticket</h1>
            <p className="text-gray-600 mb-4">
              {ticket?.statusMessage || 'This ticket is not valid'}
            </p>
            {ticket && (
              <div className="text-left bg-gray-50 rounded-lg p-4 mb-4">
                <div className="text-sm space-y-1">
                  <div><strong>Status:</strong> {ticket.status}</div>
                  <div><strong>Event:</strong> {ticket.event.title}</div>
                  <div><strong>Booking ID:</strong> {ticket.bookingId}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const eventDate = new Date(ticket.event.startAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
      case 'upcoming':
        return 'text-green-600';
      case 'ongoing':
        return 'text-blue-600';
      case 'expired':
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
      case 'upcoming':
        return '✅';
      case 'ongoing':
        return '🎪';
      case 'expired':
        return '⏰';
      case 'cancelled':
        return '❌';
      default:
        return '❓';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">{getStatusIcon(ticket.status)}</div>
              <h1 className="text-2xl font-bold mb-2">Ticket Verification</h1>
              <p className="text-green-100">EventHive Digital Ticket System</p>
            </div>
          </div>

          {/* Status */}
          <div className="p-6 border-b">
            <div className="text-center">
              <div className={`text-xl font-bold mb-2 ${getStatusColor(ticket.status)}`}>
                {ticket.statusMessage}
              </div>
              <div className="text-sm text-gray-500">
                Status: <span className="font-medium">{ticket.status.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{ticket.event.title}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">📅 Event Date & Time</h3>
                <p className="text-gray-800">{eventDate}</p>
                {ticket.event.endAt && (
                  <p className="text-sm text-gray-600">
                    Ends: {new Date(ticket.event.endAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">📍 Location</h3>
                <p className="text-gray-800">{ticket.event.location}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">🎟️ Ticket Type</h3>
                <p className="text-gray-800">{ticket.ticketType.name}</p>
                <p className="text-sm text-gray-600">₹{ticket.ticketType.price}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">📊 Quantity</h3>
                <p className="text-gray-800">{ticket.quantity} ticket(s)</p>
              </div>
            </div>
          </div>

          {/* Ticket Holder */}
          {ticket.user.name && (
            <div className="p-6 border-t bg-gray-50">
              <h3 className="text-sm font-medium text-gray-500 mb-2">🎫 Ticket Holder</h3>
              <p className="text-gray-800 font-medium">{ticket.user.name}</p>
              {ticket.user.email && (
                <p className="text-sm text-gray-600">{ticket.user.email}</p>
              )}
            </div>
          )}

          {/* Booking Details */}
          <div className="p-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Booking ID:</span>
                <span className="ml-2 font-mono font-medium">{ticket.bookingId}</span>
              </div>
              <div>
                <span className="text-gray-500">Verified At:</span>
                <span className="ml-2">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-gray-50">
            <div className="text-center text-sm text-gray-500">
              <p>🔒 This verification is valid for this moment only</p>
              <p>For real-time verification, scan the QR code on the ticket</p>
              <p className="mt-2">Powered by EventHive Digital Ticket System</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            🔄 Verify Again
          </button>
          
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
