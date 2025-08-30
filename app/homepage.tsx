import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            EventHive
          </Link>
          <nav className="space-x-6">
            <Link href="/events" className="text-gray-600 hover:text-blue-600">
              Browse Events
            </Link>
            <Link href="/create-event" className="text-gray-600 hover:text-blue-600">
              Create Event
            </Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-blue-600">
              Dashboard
            </Link>
            <Link href="/auth" className="bg-blue-600 text-white px-4 py-2 rounded-lg">
              Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Discover Amazing Events
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Find workshops, concerts, sports events, hackathons and more. Book tickets seamlessly and manage your events effortlessly.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/events" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100">
              Browse Events
            </Link>
            <Link href="/create-event" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600">
              Create Event
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Events</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Event cards will be loaded dynamically */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Sample Event</h3>
                <p className="text-gray-600 mb-4">Event description goes here...</p>
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 font-semibold">₹500</span>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded">
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Event Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['Workshop', 'Concert', 'Sports', 'Hackathon', 'Conference', 'Festival', 'Comedy', 'Theater'].map((category) => (
              <Link key={category} href={`/events?category=${category.toLowerCase()}`} className="bg-white p-6 rounded-lg text-center hover:shadow-lg transition-shadow">
                <div className="text-3xl mb-3">🎯</div>
                <h3 className="font-semibold">{category}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">EventHive</h3>
              <p className="text-gray-400">Your one-stop platform for discovering and managing events.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/events">Browse Events</Link></li>
                <li><Link href="/create-event">Create Event</Link></li>
                <li><Link href="/help">Help Center</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Categories</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/events?category=workshop">Workshops</Link></li>
                <li><Link href="/events?category=concert">Concerts</Link></li>
                <li><Link href="/events?category=sports">Sports</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <p className="text-gray-400">support@eventhive.com</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
