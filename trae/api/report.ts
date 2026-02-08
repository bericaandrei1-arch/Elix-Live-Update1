import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from './rate-limit';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);

type ReportBody = {
  targetType?: 'video' | 'comment' | 'user' | string;
  targetId?: string;
  reason?: string;
  details?: string;
  contextVideoId?: string;
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

  // Rate limit: max 10 reports per hour
  const rateCheck = checkRateLimit(data.user.id, 'report:create');
  if (!rateCheck.allowed) {
    return res.status(429).json({ error: 'Too many reports', retryAfter: rateCheck.retryAfter });
  }

  const body = (req.body ?? {}) as ReportBody;
  const targetType = body.targetType?.toString().trim();
  const targetId = body.targetId?.toString().trim();
  const reason = body.reason?.toString().trim();
  const details = body.details?.toString().trim() || null;
  const contextVideoId = body.contextVideoId?.toString().trim() || null;

  if (!targetType || !targetId || !reason) {
    return res.status(400).json({ error: 'Missing report fields' });
  }

  const insert = await supabaseAdmin.from('reports').insert({
    reporter_id: data.user.id,
    target_type: targetType,
    target_id: targetId,
    reason,
    details,
    context_video_id: contextVideoId,
  });

  if (insert.error) {
    return res.status(500).json({ error: insert.error.message });
  }

  return res.status(200).json({ success: true });
}

