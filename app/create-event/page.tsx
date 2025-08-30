'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface TicketType {
  name: string
  price: number
  maxQuantity: number
  saleStart?: string
  saleEnd?: string
  description?: string
  isEarlyBird?: boolean
}

export default function CreateEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    lat: '',
    lng: '',
    startAt: '',
    endAt: '',
    status: 'DRAFT',
    featured: false
  })
  
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    { name: 'General', price: 0, maxQuantity: 100, description: 'Standard admission' }
  ])

  const categories = [
    'Music & Concerts',
    'Sports & Fitness', 
    'Food & Drink',
    'Arts & Culture',
    'Business & Networking',
    'Technology',
    'Education',
    'Health & Wellness',
    'Travel & Adventure',
    'Community & Social'
  ]

  const predefinedTicketTypes = [
    { name: 'General', description: 'Standard admission', price: 500 },
    { name: 'VIP', description: 'Premium experience with exclusive benefits', price: 1500 },
    { name: 'Student', description: 'Discounted tickets for students (ID required)', price: 300 },
    { name: 'Early Bird', description: 'Limited time discounted tickets', price: 400, isEarlyBird: true },
    { name: 'Group', description: 'Special pricing for groups of 5 or more', price: 450 },
    { name: 'Premium', description: 'All-inclusive premium package', price: 2000 },
    { name: 'Regular', description: 'Standard pricing', price: 600 },
    { name: 'Family Pack', description: 'Special family pricing (up to 4 members)', price: 1800 }
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleTicketChange = (index: number, field: keyof TicketType, value: string | number | boolean) => {
    const newTickets = [...ticketTypes]
    newTickets[index] = { ...newTickets[index], [field]: value }
    setTicketTypes(newTickets)
  }

  const addTicketType = () => {
    setTicketTypes([...ticketTypes, { name: '', price: 0, maxQuantity: 100, description: '' }])
  }

  const addPredefinedTicket = (predefined: typeof predefinedTicketTypes[0]) => {
    setTicketTypes([...ticketTypes, {
      name: predefined.name,
      price: predefined.price,
      maxQuantity: 100,
      description: predefined.description,
      isEarlyBird: predefined.isEarlyBird || false
    }])
  }

  const removeTicketType = (index: number) => {
    if (ticketTypes.length > 1) {
      setTicketTypes(ticketTypes.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent, publish = false) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        status: publish ? 'PUBLISHED' : 'DRAFT',
        lat: formData.lat ? parseFloat(formData.lat) : null,
        lng: formData.lng ? parseFloat(formData.lng) : null,
        ticketTypes: ticketTypes.filter(ticket => ticket.name && ticket.price >= 0)
      }

      const response = await fetch('/api/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.ok) {
        router.push(`/events/${data.event.id}`)
      } else {
        alert(data.error || 'Failed to create event')
      }
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
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
            <Link href="/create-event" className="text-indigo-600 font-semibold border-b-2 border-indigo-600 pb-1">
              Create Event
            </Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent mb-6">
              Create Amazing Event
            </h1>
            <p className="text-xl text-gray-600 font-light">Bring people together with your unique event</p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center space-x-6">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 shadow-lg ${
                    currentStep >= step 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white border-2 border-gray-300 text-gray-400'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-20 h-1 mx-3 transition-all duration-300 rounded-full ${
                      currentStep > step ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center mb-8">
            <div className="text-sm text-gray-600 font-medium bg-white/60 backdrop-blur-sm px-6 py-2 rounded-full border border-gray-200">
              {currentStep === 1 && 'Step 1: Basic Information'}
              {currentStep === 2 && 'Step 2: Location & Schedule'}
              {currentStep === 3 && 'Step 3: Tickets & Pricing'}
            </div>
          </div>

          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/50 p-10">
                <h2 className="text-3xl font-bold text-slate-800 mb-8 flex items-center">
                  <span className="mr-4 text-2xl">📝</span>
                  Basic Information
                </h2>
                
                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-4">Event Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full p-5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 text-lg bg-white/50 backdrop-blur-sm placeholder-slate-400 text-slate-700"
                      placeholder="Enter an exciting event title..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-4">Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full p-5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm text-slate-700"
                    >
                      <option value="">Select a category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-4">Event Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={6}
                      className="w-full p-5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm placeholder-slate-400 text-slate-700"
                      placeholder="Describe your event in detail. What makes it special? What can attendees expect?"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={formData.featured}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-3 text-sm font-medium text-gray-700">
                      ⭐ Feature this event (increases visibility)
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location & Time */}
            {currentStep === 2 && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <span className="mr-3">📍</span>
                  Location & Schedule
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Event Location *</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                      className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter venue name, address, or city"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Latitude (optional)</label>
                      <input
                        type="number"
                        step="any"
                        name="lat"
                        value={formData.lat}
                        onChange={handleInputChange}
                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="19.0760"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Longitude (optional)</label>
                      <input
                        type="number"
                        step="any"
                        name="lng"
                        value={formData.lng}
                        onChange={handleInputChange}
                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="72.8777"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Start Date & Time *</label>
                      <input
                        type="datetime-local"
                        name="startAt"
                        value={formData.startAt}
                        onChange={handleInputChange}
                        required
                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">End Date & Time (optional)</label>
                      <input
                        type="datetime-local"
                        name="endAt"
                        value={formData.endAt}
                        onChange={handleInputChange}
                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Tickets */}
            {currentStep === 3 && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <span className="mr-3">🎫</span>
                    Tickets & Pricing
                  </h2>
                  <button
                    type="button"
                    onClick={addTicketType}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                  >
                    + Add Custom Ticket
                  </button>
                </div>

                {/* Predefined Ticket Types */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">🚀 Quick Add Ticket Types</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {predefinedTicketTypes.map((predefined, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => addPredefinedTicket(predefined)}
                        className="p-3 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-blue-600"
                      >
                        <div className="font-semibold">{predefined.name}</div>
                        <div className="text-xs text-gray-500">₹{predefined.price}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ticket Types List */}
                <div className="space-y-6">
                  {ticketTypes.map((ticket, index) => (
                    <div key={index} className="border-2 border-gray-100 rounded-xl p-6 hover:border-blue-200 transition-all duration-200">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                          🎫 Ticket Type {index + 1}
                          {ticket.isEarlyBird && (
                            <span className="ml-2 bg-orange-100 text-orange-600 text-xs font-bold px-2 py-1 rounded-full">
                              Early Bird
                            </span>
                          )}
                        </h3>
                        {ticketTypes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTicketType(index)}
                            className="text-red-500 hover:text-red-700 font-semibold transition-colors"
                          >
                            ✕ Remove
                          </button>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Ticket Name *</label>
                          <input
                            type="text"
                            value={ticket.name}
                            onChange={(e) => handleTicketChange(index, 'name', e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="e.g., General, VIP, Early Bird"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Price (₹) *</label>
                          <input
                            type="number"
                            value={ticket.price}
                            onChange={(e) => handleTicketChange(index, 'price', parseFloat(e.target.value) || 0)}
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="0"
                            min="0"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Max Quantity *</label>
                          <input
                            type="number"
                            value={ticket.maxQuantity}
                            onChange={(e) => handleTicketChange(index, 'maxQuantity', parseInt(e.target.value) || 0)}
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="100"
                            min="1"
                          />
                        </div>

                        <div>
                          <label className="flex items-center mt-8">
                            <input
                              type="checkbox"
                              checked={ticket.isEarlyBird || false}
                              onChange={(e) => handleTicketChange(index, 'isEarlyBird', e.target.checked)}
                              className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">
                              🐦 Early Bird Special
                            </span>
                          </label>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                        <input
                          type="text"
                          value={ticket.description || ''}
                          onChange={(e) => handleTicketChange(index, 'description', e.target.value)}
                          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="Brief description of what this ticket includes..."
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Sale Start (optional)</label>
                          <input
                            type="datetime-local"
                            value={ticket.saleStart || ''}
                            onChange={(e) => handleTicketChange(index, 'saleStart', e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Sale End (optional)</label>
                          <input
                            type="datetime-local"
                            value={ticket.saleEnd || ''}
                            onChange={(e) => handleTicketChange(index, 'saleEnd', e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center">
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
                  >
                    ← Previous
                  </button>
                )}
              </div>

              <div className="flex gap-4">
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                  >
                    Next Step →
                  </button>
                ) : (
                  <>
                    <Link
                      href="/dashboard"
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
                    >
                      Cancel
                    </Link>
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-all duration-200 font-semibold"
                    >
                      {loading ? 'Saving...' : '📝 Save as Draft'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={(e) => handleSubmit(e, true)}
                      disabled={loading}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                    >
                      {loading ? 'Publishing...' : '🚀 Publish Event'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
