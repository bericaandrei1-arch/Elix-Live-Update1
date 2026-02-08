import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { checkRateLimit } from './rate-limit';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('[stripe] STRIPE_SECRET_KEY is not set in server environment');
}
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2026-01-28.clover' })
  : (null as unknown as Stripe);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe is not configured' });
    }

    const { coinPackage, userId } = req.body ?? {};

    if (!coinPackage?.id || !userId) {
      return res.status(400).json({ error: 'Missing required parameters (coinPackage.id, userId)' });
    }

    // Rate limit: prevent payment spam
    const rateCheck = checkRateLimit(String(userId), 'gift:send');
    if (!rateCheck.allowed) {
      return res.status(429).json({ error: 'Too many requests', retryAfter: rateCheck.retryAfter });
    }

    // Server-side price lookup — NEVER trust client-supplied amounts
    const SERVER_COIN_PACKAGES: Record<string, { coins: number; price: number; label: string }> = {
      coins_100:  { coins: 100,  price: 0.99,  label: '100 Coins' },
      coins_500:  { coins: 500,  price: 4.99,  label: '500 Coins' },
      coins_1000: { coins: 1000, price: 9.99,  label: '1,000 Coins' },
      coins_5000: { coins: 5000, price: 49.99, label: '5,000 Coins' },
    };

    const verifiedPackage = SERVER_COIN_PACKAGES[coinPackage.id];
    if (!verifiedPackage) {
      return res.status(400).json({ error: 'Invalid coin package id' });
    }

    const verifiedAmountCents = Math.round(verifiedPackage.price * 100);

    // Create Payment Intent with server-verified amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: verifiedAmountCents,
      currency: 'usd',
      metadata: {
        coinPackageId: coinPackage.id,
        coins: verifiedPackage.coins.toString(),
        label: verifiedPackage.label,
        userId: userId.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
