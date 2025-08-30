"use client";

import React, { useState } from 'react';

interface TicketData {
  booking: {
    bookingId: string;
    quantity: number;
    status: string;
    createdAt: string;
  };
  event: {
    title: string;
    description?: string;
    startAt: string;
    endAt?: string;
    location: string;
    category: string;
    organizer?: {
      name: string;
      email: string;
    };
  };
  user: {
    name?: string;
    email?: string;
    phone?: string;
  };
  ticketType?: {
    name: string;
    price: number;
  };
  payment?: {
    amount: number;
    status: string;
    createdAt: string;
  };
  qrCode: string;
  verificationUrl: string;
}

interface TicketManagerProps {
  bookingId: string;
  token?: string;
  className?: string;
}

export default function TicketManager({ bookingId, token, className = "" }: TicketManagerProps) {
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [isWhatsAppSending, setIsWhatsAppSending] = useState(false);
  const [isSMSSending, setIsSMSSending] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  const fetchTicketData = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/ticket/download?bookingId=${bookingId}&format=json`, {
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch ticket data`);
      }

      const data = await response.json();
      if (!data.success || !data.ticket) {
        throw new Error('Invalid response format from server');
      }
      
      setTicket(data.ticket);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      alert(`Failed to load ticket data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadTicket = async () => {
    setIsDownloading(true);
    setMessage(null);
    try {
      const headers: Record<string, string> = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/ticket/download?bookingId=${bookingId}`, {
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download ticket');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setMessage({ type: 'success', text: 'Ticket downloaded successfully! 📄' });
    } catch (error) {
      console.error('Error downloading ticket:', error);
      setMessage({ 
        type: 'error', 
        text: `Failed to download ticket: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const sendTicketEmail = async (emailAddress?: string) => {
    setIsEmailSending(true);
    setMessage(null);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/ticket/download', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          bookingId,
          action: 'email',
          recipient: emailAddress || email
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      const result = await response.json();
      setMessage({ type: 'success', text: 'Ticket sent via email successfully! 📧' });
    } catch (error) {
      console.error('Error sending email:', error);
      setMessage({ 
        type: 'error', 
        text: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsEmailSending(false);
    }
  };

  const sendTicketWhatsApp = async (phone?: string) => {
    setActionLoading('whatsapp');
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/ticket/download', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          bookingId,
          action: 'whatsapp',
          recipient: phone
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send WhatsApp message');
      }

      alert('Ticket details sent via WhatsApp!');
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      alert('Failed to send WhatsApp message');
    } finally {
      setActionLoading(null);
    }
  };

  const sendTicketSMS = async (phone?: string) => {
    setActionLoading('sms');
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/ticket/download', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          bookingId,
          action: 'sms',
          recipient: phone
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send SMS');
      }

      alert('Ticket details sent via SMS!');
    } catch (error) {
      console.error('Error sending SMS:', error);
      alert('Failed to send SMS');
    } finally {
      setActionLoading(null);
    }
  };

  React.useEffect(() => {
    fetchTicketData();
  }, [bookingId]);

  if (loading) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow-md ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow-md ${className}`}>
        <div className="text-center text-red-600">
          <p>Failed to load ticket data</p>
          <button 
            onClick={fetchTicketData}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
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

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <h2 className="text-2xl font-bold mb-2">🎫 Event Ticket</h2>
        <p className="text-blue-100">EventHive Digital Ticket</p>
      </div>

      {/* Event Information */}
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-3">{ticket.event.title}</h3>
          {ticket.event.description && (
            <p className="text-gray-600 mb-3">{ticket.event.description}</p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">📅 Date & Time</p>
              <p className="font-medium">{eventDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">📍 Location</p>
              <p className="font-medium">{ticket.event.location}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">🎟️ Booking ID</p>
              <p className="font-mono font-medium">{ticket.booking.bookingId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">📊 Quantity</p>
              <p className="font-medium">{ticket.booking.quantity} ticket(s)</p>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold">Entry QR Code</h4>
            <button
              onClick={() => setShowQR(!showQR)}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            >
              {showQR ? 'Hide QR' : 'Show QR'}
            </button>
          </div>
          
          {showQR && (
            <div className="text-center">
              <img 
                src={ticket.qrCode} 
                alt="QR Code"
                className="mx-auto mb-3 border rounded"
                width={200}
                height={200}
              />
              <p className="text-xs text-gray-500">
                Present this QR code at the venue entrance
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <h4 className="text-lg font-semibold mb-3">Download & Share</h4>
          
          {/* Download Button */}
          <button
            onClick={downloadTicket}
            disabled={actionLoading === 'download'}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
          >
            {actionLoading === 'download' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Downloading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF Ticket
              </>
            )}
          </button>

          {/* Email Button */}
          <button
            onClick={() => sendTicketEmail()}
            disabled={actionLoading === 'email' || !ticket.user.email}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            {actionLoading === 'email' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sending...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 3.26a2 2 0 001.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Send via Email {ticket.user.email && `(${ticket.user.email})`}
              </>
            )}
          </button>

          {/* WhatsApp Button */}
          <button
            onClick={() => sendTicketWhatsApp()}
            disabled={actionLoading === 'whatsapp' || !ticket.user.phone}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            {actionLoading === 'whatsapp' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sending...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.097" />
                </svg>
                Send via WhatsApp {ticket.user.phone && `(${ticket.user.phone})`}
              </>
            )}
          </button>

          {/* SMS Button */}
          <button
            onClick={() => sendTicketSMS()}
            disabled={actionLoading === 'sms' || !ticket.user.phone}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            {actionLoading === 'sms' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sending...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Send via SMS {ticket.user.phone && `(${ticket.user.phone})`}
              </>
            )}
          </button>
        </div>

        {/* Verification Link */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Verify this ticket online:</p>
          <a 
            href={ticket.verificationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm break-all"
          >
            {ticket.verificationUrl}
          </a>
        </div>

        {/* Ticket Details */}
        {(ticket.ticketType || ticket.payment) && (
          <div className="mt-6 p-4 border-t">
            <h5 className="font-semibold mb-2">Ticket Details</h5>
            {ticket.ticketType && (
              <p className="text-sm text-gray-600">
                Type: {ticket.ticketType.name} - ₹{ticket.ticketType.price}
              </p>
            )}
            {ticket.payment && (
              <p className="text-sm text-gray-600">
                Payment: ₹{ticket.payment.amount} ({ticket.payment.status})
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
