'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

interface Event {
  id: string
  title: string
  description?: string
  category: string
  location: string
  startAt: string
  featured: boolean
  ticketTypes: {
    id: string
    name: string
    price: number
    totalSold: number
  }[]
  organizer: {
    name: string
  }
}

export default function HomePage() {
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([])
  const [trendingEvents, setTrendingEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events/list')
      const data = await response.json()
      
      if (data.ok && data.events) {
        const events = data.events
        // Get featured events
        const featured = events.filter((event: Event) => event.featured).slice(0, 6)
        setFeaturedEvents(featured)
        
        // Get trending events (most sold tickets)
        const trending = events
          .filter((event: Event) => !event.featured)
          .sort((a: Event, b: Event) => {
            const aSold = a.ticketTypes.reduce((sum, t) => sum + t.totalSold, 0)
            const bSold = b.ticketTypes.reduce((sum, t) => sum + t.totalSold, 0)
            return bSold - aSold
          })
          .slice(0, 3)
        setTrendingEvents(trending)
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `₹${price.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric'
    })
  }

  const categories = [
    { name: 'Music & Concerts', icon: '🎵', color: 'from-blue-500 to-blue-600' },
    { name: 'Sports & Fitness', icon: '⚽', color: 'from-green-500 to-blue-500' },
    { name: 'Food & Drink', icon: '🍕', color: 'from-orange-500 to-yellow-500' },
    { name: 'Arts & Culture', icon: '🎨', color: 'from-purple-500 to-blue-500' },
    { name: 'Business', icon: '💼', color: 'from-blue-600 to-blue-700' },
    { name: 'Technology', icon: '💻', color: 'from-gray-500 to-blue-500' },
    { name: 'Education', icon: '📚', color: 'from-blue-500 to-purple-500' },
    { name: 'Health', icon: '🏥', color: 'from-green-500 to-teal-500' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.05),transparent_70%)]"></div>
        <div className="relative container mx-auto px-6 py-32 text-center">
          <div className="max-w-5xl mx-auto fade-in">
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 leading-tight">
              Discover
              <span className="text-blue-100 block mt-2">
                Amazing Events
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
              Connect with like-minded people through workshops, concerts, sports events, and more. 
              Create unforgettable experiences or join the ones that inspire you.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/events" className="bg-white text-blue-800 px-10 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                🔍 Explore Events
              </Link>
              <Link href="/create-event" className="border-2 border-white/30 text-white px-10 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 backdrop-blur-sm">
                ✨ Create Event
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </section>

      {/* Quick Search */}
      <section className="py-16 -mt-8 relative z-10">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg border border-gray-200 p-10 slide-in">
            <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center">Find Your Perfect Event</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <input 
                type="text" 
                placeholder="Search events..." 
                className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-700 placeholder-gray-400"
              />
              <select className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-700">
                <option>All Categories</option>
                {categories.map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              <input 
                type="text" 
                placeholder="Location" 
                className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-700 placeholder-gray-400"
              />
              <Link 
                href="/events"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 text-center font-semibold shadow-md hover:shadow-lg"
              >
                Search
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      {!loading && featuredEvents.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold text-blue-600 mb-6">
                ✨ Featured Events
              </h2>
              <p className="text-xl text-gray-600 font-light">Handpicked amazing events just for you</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredEvents.map((event) => {
                const minPrice = Math.min(...event.ticketTypes.map(t => t.price))
                const totalSold = event.ticketTypes.reduce((sum, t) => sum + t.totalSold, 0)
                
                return (
                  <Link key={event.id} href={`/events/${event.id}`}>
                    <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-3 border border-gray-100 overflow-hidden group">
                      <div className="h-56 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-gray-900/20"></div>
                        <div className="absolute top-5 left-5">
                          <span className="bg-white text-blue-600 text-xs font-bold px-3 py-2 rounded-full shadow-lg">
                            ⭐ Featured
                          </span>
                        </div>
                        <div className="absolute bottom-5 left-5 text-white">
                          <p className="text-lg font-bold">{formatDate(event.startAt)}</p>
                          <p className="text-sm opacity-90 bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm">{event.category}</p>
                        </div>
                      </div>
                      <div className="p-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {event.title}
                        </h3>
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="mr-3 text-gray-400">📍</span>
                            <span className="truncate">{event.location}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="mr-3 text-gray-400">👤</span>
                            <span className="truncate">by {event.organizer.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Starting from</p>
                            <p className="text-lg font-bold text-blue-600">{formatPrice(minPrice)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500 mb-1">{totalSold} sold</p>
                            <div className="flex items-center text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
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
            <div className="text-center mt-12">
              <Link href="/events" className="bg-gray-800 text-white px-10 py-4 rounded-lg hover:bg-gray-900 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl">
                View All Events →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Trending Events */}
      {!loading && trendingEvents.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold text-orange-600 mb-6">
                🔥 Trending Events
              </h2>
              <p className="text-xl text-gray-600 font-light">Most popular events this week</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {trendingEvents.map((event, index) => {
                const minPrice = Math.min(...event.ticketTypes.map(t => t.price))
                const totalSold = event.ticketTypes.reduce((sum, t) => sum + t.totalSold, 0)
                
                return (
                  <Link key={event.id} href={`/events/${event.id}`}>
                    <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-3 border border-gray-100 overflow-hidden group relative">
                      <div className="h-56 bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/30"></div>
                        <div className="absolute top-5 left-5">
                          <span className="bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                            🔥 #{index + 1} Trending
                          </span>
                        </div>
                        <div className="absolute bottom-5 left-5 text-white">
                          <p className="text-lg font-bold">{formatDate(event.startAt)}</p>
                          <p className="text-sm opacity-90 bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm">{event.category}</p>
                        </div>
                      </div>
                      <div className="p-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 group-hover:text-orange-600 transition-colors line-clamp-2">
                          {event.title}
                        </h3>
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="mr-3 text-gray-400">📍</span>
                            <span className="truncate">{event.location}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="mr-3 text-gray-400">👤</span>
                            <span className="truncate">by {event.organizer.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Starting from</p>
                            <p className="text-lg font-bold text-orange-600">{formatPrice(minPrice)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-orange-500 font-semibold mb-1">{totalSold} sold</p>
                            <div className="flex items-center text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                              <span className="mr-1">🔥</span>
                              <span>Hot!</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-green-600 mb-4">
              🎯 Browse by Category
            </h2>
            <p className="text-xl text-gray-600">Find events that match your interests</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link key={category.name} href={`/events?category=${encodeURIComponent(category.name)}`}>
                <div className="group cursor-pointer">
                  <div className={`bg-gradient-to-br ${category.color} p-8 rounded-lg text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2 text-white`}>
                    <div className="text-4xl mb-4">{category.icon}</div>
                    <h3 className="font-bold text-lg">{category.name}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-800 via-blue-700 to-blue-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        </div>
        <div className="container mx-auto px-6 text-center relative">
          <h2 className="text-5xl font-bold mb-16">EventHive by the Numbers</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="group">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 transition-all duration-500 hover:bg-white/20 hover:scale-105 border border-white/20">
                <div className="text-6xl mb-4">🎉</div>
                <div className="text-4xl font-bold mb-3">10,000+</div>
                <div className="text-xl text-gray-200 font-medium">Events Created</div>
              </div>
            </div>
            <div className="group">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 transition-all duration-500 hover:bg-white/20 hover:scale-105 border border-white/20">
                <div className="text-6xl mb-4">🎫</div>
                <div className="text-4xl font-bold mb-3">50,000+</div>
                <div className="text-xl text-gray-200 font-medium">Tickets Sold</div>
              </div>
            </div>
            <div className="group">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 transition-all duration-500 hover:bg-white/20 hover:scale-105 border border-white/20">
                <div className="text-6xl mb-4">👥</div>
                <div className="text-4xl font-bold mb-3">5,000+</div>
                <div className="text-xl text-gray-200 font-medium">Happy Organizers</div>
              </div>
            </div>
            <div className="group">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 transition-all duration-500 hover:bg-white/20 hover:scale-105 border border-white/20">
                <div className="text-6xl mb-4">🌍</div>
                <div className="text-4xl font-bold mb-3">100+</div>
                <div className="text-xl text-gray-200 font-medium">Cities Covered</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold text-gray-800 mb-8">Ready to Start Your Event Journey?</h2>
            <p className="text-xl text-gray-600 mb-12 font-light leading-relaxed">
              Whether you're looking to attend amazing events or create your own, EventHive has got you covered.
              Join thousands of event organizers and attendees who trust our platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/auth" className="bg-blue-600 text-white px-10 py-5 rounded-lg font-bold text-lg hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                Get Started Free
              </Link>
              <Link href="/events" className="border-2 border-blue-600 text-blue-600 px-10 py-5 rounded-lg font-bold text-lg hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl">
                Explore Events
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10">
            <div>
              <h3 className="text-2xl font-bold text-blue-400 mb-6">
                EventHive
              </h3>
              <p className="text-gray-300 mb-6 leading-relaxed">Your one-stop platform for discovering and managing events.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors text-xl">📘</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors text-xl">🐦</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors text-xl">📷</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors text-xl">💼</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-6 text-lg text-gray-200">Quick Links</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/events" className="hover:text-white transition-colors">Browse Events</Link></li>
                <li><Link href="/create-event" className="hover:text-white transition-colors">Create Event</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-6 text-lg text-gray-200">Categories</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/events?category=Music%20%26%20Concerts" className="hover:text-white transition-colors">Music & Concerts</Link></li>
                <li><Link href="/events?category=Sports%20%26%20Fitness" className="hover:text-white transition-colors">Sports & Fitness</Link></li>
                <li><Link href="/events?category=Technology" className="hover:text-white transition-colors">Technology</Link></li>
                <li><Link href="/events?category=Business" className="hover:text-white transition-colors">Business</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-6 text-lg text-gray-200">Contact</h4>
              <ul className="space-y-3 text-gray-400">
                <li>📧 support@eventhive.com</li>
                <li>📞 +91 98765 43210</li>
                <li>📍 Bangalore, India</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 EventHive. All rights reserved. Made with ❤️ in India</p>
            <div className="mt-4">
              <Link 
                href="/auth/admin" 
                className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
              >
                Admin Access
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
