import React, { useState } from 'react';
import { BuyCoinsModal } from './BuyCoinsModal';
import { Button } from './ui/button';
import { Coins } from 'lucide-react';

export const StripeIntegrationExample: React.FC = () => {
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [userCoins, setUserCoins] = useState(0);

  const handlePurchaseSuccess = (coins: number) => {
    setUserCoins(prev => prev + coins);
    console.log(`Successfully purchased ${coins} coins!`);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Coins className="h-5 w-5" />
        <span className="font-semibold">Your Coins: {userCoins.toLocaleString()}</span>
      </div>
      
      <Button onClick={() => setShowBuyModal(true)}>
        Buy More Coins
      </Button>

      <BuyCoinsModal
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        onSuccess={handlePurchaseSuccess}
      />
    </div>
  );
};