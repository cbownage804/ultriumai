/**
 * Wrayth Upgrade Page
 *
 * Shown when a Free/Pro user lands on a route that their plan doesn't
 * include. Explains what's locked, why, and what unlocking gets them.
 *
 * Query params:
 *   ?tier=pro|business|enterprise   Required tier to unlock the destination.
 *   ?area=devices|intelligence|...  Area slug (see AREA_INFO below).
 *   ?from=/app/…                    Path the user was trying to reach.
 */

import { useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Bug,
  Check,
  ClipboardCheck,
  Crown,
  FileText,
  GitBranch,
  Lock,
  Monitor,
  Network,
  Plug,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Terminal,
} from 'lucide-react';
import {
  SAFESUITE_TIERS,
  FEATURE_DESCRIPTIONS,
  formatMonthlyPrice,
  type WraythTier,
  type TierFeatures,
} from '@/config/safeSuiteTiers';
import { useWraythSubscription } from '@/hooks/useSafeSuite';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type AreaInfo = {
  title: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  highlights: string[];
  /** Optional matching feature key for extra copy. */
  feature?: keyof TierFeatures;
};

const AREA_INFO: Record<string, AreaInfo> = {
  devices: {
    title: 'Device Protection',
    tagline: 'See every endpoint Ray is watching',
    description:
      'Track laptops, desktops, and servers in one live inventory. Ray flags weak posture, missing patches, and risky users before an attacker does.',
    icon: Monitor,
    highlights: [
      'Live device inventory across your organization',
      'Ray posture scoring and drift alerts',
      'Per-device timeline of everything that changed',
      'Automatic hardening recommendations',
    ],
  },
  reports: {
    title: 'Reports',
    tagline: 'Executive-ready security storytelling',
    description:
      'Turn what Ray sees into board-ready PDFs. Weekly summaries, incident reports, and compliance snapshots — generated for you.',
    icon: FileText,
    highlights: [
      'Executive weekly digest (PDF)',
      'Incident reports with MITRE ATT&CK mapping',
      'Compliance snapshots (SOC 2, HIPAA, PCI, CIS)',
      'Custom branding on every export',
    ],
  },
  intelligence: {
    title: 'Intelligence Suite',
    tagline: 'The full analyst workbench',
    description:
      'Investigations, malware analysis, script analysis, log analysis, attack paths, and policy generation — the tools Ray uses to work at analyst-level.',
    icon: Sparkles,
    highlights: [
      'Deep investigations with URL / header / DNS / VT lookups',
      'Malware and script analysis with Ray verdicts',
      'Attack path graph across identities and devices',
      'Policy generator (SOC 2, HIPAA, IR, AUP, AI governance)',
      'Compliance analysis against major frameworks',
    ],
  },
  investigations: {
    title: 'Investigations',
    tagline: 'Ray-led deep dives on any suspicious signal',
    description:
      'One click to a full investigation: URLs, headers, SPF/DKIM/DMARC, WHOIS, passive DNS, VirusTotal, and a written verdict.',
    icon: ScanSearch,
    highlights: [
      'Deep URL and email header analysis',
      'SPF / DKIM / DMARC verdicts',
      'Passive DNS and WHOIS lookups',
      'VirusTotal enrichment',
    ],
  },
  malware: {
    title: 'Malware Analysis',
    tagline: 'Static analysis with Ray commentary',
    description:
      'Drop a sample or paste code and Ray explains what it does, how it evades, and how to remediate — in plain English.',
    icon: Bug,
    highlights: ['Static analysis of scripts and binaries', 'IOC extraction', 'Ray-written remediation guidance'],
  },
  scripts: {
    title: 'Script Analysis',
    tagline: 'Understand any script before you run it',
    description:
      'Paste PowerShell, Bash, or Python and Ray tells you exactly what it does, what it touches, and whether it looks malicious.',
    icon: Terminal,
    highlights: ['Line-by-line explanation', 'Suspicious command highlighting', 'Safe-to-run verdict'],
  },
  compliance: {
    title: 'Compliance',
    tagline: 'Continuous posture against major frameworks',
    description:
      'Ray maps what it sees in your environment to SOC 2, HIPAA, PCI, CIS, and NIST and produces exportable evidence.',
    icon: ShieldCheck,
    highlights: ['SOC 2, HIPAA, PCI, CIS, NIST mappings', 'Continuous posture scoring', 'Exportable evidence packs'],
  },
  policies: {
    title: 'Policy Generator',
    tagline: 'Draft security policies in minutes',
    description:
      'Password, incident response, AUP, AI governance, HIPAA, SOC 2 — Ray writes the first draft tailored to your organization.',
    icon: ClipboardCheck,
    highlights: ['Ten+ policy templates', 'Tailored to your org profile', 'Versioned and exportable'],
  },
  graph: {
    title: 'Security Graph',
    tagline: 'See how identities, devices, and threats connect',
    description:
      "Ray's live graph makes lateral movement, blast radius, and shared exposure obvious at a glance.",
    icon: Network,
    highlights: ['Live identity ↔ device ↔ threat graph', 'Blast-radius exploration', 'Path-based investigations'],
  },
  'attack-paths': {
    title: 'Attack Paths',
    tagline: 'How an attacker would move through your environment',
    description:
      'Ray traces plausible attack paths from public exposure to sensitive assets and tells you where to break the chain.',
    icon: GitBranch,
    highlights: ['Ranked attack paths', 'Break-the-chain recommendations', 'Continuously recomputed'],
  },
  integrations: {
    title: 'Integrations',
    tagline: 'Connect Wrayth to the tools you already use',
    description:
      'Microsoft 365, Google Workspace, Slack, Teams, and more. Ray uses these signals to make smarter recommendations.',
    icon: Plug,
    highlights: ['Microsoft 365 & Google Workspace', 'Slack & Teams delivery', 'Webhook and API access'],
  },
  ray: {
    title: 'Ray',
    tagline: 'Your AI security analyst',
    description:
      "More Ray conversations, more voice minutes, and access to Ray's advanced skills.",
    icon: Bot,
    highlights: ['Higher monthly message limits', 'Voice conversations with Ray', 'Advanced Ray skills'],
    feature: 'ray',
  },
};

function inferAreaFromPath(path?: string | null): string | undefined {
  if (!path) return undefined;
  const m = path.match(/^\/app\/([^/?]+)(?:\/([^/?]+))?/);
  if (!m) return undefined;
  const [, first, second] = m;
  if (first === 'intelligence') {
    if (second && AREA_INFO[second]) return second;
    return 'intelligence';
  }
  if (AREA_INFO[first]) return first;
  return undefined;
}

const TIER_STYLES: Record<WraythTier, { accent: string; badge: string; button: string }> = {
  free: {
    accent: 'text-muted-foreground',
    badge: 'border-muted text-muted-foreground',
    button: '',
  },
  pro: {
    accent: 'text-violet-400',
    badge: 'border-violet-500/50 text-violet-400 bg-violet-500/10',
    button: 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white',
  },
  business: {
    accent: 'text-yellow-400',
    badge: 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10',
    button: 'bg-gradient-to-r from-yellow-500 to-yellow-500 hover:from-yellow-600 hover:to-yellow-600 text-black font-semibold',
  },
  enterprise: {
    accent: 'text-primary',
    badge: 'border-primary/50 text-primary bg-primary/10',
    button: '',
  },
};

export default function Upgrade() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { tier: currentTier } = useWraythSubscription();

  const from = params.get('from');
  const areaParam = params.get('area') ?? inferAreaFromPath(from);
  const area = areaParam && AREA_INFO[areaParam] ? AREA_INFO[areaParam] : null;

  const requiredTier = useMemo<WraythTier>(() => {
    const t = (params.get('tier') as WraythTier | null) ?? null;
    if (t && SAFESUITE_TIERS[t]) return t;
    // Sensible defaults if the caller didn't specify.
    if (areaParam === 'intelligence' || areaParam === 'integrations') return 'business';
    if (areaParam === 'devices' || areaParam === 'reports') return 'pro';
    return 'pro';
  }, [params, areaParam]);

  const requiredCfg = SAFESUITE_TIERS[requiredTier];
  const styles = TIER_STYLES[requiredTier];
  const Icon = area?.icon ?? Lock;

  const featureList = area?.feature ? [FEATURE_DESCRIPTIONS[area.feature]] : [];

  const enabledFeatures = Object.entries(requiredCfg.features)
    .filter(([, v]) => v.enabled)
    .map(([k]) => FEATURE_DESCRIPTIONS[k as keyof TierFeatures]?.name)
    .filter(Boolean) as string[];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      {/* Back link */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 -ml-2"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/app/dashboard'))}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="grid gap-8 md:grid-cols-[1.2fr_1fr]"
      >
        {/* Left: explanation */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div
              className={cn(
                'h-12 w-12 rounded-xl flex items-center justify-center',
                'bg-primary/10 border border-primary/20',
              )}
            >
              <Icon className={cn('h-6 w-6', styles.accent)} />
            </div>
            <Badge variant="outline" className={cn('gap-1', styles.badge)}>
              <Lock className="h-3 w-3" />
              {requiredCfg.name} plan
            </Badge>
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
            {area ? `${area.title} is a ${requiredCfg.name} feature` : `Upgrade to ${requiredCfg.name}`}
          </h1>
          <p className="text-lg text-muted-foreground mb-2">
            {area?.tagline ?? 'Unlock the full Wrayth platform.'}
          </p>

          <p className="text-muted-foreground mb-6 leading-relaxed">
            {area?.description ??
              `Your ${SAFESUITE_TIERS[currentTier].name} plan doesn't include this area yet. Upgrade to ${requiredCfg.name} to continue.`}
          </p>

          {from && (
            <p className="text-sm text-muted-foreground mb-6">
              You tried to open{' '}
              <code className="px-1.5 py-0.5 rounded bg-muted text-foreground/80 text-xs">{from}</code>.
              It's part of {requiredCfg.name}.
            </p>
          )}

          {area && area.highlights.length > 0 && (
            <Card className="border-border/60 bg-card/60 backdrop-blur">
              <CardContent className="py-5">
                <div className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Sparkles className={cn('h-4 w-4', styles.accent)} />
                  What you get with {area.title}
                </div>
                <ul className="space-y-2">
                  {area.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className={cn('h-4 w-4 mt-0.5 flex-shrink-0', styles.accent)} />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: plan card + CTA */}
        <div>
          <Card className={cn('border-2 relative overflow-hidden', requiredTier === 'business' && 'border-yellow-500/40', requiredTier === 'pro' && 'border-violet-500/40')}>
            <div
              className={cn(
                'absolute inset-0 opacity-30 pointer-events-none',
                requiredTier === 'business' && 'bg-gradient-to-br from-yellow-500/20 via-transparent to-transparent',
                requiredTier === 'pro' && 'bg-gradient-to-br from-violet-500/20 via-transparent to-transparent',
              )}
            />
            <CardContent className="relative pt-6 pb-6">
              <div className="flex items-center gap-2 mb-2">
                {requiredTier === 'business' && <Crown className="h-4 w-4 text-yellow-400" />}
                <span className="text-sm text-muted-foreground">Wrayth {requiredCfg.name}</span>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className={cn('text-4xl font-bold', styles.accent)}>
                  {formatMonthlyPrice(requiredCfg)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">{requiredCfg.description}</p>

              <Link to="/app/billing" className="block">
                <Button size="lg" className={cn('w-full gap-2', styles.button)}>
                  <Sparkles className="h-4 w-4" />
                  Upgrade to {requiredCfg.name}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link
                to="/app/billing"
                className="block text-center mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Compare all plans
              </Link>

              {enabledFeatures.length > 0 && (
                <>
                  <div className="my-5 h-px bg-border/60" />
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
                    Included in {requiredCfg.name}
                  </div>
                  <ul className="grid grid-cols-1 gap-2">
                    {enabledFeatures.map((name) => (
                      <li key={name} className="flex items-center gap-2 text-sm">
                        <Check className={cn('h-3.5 w-3.5', styles.accent)} />
                        <span>{name}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>

          {featureList[0] && (
            <p className="mt-4 text-xs text-muted-foreground text-center">
              {featureList[0].description}
            </p>
          )}
        </div>
      </motion.div>

      {/* Reassurance footer */}
      <div className="mt-10 text-center text-sm text-muted-foreground">
        You're on the <span className="text-foreground font-medium">{SAFESUITE_TIERS[currentTier].name}</span> plan.
        Upgrades take effect instantly and you can cancel any time.
      </div>
    </div>
  );
}
