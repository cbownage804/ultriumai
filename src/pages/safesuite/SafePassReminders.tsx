/**
 * SafePass Reminders - Password Expiration Reminders within Wrayth
 */

import { FeatureGate } from '@/components/safesuite/WraythPaywall';
import { ExpirationReminders } from '@/components/safepass/ExpirationReminders';

export default function SafePassReminders() {
  return (
    <FeatureGate feature="safepass">
      <ExpirationReminders />
    </FeatureGate>
  );
}
