import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceRole =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);

type BlockBody = {
  blockedUserId?: string;
  action?: 'block' | 'unblock';
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!supabaseUrl || !supabaseServiceRole) {
    return res.status(500).json({ error: 'Server auth not configured' });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
  if (!token) {
    return res.status(401).json({ error: 'Missing auth token' });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: 'Invalid auth token' });
  }

  const body = (req.body ?? {}) as BlockBody;
  const action = body.action === 'unblock' ? 'unblock' : 'block';
  const blockedUserId = body.blockedUserId?.toString().trim();
  if (!blockedUserId) {
    return res.status(400).json({ error: 'Missing blockedUserId' });
  }
  if (blockedUserId === data.user.id) {
    return res.status(400).json({ error: 'Cannot block yourself' });
  }

  if (action === 'unblock') {
    const del = await supabaseAdmin
      .from('user_blocks')
      .delete()
      .eq('blocker_id', data.user.id)
      .eq('blocked_id', blockedUserId);
    if (del.error) {
      return res.status(500).json({ error: del.error.message });
    }
    return res.status(200).json({ success: true, action });
  }

  const ins = await supabaseAdmin.from('user_blocks').insert({
    blocker_id: data.user.id,
    blocked_id: blockedUserId,
  });
  if (ins.error && ins.error.code !== '23505') {
    return res.status(500).json({ error: ins.error.message });
  }

  return res.status(200).json({ success: true, action });
}
