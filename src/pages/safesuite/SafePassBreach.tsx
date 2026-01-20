/**
 * SafePass Breach Monitor - Breach scanning within SafeSuite
 */

import { FeatureGate } from '@/components/safesuite/SafeSuitePaywall';
import { BreachMonitor } from '@/components/safepass/BreachMonitor';

export default function SafePassBreach() {
  return (
    <FeatureGate feature="safepass">
      <BreachMonitor />
    </FeatureGate>
  );
}
