/**
 * SafeSuite Scan - Security Scanner within SafeSuite
 */

import { FeatureGate, UsageLimitBanner } from '@/components/safesuite/SafeSuitePaywall';
import { SafeScanApp } from '@/components/apps/SafeScanApp';
import { Shield } from 'lucide-react';

export default function SafeSuiteScan() {
  return (
    <FeatureGate feature="safescan">
      <div className="min-h-screen bg-[#0a0a0a] space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Shield className="h-7 w-7 text-red-500" />
              <span className="text-red-500">SafeScan</span>
            </h1>
            <p className="text-gray-400">
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
