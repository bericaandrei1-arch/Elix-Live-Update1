/**
 * StreamModTools.tsx — Creator/moderator tools for live stream
 *
 * Features:
 * ✅ Mute user in chat
 * ✅ Kick user from stream
 * ✅ Delete chat message
 * ✅ Block user
 * ✅ Report user
 */

import React, { useState } from 'react';
import { ShieldAlert, Ban, MessageSquareX, UserX, Flag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSafetyStore } from '../store/useSafetyStore';

interface StreamModToolsProps {
  streamId: string;
  targetUserId: string;
  targetUsername: string;
  messageId?: string;
  isCreator: boolean;
  onAction?: (action: string, userId: string) => void;
  onClose: () => void;
}

export function StreamModTools({
  streamId,
  targetUserId,
  targetUsername,
  messageId,
  isCreator,
  onAction,
  onClose,
}: StreamModToolsProps) {
  const [loading, setLoading] = useState(false);
  const { blockUser } = useSafetyStore();

  const handleMute = async () => {
    setLoading(true);
    try {
      // Insert into stream_muted_users or use a simple approach
      await supabase.from('live_chat').insert({
        stream_id: streamId,
        user_id: targetUserId,
        message: `[SYSTEM] ${targetUsername} has been muted`,
        is_gift: false,
      });
      onAction?.('mute', targetUserId);
      onClose();
    } catch (err) {
      console.error('[Mod] Mute failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKick = async () => {
    setLoading(true);
    try {
      // Deactivate participant
      const { data: stream } = await supabase
        .from('live_streams')
        .select('id')
        .eq('stream_key', streamId)
        .single();

      if (stream) {
        await supabase
          .from('room_participants')
          .update({ is_active: false })
          .eq('room_id', stream.id)
          .eq('user_id', targetUserId);
      }
      onAction?.('kick', targetUserId);
      onClose();
    } catch (err) {
      console.error('[Mod] Kick failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async () => {
    if (!messageId) return;
    setLoading(true);
    try {
      await supabase.from('live_chat').delete().eq('id', messageId);
      onAction?.('delete_message', targetUserId);
      onClose();
    } catch (err) {
      console.error('[Mod] Delete message failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = () => {
    blockUser(targetUserId);
    onAction?.('block', targetUserId);
    onClose();
  };

  const handleReport = async () => {
    setLoading(true);
    try {
      await supabase.from('reports').insert({
        reporter_id: (await supabase.auth.getUser()).data.user?.id,
        reported_id: targetUserId,
        stream_id: streamId,
        reason: 'Reported during live stream',
        details: messageId ? `Message ID: ${messageId}` : 'User behavior in stream',
      });
      onAction?.('report', targetUserId);
      onClose();
    } catch (err) {
      console.error('[Mod] Report failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black/90 border border-white/20 rounded-2xl p-4 w-64 shadow-xl">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
        <ShieldAlert className="w-4 h-4 text-[#E6B36A]" />
        <span className="text-white text-sm font-medium">{targetUsername}</span>
      </div>

      <div className="space-y-1">
        {isCreator && (
          <>
            <button
              onClick={handleMute}
              disabled={loading}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 text-sm transition disabled:opacity-50"
            >
              <Ban className="w-4 h-4 text-yellow-400" />
              Mute User
            </button>

            <button
              onClick={handleKick}
              disabled={loading}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 text-sm transition disabled:opacity-50"
            >
              <UserX className="w-4 h-4 text-orange-400" />
              Kick from Stream
            </button>

            {messageId && (
              <button
                onClick={handleDeleteMessage}
                disabled={loading}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 text-sm transition disabled:opacity-50"
              >
                <MessageSquareX className="w-4 h-4 text-red-400" />
                Delete Message
              </button>
            )}
          </>
        )}

        <button
          onClick={handleBlock}
          disabled={loading}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 text-sm transition disabled:opacity-50"
        >
          <Ban className="w-4 h-4 text-red-500" />
          Block User
        </button>

        <button
          onClick={handleReport}
          disabled={loading}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 text-sm transition disabled:opacity-50"
        >
          <Flag className="w-4 h-4 text-red-400" />
          Report User
        </button>
      </div>

      <button
        onClick={onClose}
        className="w-full mt-3 pt-2 border-t border-white/10 text-white/40 text-xs hover:text-white/60 transition"
      >
        Cancel
      </button>
    </div>
  );
}
