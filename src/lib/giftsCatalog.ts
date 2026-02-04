import { supabase } from './supabase';
import { useRealApi } from './apiFallback';

export type GiftCatalogRow = {
  gift_id: string;
  name: string;
  gift_type: 'universe' | 'big' | 'small';
  coin_cost: number;
  animation_url: string | null;
  sfx_url: string | null;
  is_active: boolean;
};

export type GiftUiItem = {
  id: string;
  name: string;
  coins: number;
  giftType: 'universe' | 'big' | 'small';
  isActive: boolean;
  icon: string;
  video: string;
  preview: string;
};

export async function fetchGiftCatalog(): Promise<GiftCatalogRow[]> {
  if (!useRealApi) return [];

  const { data, error } = await supabase
    .from('gifts_catalog')
    .select('gift_id,name,gift_type,coin_cost,animation_url,sfx_url,is_active')
    .eq('is_active', true);

  if (error) throw error;
  return (data ?? []) as GiftCatalogRow[];
}

export async function fetchGiftPriceMap(): Promise<Map<string, number>> {
  const rows = await fetchGiftCatalog();
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.gift_id, row.coin_cost);
  }
  return map;
}

const normalizeBase = (base: string) => base.replace(/\/+$/, '');

export function resolveGiftAssetUrl(path: string): string {
  const giftsBase = import.meta.env.VITE_GIFT_ASSET_BASE_URL as string | undefined;
  if (!giftsBase) return path;
  const base = normalizeBase(giftsBase);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export function buildGiftUiItemsFromCatalog(rows: GiftCatalogRow[]): GiftUiItem[] {
  const faceArFallback: Record<string, { icon: string; video: string }> = {
    face_ar_crown: { icon: '/Icons/Gift%20icon.png?v=3', video: '/gifts/elix_global_universe.webm' },
    face_ar_glasses: { icon: '/Icons/Gift%20icon.png?v=3', video: '/gifts/elix_live_universe.webm' },
    face_ar_hearts: { icon: '/Icons/Gift%20icon.png?v=3', video: '/gifts/elix_gold_universe.webm' },
    face_ar_mask: { icon: '/Icons/Gift%20icon.png?v=3', video: '/gifts/beast_relic_of_the_ancients.webm' },
    face_ar_ears: { icon: '/Icons/Gift%20icon.png?v=3', video: '/gifts/elix_live_universe.webm' },
    face_ar_stars: { icon: '/Icons/Gift%20icon.png?v=3', video: '/gifts/elix_global_universe.webm' },
  };

  const sanitizeGiftUrl = (url: string | null): string | null => {
      if (!url) return null;
      // If it's a full URL, we might need to be careful, but if it's a relative path or just filename:
      // We want to convert "Golden Rage Lion.mp4" -> "golden_rage_lion.mp4"
      // But we must preserve the path structure if it exists.
      
      try {
          // Check if it's a full URL
          const isUrl = url.startsWith('http');
          const pathPart = isUrl ? new URL(url).pathname : url;
          const filename = pathPart.split('/').pop() || '';
          
          if (!filename) return url;
          
          // Create safe filename: lowercase, replace non-alphanum with underscore
          // (Same logic as our rename script)
          let newFilename = filename.toLowerCase()
            .replace(/%20/g, '_') // Handle encoded spaces
            .replace(/\s+/g, '_') // Handle real spaces
            .replace(/[^a-z0-9.]/g, '_') // Replace special chars (except dot) with underscore
            .replace(/_+/g, '_')
            .replace(/_\./g, '.'); // Fix _.extension
            
           // Remove leading/trailing underscores from name part (before extension)
           const parts = newFilename.split('.');
           if (parts.length > 1) {
               const ext = parts.pop();
               const name = parts.join('.').replace(/^_/, '').replace(/_$/, '');
               newFilename = `${name}.${ext}`;
           }

           return url.replace(filename, newFilename).replace(/%20/g, '_').replace(/ /g, '_'); // Brute force replace in URL too just in case
      } catch {
          return url;
      }
  };

  return rows
    .filter((r) => r.is_active)
    .map((row) => {
      const fallback = faceArFallback[row.gift_id];
      // Sanitize the animation URL from DB
      const dbAnimation = sanitizeGiftUrl(row.animation_url);
      
      const animation = dbAnimation ?? (fallback ? fallback.video : null);
      const icon = fallback?.icon ?? (animation ? resolveGiftAssetUrl(animation) : '/Icons/Gift%20icon.png?v=3');
      const video = animation ? resolveGiftAssetUrl(animation) : icon;

      return {
        id: row.gift_id,
        name: row.name,
        coins: row.coin_cost,
        giftType: row.gift_type,
        isActive: row.is_active,
        icon,
        video,
        preview: icon,
      };
    });
}
