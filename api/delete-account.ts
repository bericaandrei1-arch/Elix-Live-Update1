import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from './rate-limit';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);

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

  // Rate limit: prevent abuse
  const rateCheck = checkRateLimit(data.user.id, 'auth:signup');
  if (!rateCheck.allowed) {
    return res.status(429).json({ error: 'Too many requests', retryAfter: rateCheck.retryAfter });
  }

  const userId = data.user.id;
  const del = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (del.error) {
    return res.status(500).json({ error: del.error.message });
  }

  return res.status(200).json({ success: true });
}
