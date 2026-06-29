/**
 * SafePass Emergency Access - Manage trusted contacts for emergency vault access
 */

import { FeatureGate } from '@/components/safesuite/SafeSuitePaywall';
import { EmergencyAccess } from '@/components/safepass/EmergencyAccess';

export default function SafePassEmergency() {
  return (
    <FeatureGate feature="safepass">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Emergency Access</h1>
          <p className="text-muted-foreground">
            Set up trusted contacts who can request access to your vault in emergencies
          </p>
        </div>
        
        <EmergencyAccess />
      </div>
    </FeatureGate>
  );
}
