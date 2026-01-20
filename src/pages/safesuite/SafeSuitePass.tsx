/**
 * SafeSuite Pass - Password Manager within SafeSuite
 */

import { FeatureGate } from '@/components/safesuite/SafeSuitePaywall';
import { PasswordVault } from '@/components/safepass/PasswordVault';

export default function SafeSuitePass() {
  return (
    <FeatureGate feature="safepass">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">SafePass</h1>
            <p className="text-muted-foreground">
              Securely store and manage your passwords with military-grade encryption
            </p>
          </div>
        </div>
        
        <PasswordVault />
      </div>
    </FeatureGate>
  );
}
