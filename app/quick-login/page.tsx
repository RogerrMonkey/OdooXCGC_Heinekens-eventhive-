'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function QuickLoginPage() {
  const [phone, setPhone] = useState('+1234567890')
  const [otp, setOtp] = useState('123456')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const sendOTP = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-otp',
          phone
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setStep('otp')
        alert(`Test OTP sent: ${data.testCode}`)
      } else {
        alert('Failed to send OTP')
      }
    } catch (error) {
      alert('Error sending OTP')
    }
    setLoading(false)
  }

  const verifyOTP = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-otp',
          phone,
          code: otp,
          name: 'Test User'
        })
      })
      
      const data = await response.json()
      if (data.success) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
        alert('Login successful!')
      } else {
        alert('Invalid OTP')
      }
    } catch (error) {
      alert('Error verifying OTP')
    }
    setLoading(false)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setStep('phone')
  }

  const createTestUser = async () => {
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
        setUser(data.user)
        alert('Test user created and logged in!')
      }
    } catch (error) {
      alert('Error creating test user')
    }
    setLoading(false)
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center text-green-600">✅ Logged In Successfully</h1>
          
          <div className="space-y-3 mb-6">
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email || 'Not set'}</p>
            <p><strong>Phone:</strong> {user.phone || 'Not set'}</p>
            <p><strong>Role:</strong> {user.role}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/events')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
            >
              Go to Events & Test Payment
            </button>
            
            <button
              onClick={() => router.push('/debug-payment')}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700"
            >
              Open Debug Dashboard
            </button>
            
            <button
              onClick={logout}
              className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Quick Login for Testing</h1>
        
        {step === 'phone' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 border rounded-lg"
                placeholder="+1234567890"
              />
            </div>
            
            <button
              onClick={sendOTP}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Test OTP'}
            </button>
            
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-3">Or skip the OTP process:</p>
              <button
                onClick={createTestUser}
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Create Test User & Auto Login
              </button>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full p-3 border rounded-lg text-center text-2xl"
                placeholder="123456"
                maxLength={6}
              />
              <p className="text-sm text-gray-600 mt-2">Test OTP is always: 123456</p>
            </div>
            
            <button
              onClick={verifyOTP}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            
            <button
              onClick={() => setStep('phone')}
              className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700"
            >
              Back
            </button>
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-bold text-sm mb-2">🧪 Testing Instructions:</h3>
          <ol className="text-sm space-y-1">
            <li>1. Click "Create Test User & Auto Login" (easiest)</li>
            <li>2. Or use phone: +1234567890, OTP: 123456</li>
            <li>3. After login, go to Events to test payment</li>
            <li>4. Use debug dashboard to troubleshoot issues</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
