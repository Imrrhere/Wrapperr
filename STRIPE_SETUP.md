# WrapeR2 Stripe Integration Setup Guide

## 🚨 YOUR SPECIFIC CONFIGURATION

**Update your `.env.local` file with these values:**

```bash
# Stripe Configuration
# ⚠️ CRITICAL: The STRIPE_SECRET_KEY below is INCORRECT!
# You provided a publishable key (pk_live_) for both secret and publishable
# Please replace the secret key with your actual secret key that starts with sk_live_

STRIPE_SECRET_KEY=YOUR_ACTUAL_SECRET_KEY_HERE_STARTS_WITH_sk_live_
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51RQ6XnDeBNzmpbwBbZa5NYnlR6BvTp56MhpCrVccl0pXmUFWVZdCXUwrcjvsv6hOBBuvuazTETfOv3nNl5nPnNG000r4oe3B4i
STRIPE_WEBHOOK_SECRET=whsec_A4yXFCqDDRaJwLQv70IZSdNiDsWWQ9k6
```

**Your Price IDs (already configured in code):**
- WrapeR2 Pro: `price_1RRyT1DeBNzmpbwBAghQ0ap8` ✅
- WrapeR2 Team: `price_1RRyTXDeBNzmpbwBq1w3rxWw` ✅

## 🔑 Finding Your Secret Key

1. Go to your Stripe Dashboard
2. Navigate to **Developers** → **API Keys**
3. Look for the **Secret key** (not Publishable key)
4. It should start with `sk_live_` for production or `sk_test_` for testing
5. Click "Reveal" and copy the key that starts with `sk_live_`

## 🚨 SECURITY WARNING

**You provided the same key for both STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!**

- **Publishable Key** (starts with `pk_live_`): ✅ Safe to expose in frontend
- **Secret Key** (starts with `sk_live_`): ❌ MUST be kept secret, server-side only

**Never expose your secret key in the frontend or commit it to version control!**

---

This guide will walk you through setting up the complete Stripe integration for WrapeR2's subscription system.

## 🔧 Prerequisites

- Stripe account (https://stripe.com)
- Supabase project with authentication enabled
- Next.js app with WrapeR2 codebase

## 📋 Step 1: Stripe Dashboard Setup

### 1.1 Create Stripe Products and Prices

1. Log into your Stripe Dashboard
2. Go to **Products** → **Add Product**

**Pro Plan Product:**
- Name: `WrapeR2 Pro Plan`
- Description: `500 Claude queries per month with priority access and saved history`
- Pricing Model: `Recurring`
- Price: `$9.00 USD`
- Billing Period: `Monthly`
- Copy the Price ID (starts with `price_`)

**Team Plan Product:**
- Name: `WrapeR2 Team Plan`
- Description: `5000 Claude queries per month with team features and priority support`
- Pricing Model: `Recurring`
- Price: `$99.00 USD`
- Billing Period: `Monthly`
- Copy the Price ID (starts with `price_`)

### 1.2 Update Price IDs in Code

Update `lib/stripe.ts` with your actual price IDs:

```typescript
pro: {
  // ... other config
  stripePriceId: 'price_YOUR_ACTUAL_PRO_PRICE_ID_HERE', // Replace this
},
team: {
  // ... other config
  stripePriceId: 'price_YOUR_ACTUAL_TEAM_PRICE_ID_HERE', // Replace this
}
```

### 1.3 Configure Customer Portal

1. Go to **Settings** → **Billing** → **Customer Portal**
2. Enable the customer portal
3. Configure allowed features:
   - ✅ Update payment method
   - ✅ View invoice history
   - ✅ Cancel subscription
   - ✅ Update billing information

## 🔑 Step 2: Environment Variables

### 2.1 Get Stripe Keys

From your Stripe Dashboard:

1. **Publishable Key**: Go to **Developers** → **API Keys** → Copy "Publishable key"
2. **Secret Key**: Go to **Developers** → **API Keys** → Reveal and copy "Secret key"

### 2.2 Set Up Webhook

1. Go to **Developers** → **Webhooks** → **Add endpoint**
2. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
3. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
4. Copy the **Signing secret** (starts with `whsec_`)

### 2.3 Update .env.local

Add these variables to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret_here
```

**🚨 Important Security Notes:**
- Use test keys (`sk_test_` and `pk_test_`) for development
- Use live keys (`sk_live_` and `pk_live_`) for production
- Never commit secret keys to version control
- Rotate keys if compromised

## 🗄️ Step 3: Database Migration

### 3.1 Update Supabase Schema

Run this SQL in your Supabase SQL Editor:

```sql
-- Add subscription management fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS requests_this_month INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS last_request_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Update the subscription constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS valid_subscription;

ALTER TABLE public.profiles 
ADD CONSTRAINT valid_subscription CHECK (subscription IN ('free', 'pro', 'team'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id 
ON public.profiles(stripe_customer_id);

-- Create index for usage tracking
CREATE INDEX IF NOT EXISTS idx_profiles_last_request 
ON public.profiles(last_request_at);
```

### 3.2 Verify Database Update

Check that your profiles table now has these columns:
- `subscription` (text, default 'free')
- `requests_this_month` (integer, default 0)
- `last_request_at` (timestamptz)
- `stripe_customer_id` (text)

## 🚀 Step 4: Deployment

### 4.1 Vercel Environment Variables

If deploying to Vercel:

1. Go to your Vercel project dashboard
2. **Settings** → **Environment Variables**
3. Add each environment variable:
   - `STRIPE_SECRET_KEY` → `sk_test_...` (your secret key)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_test_...` (your publishable key)
   - `STRIPE_WEBHOOK_SECRET` → `whsec_...` (your webhook secret)

4. Redeploy your application

### 4.2 Update Webhook URL

After deployment, update your Stripe webhook endpoint URL to point to your live domain:
- Development: `https://localhost:3000/api/stripe/webhook`
- Production: `https://yourdomain.com/api/stripe/webhook`

## 🧪 Step 5: Testing

### 5.1 Test Credit Cards

Use Stripe's test credit cards:

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any valid ZIP

**Declined Payment:**
- Card: `4000 0000 0000 0002`
- Expiry: Any future date
- CVC: Any 3 digits

### 5.2 Test Workflow

1. **Sign up** for a new account
2. Go to **Pricing** page
3. Click **Subscribe to Pro**
4. Complete Stripe checkout with test card
5. Verify subscription upgrade in dashboard
6. Test usage limits by making queries
7. Test customer portal access

### 5.3 Webhook Testing

1. Use Stripe CLI to test webhooks locally:
```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

2. Test webhook events:
```bash
stripe trigger checkout.session.completed
```

## 📊 Step 6: Monitoring

### 6.1 Stripe Dashboard

Monitor these metrics in your Stripe Dashboard:
- Active subscriptions
- Monthly recurring revenue (MRR)
- Churn rate
- Failed payments

### 6.2 Supabase Analytics

Monitor database usage:
- User signups
- Subscription conversions
- API usage by plan
- Query patterns

## 🔒 Step 7: Security Checklist

- [ ] Environment variables are properly set
- [ ] Webhook signature verification is enabled
- [ ] Test keys are used in development
- [ ] Live keys are secured for production
- [ ] Customer portal is properly configured
- [ ] RLS policies are enabled on profiles table
- [ ] API routes validate user authentication

## 🐛 Troubleshooting

### Common Issues

**"Invalid API Key" Error:**
- Verify `STRIPE_SECRET_KEY` is correctly set
- Ensure no extra spaces or quotes around the key
- Check you're using the correct environment (test vs live)

**Webhook "Invalid Signature" Error:**
- Verify `STRIPE_WEBHOOK_SECRET` matches your webhook's signing secret
- Ensure the webhook URL is correct
- Check that the webhook endpoint is receiving raw body data

**"supabaseUrl is required" Error:**
- Verify all Supabase environment variables are set
- Check the environment variable format in Vercel

**Subscription Not Updating:**
- Check webhook events are being received
- Verify webhook handler is processing `checkout.session.completed`
- Check Supabase logs for database errors

### Debug API Endpoints

Test environment variables:
```bash
GET /api/test-env
```

Test Stripe configuration:
```bash
GET /api/stripe/test
```

## 📞 Support

- **Stripe Documentation**: https://stripe.com/docs
- **Supabase Documentation**: https://supabase.com/docs
- **Next.js Documentation**: https://nextjs.org/docs

## 🎉 Congratulations!

Your WrapeR2 subscription system is now fully configured with:
- ✅ Stripe payment processing
- ✅ Usage-based access control
- ✅ Customer subscription management
- ✅ Webhook automation
- ✅ Secure environment configuration

Users can now:
1. Sign up for free accounts with 10 daily queries
2. Upgrade to Pro ($9/month) for 500 monthly queries
3. Access Team plan ($99/month) for 5000 monthly queries
4. Manage their subscriptions through Stripe Customer Portal
5. Have their usage automatically tracked and enforced 