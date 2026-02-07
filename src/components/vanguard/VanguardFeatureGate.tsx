import { ReactNode } from 'react';
import { useVanguardSubscription } from '@/hooks/useVanguardSubscription';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Sparkles, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
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

/** Maps addon IDs to branded display names */
const ADDON_DISPLAY_NAMES: Record<string, string> = {
  'pursuit-xdr': 'Pursuit XDR',
  'cortex-ai': 'Cortex AI',
  'sentinel-saas': 'Sentinel SaaS Security',
  'recon-pentest': 'Recon Pentest',
  'atlas-docs': 'Atlas Documentation',
  'comply': 'Comply',
};

/** Maps addon IDs to value propositions */
const ADDON_VALUE_PROPS: Record<string, string> = {
  'pursuit-xdr': 'Real-time threat detection, SOC dashboards, and automated incident response across your fleet.',
  'cortex-ai': 'AI-powered summarization, pattern detection, smart routing, and operational intelligence.',
  'sentinel-saas': 'Microsoft 365 and Google Workspace security monitoring with AI-driven alert triage.',
  'recon-pentest': 'Automated vulnerability scanning, penetration testing workflows, and compliance-ready reporting.',
  'atlas-docs': 'Centralized IT documentation, runbooks, password management, and knowledge base.',
  'comply': 'Compliance lifecycle management with automated evidence collection and audit-ready reporting.',
};

const TIER_ORDER = [
  'free',
  'it-professional', 'msp-pro',
  'it-expert', 'msp-growth',
  'it-master', 'msp-power',
  'it-enterprise', 'msp-superpower',
];

const TIER_DISPLAY_NAMES: Record<string, string> = {
  'it-professional': 'Professional',
  'msp-pro': 'Pro',
  'it-expert': 'Expert',
  'msp-growth': 'Growth',
  'it-master': 'Master',
  'msp-power': 'Power',
  'it-enterprise': 'Enterprise',
  'msp-superpower': 'Superpower',
};

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
  const addonName = requiredAddon ? (ADDON_DISPLAY_NAMES[requiredAddon] || requiredAddon) : '';
  const addonValue = requiredAddon ? (ADDON_VALUE_PROPS[requiredAddon] || '') : '';
  const tierName = requiredTier ? (TIER_DISPLAY_NAMES[requiredTier] || requiredTier) : '';

  const defaultDescription = reason === 'addon'
    ? `${featureName} is part of the ${addonName} module. Add it to your plan to unlock this capability.`
    : reason === 'tier'
    ? `${featureName} is available on the ${tierName} plan and above.`
    : 'Activate your Vanguard subscription to access the full platform.';

  return (
    <div className="container mx-auto p-6 flex items-center justify-center min-h-[500px]">
      <Card className="w-full max-w-lg border-cyan-500/20 bg-black/40 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
            <Lock className="h-8 w-8 text-cyan-400" />
          </div>
          <CardTitle className="text-xl text-white">{featureName}</CardTitle>
          <CardDescription className="text-white/60">
            {featureDescription || defaultDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Value proposition */}
          {addonValue && (
            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2 text-sm text-white/80">
                <ShieldCheck className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
                <span>{addonValue}</span>
              </div>
            </div>
          )}

          {/* Action context */}
          <div className="bg-white/[0.03] border border-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
              {reason === 'subscription' && 'Choose a plan that fits your team — all plans include a 14-day free trial.'}
              {reason === 'tier' && `Upgrade to the ${tierName} tier or higher to unlock ${featureName}.`}
              {reason === 'addon' && (
                <>
                  Add <Badge variant="outline" className="text-cyan-400 border-cyan-500/30 mx-1">{addonName}</Badge> to your current plan.
                </>
              )}
            </div>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            asChild
          >
            <Link to={`${basePath}/suite`}>
              View Plans & Add-Ons
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
