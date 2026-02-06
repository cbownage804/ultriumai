import { ReactNode } from 'react';
import { useVanguardSubscription } from '@/hooks/useVanguardSubscription';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getVanguardBasePath } from '@/utils/subdomain';

interface VanguardFeatureGateProps {
  children: ReactNode;
  /** The add-on ID required (e.g. 'pursuit-xdr', 'cortex-ai'). If null, just requires any subscription. */
  requiredAddon?: string;
  /** The minimum tier required (e.g. 'msp-growth'). If null, any paid tier works. */
  requiredTier?: string;
  /** Human-readable feature name for the upgrade prompt */
  featureName: string;
  /** Short description shown in the gate */
  featureDescription?: string;
}

const TIER_ORDER = [
  'free',
  'it-professional', 'msp-pro',
  'it-expert', 'msp-growth',
  'it-master', 'msp-power',
  'it-enterprise', 'msp-superpower',
];

function tierMeetsMinimum(current: string, required: string): boolean {
  const currentIdx = TIER_ORDER.indexOf(current);
  const requiredIdx = TIER_ORDER.indexOf(required);
  if (currentIdx === -1 || requiredIdx === -1) return false;
  return currentIdx >= requiredIdx;
}

export function VanguardFeatureGate({
  children,
  requiredAddon,
  requiredTier,
  featureName,
  featureDescription,
}: VanguardFeatureGateProps) {
  const { subscribed, tier, hasAddon, loading, adminOverride } = useVanguardSubscription();
  const basePath = getVanguardBasePath();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  // Admin override bypasses all gates
  if (adminOverride) return <>{children}</>;

  // Check subscription
  if (!subscribed) {
    return <UpgradePrompt featureName={featureName} featureDescription={featureDescription} basePath={basePath} reason="subscription" />;
  }

  // Check tier
  if (requiredTier && !tierMeetsMinimum(tier, requiredTier)) {
    return <UpgradePrompt featureName={featureName} featureDescription={featureDescription} basePath={basePath} reason="tier" requiredTier={requiredTier} />;
  }

  // Check add-on
  if (requiredAddon && !hasAddon(requiredAddon)) {
    return <UpgradePrompt featureName={featureName} featureDescription={featureDescription} basePath={basePath} reason="addon" requiredAddon={requiredAddon} />;
  }

  return <>{children}</>;
}

function UpgradePrompt({
  featureName,
  featureDescription,
  basePath,
  reason,
  requiredTier,
  requiredAddon,
}: {
  featureName: string;
  featureDescription?: string;
  basePath: string;
  reason: 'subscription' | 'tier' | 'addon';
  requiredTier?: string;
  requiredAddon?: string;
}) {
  return (
    <div className="container mx-auto p-6 flex items-center justify-center min-h-[500px]">
      <Card className="w-full max-w-lg border-cyan-500/20 bg-black/40 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
            <Lock className="h-8 w-8 text-cyan-400" />
          </div>
          <CardTitle className="text-xl text-white">{featureName}</CardTitle>
          <CardDescription className="text-white/60">
            {featureDescription || 'This feature requires an active Vanguard subscription.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              {reason === 'subscription' && 'Subscribe to a Vanguard plan to unlock this module.'}
              {reason === 'tier' && `Upgrade to the ${requiredTier?.replace(/(it-|msp-)/, '').replace(/^./, c => c.toUpperCase())} tier or higher.`}
              {reason === 'addon' && (
                <>
                  Add the <Badge variant="outline" className="text-cyan-400 border-cyan-500/30 mx-1">{requiredAddon?.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase())}</Badge> module to your plan.
                </>
              )}
            </div>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            asChild
          >
            <Link to={`${basePath}/suite`}>
              View Plans & Pricing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
