export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  
  coinPackages: [
    { id: 'coins_100', coins: 100, price: 0.99, label: '100 Coins' },
    { id: 'coins_500', coins: 500, price: 4.99, label: '500 Coins' },
    { id: 'coins_1000', coins: 1000, price: 9.99, label: '1,000 Coins' },
    { id: 'coins_5000', coins: 5000, price: 49.99, label: '5,000 Coins' },
  ],
};

export const getStripeKey = () => {
  if (!STRIPE_CONFIG.publishableKey) {
    throw new Error('Stripe publishable key is not configured. Please add VITE_STRIPE_PUBLISHABLE_KEY to your environment variables.');
  }
  return STRIPE_CONFIG.publishableKey;
};
