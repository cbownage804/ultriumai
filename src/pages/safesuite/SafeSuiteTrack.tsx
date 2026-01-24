/**
 * SafeSuite Track - Asset Management within SafeSuite
 */

import { FeatureGate, UsageLimitBanner } from '@/components/safesuite/SafeSuitePaywall';
import { Card, CardContent } from '@/components/ui/card';
import { Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import safetrackLogo from '@/assets/safetrack-logo.png';

export default function SafeSuiteTrack() {
  return (
    <FeatureGate feature="safetrack">
      <div className="min-h-screen bg-[#0a0a0a] space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <img src={safetrackLogo} alt="SafeTrack" className="h-10 w-auto" />
            <p className="text-gray-400 mt-1">
              Track and manage your IT assets with AI-powered search
            </p>
          </div>
        </div>

        <UsageLimitBanner feature="safetrack" />

        <Card className="bg-[#141414] border-emerald-500/10">
          <CardContent className="py-12 text-center">
            <div className="p-4 rounded-full bg-emerald-500/10 w-fit mx-auto mb-4">
              <Package className="h-16 w-16 text-emerald-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">Asset Management</h3>
            <p className="text-gray-400 mb-4">
              Track hardware, software licenses, and IT inventory across your organization
            </p>
            <Link to="/safetrack">
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">Open Full SafeTrack</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </FeatureGate>
  );
}
