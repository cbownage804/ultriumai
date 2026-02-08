import { useCrossModuleSync } from '@/hooks/useCrossModuleSync';

/**
 * Invisible component that triggers cross-module sync when mounted
 * inside the VanguardSubscriptionProvider context.
 */
export function CrossModuleSyncTrigger() {
  useCrossModuleSync();
  return null;
}
