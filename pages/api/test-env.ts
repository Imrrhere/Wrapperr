import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Clean and validate environment variables
  const cleanUrl = (url: string | undefined) => {
    if (!url) return null
    return url.replace(/[\r\n\t]/g, '').trim()
  }

  const supabaseUrl = cleanUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const supabaseAnonKey = cleanUrl(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const supabaseServiceKey = cleanUrl(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const anthropicKey = cleanUrl(process.env.ANTHROPIC_API_KEY)
  const stripeSecretKey = cleanUrl(process.env.STRIPE_SECRET_KEY)
  const stripePublishableKey = cleanUrl(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  const stripeWebhookSecret = cleanUrl(process.env.STRIPE_WEBHOOK_SECRET)

  const envStatus = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    
    // Supabase
    supabase: {
      url: supabaseUrl ? '✅ Set' : '❌ Missing',
      urlValid: supabaseUrl?.startsWith('https://') ? '✅ Valid format' : '❌ Invalid format',
      anonKey: supabaseAnonKey ? '✅ Set' : '❌ Missing',
      anonKeyValid: supabaseAnonKey?.startsWith('eyJ') ? '✅ Valid JWT format' : '❌ Invalid JWT format',
      serviceKey: supabaseServiceKey ? '✅ Set' : '❌ Missing',
      serviceKeyValid: supabaseServiceKey?.startsWith('eyJ') ? '✅ Valid JWT format' : '❌ Invalid JWT format',
    },
    
    // Claude AI
    anthropic: {
      key: anthropicKey ? '✅ Set' : '❌ Missing',
      keyValid: anthropicKey?.startsWith('sk-ant-') ? '✅ Valid format' : '❌ Invalid format',
    },
    
    // Stripe
    stripe: {
      secretKey: stripeSecretKey ? '✅ Set' : '❌ Missing',
      secretKeyValid: stripeSecretKey?.startsWith('sk_') ? '✅ Valid format' : '❌ Invalid format',
      publishableKey: stripePublishableKey ? '✅ Set' : '❌ Missing',
      publishableKeyValid: stripePublishableKey?.startsWith('pk_') ? '✅ Valid format' : '❌ Invalid format',
      webhookSecret: stripeWebhookSecret ? '✅ Set' : '❌ Missing',
      webhookSecretValid: stripeWebhookSecret?.startsWith('whsec_') ? '✅ Valid format' : '❌ Invalid format',
    },
    
    // Critical Issues
    criticalIssues: [] as string[],
    
    // Debug Info (first 10 chars only for security)
    debug: {
      supabaseUrl: supabaseUrl?.substring(0, 30) + '...',
      stripeSecretStart: stripeSecretKey?.substring(0, 12) + '...',
      stripePublishableStart: stripePublishableKey?.substring(0, 12) + '...',
    }
  }

  // Check for critical issues
  if (!supabaseUrl) envStatus.criticalIssues.push('NEXT_PUBLIC_SUPABASE_URL missing')
  if (!supabaseAnonKey) envStatus.criticalIssues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY missing')
  if (!anthropicKey) envStatus.criticalIssues.push('ANTHROPIC_API_KEY missing')
  if (!stripeSecretKey) envStatus.criticalIssues.push('STRIPE_SECRET_KEY missing')
  if (!stripePublishableKey) envStatus.criticalIssues.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY missing')
  
  if (stripeSecretKey && stripePublishableKey && stripeSecretKey === stripePublishableKey) {
    envStatus.criticalIssues.push('STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY are identical!')
  }

  const status = envStatus.criticalIssues.length === 0 ? 200 : 500

  res.status(status).json({
    success: status === 200,
    message: status === 200 ? 'All environment variables configured correctly' : 'Environment configuration issues found',
    ...envStatus
  })
} 