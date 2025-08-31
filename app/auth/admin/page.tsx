'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminLoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [step, setStep] = useState<'login' | 'verify'>('login')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const sendOTP = async () => {
    if (!email) return

    setLoading(true)
    try {
      const response = await fetch('/api/auth/admin-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
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
    if (!code) return

    setLoading(true)
    try {
      const response = await fetch('/api/auth/admin-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      })

      const data = await response.json()
      if (data.ok) {
        // Use AuthContext login method
        login(data.user, data.token)
        
        // Redirect to admin dashboard
        router.push('/admin')
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
      <div className="max-w-md w-full mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-4xl font-bold text-red-600">
            EventHive
          </Link>
          <p className="text-gray-600 mt-2">Admin Portal</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {step === 'login' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">👑</span>
                </div>
                <h2 className="text-xl font-semibold">Admin Login</h2>
                <p className="text-gray-600 text-sm mt-2">
                  Secure access for administrators only
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Admin Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your admin email"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <button
                onClick={sendOTP}
                disabled={!email || loading}
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>

              <div className="text-center">
                <Link 
                  href="/auth/role-based"
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  ← Back to User Login
                </Link>
              </div>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔐</span>
                </div>
                <h2 className="text-xl font-semibold">Verify Admin Access</h2>
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
                  className="w-full p-3 border rounded-lg text-center text-2xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  maxLength={6}
                />
              </div>

              <button
                onClick={verifyOTP}
                disabled={!code || loading}
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify & Access Admin Panel'}
              </button>

              <div className="text-center">
                <button
                  onClick={() => setStep('login')}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  ← Change Email
                </button>
                <span className="mx-3 text-gray-300">|</span>
                <button
                  onClick={sendOTP}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700 text-sm"
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
