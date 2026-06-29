/**
 * SafePass Breach Monitor - Breach scanning within Wrayth
 */

import { FeatureGate } from '@/components/safesuite/WraythPaywall';
import { BreachMonitor } from '@/components/safepass/BreachMonitor';

export default function SafePassBreach() {
  return (
    <FeatureGate feature="safepass">
      <BreachMonitor />
    </FeatureGate>
  );
}
