/**
 * SafePass Shared - View passwords shared with you (Business feature only)
 */

import { FeatureGate } from '@/components/safesuite/SafeSuitePaywall';
import { SharedPasswordAccess } from '@/components/safepass/SharedPasswordAccess';
import { useSafeSuiteSubscription } from '@/hooks/useSafeSuite';
import { useNavigate } from 'react-router-dom';
import { isSafeSuiteDomain } from '@/utils/subdomain';
import { Button } from '@/components/ui/button';
import { Lock, Crown } from 'lucide-react';

export default function SafePassShared() {
  const navigate = useNavigate();
  const { isBusiness, loading: subLoading, tier } = useSafeSuiteSubscription();

  // Business tier gate
  if (!subLoading && !isBusiness) {
    const billingPath = isSafeSuiteDomain() ? '/billing' : '/safesuite/billing';
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 bg-amber-500/10 rounded-full mb-4">
          <Lock className="h-10 w-10 text-amber-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Shared Passwords is a Business Feature</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          Share passwords securely with team members on the Business plan.
          {tier === 'free' && " Upgrade to unlock team sharing and collaboration."}
          {tier === 'pro' && " Upgrade from Pro to Business to unlock password sharing."}
        </p>
        <Button onClick={() => navigate(billingPath)} className="gap-2 bg-amber-500 hover:bg-amber-600 text-black">
          <Crown className="h-4 w-4" />
          Upgrade to Business
        </Button>
      </div>
    );
  }

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