// @ts-nocheck — This file runs as a Supabase/Deno Edge Function, not under the project TypeScript config.
// supabase/functions/send-gift/index.ts
// Supabase Edge Function: Server-validated gift sending with ACK
//
// Deploy: supabase functions deploy send-gift
//
// POST /send-gift
// Body: { streamKey, giftId, clientRequestId }
// Returns: { ack: true, newBalance, newLevel, newXp, diamondsEarned, transactionId, clientRequestId }

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// In-memory rate limiter (per-user, per-function instance)
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 30;       // max 30 gifts per window
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute window

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimits.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
        'Access-Control-Allow-Methods': 'POST',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Auth
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: { user }, error: authErr } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  if (authErr || !user) {
    return new Response(JSON.stringify({ error: 'Invalid auth token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Rate limit
  if (!checkRateLimit(user.id)) {
    return new Response(JSON.stringify({ error: 'rate_limited', message: 'Too many gifts. Please slow down.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse body
  let body: { streamKey: string; giftId: string; clientRequestId: string; idempotencyKey?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { streamKey, giftId, clientRequestId, idempotencyKey } = body;

  if (!streamKey || !giftId || !clientRequestId) {
    return new Response(JSON.stringify({ error: 'streamKey, giftId, and clientRequestId are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Call the DB RPC (atomic transaction) with client_request_id
  const { data, error } = await supabase.rpc('send_stream_gift', {
    p_stream_key: streamKey,
    p_gift_id: giftId,
    p_client_request_id: clientRequestId,
    p_idempotency_key: idempotencyKey || null,
  });

  if (error) {
    const msg = error.message || '';
    const statusCode = msg.includes('insufficient_funds') ? 402
      : msg.includes('invalid_gift') ? 400
      : msg.includes('stream_not_found') ? 404
      : msg.includes('cannot_gift_self') ? 400
      : msg.includes('not_authenticated') ? 401
      : 500;

    console.error(`[send-gift] Error for user=${user.id}: ${msg}`);
    return new Response(JSON.stringify({ error: msg, ack: false }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const result = Array.isArray(data) ? data[0] : data;

  console.log(`[send-gift] ACK user=${user.id} gift=${giftId} stream=${streamKey} client_request_id=${clientRequestId} balance=${result?.new_balance}`);

  return new Response(
    JSON.stringify({
      ack: true,
      clientRequestId,
      transactionId: result?.transaction_id ?? null,
      newBalance: result?.new_balance ?? 0,
      newLevel: result?.new_level ?? 1,
      newXp: result?.new_xp ?? 0,
      diamondsEarned: result?.diamonds_earned ?? 0,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
});
