/**
 * giftService.ts — Production gift sending with client_request_id + ACK
 *
 * Flow (per user spec):
 * 1. Client generates client_request_id (UUID)
 * 2. Client calls Edge Function sendGift(client_request_id, room_id, gift_id)
 * 3. UI shows "sending…"
 * 4. Edge Function validates auth/balance/idempotency, writes confirmed transaction
 * 5. Supabase Realtime delivers gift_transaction INSERT to all subscribers
 * 6. Client considers gift "sent" when:
 *    - Edge Function responds 200 (ACK from server)
 *    - OR Realtime shows the transaction with that client_request_id (fallback)
 */

import { supabase } from './supabase';
import { waitForGiftACK } from './realtimeManager';

// ─── Types ──────────────────────────────────────────────────

export interface SendGiftResult {
  ack: boolean;
  clientRequestId: string;
  transactionId: string | null;
  newBalance: number;
  newLevel: number;
  newXp: number;
  diamondsEarned: number;
}

export type GiftSendStatus = 'idle' | 'sending' | 'confirmed' | 'failed';

// ─── UUID generator ─────────────────────────────────────────

function generateClientRequestId(): string {
  // Use crypto.randomUUID if available, fallback to manual
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── Main send function ─────────────────────────────────────

/**
 * Send a gift with full ACK flow:
 * 1. Generate client_request_id
 * 2. Call Edge Function (or RPC directly)
 * 3. Wait for Realtime ACK (race: HTTP response vs Realtime)
 *
 * @returns SendGiftResult on success, throws on failure
 */
export async function sendGift(
  streamKey: string,
  giftId: string,
  onStatusChange?: (status: GiftSendStatus) => void,
): Promise<SendGiftResult> {
  const clientRequestId = generateClientRequestId();

  onStatusChange?.('sending');

  try {
    // Start listening for Realtime ACK (in parallel with HTTP call)
    const realtimeACK = waitForGiftACK(clientRequestId, 10_000).catch(() => null);

    // Get current session token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('not_authenticated');
    }

    // Call Edge Function (primary ACK path)
    const edgeFnUrl = `${import.meta.env.VITE_SUPABASE_URL || ''}/functions/v1/send-gift`;
    const response = await fetch(edgeFnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        streamKey,
        giftId,
        clientRequestId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      onStatusChange?.('failed');
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    if (data.ack) {
      onStatusChange?.('confirmed');

      // Also wait for Realtime confirmation (non-blocking, just for consistency)
      realtimeACK.then((rtTx) => {
        if (rtTx) {
          console.log('[GiftService] Realtime ACK received for', clientRequestId);
        }
      });

      return {
        ack: true,
        clientRequestId,
        transactionId: data.transactionId ?? null,
        newBalance: data.newBalance ?? 0,
        newLevel: data.newLevel ?? 1,
        newXp: data.newXp ?? 0,
        diamondsEarned: data.diamondsEarned ?? 0,
      };
    }

    // If HTTP succeeded but no ack, fall back to waiting for Realtime
    const rtResult = await realtimeACK;
    if (rtResult) {
      onStatusChange?.('confirmed');
      return {
        ack: true,
        clientRequestId,
        transactionId: rtResult.id,
        newBalance: 0,
        newLevel: 0,
        newXp: 0,
        diamondsEarned: rtResult.diamonds_earned,
      };
    }

    onStatusChange?.('failed');
    throw new Error('no_ack_received');
  } catch (err) {
    onStatusChange?.('failed');
    throw err;
  }
}

/**
 * Fallback: send gift via RPC directly (when Edge Function URL not configured)
 * Still uses client_request_id for idempotency
 */
export async function sendGiftViaRPC(
  streamKey: string,
  giftId: string,
  onStatusChange?: (status: GiftSendStatus) => void,
): Promise<SendGiftResult> {
  const clientRequestId = generateClientRequestId();

  onStatusChange?.('sending');

  try {
    const { data, error } = await supabase.rpc('send_stream_gift', {
      p_stream_key: streamKey,
      p_gift_id: giftId,
      p_client_request_id: clientRequestId,
    });

    if (error) {
      onStatusChange?.('failed');
      throw new Error(error.message);
    }

    const row = Array.isArray(data) ? data[0] : data;

    onStatusChange?.('confirmed');
    return {
      ack: true,
      clientRequestId,
      transactionId: row?.transaction_id ?? null,
      newBalance: row?.new_balance ?? 0,
      newLevel: row?.new_level ?? 1,
      newXp: row?.new_xp ?? 0,
      diamondsEarned: row?.diamonds_earned ?? 0,
    };
  } catch (err) {
    onStatusChange?.('failed');
    throw err;
  }
}
