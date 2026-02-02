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
    face_ar_crown: { icon: '/Icons/Gift%20icon.png?v=3', video: '/gifts/Zeus.webm' },
    face_ar_glasses: { icon: '/Icons/Gift%20icon.png?v=3', video: '/gifts/Frostwing Ascendant.webm' },
    face_ar_hearts: { icon: '/Icons/Gift%20icon.png?v=3', video: '/gifts/Elix Thunder God Rage.webm' },
    face_ar_mask: { icon: '/Icons/Gift%20icon.png?v=3', video: '/gifts/Hunted Castel.webm' },
    face_ar_ears: { icon: '/Icons/Gift%20icon.png?v=3', video: '/gifts/majestic_ice_blue_mythic_bird_in_flight.webm' },
    face_ar_stars: { icon: '/Icons/Gift%20icon.png?v=3', video: '/gifts/Zeus.webm' },
  };

  return rows
    .filter((r) => r.is_active)
    .map((row) => {
      const fallback = faceArFallback[row.gift_id];
      const animation = row.animation_url ?? (fallback ? fallback.video : null);
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
