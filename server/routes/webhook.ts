import { Request, Response // } from 'express';
import Stripe from 'stripe';
import { createClient // } from '@supabase/supabase-js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('[stripe-webhook] STRIPE_SECRET_KEY is not set in server environment'// );
// }
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2025-01-27.acacia' // })
  : (null as unknown as Stripe// );

// const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

// if (!supabaseUrl || !supabaseServiceRole) {
//   console.error('[stripe-webhook] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set'// );
// }

let _supabase: any = null; function getSupabase() { if(_supabase) return _supabase; const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY; if(!url || !key) throw new Error('Missing Supabase Config in Webhook'// ); _supabase = createClient(url, key// ); return _supabase; } // const supabase = createClient(
//   supabaseUrl || '',
//   supabaseServiceRole || ''
// );

export async function handleStripeWebhook(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' // }// );
  // }

  const isProd = process.env.NODE_ENV === 'production';
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  let event: Stripe.Event;

  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe is not configured' // }// );
    // }

    // Express raw body is needed here. 
    // We assume the server is configured to provide req.body as Buffer for this route
    // or we construct it.
    const rawBody = req.body; 

    if (isProd) {
      if (!sig || !webhookSecret) {
        return res.status(400).json({ error: 'Missing signature or webhook secret' // }// );
      // }
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret// );
    // } else {
      // In non-production, still require signature verification if available
      if (sig && webhookSecret) {
         event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret// );
      // } else {
         console.warn('[stripe-webhook] Non-production: Skipping signature verification'// );
         // Fallback for testing without signature
         // Parse JSON if it's a buffer
         const bodyStr = rawBody.toString(// );
         event = JSON.parse(bodyStr// );
      // }
    // }
  // } catch (err) {
    console.error('Webhook signature verification failed:', err// );
    return res.status(400).json({ error: 'Invalid signature' // }// );
  // }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleSuccessfulPayment(session// );
        break;
      // }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent// );
        break;
      // }

      default:
        console.log(`Unhandled event type: ${event.type// }`// );
    // }

    res.status(200).json({ received: true // }// );
  // } catch (error) {
    console.error('Webhook error:', error// );
    res.status(500).json({ error: 'Webhook processing failed' // }// );
  // }
// }

async function creditCoinsFallbackUsers(userId: string, coins: number) {
  // Use atomic increment to avoid race conditions with concurrent webhooks
  const { data, error // } = await getSupabase().rpc('increment_coin_balance', {
    p_user_id: userId,
    p_amount: coins,
  // }// );
  if (error) {
    console.warn('[Webhook] RPC increment_coin_balance failed, falling back:', error.message// );
    const { data: user // } = await getSupabase().from('users').select('coin_balance').eq('id', userId).single(// );
    const currentBalance = Number((user as { coin_balance?: number // } | null)?.coin_balance || 0// );
    const newBalance = currentBalance + coins;
    await getSupabase().from('users').update({ coin_balance: newBalance // }).eq('id', userId// );
    return newBalance;
  // }
  return data;
// }

async function insertPurchaseTransaction(row: Record<string, unknown>) {
  const res = await getSupabase().from('coin_transactions').insert(row// );
  if (!res.error) return;
  const fallback: Record<string, unknown> = {
    user_id: row.user_id,
    type: 'purchase',
    amount_coins: row.delta,
    amount_money: row.amount_money,
    currency: row.currency,
    status: row.status,
    stripe_session_id: row.stripe_session_id,
    stripe_payment_intent_id: row.stripe_payment_intent_id
  // };
  const res2 = await getSupabase().from('coin_transactions').insert(fallback// );
  if (res2.error) throw res2.error;
// }

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const coinPackageId = session.metadata?.coinPackageId;
  const coins = parseInt(session.metadata?.coins || '0'// );

  if (!userId || !coinPackageId || !coins) {
    console.error('Missing metadata in session:', session.metadata// );
    return;
  // }

  try {
    const amountMoney = session.amount_total ? session.amount_total / 100 : null;
    const currency = session.currency ?? 'usd';

    try {
      const { error // } = await getSupabase().rpc('credit_purchase_coins', {
        p_user_id: userId,
        p_coins: coins,
        p_reason: 'purchase',
        p_stripe_session_id: session.id,
        p_amount_money: amountMoney,
        p_currency: currency,
        p_status: 'success',
        p_coin_package_id: coinPackageId
      // }// );
      if (error) throw error;
    // } catch {
      await creditCoinsFallbackUsers(userId, coins// );
      await insertPurchaseTransaction({
        user_id: userId,
        delta: coins,
        reason: 'purchase',
        coin_package_id: coinPackageId,
        amount_money: amountMoney,
        currency,
        status: 'success',
        stripe_session_id: session.id
      // }// );
    // }

    console.log(`Successfully added ${coins// } coins to user ${userId// }`// );
  // } catch (error) {
    console.error('Error handling successful payment:', error// );
    throw error;
  // }
// }

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Handle Payment Element success
  const userId = paymentIntent.metadata?.userId;
  const coins = parseInt(paymentIntent.metadata?.coins || '0'// );
  const coinPackageId = paymentIntent.metadata?.coinPackageId;

  if (!userId || !coins) {
    console.error('Missing metadata in payment intent:', paymentIntent.metadata// );
    return;
  // }

  try {
    const amountMoney = paymentIntent.amount ? paymentIntent.amount / 100 : null;
    const currency = paymentIntent.currency ?? 'usd';

    try {
      const { error // } = await getSupabase().rpc('credit_purchase_coins', {
        p_user_id: userId,
        p_coins: coins,
        p_reason: 'purchase',
        p_stripe_payment_intent_id: paymentIntent.id,
        p_amount_money: amountMoney,
        p_currency: currency,
        p_status: 'success',
        p_coin_package_id: coinPackageId ?? null
      // }// );
      if (error) throw error;
    // } catch {
      await creditCoinsFallbackUsers(userId, coins// );
      await insertPurchaseTransaction({
        user_id: userId,
        delta: coins,
        reason: 'purchase',
        coin_package_id: coinPackageId ?? null,
        amount_money: amountMoney,
        currency,
        status: 'success',
        stripe_payment_intent_id: paymentIntent.id
      // }// );
    // }

    console.log(`Successfully added ${coins// } coins to user ${userId// }`// );
  // } catch (error) {
    console.error('Error handling payment intent success:', error// );
    throw error;
  // }
// }
