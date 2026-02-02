import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover',
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.VITE_STRIPE_WEBHOOK_SECRET || '';

  if (!sig || !webhookSecret) {
    return res.status(400).json({ error: 'Missing signature or webhook secret' });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await handleSuccessfulPayment(session);
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const coinPackageId = session.metadata?.coinPackageId;
  const coins = parseInt(session.metadata?.coins || '0');

  if (!userId || !coinPackageId || !coins) {
    console.error('Missing metadata in session:', session.metadata);
    return;
  }

  try {
    // Update user's coin balance
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('coin_balance')
      .eq('id', userId)
      .single();

    if (userError) {
      throw new Error(`User not found: ${userError.message}`);
    }

    const newBalance = (user.coin_balance || 0) + coins;

    // Update user balance
    const { error: updateError } = await supabase
      .from('users')
      .update({ coin_balance: newBalance })
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Failed to update balance: ${updateError.message}`);
    }

    // Record transaction
    const { error: transactionError } = await supabase
      .from('coin_transactions')
      .insert({
        user_id: userId,
        type: 'purchase',
        amount_coins: coins,
        amount_money: session.amount_total ? session.amount_total / 100 : 0,
        currency: 'usd',
        status: 'success',
        stripe_session_id: session.id,
      });

    if (transactionError) {
      throw new Error(`Failed to record transaction: ${transactionError.message}`);
    }

    console.log(`Successfully added ${coins} coins to user ${userId}`);
  } catch (error) {
    console.error('Error handling successful payment:', error);
    throw error;
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Handle Payment Element success
  const userId = paymentIntent.metadata?.userId;
  const coins = parseInt(paymentIntent.metadata?.coins || '0');

  if (!userId || !coins) {
    console.error('Missing metadata in payment intent:', paymentIntent.metadata);
    return;
  }

  try {
    // Update user's coin balance
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('coin_balance')
      .eq('id', userId)
      .single();

    if (userError) {
      throw new Error(`User not found: ${userError.message}`);
    }

    const newBalance = (user.coin_balance || 0) + coins;

    // Update user balance
    const { error: updateError } = await supabase
      .from('users')
      .update({ coin_balance: newBalance })
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Failed to update balance: ${updateError.message}`);
    }

    // Record transaction
    const { error: transactionError } = await supabase
      .from('coin_transactions')
      .insert({
        user_id: userId,
        type: 'purchase',
        amount_coins: coins,
        amount_money: paymentIntent.amount ? paymentIntent.amount / 100 : 0,
        currency: 'usd',
        status: 'success',
        stripe_payment_intent_id: paymentIntent.id,
      });

    if (transactionError) {
      throw new Error(`Failed to record transaction: ${transactionError.message}`);
    }

    console.log(`Successfully added ${coins} coins to user ${userId}`);
  } catch (error) {
    console.error('Error handling payment intent success:', error);
    throw error;
  }
}