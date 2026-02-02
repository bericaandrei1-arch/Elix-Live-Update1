import { supabase } from './supabase';

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase env. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Selected file is not an image.');
  }

  const maxBytes = 8 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error('Image is too large (max 8MB).');
  }

  const nameParts = file.name.split('.');
  const ext = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'png';
  const objectPath = `${userId}/${Date.now()}.${ext}`;
  const bucket = 'avatars';

  const { error: uploadError } = await supabase.storage.from(bucket).upload(objectPath, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: '3600'
  });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  const publicUrl = data?.publicUrl;

  if (!publicUrl) {
    throw new Error('Failed to get public URL for uploaded image.');
  }

  return publicUrl;
}

