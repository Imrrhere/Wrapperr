import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

// Environment variables with fallbacks for development
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

// Development mode fallbacks
const isDevelopment = process.env.NODE_ENV === 'development'
const fallbackSecretKey = 'sk_test_placeholder'
const fallbackPublishableKey = 'pk_test_placeholder'

// Use fallbacks in development if variables are missing
const cleanStripeSecretKey = stripeSecretKey || (isDevelopment ? fallbackSecretKey : '')
const cleanStripePublishableKey = stripePublishableKey || (isDevelopment ? fallbackPublishableKey : '')

// Warn in development if using fallbacks
if (isDevelopment && (!stripeSecretKey || !stripePublishableKey)) {
  console.warn('⚠️  Using Stripe fallback values in development. Payment features will not work.')
  console.warn('   To enable payment functionality, set up your environment variables:')
  console.warn('   - STRIPE_SECRET_KEY')
  console.warn('   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')
}

// Server-side Stripe instance with error handling
export const stripe = cleanStripeSecretKey !== fallbackSecretKey 
  ? new Stripe(cleanStripeSecretKey)
  : null

// Client-side Stripe instance with error handling
export const getStripe = () => {
  if (cleanStripePublishableKey === fallbackPublishableKey) {
    console.warn('⚠️  Stripe not configured - payment features disabled')
    return null
  }
  return loadStripe(cleanStripePublishableKey)
}

// Helper to check if Stripe is properly configured
export const isStripeConfigured = () => {
  return !!(stripeSecretKey && stripePublishableKey && cleanStripeSecretKey !== fallbackSecretKey)
}

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    requests: 10,
    period: 'day',
    features: [
      '10 Claude queries per day',
      'Basic AI assistance',
      'Standard response time'
    ]
  },
  pro: {
    name: 'Pro',
    price: 9,
    requests: 500,
    period: 'month',
    stripePriceId: 'price_1RRyT1DeBNzmpbwBAghQ0ap8', // WrapeR2 Pro
    features: [
      '500 Claude queries per month',
      'Priority access',
      'Saved conversation history',
      'Faster response times',
      'Advanced AI features'
    ]
  },
  team: {
    name: 'Team',
    price: 99,
    requests: 5000,
    period: 'month',
    stripePriceId: 'price_1RRyTXDeBNzmpbwBq1w3rxWw', // WrapeR2 Team
    features: [
      '5000 Claude queries per month',
      'Team collaboration features',
      'Priority support',
      'Custom integrations',
      'Advanced analytics',
      'Dedicated account manager'
    ]
  }
} as const

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS 