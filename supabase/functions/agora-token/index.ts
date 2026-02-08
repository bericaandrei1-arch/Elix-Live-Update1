// @ts-nocheck — This file runs as a Supabase/Deno Edge Function, not under the project TypeScript config.
// supabase/functions/agora-token/index.ts
// Supabase Edge Function: Generate Agora RTC tokens
//
// Deploy: supabase functions deploy agora-token
// Requires env vars: AGORA_APP_ID, AGORA_APP_CERTIFICATE
//
// POST /agora-token
// Body: { channelName, role: "publisher" | "subscriber", uid?: number }
// Returns: { token, uid, expiresIn }

import { serve } from 'std/server';
import { createClient } from 'npm:@supabase/supabase-js';

// Deno global type declarations for Edge Functions
declare const Deno: {
  env: { get(key: string): string | undefined };
};

// Agora token builder (RtcTokenBuilder equivalent for Deno/Edge)
// Based on https://github.com/AgoraIO/Tools/tree/master/DynamicKey/AgoraRtcToken
// HMAC helper for Deno Edge Functions using Web Crypto API
async function createHmacSha256(key: string, data: Uint8Array): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, data as ArrayBufferView);
  return new Uint8Array(signature);
}

const AGORA_APP_ID = Deno.env.get('AGORA_APP_ID');
const AGORA_APP_CERTIFICATE = Deno.env.get('AGORA_APP_CERTIFICATE');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Agora role constants
const ROLE_PUBLISHER = 1;
const ROLE_SUBSCRIBER = 2;

// Token expiry: 10 minutes for publisher, 60 minutes for subscriber
const PUBLISHER_EXPIRY_SECONDS = 600;
const SUBSCRIBER_EXPIRY_SECONDS = 3600;

interface TokenRequest {
  channelName: string;
  role: 'publisher' | 'subscriber';
  uid?: number;
}

/**
 * Build an Agora RTC token.
 * 
 * This is a simplified token builder. For production, use the official
 * Agora token builder npm package or compile from their Go/Python SDK.
 * 
 * The token format is documented at:
 * https://docs.agora.io/en/video-calling/develop/authentication-workflow
 */
async function buildToken(
  appId: string,
  appCertificate: string,
  channelName: string,
  uid: number,
  role: number,
  privilegeExpiredTs: number
): Promise<string> {
  // Version 006 token format
  const version = '006';
  const _ts = Math.floor(Date.now() / 1000);
  const _salt = Math.floor(Math.random() * 99999999);

  // Build message
  const _message = new Uint8Array(20);
  // Skipping message usage as in original code

  // Build privilege map
  const privileges: Record<number, number> = {};
  privileges[1] = privilegeExpiredTs; // kJoinChannel
  if (role === ROLE_PUBLISHER) {
    privileges[2] = privilegeExpiredTs; // kPublishAudioStream
    privileges[3] = privilegeExpiredTs; // kPublishVideoStream
    privileges[4] = privilegeExpiredTs; // kPublishDataStream
  }

  // Encode privileges
  let privilegesBuf = new Uint8Array(2);
  new DataView(privilegesBuf.buffer).setUint16(0, Object.keys(privileges).length, true);
  for (const [key, value] of Object.entries(privileges)) {
    const item = new Uint8Array(6);
    const view = new DataView(item.buffer);
    view.setUint16(0, Number(key), true);
    view.setUint32(2, value, true);
    const tmp = new Uint8Array(privilegesBuf.length + item.length);
    tmp.set(privilegesBuf, 0);
    tmp.set(item, privilegesBuf.length);
    privilegesBuf = tmp;
  }

  // Sign
  const enc = new TextEncoder();
  const toSign = new Uint8Array([
    ...enc.encode(appId),
    ...enc.encode(channelName),
    ...enc.encode(String(uid)),
    ...privilegesBuf,
  ]);

  const signature = await createHmacSha256(appCertificate, toSign);

  // Compose token
  const content = new Uint8Array([
    ...signature,
    ...enc.encode(appId),
    ...new Uint8Array(4), // ts
    ...new Uint8Array(4), // salt
    ...privilegesBuf,
  ]);

  // Note: This is a simplified builder. For production deployment,
  // use the official agora-token npm package:
  // npm install agora-token
  // import { RtcTokenBuilder, RtcRole } from 'agora-token';
  // 
  // const token = RtcTokenBuilder.buildTokenWithUid(
  //   appId, appCertificate, channelName, uid, role, privilegeExpiredTs
  // );

  return `${version}${btoa(String.fromCharCode(...content))}`;
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

  // Validate Agora config
  if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
    console.error('[agora-token] Missing AGORA_APP_ID or AGORA_APP_CERTIFICATE');
    return new Response(JSON.stringify({ error: 'Agora not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Authenticate user via Supabase JWT
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing auth token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid auth token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check if user is banned
  const { data: ban } = await supabase
    .from('user_bans')
    .select('id')
    .eq('user_id', user.id)
    .or('expires_at.is.null,expires_at.gt.now()')
    .limit(1)
    .single();

  if (ban) {
    return new Response(JSON.stringify({ error: 'User is banned' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse request
  let body: TokenRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { channelName, role, uid } = body;

  if (!channelName || typeof channelName !== 'string') {
    return new Response(JSON.stringify({ error: 'channelName is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (role !== 'publisher' && role !== 'subscriber') {
    return new Response(JSON.stringify({ error: 'role must be publisher or subscriber' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate channel exists in DB (channel = stream_key)
  const { data: stream } = await supabase
    .from('live_streams')
    .select('id, user_id, is_live')
    .eq('stream_key', channelName)
    .single();

  if (!stream) {
    return new Response(JSON.stringify({ error: 'Channel not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Only stream owner can be publisher
  if (role === 'publisher' && stream.user_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Only stream owner can publish' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Generate token
  const agoraRole = role === 'publisher' ? ROLE_PUBLISHER : ROLE_SUBSCRIBER;
  const expiresIn = role === 'publisher' ? PUBLISHER_EXPIRY_SECONDS : SUBSCRIBER_EXPIRY_SECONDS;
  const privilegeExpiredTs = Math.floor(Date.now() / 1000) + expiresIn;
  const tokenUid = uid ?? 0; // 0 = wildcard UID

  const token = await buildToken(
    AGORA_APP_ID,
    AGORA_APP_CERTIFICATE,
    channelName,
    tokenUid,
    agoraRole,
    privilegeExpiredTs
  );

  // Log token issuance
  console.log(`[agora-token] Issued ${role} token for channel=${channelName} user=${user.id} uid=${tokenUid} expires=${expiresIn}s`);

  return new Response(
    JSON.stringify({
      token,
      uid: tokenUid,
      appId: AGORA_APP_ID,
      channel: channelName,
      expiresIn,
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
