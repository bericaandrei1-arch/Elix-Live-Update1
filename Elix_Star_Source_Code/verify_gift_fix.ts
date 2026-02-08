
import { buildGiftUiItemsFromCatalog, GiftCatalogRow } from './src/lib/giftsCatalog';

// Mock the environment variable
process.env.VITE_GIFT_ASSET_BASE_URL = '/';

// Mock the input data (what comes from the DB)
const mockDbRows: GiftCatalogRow[] = [
  {
    gift_id: 'golden_lion',
    name: 'Golden Lion',
    gift_type: 'big',
    coin_cost: 46000,
    animation_url: 'https://www.elixlive.co.uk/gifts/Golden%20Rage%20Lion.mp4',
    sfx_url: null,
    is_active: true
  },
  {
    gift_id: 'treasure_chest',
    name: 'Treasure Chest',
    gift_type: 'big',
    coin_cost: 15000,
    animation_url: '/gifts/Legendary guardians of treasure chest .mp4', // Tricky one with spaces and dot
    sfx_url: null,
    is_active: true
  }
];

// Run the function
const result = buildGiftUiItemsFromCatalog(mockDbRows);

console.log('--- Verification Results ---');
result.forEach(item => {
    console.log(`\nGift: ${item.name}`);
    console.log(`Original URL (implied): ${mockDbRows.find(r => r.name === item.name)?.animation_url}`);
    console.log(`Sanitized Video URL: ${item.video}`);
    console.log(`Sanitized Icon URL: ${item.icon}`);
});
