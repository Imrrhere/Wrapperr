import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe, isStripeConfigured } from '../../lib/stripe';

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
    const { customer_id } = req.body;

    if (!customer_id) {
      return res.status(400).json({ error: 'Missing customer_id' });
    }

    // Create a customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer_id,
      return_url: `${req.headers.origin}/dashboard`,
    });

    res.status(200).json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 