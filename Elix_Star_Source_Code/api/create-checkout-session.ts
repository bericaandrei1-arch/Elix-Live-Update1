import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY || '';
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2026-01-28.clover',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { coinPackage, userId } = req.body ?? {};
    const headerUserId = req.headers['x-user-id'] as string | undefined;
    const effectiveUserId = (typeof userId === 'string' && userId.trim()) || headerUserId;

    if (!coinPackage) {
      return res.status(400).json({ error: 'Missing coin package' });
    }
    if (!effectiveUserId) {
      return res.status(400).json({ error: 'Missing user id' });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: coinPackage.label,
              description: `${coinPackage.coins} coins for ElixStarLive`,
            },
            unit_amount: Math.round(coinPackage.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/payment-cancelled`,
      client_reference_id: effectiveUserId,
      metadata: {
        coinPackageId: coinPackage.id,
        coins: coinPackage.coins.toString(),
        userId: effectiveUserId,
      },
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
