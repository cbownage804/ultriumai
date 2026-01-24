/**
 * SafeSuite Scan - Security Scanner within SafeSuite
 */

import { FeatureGate, UsageLimitBanner } from '@/components/safesuite/SafeSuitePaywall';
import { SafeScanApp } from '@/components/apps/SafeScanApp';
import safescanLogo from '@/assets/safescan-logo.png';

export default function SafeSuiteScan() {
  return (
    <FeatureGate feature="safescan">
      <div className="min-h-screen bg-[#0a0a0a] space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <img src={safescanLogo} alt="SafeScan" className="h-10 w-auto" />
            <p className="text-gray-400 mt-1">
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
