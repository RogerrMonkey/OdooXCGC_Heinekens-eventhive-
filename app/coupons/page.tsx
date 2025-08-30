'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Coupon {
  id: string
  code: string
  percentOff?: number
  amountOff?: number
  maxUsage?: number
  usedCount: number
  validFrom?: string
  validUntil?: string
  eventId?: string
  event?: {
    title: string
  }
}

interface Event {
  id: string
  title: string
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    type: 'percent', // 'percent' or 'amount'
    percentOff: '',
    amountOff: '',
    maxUsage: '',
    validFrom: '',
    validUntil: '',
    eventId: ''
  })

  useEffect(() => {
    fetchCoupons()
    fetchEvents()
  }, [])

  const fetchCoupons = async () => {
    try {
      const response = await fetch('/api/coupons/list')
      const data = await response.json()
      if (data.ok) {
        setCoupons(data.coupons)
      }
    } catch (error) {
      console.error('Error fetching coupons:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events/list')
      const data = await response.json()
      if (data.ok) {
        setEvents(data.events)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData(prev => ({ ...prev, code: result }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        code: formData.code.toUpperCase(),
        percentOff: formData.type === 'percent' ? parseInt(formData.percentOff) || null : null,
        amountOff: formData.type === 'amount' ? parseFloat(formData.amountOff) || null : null,
        maxUsage: formData.maxUsage ? parseInt(formData.maxUsage) : null,
        validFrom: formData.validFrom || null,
        validUntil: formData.validUntil || null,
        eventId: formData.eventId || null
      }

      const response = await fetch('/api/coupons/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.ok) {
        setShowCreateForm(false)
        setFormData({
          code: '',
          type: 'percent',
          percentOff: '',
          amountOff: '',
          maxUsage: '',
          validFrom: '',
          validUntil: '',
          eventId: ''
        })
        fetchCoupons()
        alert('Coupon created successfully!')
      } else {
        alert(data.error || 'Failed to create coupon')
      }
    } catch (error) {
      console.error('Error creating coupon:', error)
      alert('Failed to create coupon')
    } finally {
      setLoading(false)
    }
  }

  const deleteCoupon = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return

    try {
      const response = await fetch(`/api/coupons/delete/${couponId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.ok) {
        fetchCoupons()
        alert('Coupon deleted successfully!')
      } else {
        alert(data.error || 'Failed to delete coupon')
      }
    } catch (error) {
      console.error('Error deleting coupon:', error)
      alert('Failed to delete coupon')
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No limit'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getDiscountText = (coupon: Coupon) => {
    if (coupon.percentOff) {
      return `${coupon.percentOff}% OFF`
    } else if (coupon.amountOff) {
      return `₹${coupon.amountOff} OFF`
    }
    return 'No discount'
  }

  const getCouponStatus = (coupon: Coupon) => {
    const now = new Date()
    const validFrom = coupon.validFrom ? new Date(coupon.validFrom) : null
    const validUntil = coupon.validUntil ? new Date(coupon.validUntil) : null

    if (validFrom && now < validFrom) {
      return { status: 'upcoming', color: 'bg-yellow-100 text-yellow-800' }
    } else if (validUntil && now > validUntil) {
      return { status: 'expired', color: 'bg-red-100 text-red-800' }
    } else if (coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) {
      return { status: 'exhausted', color: 'bg-gray-100 text-gray-800' }
    } else {
      return { status: 'active', color: 'bg-green-100 text-green-800' }
    }
  }

  if (loading && coupons.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading coupons...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
            EventHive
          </Link>
          <nav className="hidden md:flex space-x-8">
            <Link href="/events" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">
              Browse Events
            </Link>
            <Link href="/create-event" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">
              Create Event
            </Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">
              Dashboard
            </Link>
            <Link href="/coupons" className="text-indigo-600 font-semibold border-b-2 border-indigo-600 pb-1">
              Coupons
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent mb-4">
                🎟️ Promotional Codes & Coupons
              </h1>
              <p className="text-xl text-gray-600 font-light">Create and manage discount codes for your events</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-8 py-4 rounded-2xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 font-semibold shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              ✨ Create New Coupon
            </button>
          </div>

          {/* Create Coupon Form */}
          {showCreateForm && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 p-10 mb-12">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800">Create New Coupon</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Coupon Code *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        required
                        className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-mono uppercase"
                        placeholder="SUMMER2024"
                      />
                      <button
                        type="button"
                        onClick={generateCouponCode}
                        className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        🎲 Generate
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Discount Type *</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="percent">Percentage Off</option>
                      <option value="amount">Fixed Amount Off</option>
                    </select>
                  </div>

                  {formData.type === 'percent' ? (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Percentage Off *</label>
                      <div className="relative">
                        <input
                          type="number"
                          name="percentOff"
                          value={formData.percentOff}
                          onChange={handleInputChange}
                          required
                          min="1"
                          max="100"
                          className="w-full p-3 pr-8 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="20"
                        />
                        <span className="absolute right-3 top-3 text-gray-500">%</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Amount Off (₹) *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500">₹</span>
                        <input
                          type="number"
                          name="amountOff"
                          value={formData.amountOff}
                          onChange={handleInputChange}
                          required
                          min="1"
                          className="w-full p-3 pl-8 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="100"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Max Usage (optional)</label>
                    <input
                      type="number"
                      name="maxUsage"
                      value={formData.maxUsage}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Leave empty for unlimited"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Valid From (optional)</label>
                    <input
                      type="datetime-local"
                      name="validFrom"
                      value={formData.validFrom}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Valid Until (optional)</label>
                    <input
                      type="datetime-local"
                      name="validUntil"
                      value={formData.validUntil}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Apply to Event (optional)</label>
                    <select
                      name="eventId"
                      value={formData.eventId}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">All Events</option>
                      {events.map(event => (
                        <option key={event.id} value={event.id}>{event.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                  >
                    {loading ? 'Creating...' : '🎟️ Create Coupon'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Coupons List */}
          <div className="space-y-6">
            {coupons.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <span className="text-4xl">🎟️</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No coupons created yet</h3>
                <p className="text-gray-600 mb-6">Create your first promotional code to boost ticket sales</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create First Coupon
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.map((coupon) => {
                  const status = getCouponStatus(coupon)
                  
                  return (
                    <div key={coupon.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                      {/* Coupon Header */}
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-2xl font-bold font-mono">{coupon.code}</h3>
                            <p className="text-blue-100 text-sm">{getDiscountText(coupon)}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.color}`}>
                            {status.status.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="border-t border-blue-300 pt-4">
                          <div className="text-sm text-blue-100">
                            {coupon.event ? (
                              <span>🎯 {coupon.event.title}</span>
                            ) : (
                              <span>🌟 All Events</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Coupon Body */}
                      <div className="p-6">
                        <div className="space-y-3 mb-6">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Usage:</span>
                            <span className="font-semibold">
                              {coupon.usedCount}
                              {coupon.maxUsage ? ` / ${coupon.maxUsage}` : ' (unlimited)'}
                            </span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Valid From:</span>
                            <span className="font-semibold">{formatDate(coupon.validFrom)}</span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Valid Until:</span>
                            <span className="font-semibold">{formatDate(coupon.validUntil)}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => navigator.clipboard.writeText(coupon.code)}
                            className="flex-1 bg-blue-50 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-100 transition-colors text-sm font-semibold"
                          >
                            📋 Copy Code
                          </button>
                          <button
                            onClick={() => deleteCoupon(coupon.id)}
                            className="bg-red-50 text-red-600 py-2 px-4 rounded-lg hover:bg-red-100 transition-colors text-sm font-semibold"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
