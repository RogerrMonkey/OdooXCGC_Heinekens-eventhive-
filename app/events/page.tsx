'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Event {
  id: string
  title: string
  description?: string
  category: string
  location: string
  startAt: string
  endAt?: string
  status: string
  featured: boolean
  ticketTypes: {
    id: string
    name: string
    price: number
    maxQuantity: number
    totalSold: number
  }[]
  organizer: {
    id: string
    name: string
  }
}

interface Filters {
  search: string
  category: string
  location: string
  priceRange: string
  dateRange: string
  ticketType: string
  sortBy: string
  featured: boolean
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  
  const [filters, setFilters] = useState<Filters>({
    search: '',
    category: '',
    location: '',
    priceRange: '',
    dateRange: '',
    ticketType: '',
    sortBy: 'relevance',
    featured: false
  })

  const eventsPerPage = 12

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

  const ticketTypes = ['General', 'VIP', 'Student', 'Early Bird', 'Group']
  const priceRanges = ['Free', '₹1 - ₹500', '₹501 - ₹1000', '₹1001 - ₹2500', '₹2501 - ₹5000', '₹5000+']
  const dateRanges = ['Today', 'Tomorrow', 'This Week', 'This Month', 'Next Month']
  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'date-asc', label: 'Date: Earliest First' },
    { value: 'date-desc', label: 'Date: Latest First' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'popularity', label: 'Most Popular' },
    { value: 'newest', label: 'Newly Added' }
  ]

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [events, filters, currentPage])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events/list')
      const data = await response.json()
      
      if (data.ok) {
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...events]

    // Search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm) ||
        event.description?.toLowerCase().includes(searchTerm) ||
        event.location.toLowerCase().includes(searchTerm) ||
        event.organizer.name.toLowerCase().includes(searchTerm)
      )
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(event => event.category === filters.category)
    }

    // Location filter
    if (filters.location.trim()) {
      filtered = filtered.filter(event =>
        event.location.toLowerCase().includes(filters.location.toLowerCase())
      )
    }

    // Featured filter
    if (filters.featured) {
      filtered = filtered.filter(event => event.featured)
    }

    // Ticket type filter
    if (filters.ticketType) {
      filtered = filtered.filter(event =>
        event.ticketTypes.some(ticket =>
          ticket.name.toLowerCase().includes(filters.ticketType.toLowerCase())
        )
      )
    }

    // Price range filter
    if (filters.priceRange) {
      filtered = filtered.filter(event => {
        const minPrice = Math.min(...event.ticketTypes.map(t => t.price))
        switch (filters.priceRange) {
          case 'Free': return minPrice === 0
          case '₹1 - ₹500': return minPrice > 0 && minPrice <= 500
          case '₹501 - ₹1000': return minPrice > 500 && minPrice <= 1000
          case '₹1001 - ₹2500': return minPrice > 1000 && minPrice <= 2500
          case '₹2501 - ₹5000': return minPrice > 2500 && minPrice <= 5000
          case '₹5000+': return minPrice > 5000
          default: return true
        }
      })
    }

    // Date range filter
    if (filters.dateRange) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.startAt)
        switch (filters.dateRange) {
          case 'Today':
            return eventDate.toDateString() === today.toDateString()
          case 'Tomorrow':
            const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
            return eventDate.toDateString() === tomorrow.toDateString()
          case 'This Week':
            const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
            return eventDate >= today && eventDate <= weekFromNow
          case 'This Month':
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            return eventDate >= today && eventDate <= endOfMonth
          case 'Next Month':
            const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
            const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0)
            return eventDate >= startOfNextMonth && eventDate <= endOfNextMonth
          default: return true
        }
      })
    }

    // Sort events
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'date-asc':
          return new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
        case 'date-desc':
          return new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
        case 'price-asc':
          const minPriceA = Math.min(...a.ticketTypes.map(t => t.price))
          const minPriceB = Math.min(...b.ticketTypes.map(t => t.price))
          return minPriceA - minPriceB
        case 'price-desc':
          const maxPriceA = Math.max(...a.ticketTypes.map(t => t.price))
          const maxPriceB = Math.max(...b.ticketTypes.map(t => t.price))
          return maxPriceB - maxPriceA
        case 'popularity':
          const popularityA = a.ticketTypes.reduce((sum, t) => sum + t.totalSold, 0)
          const popularityB = b.ticketTypes.reduce((sum, t) => sum + t.totalSold, 0)
          return popularityB - popularityA
        case 'newest':
          return b.id.localeCompare(a.id)
        default: // relevance
          return a.featured === b.featured ? 0 : a.featured ? -1 : 1
      }
    })

    // Calculate pagination
    const totalPages = Math.ceil(filtered.length / eventsPerPage)
    setTotalPages(totalPages)
    
    // Get current page events
    const startIndex = (currentPage - 1) * eventsPerPage
    const endIndex = startIndex + eventsPerPage
    setFilteredEvents(filtered.slice(startIndex, endIndex))
  }

  const handleFilterChange = (key: keyof Filters, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      location: '',
      priceRange: '',
      dateRange: '',
      ticketType: '',
      sortBy: 'relevance',
      featured: false
    })
    setCurrentPage(1)
  }

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `₹${price.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600 font-medium">Loading events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 fade-in">
          <h1 className="text-display-lg font-bold text-primary-600 mb-6">
            Discover Amazing Events
          </h1>
          <p className="text-xl text-neutral-600 mb-8 font-light leading-relaxed">Find and book tickets for the best events happening around you</p>
        </div>

        {/* Search and Filters */}
        <div className="card card-elevated p-8 mb-12 slide-in">
          {/* Main Search */}
          <div className="flex flex-col lg:flex-row gap-6 mb-6">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search events, organizers, or locations..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="input focus-ring w-full pl-12"
                />
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-neutral-400 text-xl">🔍</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="input focus-ring"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-secondary flex items-center gap-3"
              >
                <span>🎛️</span>
                Filters
                <span className={`transform transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-neutral-200">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-3">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="input focus-ring w-full"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-3">Ticket Type</label>
                <select
                  value={filters.ticketType}
                  onChange={(e) => handleFilterChange('ticketType', e.target.value)}
                  className="input focus-ring w-full"
                >
                  <option value="">All Types</option>
                  {ticketTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-3">Price Range</label>
                <select
                  value={filters.priceRange}
                  onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                  className="input focus-ring w-full"
                >
                  <option value="">All Prices</option>
                  {priceRanges.map(range => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-white/50 backdrop-blur-sm text-slate-700"
                >
                  <option value="">All Dates</option>
                  {dateRanges.map(range => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-3">Location</label>
                <input
                  type="text"
                  placeholder="Enter city or venue..."
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-white/50 backdrop-blur-sm text-slate-700 placeholder-slate-400"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.featured}
                    onChange={(e) => handleFilterChange('featured', e.target.checked)}
                    className="mr-3 text-slate-600 focus:ring-slate-500 w-4 h-4"
                  />
                  <span className="text-sm font-semibold text-slate-700">Featured Events Only</span>
                </label>
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full bg-rose-50 text-rose-600 px-4 py-3 rounded-xl hover:bg-rose-100 transition-colors duration-200 font-medium"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-8">
          <p className="text-slate-600 font-medium">
            Showing {filteredEvents.length} of {events.length} events
            {filters.search && (
              <span className="ml-2 text-slate-700 font-semibold">
                for "{filters.search}"
              </span>
            )}
          </p>
          <div className="text-sm text-slate-500 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200">
            Page {currentPage} of {totalPages}
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto mb-8 flex items-center justify-center">
              <span className="text-4xl">🎭</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">No events found</h3>
            <p className="text-slate-600 mb-8 font-light">Try adjusting your filters or search terms</p>
            <button
              onClick={clearFilters}
              className="bg-slate-700 text-white px-8 py-3 rounded-xl hover:bg-slate-800 transition-colors font-medium shadow-lg"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
            {filteredEvents.map((event) => {
              const minPrice = Math.min(...event.ticketTypes.map(t => t.price))
              const maxPrice = Math.max(...event.ticketTypes.map(t => t.price))
              const totalSold = event.ticketTypes.reduce((sum, t) => sum + t.totalSold, 0)
              const isPopular = totalSold > 50
              const isNewEvent = new Date(event.startAt) > new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

              return (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border border-slate-200/50 overflow-hidden group">
                    {/* Event Image Placeholder */}
                    <div className="h-56 bg-gradient-to-br from-slate-400 via-blue-500 to-cyan-500 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/30"></div>
                      <div className="absolute top-5 left-5 flex flex-wrap gap-2">
                        {event.featured && (
                          <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg">
                            ⭐ Featured
                          </span>
                        )}
                        {isPopular && (
                          <span className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg">
                            🔥 Popular
                          </span>
                        )}
                        {isNewEvent && (
                          <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg">
                            ✨ New
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-5 left-5 text-white">
                        <p className="text-lg font-bold">{formatDate(event.startAt)}</p>
                        <p className="text-sm opacity-90 bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm">{formatTime(event.startAt)}</p>
                      </div>
                    </div>

                    <div className="p-8">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-xl font-bold text-slate-800 group-hover:text-slate-600 transition-colors line-clamp-2">
                          {event.title}
                        </h3>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-sm text-slate-600">
                          <span className="mr-3 text-slate-400">📍</span>
                          <span className="truncate">{event.location}</span>
                        </div>
                        <div className="flex items-center text-sm text-slate-600">
                          <span className="mr-3 text-slate-400">👤</span>
                          <span className="truncate">by {event.organizer.name}</span>
                        </div>
                        <div className="flex items-center text-sm text-slate-600">
                          <span className="mr-3 text-slate-400">🏷️</span>
                          <span className="truncate">{event.category}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Starting from</p>
                          <p className="text-lg font-bold text-slate-700">
                            {minPrice === maxPrice 
                              ? formatPrice(minPrice)
                              : `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`
                            }
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500 mb-1">
                            {totalSold} sold
                          </p>
                          <div className="flex items-center text-sm text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                            <span className="mr-1">⚡</span>
                            <span>Quick Book</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-3">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-6 py-3 bg-white/70 backdrop-blur-sm border border-slate-200 rounded-xl hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 font-medium"
            >
              ← Previous
            </button>
            
            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1
              const isCurrentPage = page === currentPage
              const isNearCurrentPage = Math.abs(page - currentPage) <= 2
              const isFirstOrLast = page === 1 || page === totalPages
              
              if (!isNearCurrentPage && !isFirstOrLast) {
                if (page === currentPage - 3 || page === currentPage + 3) {
                  return <span key={page} className="px-3 text-slate-500">...</span>
                }
                return null
              }
              
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-3 rounded-xl transition-colors font-medium ${
                    isCurrentPage
                      ? 'bg-slate-700 text-white shadow-lg'
                      : 'bg-white/70 backdrop-blur-sm border border-slate-200 hover:bg-white text-slate-700'
                  }`}
                >
                  {page}
                </button>
              )
            })}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-6 py-3 bg-white/70 backdrop-blur-sm border border-slate-200 rounded-xl hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 font-medium"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
