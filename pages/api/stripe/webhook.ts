import type { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import { stripe, isStripeConfigured } from '../../../lib/stripe';
import { createSupabaseServerClientForAPI } from '../../../lib/supabase';
import Stripe from 'stripe';

// Disable body parser for webhook
export const config = {
  api: {
    bodyParser: false,
  },
};

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

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const supabase = createSupabaseServerClientForAPI();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan;

        if (!userId || !plan) {
          console.error('Missing user_id or plan in session metadata');
          return res.status(400).json({ error: 'Invalid session metadata' });
        }

        // Update user subscription in Supabase
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription: plan,
            requests_this_month: 0, // Reset usage count
          })
          .eq('id', userId);

        if (updateError) {
          console.error('Error updating user subscription:', updateError);
          return res.status(500).json({ error: 'Failed to update subscription' });
        }

        console.log(`Successfully upgraded user ${userId} to ${plan} plan`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profileError || !profile) {
          console.error('User not found for customer:', customerId);
          return res.status(404).json({ error: 'User not found' });
        }

        // Downgrade to free plan
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription: 'free',
            requests_this_month: 0,
          })
          .eq('id', profile.id);

        if (updateError) {
          console.error('Error downgrading user subscription:', updateError);
          return res.status(500).json({ error: 'Failed to downgrade subscription' });
        }

        console.log(`Successfully downgraded user ${profile.id} to free plan`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find user by Stripe customer ID
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profileError || !profile) {
          console.error('User not found for customer:', customerId);
          return res.status(404).json({ error: 'User not found' });
        }

        // Reset monthly usage count for new billing period
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            requests_this_month: 0,
          })
          .eq('id', profile.id);

        if (updateError) {
          console.error('Error resetting user usage:', updateError);
          return res.status(500).json({ error: 'Failed to reset usage' });
        }

        console.log(`Successfully reset usage for user ${profile.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 