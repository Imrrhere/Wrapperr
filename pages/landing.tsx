import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

export default function Landing() {
  const [email, setEmail] = useState('');

  const handleGetStarted = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to signup with email pre-filled
    const signupUrl = `/signup${email ? `?email=${encodeURIComponent(email)}` : ''}`;
    window.location.href = signupUrl;
  };

  return (
    <>
      <Head>
        <title>WrapeR2 | AI Search Assistant with Multiple Sources</title>
        <meta name="description" content="Get AI-powered answers backed by multiple verified sources. WrapeR2 combines Claude AI with real-time web data for comprehensive, reliable responses." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="AI search, Claude AI, DuckDuckGo, search assistant, multiple sources, verified information" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    WrapeR2
                  </span>
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/pricing" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Pricing
                </Link>
                <Link href="/login" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Sign In
                </Link>
                <Link href="/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              AI Search with
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {' '}Multiple Sources
              </span>
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Get comprehensive answers backed by verified sources from across the web. 
              WrapeR2 combines Claude AI with real-time data for reliable, contextual responses.
            </p>

            {/* Email Signup */}
            <form onSubmit={handleGetStarted} className="max-w-md mx-auto mb-8">
              <div className="flex gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Get Started
                </button>
              </div>
            </form>

            <p className="text-sm text-gray-500 mb-12">
              Start with 10 free queries per month. No credit card required.
            </p>

            {/* Demo Preview */}
            <div className="bg-gray-50 rounded-2xl p-8 max-w-3xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-500 ml-4">WrapeR2 Search</span>
                </div>
                <div className="text-left">
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <p className="text-gray-800">What are the latest developments in renewable energy?</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-600 text-sm mb-2">✅ Found 8 verified sources</p>
                    <p className="text-gray-800">Based on recent reports from multiple sources, renewable energy continues to see significant growth...</p>
                    <div className="flex gap-2 mt-3">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">IEA Report</span>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Nature Energy</span>
                      <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">+6 more</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Why Choose WrapeR2?</h3>
              <p className="text-lg text-gray-600">Reliable AI search with verified sources and contextual understanding</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Multiple Sources</h4>
                <p className="text-gray-600">Every answer is backed by multiple verified sources from across the web for maximum reliability.</p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Claude AI Powered</h4>
                <p className="text-gray-600">Advanced Claude 3.5 Sonnet AI for intelligent, nuanced responses that understand context.</p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Conversational</h4>
                <p className="text-gray-600">Follow-up questions that build on previous context for natural, flowing conversations.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h3>
            <p className="text-lg text-gray-600 mb-12">Start free, upgrade when you need more</p>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Free Plan */}
              <div className="bg-white border border-gray-200 rounded-2xl p-8">
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Free</h4>
                <div className="text-3xl font-bold text-gray-900 mb-4">$0<span className="text-lg text-gray-500">/month</span></div>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    10 queries per month
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Multiple source verification
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Conversation history
                  </li>
                </ul>
                <Link href="/signup" className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 px-4 rounded-lg font-medium transition-colors">
                  Get Started
                </Link>
              </div>

              {/* Pro Plan */}
              <div className="bg-blue-600 text-white rounded-2xl p-8 relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-medium">Most Popular</span>
                </div>
                <h4 className="text-xl font-semibold mb-2">Pro</h4>
                <div className="text-3xl font-bold mb-4">$19<span className="text-lg opacity-75">/month</span></div>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-blue-200 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Unlimited queries
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-blue-200 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Priority processing
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-blue-200 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Advanced features
                  </li>
                </ul>
                <Link href="/signup" className="block w-full bg-white text-blue-600 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                  Start Pro Trial
                </Link>
              </div>

              {/* Team Plan */}
              <div className="bg-white border border-gray-200 rounded-2xl p-8">
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Team</h4>
                <div className="text-3xl font-bold text-gray-900 mb-4">$99<span className="text-lg text-gray-500">/month</span></div>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Everything in Pro
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Team collaboration
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Priority support
                  </li>
                </ul>
                <Link href="/signup" className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 px-4 rounded-lg font-medium transition-colors">
                  Contact Sales
                </Link>
              </div>
            </div>

            <div className="mt-12">
              <Link href="/pricing" className="text-blue-600 hover:text-blue-700 font-medium">
                View detailed pricing →
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-blue-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-3xl font-bold text-white mb-4">Ready to get started?</h3>
            <p className="text-xl text-blue-100 mb-8">Join thousands of users getting better answers with WrapeR2</p>
            <Link href="/signup" className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors">
              Start Free Today
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <h5 className="text-lg font-semibold mb-4">WrapeR2</h5>
                <p className="text-gray-400">AI search with multiple verified sources for reliable, comprehensive answers.</p>
              </div>
              <div>
                <h6 className="font-semibold mb-4">Product</h6>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                  <li><Link href="/login" className="hover:text-white">Sign In</Link></li>
                  <li><Link href="/signup" className="hover:text-white">Sign Up</Link></li>
                </ul>
              </div>
              <div>
                <h6 className="font-semibold mb-4">Support</h6>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="mailto:support@wraper2.com" className="hover:text-white">Contact</a></li>
                  <li><a href="#" className="hover:text-white">Help Center</a></li>
                  <li><a href="#" className="hover:text-white">Status</a></li>
                </ul>
              </div>
              <div>
                <h6 className="font-semibold mb-4">Legal</h6>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white">Privacy</a></li>
                  <li><a href="#" className="hover:text-white">Terms</a></li>
                  <li><a href="#" className="hover:text-white">Security</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2024 WrapeR2. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
} 