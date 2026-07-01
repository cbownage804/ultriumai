/**
 * Vault Reminders - Password Expiration Reminders within Wrayth
 */

import { FeatureGate } from '@/components/safesuite/SafeSuitePaywall';
import { ExpirationReminders } from '@/components/safepass/ExpirationReminders';

export default function VaultReminders() {
  return (
    <FeatureGate feature="vault">
      <ExpirationReminders />
    </FeatureGate>
  );
}
