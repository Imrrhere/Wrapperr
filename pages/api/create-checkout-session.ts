import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe, SUBSCRIPTION_PLANS, SubscriptionPlan, isStripeConfigured } from '../../lib/stripe';
import { createSupabaseServerClientForAPI } from '../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if Stripe is properly configured
  if (!stripe || !isStripeConfigured()) {
    return res.status(503).json({ error: 'Payment service is not available' });
  }

  try {
    const { user_id, plan } = req.body;

    if (!user_id || !plan) {
      return res.status(400).json({ error: 'Missing user_id or plan' });
    }

    if (plan !== 'pro') {
      return res.status(400).json({ error: 'Only Pro plan checkout is supported' });
    }

    // Get user from Supabase to validate and get email
    const supabase = createSupabaseServerClientForAPI();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create or retrieve Stripe customer
    let customer_id = profile.stripe_customer_id;

    if (!customer_id) {
      const customer = await stripe.customers.create({
        email: profile.email,
        metadata: {
          user_id: user_id,
        },
      });
      customer_id = customer.id;

      // Update profile with Stripe customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customer_id })
        .eq('id', user_id);
    }

    // Type the plan properly
    const planConfig = SUBSCRIPTION_PLANS[plan as SubscriptionPlan];

    // Ensure the plan has a price ID (only paid plans should)
    if (!('stripePriceId' in planConfig)) {
      return res.status(400).json({ error: 'Plan does not support checkout' });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer_id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: planConfig.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${req.headers.origin}/pricing`,
      metadata: {
        user_id: user_id,
        plan: plan,
      },
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 