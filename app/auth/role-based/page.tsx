'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function RoleBasedAuthPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [selectedRole, setSelectedRole] = useState<'ATTENDEE' | 'ORGANIZER' | 'VOLUNTEER' | null>(null)
  const [step, setStep] = useState<'role-selection' | 'login' | 'verify'>('role-selection')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const roleDescriptions = {
    ATTENDEE: {
      title: 'Event Attendee',
      description: 'Browse and book tickets for events',
      features: ['Book event tickets', 'View booking history', 'Earn loyalty points', 'Cancel bookings with refunds'],
      color: 'blue'
    },
    ORGANIZER: {
      title: 'Event Organizer', 
      description: 'Create and manage events',
      features: ['Create and manage events', 'Track sales and analytics', 'Manage attendee lists', 'Export attendee data'],
      color: 'green'
    },
    VOLUNTEER: {
      title: 'Event Volunteer',
      description: 'Help with event operations',
      features: ['Check-in attendees', 'Assist with event operations', 'Access volunteer dashboard', 'Support event logistics'],
      color: 'purple'
    }
  }

  const sendOTP = async () => {
    if (!email || !selectedRole) return

    setLoading(true)
    try {
      const response = await fetch('/api/auth/role-based-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, requestedRole: selectedRole })
      })

      const data = await response.json()
      if (data.ok) {
        setStep('verify')
      } else {
        alert(data.error || 'Failed to send OTP')
      }
    } catch (error) {
      console.error('Error sending OTP:', error)
      alert('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const verifyOTP = async () => {
    if (!code || !selectedRole) return

    setLoading(true)
    try {
      const response = await fetch('/api/auth/role-based-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, name, requestedRole: selectedRole })
      })

      const data = await response.json()
      if (data.ok) {
        // Use AuthContext login method
        login(data.user, data.token)
        
        // Redirect based on role
        switch (data.user.role) {
          case 'ADMIN':
            router.push('/admin')
            break
          case 'ORGANIZER':
            router.push('/organizer')
            break
          case 'VOLUNTEER':
            router.push('/dashboard')
            break
          default:
            router.push('/dashboard')
        }
      } else {
        alert(data.error || 'Invalid OTP or access denied')
      }
    } catch (error) {
      console.error('Error verifying OTP:', error)
      alert('Failed to verify OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-4xl w-full mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-4xl font-bold text-blue-600">
            EventHive
          </Link>
          <p className="text-gray-600 mt-2">
            {step === 'role-selection' ? 'Choose your role to continue' : 
             step === 'login' ? 'Sign in to your account' : 
             'Enter verification code'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {step === 'role-selection' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center mb-8">Select Your Role</h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                {Object.entries(roleDescriptions).map(([role, info]) => (
                  <div
                    key={role}
                    onClick={() => setSelectedRole(role as any)}
                    className={`cursor-pointer border-2 rounded-lg p-6 transition-all ${
                      selectedRole === role
                        ? `border-${info.color}-500 bg-${info.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full bg-${info.color}-100 flex items-center justify-center mb-4`}>
                      <span className="text-2xl">
                        {role === 'ATTENDEE' ? '🎫' : 
                         role === 'ORGANIZER' ? '🎪' : '🤝'}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{info.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{info.description}</p>
                    <ul className="text-xs text-gray-500 space-y-1">
                      {info.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <button
                  onClick={() => selectedRole && setStep('login')}
                  disabled={!selectedRole}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue as {selectedRole ? roleDescriptions[selectedRole].title : 'Selected Role'}
                </button>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">Administrator Access</p>
                  <Link 
                    href="/auth/admin"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    👑 Admin Login
                  </Link>
                </div>
              </div>
            </div>
          )}

          {step === 'login' && selectedRole && (
            <div className="space-y-6 max-w-md mx-auto">
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full bg-${roleDescriptions[selectedRole].color}-100 flex items-center justify-center mx-auto mb-4`}>
                  <span className="text-3xl">
                    {selectedRole === 'ATTENDEE' ? '🎫' : 
                     selectedRole === 'ORGANIZER' ? '🎪' : '🤝'}
                  </span>
                </div>
                <h2 className="text-xl font-semibold">{roleDescriptions[selectedRole].title} Login</h2>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                onClick={sendOTP}
                disabled={!email || !name || loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>

              <div className="text-center">
                <button
                  onClick={() => setStep('role-selection')}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  ← Change Role
                </button>
              </div>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-6 max-w-md mx-auto">
              <div className="text-center">
                <h2 className="text-xl font-semibold">Verify Your Email</h2>
                <p className="text-gray-600 text-sm mt-2">
                  We've sent a verification code to {email}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Verification Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full p-3 border rounded-lg text-center text-2xl"
                  maxLength={6}
                />
              </div>

              <button
                onClick={verifyOTP}
                disabled={!code || loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>

              <div className="text-center">
                <button
                  onClick={() => setStep('login')}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  ← Change Email
                </button>
                <span className="mx-3 text-gray-300">|</span>
                <button
                  onClick={sendOTP}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Resend Code
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
