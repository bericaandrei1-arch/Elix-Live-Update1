import { supabase } from './supabase';

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

export const GIFTS: GiftUiItem[] = [ 
   // --- Small Gifts (Static) --- 
   { 
     id: 's_diamond', 
     name: 'Blue Diamond', 
     coins: 300, 
     giftType: 'small', 
     isActive: true,
     icon: '/gifts/crystal_rhino.png', 
     video: '/gifts/crystal_rhino.png', 
     preview: '/gifts/crystal_rhino.png',
   }, 
   { 
     id: 's_crown', 
     name: 'King Crown', 
     coins: 1500, 
     giftType: 'small', 
     isActive: true,
     icon: '/gifts/crown_kitty_treasure.png', 
     video: '/gifts/crown_kitty_treasure.png', 
     preview: '/gifts/crown_kitty_treasure.png',
   }, 
   { 
     id: 's_panda', 
     name: 'Cute Panda', 
     coins: 10, 
     giftType: 'small', 
     isActive: true, 
     icon: 'https://cdn-icons-png.flaticon.com/512/3069/3069172.png', 
     video: 'https://cdn-icons-png.flaticon.com/512/3069/3069172.png', 
     preview: 'https://cdn-icons-png.flaticon.com/512/3069/3069172.png', 
   }, 
   { 
     id: 's_butterfly', 
     name: 'Blue Butterfly', 
     coins: 25, 
     giftType: 'small', 
     isActive: true, 
     icon: 'https://cdn-icons-png.flaticon.com/512/2979/2979563.png', 
     video: 'https://cdn-icons-png.flaticon.com/512/2979/2979563.png', 
     preview: 'https://cdn-icons-png.flaticon.com/512/2979/2979563.png', 
   }, 
   { 
     id: 's_cat', 
     name: 'Happy Cat', 
     coins: 50, 
     giftType: 'small', 
     isActive: true, 
     icon: 'https://cdn-icons-png.flaticon.com/512/616/616430.png', 
     video: 'https://cdn-icons-png.flaticon.com/512/616/616430.png', 
     preview: 'https://cdn-icons-png.flaticon.com/512/616/616430.png', 
   }, 
   { 
     id: 's_dog', 
     name: 'Puppy Love', 
     coins: 100, 
     giftType: 'small', 
     isActive: true, 
     icon: 'https://cdn-icons-png.flaticon.com/512/194/194279.png', 
     video: 'https://cdn-icons-png.flaticon.com/512/194/194279.png', 
     preview: 'https://cdn-icons-png.flaticon.com/512/194/194279.png', 
   }, 
   { 
     id: 's_sun', 
     name: 'Sunny Day', 
     coins: 250, 
     giftType: 'small', 
     isActive: true, 
     icon: 'https://cdn-icons-png.flaticon.com/512/869/869869.png', 
     video: 'https://cdn-icons-png.flaticon.com/512/869/869869.png', 
     preview: 'https://cdn-icons-png.flaticon.com/512/869/869869.png', 
   }, 
   { 
     id: 's_rainbow', 
     name: 'Rainbow', 
     coins: 500, 
     giftType: 'small', 
     isActive: true, 
     icon: 'https://cdn-icons-png.flaticon.com/512/265/265674.png', 
     video: 'https://cdn-icons-png.flaticon.com/512/265/265674.png', 
     preview: 'https://cdn-icons-png.flaticon.com/512/265/265674.png', 
   }, 
   { 
     id: 's_unicorn', 
     name: 'Mini Unicorn', 
     coins: 1000, 
     giftType: 'small', 
     isActive: true, 
     icon: 'https://cdn-icons-png.flaticon.com/512/3468/3468081.png', 
     video: 'https://cdn-icons-png.flaticon.com/512/3468/3468081.png', 
     preview: 'https://cdn-icons-png.flaticon.com/512/3468/3468081.png', 
   }, 
  
   // --- Video Gifts (Auto-generated from public/gifts) --- 
   { 
     id: 'global_universe', 
     name: 'Global Universe', 
     coins: 1000000, 
     giftType: 'universe', 
     isActive: true, 
     icon: '/gifts/elix_global_universe.png', 
     video: '/gifts/elix_global_universe.webm', 
     preview: '/gifts/elix_global_universe.png', 
   }, 
   { 
     id: 'rex_dino', 
     name: 'T-Rex', 
     coins: 12000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/rex_dinosaur.png', 
     video: '/gifts/rex_dinosaur.mp4', 
     preview: '/gifts/rex_dinosaur.png', 
   }, 
   { 
     id: 'treasure_chest', 
     name: 'Treasure Chest', 
     coins: 15000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/a_gleaming_treasure_chest_in_a_cave.png', 
     video: '/gifts/a_gleaming_treasure_chest_in_a_cave.mp4', 
     preview: '/gifts/a_gleaming_treasure_chest_in_a_cave.png', 
   }, 
   { 
     id: 'war_bird', 
     name: 'War Bird', 
     coins: 15000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/fantasy_celestial_war_bird.png', 
     video: '/gifts/fantasy_celestial_war_bird.mp4', 
     preview: '/gifts/fantasy_celestial_war_bird.png', 
   }, 
   { 
     id: 'kitty_treasure', 
     name: 'Kitty Treasure', 
     coins: 17000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/crown_kitty_treasure.png', 
     video: '/gifts/crown_kitty_treasure.mp4', 
     preview: '/gifts/crown_kitty_treasure.png', 
   }, 
   { 
     id: 'frost_wolf', 
     name: 'Frost Wolf', 
     coins: 18000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/frost_wolf.png', 
     video: '/gifts/frost_wolf.mp4', 
     preview: '/gifts/frost_wolf.png', 
   }, 
   { 
     id: 'voyager_ship', 
     name: 'Voyager Ship', 
     coins: 19000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/crystal_voyager_ship.png', 
     video: '/gifts/crystal_voyager_ship.mp4', 
     preview: '/gifts/crystal_voyager_ship.png', 
   }, 
   { 
     id: 'fiery_lion', 
     name: 'Fiery Lion', 
     coins: 21000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/fiery_lion_in_blazing_glory.png', 
     video: '/gifts/fiery_lion_in_blazing_glory.mp4', 
     preview: '/gifts/fiery_lion_in_blazing_glory.png', 
   }, 
   { 
     id: 'night_panther', 
     name: 'Night Panther', 
     coins: 22000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/night_panther.png', 
     video: '/gifts/night_panther.mp4', 
     preview: '/gifts/night_panther.png', 
   }, 
   { 
     id: 'titan_gorilla', 
     name: 'Titan Gorilla', 
     coins: 23000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/earth_titan_gorilla.png', 
     video: '/gifts/earth_titan_gorilla.mp4', 
     preview: '/gifts/earth_titan_gorilla.png', 
   }, 
   { 
     id: 'misty_wolf', 
     name: 'Misty Wolf', 
     coins: 25000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/ferocious_wolf_in_misty_terrain.png', 
     video: '/gifts/ferocious_wolf_in_misty_terrain.mp4', 
     preview: '/gifts/ferocious_wolf_in_misty_terrain.png', 
   }, 
   { 
     id: 'cosmic_panther', 
     name: 'Cosmic Panther', 
     coins: 26000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/cosmic_panther.png', 
     video: '/gifts/cosmic_panther.mp4', 
     preview: '/gifts/cosmic_panther.png', 
   }, 
   { 
     id: 'star_wand', 
     name: 'Star Wand', 
     coins: 28000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/celestial_star_wand.png', 
     video: '/gifts/celestial_star_wand.mp4', 
     preview: '/gifts/celestial_star_wand.png', 
   }, 
   { 
     id: 'beast_relic', 
     name: 'Beast Relic', 
     coins: 31000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/beast_relic_of_the_ancients.png', 
     video: '/gifts/beast_relic_of_the_ancients.webm', 
     preview: '/gifts/beast_relic_of_the_ancients.png', 
   }, 
   { 
     id: 'crystal_rhino', 
     name: 'Crystal Rhino', 
     coins: 32000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/crystal_rhino.png', 
     video: '/gifts/crystal_rhino.mp4', 
     preview: '/gifts/crystal_rhino.png', 
   }, 
   { 
     id: 'storm_phoenix', 
     name: 'Storm Phoenix', 
     coins: 34000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/arcane_storm_phoenix.png', 
     video: '/gifts/arcane_storm_phoenix.mp4', 
     preview: '/gifts/arcane_storm_phoenix.png', 
   }, 
   { 
     id: 'ice_sorceress', 
     name: 'Ice Sorceress', 
     coins: 37000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/elix_ice_sorceress.png', 
     video: '/gifts/elix_ice_sorceress.mp4', 
     preview: '/gifts/elix_ice_sorceress.png', 
   }, 
   { 
     id: 'fire_phoenix', 
     name: 'Fire Phoenix', 
     coins: 38000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/fire_phoenix.png', 
     video: '/gifts/fire_phoenix.mp4', 
     preview: '/gifts/fire_phoenix.png', 
   }, 
   { 
     id: 'lavarok', 
     name: 'Lavarok', 
     coins: 40000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/lavarok.png', 
     video: '/gifts/lavarok.mp4', 
     preview: '/gifts/lavarok.png', 
   }, 
   { 
     id: 'blazing_wizard', 
     name: 'Blazing Wizard', 
     coins: 42000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/fiery_power_of_the_blazing_wizard.png', 
     video: '/gifts/fiery_power_of_the_blazing_wizard.mp4', 
     preview: '/gifts/fiery_power_of_the_blazing_wizard.png', 
   }, 
   { 
     id: 'aelyra_flameveil', 
     name: 'Aelyra Flameveil', 
     coins: 45000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/aelyra_flameveil.png', 
     video: '/gifts/aelyra_flameveil.mp4', 
     preview: '/gifts/aelyra_flameveil.png', 
   }, 
   { 
     id: 'golden_lion', 
     name: 'Golden Lion', 
     coins: 46000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/golden_rage_lion.png', 
     video: '/gifts/golden_rage_lion.mp4', 
     preview: '/gifts/golden_rage_lion.png', 
   }, 
   { 
     id: 'dragon_egg', 
     name: 'Dragon Egg', 
     coins: 49000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/ember_dragon_egg.png', 
     video: '/gifts/ember_dragon_egg.mp4', 
     preview: '/gifts/ember_dragon_egg.png', 
   }, 
   { 
     id: 'lava_demon', 
     name: 'Lava Demon', 
     coins: 52000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/lava_demon.png', 
     video: '/gifts/lava_demon.mp4', 
     preview: '/gifts/lava_demon.png', 
   }, 
   { 
     id: 'flames_royalty', 
     name: 'Flames Royalty', 
     coins: 55000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/flames_and_royalty_on_fiery_ground.png', 
     video: '/gifts/flames_and_royalty_on_fiery_ground.mp4', 
     preview: '/gifts/flames_and_royalty_on_fiery_ground.png', 
   }, 
   { 
     id: 'fire_unicorn', 
     name: 'Fire Unicorn', 
     coins: 55000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/mythic_fire_unicorn.png', 
     video: '/gifts/mythic_fire_unicorn.mp4', 
     preview: '/gifts/mythic_fire_unicorn.png', 
   }, 
   { 
     id: 'thunder_falcon', 
     name: 'Thunder Falcon', 
     coins: 58000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/elix_thunder_falcon.png', 
     video: '/gifts/elix_thunder_falcon.mp4', 
     preview: '/gifts/elix_thunder_falcon.png', 
   }, 
   { 
     id: 'infernal_lion', 
     name: 'Infernal Lion', 
     coins: 60000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/infernal_lion_king.png', 
     video: '/gifts/infernal_lion_king.mp4', 
     preview: '/gifts/infernal_lion_king.png', 
   }, 
   { 
     id: 'fantasy_unicorn', 
     name: 'Fantasy Unicorn', 
     coins: 61000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/fantasy_unicorn.png', 
     video: '/gifts/fantasy_unicorn.mp4', 
     preview: '/gifts/fantasy_unicorn.png', 
   }, 
   { 
     id: 'sky_guardian', 
     name: 'Sky Guardian', 
     coins: 64000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/eternal_guardian.png', 
     video: '/gifts/eternal_guardian.mp4', 
     preview: '/gifts/eternal_guardian.png', 
   }, 
   { 
     id: 'majestic_bird', 
     name: 'Majestic Bird', 
     coins: 65000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/majestic_ice_blue_mythic_bird.png', 
     video: '/gifts/majestic_ice_blue_mythic_bird.mp4', 
     preview: '/gifts/majestic_ice_blue_mythic_bird.png', 
   }, 
   { 
     id: 'flame_king', 
     name: 'The Flame King', 
     coins: 65000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/the_flame_king.png', 
     video: '/gifts/the_flame_king.mp4', 
     preview: '/gifts/the_flame_king.png', 
   }, 
   { 
     id: 'majestic_phoenix', 
     name: 'Majestic Phoenix', 
     coins: 70000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/majestic_phoenix_soaring_in_flames.png', 
     video: '/gifts/majestic_phoenix_soaring_in_flames.mp4', 
     preview: '/gifts/majestic_phoenix_soaring_in_flames.png', 
   }, 
   { 
     id: 'molten_fury', 
     name: 'Molten Fury', 
     coins: 75000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/molten_fury_of_the_lava_dragon.png', 
     video: '/gifts/molten_fury_of_the_lava_dragon.mp4', 
     preview: '/gifts/molten_fury_of_the_lava_dragon.png', 
   }, 
   { 
     id: 'universe', 
     name: 'Universe', 
     coins: 80000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/elix_live_universe.png', 
     video: '/gifts/elix_live_universe.webm', 
     preview: '/gifts/elix_live_universe.png', 
   }, 
   { 
     id: 'lava_rampage', 
     name: 'Lava Rampage', 
     coins: 80000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/rampage_of_the_lava_beast.png', 
     video: '/gifts/rampage_of_the_lava_beast.mp4', 
     preview: '/gifts/rampage_of_the_lava_beast.png', 
   }, 
   { 
     id: 'guardian_chest', 
     name: 'Guardian Chest', 
     coins: 85000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/legendary_guardians_of_treasure_chest.png', 
     video: '/gifts/legendary_guardians_of_treasure_chest.mp4', 
     preview: '/gifts/legendary_guardians_of_treasure_chest.png', 
   }, 
   { 
     id: 'storm_warrior', 
     name: 'Storm Warrior', 
     coins: 85000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/storm_warrior_in_electric_fury.png', 
     video: '/gifts/storm_warrior_in_electric_fury.mp4', 
     preview: '/gifts/storm_warrior_in_electric_fury.png', 
   }, 
   { 
     id: 'pink_jet', 
     name: 'Pink Love Jet', 
     coins: 88000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/pink_love_jet.png', 
     video: '/gifts/pink_love_jet.mp4', 
     preview: '/gifts/pink_love_jet.png', 
   }, 
   { 
     id: 'frost_lion', 
     name: 'Frost Lion', 
     coins: 90000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/froststorm_lion.png', 
     video: '/gifts/froststorm_lion.mp4', 
     preview: '/gifts/froststorm_lion.png', 
   }, 
   { 
     id: 'night_owl', 
     name: 'Night Owl', 
     coins: 90000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/stormborn_night_owl.png', 
     video: '/gifts/stormborn_night_owl.mp4', 
     preview: '/gifts/stormborn_night_owl.png', 
   }, 
   { 
     id: 'drake_cub', 
     name: 'Drake Cub', 
     coins: 95000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/treasure_drake_cub.png', 
     video: '/gifts/treasure_drake_cub.mp4', 
     preview: '/gifts/treasure_drake_cub.png', 
   }, 
   { 
     id: 'romantic_jet', 
     name: 'Romantic Jet', 
     coins: 99000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/romantic_jet.png', 
     video: '/gifts/romantic_jet.mp4', 
     preview: '/gifts/romantic_jet.png', 
   }, 
   { 
     id: 'guardian_vault', 
     name: 'Guardian Vault', 
     coins: 100000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/mythic_beast_vault_phoenix_lion_dragon_bear_wolf.png', 
     video: '/gifts/mythic_beast_vault_phoenix_lion_dragon_bear_wolf.mp4', 
     preview: '/gifts/mythic_beast_vault_phoenix_lion_dragon_bear_wolf.png', 
   }, 
   { 
     id: 'elix_gold_universe', 
     name: 'Gold Universe', 
     coins: 120000, 
     giftType: 'big', 
     isActive: true, 
     icon: '/gifts/elix_gold_universe.png', 
     video: '/gifts/elix_gold_universe.webm', 
     preview: '/gifts/elix_gold_universe.png', 
   }, 
 ];

export async function fetchGiftPriceMap(): Promise<Map<string, number>> {
  // Use GIFTS constant instead of fetching from DB for now to simplify
  const map = new Map<string, number>();
  for (const gift of GIFTS) {
    map.set(gift.id, gift.coins);
  }
  return map;
}

const normalizeBase = (base: string) => base.replace(/\/+$/, '');

export function resolveGiftAssetUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
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

           // Fix for broken elixlive.co.uk URLs: return relative path for Supabase storage
           if (isUrl && url.includes('elixlive.co.uk')) {
               return `gifts/${newFilename}`;
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
