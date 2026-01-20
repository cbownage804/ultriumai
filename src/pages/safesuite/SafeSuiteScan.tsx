/**
 * SafeSuite Scan - Security Scanner within SafeSuite
 */

import { FeatureGate, UsageLimitBanner } from '@/components/safesuite/SafeSuitePaywall';
import { SafeScanApp } from '@/components/apps/SafeScanApp';

export default function SafeSuiteScan() {
  return (
    <FeatureGate feature="safescan">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">SafeScan</h1>
            <p className="text-muted-foreground">
              Scan emails, URLs, and documents for security threats
            </p>
          </div>
        </div>
        
        <UsageLimitBanner feature="safescan" />
        
        <SafeScanApp isWhiteLabeled={false} brandName="SafeSuite" />
      </div>
    </FeatureGate>
  );
}
