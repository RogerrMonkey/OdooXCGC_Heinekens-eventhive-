"use client";

import React, { useState } from 'react';
import TicketManager from '@/components/TicketManager';

export default function TicketTestPage() {
  const [bookingId, setBookingId] = useState('');
  const [token, setToken] = useState('');
  const [showTicket, setShowTicket] = useState(false);

  // Mock JWT token for testing
  const generateTestToken = () => {
    const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQiLCJpYXQiOjE2MzIzNjQ4MDB9.test";
    setToken(testToken);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">🎫 Ticket Management System</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Booking ID
              </label>
              <input
                type="text"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                placeholder="Enter booking ID (e.g., clz123abc...)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                JWT Token (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Bearer token for authentication"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={generateTestToken}
                  className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Test Token
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setShowTicket(true)}
              disabled={!bookingId}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              Load Ticket
            </button>
            
            <button
              onClick={() => setShowTicket(false)}
              className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Clear
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <h3 className="text-lg font-medium text-blue-900 mb-2">📋 How to Test</h3>
            <ol className="list-decimal list-inside text-blue-800 space-y-1 text-sm">
              <li>Create a booking through the payment system first</li>
              <li>Get the booking ID (format: BH-xxxxxxxx) from the successful payment response</li>
              <li>Enter the booking ID above and click "Load Ticket"</li>
              <li>Test download, email, WhatsApp, and SMS features</li>
              <li>Verify the QR code functionality</li>
            </ol>
            <div className="mt-3 p-2 bg-blue-100 rounded text-sm">
              <strong>💡 Tip:</strong> Go to the dashboard to see your recent bookings and copy a booking ID from there.
            </div>
          </div>

          {/* API Endpoints Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">🔗 Available Endpoints</h3>
            <div className="space-y-2 text-sm">
              <div><strong>GET</strong> /api/ticket/download?bookingId=ID&format=pdf - Download PDF ticket</div>
              <div><strong>GET</strong> /api/ticket/download?bookingId=ID&format=json - Get ticket data as JSON</div>
              <div><strong>POST</strong> /api/ticket/download - Send ticket via email/SMS/WhatsApp</div>
              <div><strong>GET</strong> /api/ticket/verify/[bookingId] - Verify ticket validity</div>
              <div><strong>POST</strong> /api/ticket/verify/[bookingId] - Check-in functionality</div>
            </div>
          </div>
        </div>

        {/* Ticket Manager Component */}
        {showTicket && bookingId && (
          <TicketManager 
            bookingId={bookingId}
            token={token || undefined}
            className="mb-8"
          />
        )}

        {/* Quick Test Buttons */}
        {bookingId && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold mb-4">🧪 Quick API Tests</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/ticket/download?bookingId=${bookingId}&format=json`);
                    const data = await response.json();
                    console.log('Ticket Data:', data);
                    alert('Check console for ticket data');
                  } catch (error) {
                    alert('Error: ' + error);
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Test JSON API
              </button>

              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/ticket/verify/${bookingId}`);
                    const data = await response.json();
                    console.log('Verification:', data);
                    alert(`Ticket Valid: ${data.valid}`);
                  } catch (error) {
                    alert('Error: ' + error);
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Test Verification
              </button>

              <button
                onClick={() => {
                  const url = `/api/ticket/download?bookingId=${bookingId}`;
                  window.open(url, '_blank');
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                Direct Download
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
