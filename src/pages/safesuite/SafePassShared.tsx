/**
 * SafePass Shared - View passwords shared with you
 */

import { FeatureGate } from '@/components/safesuite/SafeSuitePaywall';
import { SharedPasswordAccess } from '@/components/safepass/SharedPasswordAccess';

export default function SafePassShared() {
  return (
    <FeatureGate feature="safepass">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Shared With Me</h1>
          <p className="text-muted-foreground">
            Access passwords that others have securely shared with you
          </p>
        </div>
        
        <SharedPasswordAccess />
      </div>
    </FeatureGate>
  );
}
