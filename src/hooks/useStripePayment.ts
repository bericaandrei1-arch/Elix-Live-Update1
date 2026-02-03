import { useState } from 'react';
import { STRIPE_CONFIG } from '@/config/stripe';
import { useAuthStore } from '@/store/useAuthStore';

export interface PaymentResult {
  success: boolean;
  error?: string;
  sessionId?: string;
}

export const useStripePayment = () => {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckoutSession = async (coinPackageId: string): Promise<PaymentResult> => {
    setLoading(true);
    setError(null);

    try {
      const coinPackage = STRIPE_CONFIG.coinPackages.find(p => p.id === coinPackageId);
      if (!coinPackage) {
        throw new Error('Invalid coin package');
      }

      // Create checkout session on your backend
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.id ? { 'x-user-id': user.id } : {})
        },
        body: JSON.stringify({
          userId: user?.id ?? null,
          coinPackage: {
            id: coinPackage.id,
            coins: coinPackage.coins,
            price: coinPackage.price,
            label: coinPackage.label,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      return { success: true, sessionId };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    createCheckoutSession,
    loading,
    error,
  };
};
