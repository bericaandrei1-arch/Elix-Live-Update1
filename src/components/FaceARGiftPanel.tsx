import React, { useEffect, useMemo, useState } from 'react';
import { Crown, Glasses, Heart, Star, Sparkles, Palette, Coins, Rabbit } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { fetchGiftPriceMap } from '../lib/giftsCatalog';

export interface FaceARGift {
  id: string;
  name: string;
  type: 'crown' | 'glasses' | 'mask' | 'ears' | 'hearts' | 'stars';
  icon: React.ReactNode;
  price: number;
  color: string;
  category: 'basic' | 'premium' | 'legendary';
  description: string;
}

export const FACE_AR_GIFTS: FaceARGift[] = [
  {
    id: 'face_ar_crown',
    name: 'Golden Crown',
    type: 'crown',
    icon: <Crown className="w-6 h-6" />,
    price: 0,
    color: '#FFD700',
    category: 'premium',
    description: 'Royal crown that appears on the creator\'s forehead'
  },
  {
    id: 'face_ar_glasses',
    name: 'Cool Glasses',
    type: 'glasses',
    icon: <Glasses className="w-6 h-6" />,
    price: 0,
    color: '#000000',
    category: 'basic',
    description: 'Stylish glasses that track with eye movement'
  },
  {
    id: 'face_ar_mask',
    name: 'Mystery Mask',
    type: 'mask',
    icon: <Rabbit className="w-6 h-6" />,
    price: 0,
    color: '#4A90E2',
    category: 'premium',
    description: 'Elegant mask covering lower face'
  },
  {
    id: 'face_ar_ears',
    name: 'Animal Ears',
    type: 'ears',
    icon: <Heart className="w-6 h-6" />,
    price: 0,
    color: '#FF69B4',
    category: 'basic',
    description: 'Cute animal ears on top of head'
  },
  {
    id: 'face_ar_hearts',
    name: 'Floating Hearts',
    type: 'hearts',
    icon: <Heart className="w-6 h-6" />,
    price: 0,
    color: '#FF1493',
    category: 'premium',
    description: 'Animated hearts floating around face'
  },
  {
    id: 'face_ar_stars',
    name: 'Sparkling Stars',
    type: 'stars',
    icon: <Star className="w-6 h-6" />,
    price: 0,
    color: '#FFD700',
    category: 'legendary',
    description: 'Magical stars orbiting around head'
  }
];

interface FaceARGiftPanelProps {
  onSelectGift: (gift: FaceARGift) => void;
  userCoins: number;
  isStreamer?: boolean;
  currentGift?: FaceARGift | null;
  onClearGift?: () => void;
}

export const FaceARGiftPanel: React.FC<FaceARGiftPanelProps> = ({
  onSelectGift,
  userCoins,
  isStreamer = false,
  currentGift,
  onClearGift
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'basic' | 'premium' | 'legendary'>('all');
  const [customColor, setCustomColor] = useState('#FFD700');
  const [giftPriceMap, setGiftPriceMap] = useState<Map<string, number>>(() => new Map());

  useEffect(() => {
    fetchGiftPriceMap()
      .then((map) => setGiftPriceMap(map))
      .catch(() => {});
  }, []);

  const giftsWithPrices = useMemo(
    () =>
      FACE_AR_GIFTS.map((gift) => ({
        ...gift,
        price: giftPriceMap.get(gift.id) ?? gift.price,
      })),
    [giftPriceMap]
  );

  const filteredGifts = selectedCategory === 'all'
    ? giftsWithPrices
    : giftsWithPrices.filter(gift => gift.category === selectedCategory);

  const categories = [
    { id: 'all', name: 'All', color: 'bg-gray-600' },
    { id: 'basic', name: 'Basic', color: 'bg-blue-600' },
    { id: 'premium', name: 'Premium', color: 'bg-purple-600' },
    { id: 'legendary', name: 'Legendary', color: 'bg-yellow-600' }
  ];

  const handleGiftSelect = (gift: FaceARGift) => {
    if (userCoins >= gift.price) {
      onSelectGift({ ...gift, color: customColor });
    }
  };

  return (
    <div className="w-full max-w-md bg-gray-900 rounded-lg border border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          Face AR Gifts
        </h3>
        <div className="flex items-center gap-2 text-yellow-400">
          <Coins className="w-4 h-4" />
          <span className="text-sm font-medium">{userCoins}</span>
        </div>
      </div>

      {/* Current Gift Status */}
      {currentGift && (
        <div className="mb-4 p-3 bg-gray-800 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: currentGift.color + '20', color: currentGift.color }}
              >
                {currentGift.icon}
              </div>
              <div>
                <div className="text-white font-medium text-sm">{currentGift.name}</div>
                <div className="text-gray-400 text-xs">Active Face AR Gift</div>
              </div>
            </div>
            {onClearGift && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearGift}
                className="text-xs"
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 mb-4">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.id as any)}
            className={cn(
              'text-xs',
              selectedCategory === category.id && category.color
            )}
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* Custom Color Picker */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Custom Color
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            className="w-12 h-8 rounded border border-gray-600 bg-gray-800"
          />
          <span className="text-sm text-gray-400">{customColor}</span>
        </div>
      </div>

      {/* Gift Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {filteredGifts.map((gift) => {
          const canAfford = userCoins >= gift.price;
          const isSelected = currentGift?.id === gift.id;

          return (
            <div
              key={gift.id}
              className={cn(
                'relative p-3 rounded-lg border cursor-pointer transition-all',
                isSelected 
                  ? 'border-yellow-400 bg-yellow-400/10' 
                  : canAfford 
                    ? 'border-gray-600 bg-gray-800 hover:border-gray-500 hover:bg-gray-700'
                    : 'border-gray-700 bg-gray-800 opacity-50 cursor-not-allowed'
              )}
              onClick={() => canAfford && handleGiftSelect(gift)}
            >
              <div className="flex items-center justify-between mb-2">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: gift.color + '20', color: gift.color }}
                >
                  {gift.icon}
                </div>
                <div className="text-right">
                  <div className="text-yellow-400 font-bold text-sm">{gift.price}</div>
                  <div className="text-xs text-gray-400">coins</div>
                </div>
              </div>
              
              <div className="text-white font-medium text-sm mb-1">{gift.name}</div>
              <div className="text-xs text-gray-400">{gift.description}</div>
              
              {isSelected && (
                <div className="absolute top-2 right-2 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
              )}
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="text-xs text-gray-400 bg-gray-800 p-3 rounded-lg">
        <p className="mb-1"><strong>How it works:</strong></p>
        <p>• Face AR gifts appear as real-time overlays on the streamer's face</p>
        <p>• They track facial movements and expressions automatically</p>
        <p>• Effects last for 30 seconds and can be stacked</p>
        <p>• Choose custom colors to personalize your gift</p>
      </div>
    </div>
  );
};

export default FaceARGiftPanel;
