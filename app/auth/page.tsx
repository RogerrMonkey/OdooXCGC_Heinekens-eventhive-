'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const router = useRouter()
  const [step, setStep] = useState<'input' | 'verify'>('input')
  const [method, setMethod] = useState<'sms' | 'whatsapp' | 'email'>('sms')
  const [target, setTarget] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [isTestMode, setIsTestMode] = useState(false)

  const quickTestLogin = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-test-user'
        })
      })
      
      const data = await response.json()
      if (data.success) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        router.push('/events')
      } else {
        alert('Test login failed')
      }
    } catch (error) {
      alert('Error during test login')
    }
    setLoading(false)
  }

  const sendOTP = async () => {
    if (!target) return

    setLoading(true)
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, via: method })
      })

      // Check if response is ok and has content
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', errorText)
        alert('Server error. Please try again.')
        return
      }

      // Check if response has content
      const responseText = await response.text()
      if (!responseText) {
        console.error('Empty response from server')
        alert('Server error. Please try again.')
        return
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError, 'Response:', responseText)
        alert('Server error. Please try again.')
        return
      }

      if (data.ok) {
        setStep('verify')
      } else {
        alert(data.error || 'Failed to send OTP')
      }
    } catch (error) {
      console.error('Error sending OTP:', error)
      alert('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const verifyOTP = async () => {
    if (!code) return

    setLoading(true)
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, code, name })
      })

      const data = await response.json()
      if (data.ok) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('token', data.token)
        
        // Redirect to dashboard
        router.push('/dashboard')
      } else {
        alert(data.error || 'Invalid OTP')
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
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-blue-600">
            EventHive
          </Link>
          <p className="text-gray-600 mt-2">
            {step === 'input' ? 'Sign in to your account' : 'Enter verification code'}
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-lg">
          {/* Test Mode Toggle */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-yellow-800">🧪 Test Mode</span>
              <button
                onClick={() => setIsTestMode(!isTestMode)}
                className="text-sm text-yellow-700 hover:text-yellow-900 underline"
              >
                {isTestMode ? 'Hide' : 'Show'} Quick Login
              </button>
            </div>
            {isTestMode && (
              <div className="mt-3">
                <button
                  onClick={quickTestLogin}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : '⚡ Quick Login (Test User)'}
                </button>
                <p className="text-xs text-yellow-700 mt-2">
                  Creates a test user and logs you in instantly for payment testing
                </p>
              </div>
            )}
          </div>

          {step === 'input' ? (
            <div className="space-y-6">
              {/* Method Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">Choose verification method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod('sms')}
                    className={`p-3 text-sm rounded-lg border-2 transition-colors ${
                      method === 'sms' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    📱 SMS
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('whatsapp')}
                    className={`p-3 text-sm rounded-lg border-2 transition-colors ${
                      method === 'whatsapp' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    💬 WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('email')}
                    className={`p-3 text-sm rounded-lg border-2 transition-colors ${
                      method === 'email' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    📧 Email
                  </button>
                </div>
              </div>

              {/* Input Field */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {method === 'email' ? 'Email Address' : 'Phone Number'}
                </label>
                <input
                  type={method === 'email' ? 'email' : 'tel'}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder={
                    method === 'email' 
                      ? 'Enter your email' 
                      : '+91 98765 43210'
                  }
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Your Name (optional)
                </label>
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
                disabled={!target || loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : `Send OTP via ${method.toUpperCase()}`}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600">
                  We've sent a verification code to
                </p>
                <p className="font-medium">{target}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="w-full p-3 border rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  onClick={() => setStep('input')}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  ← Change phone/email
                </button>
                <span className="mx-3 text-gray-300">|</span>
                <button
                  onClick={sendOTP}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Resend OTP
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 text-center text-sm text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
