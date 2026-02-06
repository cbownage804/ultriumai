import { createContext, useContext, ReactNode } from 'react';
import { useVanguardSubscription, VanguardSubscriptionData } from '@/hooks/useVanguardSubscription';

interface VanguardSubscriptionContextValue extends VanguardSubscriptionData {
  hasAddon: (addonId: string) => boolean;
  isMspTier: boolean;
  isItTier: boolean;
  refreshSubscription: () => Promise<void>;
}

const VanguardSubscriptionContext = createContext<VanguardSubscriptionContextValue | null>(null);

export function VanguardSubscriptionProvider({ children }: { children: ReactNode }) {
  const subscription = useVanguardSubscription();
  return (
    <VanguardSubscriptionContext.Provider value={subscription}>
      {children}
    </VanguardSubscriptionContext.Provider>
  );
}

export function useVanguardSub() {
  const ctx = useContext(VanguardSubscriptionContext);
  if (!ctx) {
    throw new Error('useVanguardSub must be used within VanguardSubscriptionProvider');
  }
  return ctx;
}
