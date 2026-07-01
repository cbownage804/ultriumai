/**
 * Vault Breach Monitor - Breach scanning within Wrayth
 */

import { FeatureGate } from '@/components/safesuite/SafeSuitePaywall';
import { BreachMonitor } from '@/components/safepass/BreachMonitor';

export default function VaultBreach() {
  return (
    <FeatureGate feature="vault">
      <BreachMonitor />
    </FeatureGate>
  );
}
