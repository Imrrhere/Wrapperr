import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createSupabaseBrowserClient, createSupabaseServerClient } from '../lib/supabase'
import { SUBSCRIPTION_PLANS } from '../lib/stripe'

interface Profile {
  id: string
  email: string
  subscription: string
  requests_this_month: number
  last_request_at: string | null
  stripe_customer_id: string | null
  created_at: string
}

interface HistoryItem {
  id: string
  query: string
  response: string
  created_at: string
}

interface DashboardProps {
  user: {
    id: string
    email: string
  }
  profile: Profile
  recentHistory: HistoryItem[]
}

export default function Dashboard({ user, profile, recentHistory }: DashboardProps) {
  const [loading, setLoading] = useState(false)
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getUsageInfo = () => {
    const plan = SUBSCRIPTION_PLANS[profile.subscription as keyof typeof SUBSCRIPTION_PLANS] || SUBSCRIPTION_PLANS.free
    const used = profile.requests_this_month || 0
    const limit = plan.requests
    const percentage = (used / limit) * 100
    
    return {
      used,
      limit,
      percentage: Math.min(percentage, 100),
      period: plan.period,
      remaining: Math.max(limit - used, 0)
    }
  }

  const handleUpgrade = async () => {
    setUpgradeLoading(true)
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          plan: 'pro',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { sessionId } = await response.json()
      
      // Redirect to Stripe Checkout
      const stripe = await import('@stripe/stripe-js').then(mod => 
        mod.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      )
      
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId })
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to start upgrade process. Please try again.')
    } finally {
      setUpgradeLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    if (!profile.stripe_customer_id) {
      alert('No subscription to manage')
      return
    }

    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: profile.stripe_customer_id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create portal session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to open subscription management. Please try again.')
    }
  }

  const getSubscriptionBadge = (subscription: string) => {
    const badges = {
      free: 'bg-gray-100 text-gray-800',
      pro: 'bg-blue-100 text-blue-800',
      team: 'bg-purple-100 text-purple-800'
    }
    return badges[subscription as keyof typeof badges] || badges.free
  }

  const usage = getUsageInfo()

  return (
    <>
      <Head>
        <title>Dashboard - WrapeR2</title>
        <meta name="description" content="Your WrapeR2 dashboard" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold">
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    WrapeR2
                  </span>
                </h1>
                <span className="text-gray-500">Dashboard</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/pricing')}
                  className="px-4 py-2 text-purple-600 hover:text-purple-700 border border-purple-600 rounded-lg hover:bg-purple-50"
                >
                  Pricing
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="px-4 py-2 text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg hover:bg-blue-50"
                >
                  Search
                </button>
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                >
                  {loading ? 'Signing out...' : 'Sign out'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Credits Overview Card */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 text-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Current Plan */}
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">{profile.subscription.toUpperCase()}</div>
                  <div className="text-blue-100">Current Plan</div>
                </div>
                
                {/* Credits Remaining */}
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">{usage.remaining}</div>
                  <div className="text-blue-100">Credits Remaining</div>
                  <div className="text-sm text-blue-200 mt-1">
                    this {usage.period === 'day' ? 'day' : 'month'}
                  </div>
                </div>
                
                {/* Usage Progress */}
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">{Math.round(usage.percentage)}%</div>
                  <div className="text-blue-100">Used</div>
                  <div className="w-full bg-white/20 rounded-full h-2 mt-3">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(usage.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={() => router.push('/')}
                  className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Start Searching
                </button>
                {profile.subscription === 'free' && (
                  <button
                    onClick={handleUpgrade}
                    disabled={upgradeLoading}
                    className="bg-white text-purple-600 hover:bg-gray-100 px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {upgradeLoading ? 'Processing...' : 'Upgrade Plan'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Section */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Info */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Profile</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <div className="text-gray-900">{user.email}</div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Subscription</label>
                    <div className="mt-1">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getSubscriptionBadge(profile.subscription)}`}>
                        {profile.subscription.charAt(0).toUpperCase() + profile.subscription.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Member since</label>
                    <div className="text-gray-900">{formatDate(profile.created_at)}</div>
                  </div>
                </div>
              </div>

              {/* Usage Stats */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Usage This {usage.period === 'day' ? 'Day' : 'Month'}</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Queries Used</span>
                    <span className="text-sm font-medium">{usage.used} / {usage.limit}</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        usage.percentage > 90 ? 'bg-red-500' : 
                        usage.percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${usage.percentage}%` }}
                    ></div>
                  </div>
                  
                  <div className="text-center">
                    <span className="text-2xl font-bold text-gray-900">{usage.remaining}</span>
                    <p className="text-sm text-gray-500">queries remaining</p>
                  </div>
                </div>
              </div>

              {/* Subscription Management */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Subscription</h3>
                
                {profile.subscription === 'free' ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                      <h4 className="font-semibold text-gray-900 mb-2">Upgrade to Pro</h4>
                      <ul className="text-sm text-gray-600 mb-3 space-y-1">
                        <li>• 500 queries per month</li>
                        <li>• Priority access</li>
                        <li>• Saved history</li>
                        <li>• Faster responses</li>
                      </ul>
                      <button 
                        onClick={handleUpgrade}
                        disabled={upgradeLoading}
                        className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium disabled:opacity-50"
                      >
                        {upgradeLoading ? 'Processing...' : 'Upgrade to Pro - $9/month'}
                      </button>
                    </div>
                    <button
                      onClick={() => router.push('/pricing')}
                      className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      View All Plans
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-green-800 font-medium">
                          {profile.subscription.charAt(0).toUpperCase() + profile.subscription.slice(1)} Plan Active
                        </span>
                      </div>
                    </div>
                    
                    {profile.stripe_customer_id && (
                      <button
                        onClick={handleManageSubscription}
                        className="w-full py-2 px-4 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50"
                      >
                        Manage Subscription
                      </button>
                    )}
                    
                    {profile.subscription === 'pro' && (
                      <button
                        onClick={() => router.push('/pricing')}
                        className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        Upgrade to Team
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Recent History Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Recent Search History</h2>
                  <button 
                    onClick={() => router.push('/')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    New Search →
                  </button>
                </div>

                {recentHistory.length > 0 ? (
                  <div className="space-y-4">
                    {recentHistory.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-900 line-clamp-2">{item.query}</h3>
                          <span className="text-xs text-gray-500 ml-4 whitespace-nowrap">
                            {formatDate(item.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-3">{item.response}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🔍</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No search history yet</h3>
                    <p className="text-gray-500 mb-4">Start searching to see your history here.</p>
                    <button 
                      onClick={() => router.push('/')}
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700"
                    >
                      Start Searching
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Server-side authentication check
export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabase = createSupabaseServerClient(context)
  
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    }
  }

  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
    }

    // Get recent search history
    const { data: recentHistory, error: historyError } = await supabase
      .from('history')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (historyError) {
      console.error('History error:', historyError)
    }

    return {
      props: {
        user: {
          id: session.user.id,
          email: session.user.email,
        },
        profile: profile || {
          id: session.user.id,
          email: session.user.email || '',
          subscription: 'free',
          created_at: new Date().toISOString(),
        },
        recentHistory: recentHistory || [],
      },
    }
  } catch (error) {
    console.error('Dashboard error:', error)
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    }
  }
} 