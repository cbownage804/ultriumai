/**
 * SafeSuite Track - Asset Management within SafeSuite
 */

import { FeatureGate, UsageLimitBanner } from '@/components/safesuite/SafeSuitePaywall';
import { Card, CardContent } from '@/components/ui/card';
import { Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function SafeSuiteTrack() {
  return (
    <FeatureGate feature="safetrack">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">SafeTrack</h1>
            <p className="text-muted-foreground">
              Track and manage your IT assets with AI-powered search
            </p>
          </div>
        </div>

        <UsageLimitBanner feature="safetrack" />

        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-16 w-16 mx-auto text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Asset Management</h3>
            <p className="text-muted-foreground mb-4">
              Track hardware, software licenses, and IT inventory across your organization
            </p>
            <Link to="/safetrack">
              <Button>Open Full SafeTrack</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </FeatureGate>
  );
}
