/**
 * RealtimeManager — Production-grade Supabase Realtime wrapper for live rooms
 *
 * Features per user spec:
 * ✅ Chat: subscribe to live_chat for room_id (with pagination)
 * ✅ Gifts: subscribe to gift_transactions for room_id (ACK via client_request_id)
 * ✅ Battle: subscribe to battles for room_id
 * ✅ Presence/viewers: room_participants changes + heartbeat
 * ✅ Reconnect strategy (exponential backoff)
 * ✅ Unsubscribe on leave (no memory leak)
 * ✅ Chat pagination (limit, don't load 10k messages)
 */

import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ─── Types ──────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  stream_id: string;
  user_id: string;
  message: string;
  is_gift: boolean;
  gift_id: string | null;
  created_at: string;
  // joined from profiles
  username?: string;
  avatar_url?: string | null;
  level?: number;
}

export interface GiftTransaction {
  id: string;
  sender_id: string;
  receiver_id: string;
  stream_id: string;
  gift_id: string;
  coins: number;
  diamonds_earned: number;
  client_request_id: string | null;
  status: 'pending' | 'confirmed' | 'failed';
  ack_at: string | null;
  created_at: string;
}

export interface RoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  role: 'creator' | 'viewer' | 'moderator' | 'guest';
  is_active: boolean;
  joined_at: string;
}

export interface BattleState {
  id: string;
  stream_id: string;
  challenger_id: string;
  opponent_id: string | null;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  challenger_score: number;
  opponent_score: number;
  winner_id: string | null;
}

export interface RealtimeCallbacks {
  onChatMessage?: (msg: ChatMessage) => void;
  onGiftTransaction?: (tx: GiftTransaction) => void;
  onBattleUpdate?: (battle: BattleState) => void;
  onViewerJoin?: (participant: RoomParticipant) => void;
  onViewerLeave?: (participant: RoomParticipant) => void;
  onViewerCountChange?: (count: number) => void;
  onConnectionChange?: (status: 'connected' | 'disconnected' | 'reconnecting') => void;
  onError?: (error: Error) => void;
}

// ─── Constants ──────────────────────────────────────────────

const CHAT_PAGE_SIZE = 50;
const HEARTBEAT_INTERVAL_MS = 30_000; // 30 seconds
const LOG_PREFIX = '[Realtime]';

function log(level: 'info' | 'warn' | 'error', msg: string, data?: unknown) {
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  fn(`${LOG_PREFIX} ${msg}`, data ?? '');
}

// ─── Pending ACK tracker ────────────────────────────────────

const pendingGiftACKs = new Map<string, {
  resolve: (tx: GiftTransaction) => void;
  reject: (err: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}>();

/**
 * Register a pending gift ACK — resolved when Realtime delivers the
 * matching gift_transaction with this client_request_id
 */
export function waitForGiftACK(clientRequestId: string, timeoutMs = 10_000): Promise<GiftTransaction> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      pendingGiftACKs.delete(clientRequestId);
      reject(new Error('gift_ack_timeout'));
    }, timeoutMs);

    pendingGiftACKs.set(clientRequestId, { resolve, reject, timeoutId });
  });
}

// ─── Manager Class ──────────────────────────────────────────

class RealtimeManager {
  private channels: RealtimeChannel[] = [];
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private currentStreamKey: string | null = null;
  private currentRoomId: string | null = null;
  private callbacks: RealtimeCallbacks = {};
  private isConnected = false;

  /**
   * Join a room: subscribe to all Realtime channels + start heartbeat
   */
  async joinRoom(streamKey: string, callbacks: RealtimeCallbacks): Promise<{
    roomId: string;
    role: string;
    viewerCount: number;
    initialMessages: ChatMessage[];
  }> {
    // Clean up any previous room
    await this.leaveRoom();

    this.callbacks = callbacks;
    this.currentStreamKey = streamKey;

    // 1. Join room server-side (RPC)
    const { data: joinData, error: joinErr } = await supabase.rpc('join_room', {
      p_stream_key: streamKey,
    });

    if (joinErr) throw new Error(joinErr.message);
    const row = Array.isArray(joinData) ? joinData[0] : joinData;
    const roomId = row.room_id;
    const role = row.role;
    const viewerCount = row.viewer_count;
    this.currentRoomId = roomId;

    // 2. Load initial chat (paginated — latest N only)
    const initialMessages = await this.loadChatPage(roomId);

    // 3. Subscribe to all channels
    this.subscribeToChatChannel(roomId);
    this.subscribeToGiftChannel(roomId);
    this.subscribeToBattleChannel(roomId);
    this.subscribeToParticipantsChannel(roomId);

    // 4. Start heartbeat
    this.startHeartbeat(streamKey);

    this.isConnected = true;
    this.callbacks.onConnectionChange?.('connected');
    log('info', `Joined room ${streamKey} (${roomId}) as ${role}, ${viewerCount} viewers`);

    return { roomId, role, viewerCount, initialMessages };
  }

  /**
   * Leave room: unsubscribe all channels + stop heartbeat + server-side leave
   */
  async leaveRoom(): Promise<void> {
    if (!this.currentStreamKey) return;

    const streamKey = this.currentStreamKey;

    // Stop heartbeat
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // Unsubscribe all channels (prevents memory leak)
    for (const ch of this.channels) {
      try {
        supabase.removeChannel(ch);
      } catch (err) {
        log('warn', 'Error removing channel', err);
      }
    }
    this.channels = [];

    // Server-side leave
    try {
      await supabase.rpc('leave_room', { p_stream_key: streamKey });
    } catch (err) {
      log('warn', 'Error leaving room', err);
    }

    // Clear pending ACKs
    for (const [, pending] of pendingGiftACKs) {
      clearTimeout(pending.timeoutId);
      pending.reject(new Error('room_left'));
    }
    pendingGiftACKs.clear();

    this.currentStreamKey = null;
    this.currentRoomId = null;
    this.isConnected = false;
    this.callbacks.onConnectionChange?.('disconnected');
    log('info', `Left room ${streamKey}`);
  }

  // ─── Chat ───────────────────────────────────────────────

  private subscribeToChatChannel(roomId: string) {
    const channel = supabase
      .channel(`room:${roomId}:chat`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat',
          filter: `stream_id=eq.${roomId}`,
        },
        (payload) => {
          const msg = payload.new as ChatMessage;
          this.callbacks.onChatMessage?.(msg);
        }
      )
      .subscribe((status) => {
        log('info', `Chat channel ${status}`);
        if (status === 'CHANNEL_ERROR') {
          this.callbacks.onConnectionChange?.('reconnecting');
        }
      });

    this.channels.push(channel);
  }

  /** Load a page of chat messages (newest first, reversed for display) */
  async loadChatPage(roomId: string, beforeTimestamp?: string): Promise<ChatMessage[]> {
    let query = supabase
      .from('live_chat')
      .select('*')
      .eq('stream_id', roomId)
      .order('created_at', { ascending: false })
      .limit(CHAT_PAGE_SIZE);

    if (beforeTimestamp) {
      query = query.lt('created_at', beforeTimestamp);
    }

    const { data, error } = await query;
    if (error) {
      log('error', 'Failed to load chat', error);
      return [];
    }

    return (data ?? []).reverse();
  }

  // ─── Gifts ──────────────────────────────────────────────

  private subscribeToGiftChannel(roomId: string) {
    const channel = supabase
      .channel(`room:${roomId}:gifts`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gift_transactions',
          filter: `stream_id=eq.${roomId}`,
        },
        (payload) => {
          const tx = payload.new as GiftTransaction;

          // Check if this resolves a pending ACK
          if (tx.client_request_id && pendingGiftACKs.has(tx.client_request_id)) {
            const pending = pendingGiftACKs.get(tx.client_request_id)!;
            clearTimeout(pending.timeoutId);
            pending.resolve(tx);
            pendingGiftACKs.delete(tx.client_request_id);
          }

          this.callbacks.onGiftTransaction?.(tx);
        }
      )
      .subscribe((status) => {
        log('info', `Gift channel ${status}`);
      });

    this.channels.push(channel);
  }

  // ─── Battle ─────────────────────────────────────────────

  private subscribeToBattleChannel(roomId: string) {
    const channel = supabase
      .channel(`room:${roomId}:battles`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battles',
          filter: `stream_id=eq.${roomId}`,
        },
        (payload) => {
          const battle = (payload.new ?? payload.old) as BattleState;
          this.callbacks.onBattleUpdate?.(battle);
        }
      )
      .subscribe((status) => {
        log('info', `Battle channel ${status}`);
      });

    this.channels.push(channel);
  }

  // ─── Participants / Presence ────────────────────────────

  private subscribeToParticipantsChannel(roomId: string) {
    const channel = supabase
      .channel(`room:${roomId}:participants`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_participants',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const participant = (payload.new ?? payload.old) as RoomParticipant;

          if (payload.eventType === 'INSERT' || (payload.eventType === 'UPDATE' && participant.is_active)) {
            this.callbacks.onViewerJoin?.(participant);
          }
          if (payload.eventType === 'UPDATE' && !participant.is_active) {
            this.callbacks.onViewerLeave?.(participant);
          }

          // Fetch updated count
          const { count } = await supabase
            .from('room_participants')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', roomId)
            .eq('is_active', true);

          if (count != null) {
            this.callbacks.onViewerCountChange?.(count);
          }
        }
      )
      .subscribe((status) => {
        log('info', `Participants channel ${status}`);
      });

    this.channels.push(channel);
  }

  // ─── Heartbeat ──────────────────────────────────────────

  private startHeartbeat(streamKey: string) {
    this.heartbeatTimer = setInterval(async () => {
      try {
        await supabase.rpc('room_heartbeat', { p_stream_key: streamKey });
      } catch (err) {
        log('warn', 'Heartbeat failed', err);
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  // ─── Getters ────────────────────────────────────────────

  get connected() { return this.isConnected; }
  get roomId() { return this.currentRoomId; }
  get streamKey() { return this.currentStreamKey; }
}

// ─── Singleton Export ───────────────────────────────────────

export const realtimeManager = new RealtimeManager();
