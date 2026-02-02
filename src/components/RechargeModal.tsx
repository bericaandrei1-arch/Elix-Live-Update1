import React, { useState } from 'react';
import { X, Coins, CreditCard, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

interface RechargeModalProps {
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
}

const PACKAGES = [
  { coins: 500, price: '£0.99', popular: false },
  { coins: 2500, price: '£4.99', popular: false },
  { coins: 5000, price: '£9.99', popular: true },
  { coins: 10000, price: '£19.99', popular: false },
  { coins: 50000, price: '£99.99', popular: false },
  { coins: 1000000, price: '£2000', popular: false },
];

export function RechargeModal({ onClose, onSuccess }: RechargeModalProps) {
  const user = useAuthStore((s) => s.user);
  const [loadingPkg, setLoadingPkg] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  const formatCoinsLabel = (coins: number) => {
    if (coins >= 1000000) return `${coins / 1000000}M`;
    if (coins >= 1000) return `${coins / 1000}k`;
    return `${coins}`;
  };

  const handleCustomPurchase = async () => {
    const coins = parseInt(customAmount);
    if (!coins || coins < 1) return;
    
    setLoadingCustom(true);
    await handleTransaction(coins);
    setLoadingCustom(false);
  };

  const handleTransaction = async (coins: number) => {
    if (!user) return;
    
    // Simulate API processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      // 1. Get current balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('coin_balance')
        .eq('user_id', user.id)
        .single();

      const currentBalance = Number(profile?.coin_balance || 0);
      const newBalance = currentBalance + coins;

      // 2. Update balance
      const { error } = await supabase
        .from('profiles')
        .update({ coin_balance: newBalance })
        .eq('user_id', user.id);

      if (error) throw error;

      // 3. Notify success
      onSuccess(newBalance);
      onClose();
    } catch (err) {
      console.error('Recharge failed:', err);
      alert('Purchase failed. Please try again.');
    }
  };

  const handlePurchase = async (pkgIndex: number, coins: number) => {
    setLoadingPkg(pkgIndex);
    await handleTransaction(coins);
    setLoadingPkg(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-[508px] bg-[#1a1a1a] border border-[#E6B36A]/30 rounded-2xl overflow-hidden shadow-2xl animate-scale-up flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#E6B36A]/10 flex-shrink-0">
          <div className="flex items-center gap-2 text-[#E6B36A]">
            <Coins size={20} strokeWidth={2.5} />
            <span className="font-extrabold text-lg tracking-wide">Recharge Coins</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white/70 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar flex-1 min-h-0">
          <div className="text-center mb-4">
            <p className="text-white/60 text-xs">Select a package to top up your balance instantly.</p>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {PACKAGES.map((pkg, idx) => (
              <button
                key={idx}
                type="button"
                disabled={loadingPkg !== null || loadingCustom}
                onClick={() => handlePurchase(idx, pkg.coins)}
                className={`relative aspect-square rounded-xl border transition-all duration-200 overflow-hidden
                  ${loadingPkg === idx
                    ? 'bg-[#E6B36A]/20 border-[#E6B36A]'
                    : 'bg-black/40 border-white/10 hover:bg-white/5 hover:border-[#E6B36A]/50'
                  }
                `}
              >
                {pkg.popular && (
                  <div className="absolute top-1.5 right-1.5 bg-gradient-to-r from-[#E6B36A] to-orange-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-lg">
                    POPULAR
                  </div>
                )}

                <div className="h-full w-full flex flex-col items-center justify-center gap-1 px-1.5">
                  <div className="text-center">
                    <div className="text-white font-black text-sm tracking-wide">
                      {formatCoinsLabel(pkg.coins)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="text-[#E6B36A] font-black text-xs leading-none">{pkg.price}</div>
                    {loadingPkg === idx && (
                      <div className="w-5 h-5 rounded-full bg-[#E6B36A] flex items-center justify-center">
                        <Check size={12} className="text-black" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}

            <button
              type="button"
              disabled={loadingPkg !== null || loadingCustom}
              onClick={() => setShowCustom(true)}
              className={`aspect-square rounded-xl border transition-all duration-200 overflow-hidden
                ${showCustom ? 'bg-[#E6B36A]/20 border-[#E6B36A]' : 'bg-black/40 border-white/10 hover:bg-white/5 hover:border-[#E6B36A]/50'}
              `}
            >
              <div className="h-full w-full flex flex-col items-center justify-center gap-1 px-1.5">
                <div className="text-white font-black text-sm tracking-wide">Custom</div>
                <div className="text-white/60 text-[10px] font-bold">Amount</div>
              </div>
            </button>
          </div>

          {showCustom && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Coins..."
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-[#E6B36A] outline-none transition"
                />
                <button
                  type="button"
                  onClick={handleCustomPurchase}
                  disabled={!customAmount || loadingCustom || loadingPkg !== null}
                  className="bg-[#E6B36A] text-black font-bold px-4 py-2 rounded-xl text-sm hover:bg-[#ffcc80] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  {loadingCustom ? '...' : 'Buy'}
                </button>
              </div>
              <p className="text-[10px] text-white/30 mt-1 ml-1">£1 / 500 coins</p>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-white/10 text-center">
            <p className="text-[10px] text-white/30 flex items-center justify-center gap-1">
              <CreditCard size={10} />
              Secure payment processed securely
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
