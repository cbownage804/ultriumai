/**
 * Wrayth Dashboard - Unified overview of all security tools
 * All data is fetched from real database - no mock data
 */

import { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWraythSubscription, useFeatureAccess } from '@/hooks/useSafeSuite';
import { useVault } from '@/hooks/useSafePass';
import { SAFESUITE_TIERS, FEATURE_DESCRIPTIONS, TierFeatures } from '@/config/safeSuiteTiers';
import { supabase } from '@/integrations/supabase/client';
import { safeSuiteProducts } from '@/components/safesuite/SafeSuiteProductIcons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UsageLimitBanner } from '@/components/safesuite/SafeSuitePaywall';
import { SubscriptionBanner } from '@/components/safesuite/SubscriptionBanner';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { ProductTour } from '@/components/onboarding/ProductTour';
import { SAFESUITE_TOUR_STEPS } from '@/config/productTours';
import { motion } from 'framer-motion';
import { GlowContainer, AnimatedStatsCard, StaggerContainer, StaggerItem, SAFESUITE_THEMES } from '@/components/safesuite/SafeSuiteEffects';
import {
  Shield,
  KeyRound,
  ScanSearch,
  Globe,
  Package,
  ArrowRight,
  Lock,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Clock,
  Inbox,
  Activity,
  TrendingUp,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { MorningBriefHero } from '@/components/ray/MorningBriefHero';
import { AccountHealthPanel } from '@/components/ray/AccountHealthPanel';
import { useRayLiveSignals } from '@/hooks/useRayLiveSignals';
import { RayNoticesPanel } from '@/components/ray/RayNoticesPanel';
import { RayTimeline } from '@/components/ray/RayTimeline';
import { PasswordProtectionCard, PasswordAnalyzingCard } from '@/components/ray/PasswordProtectionCard';
import { RayWatchingCard } from '@/components/ray/RayWatchingCard';
import { usePasswordLifecycle } from '@/lib/ray/passwordLifecycle';
import { CisoNextAction } from '@/components/ray/CisoNextAction';
import { nextBestAction } from '@/lib/ray/ciso';
import { VaultLockedCard } from '@/components/ray/VaultLockedCard';
import { HomeContextBridge } from '@/components/ray/HomeContextBridge';
import { HomeCapabilityTiles } from '@/components/ray/home/HomeCapabilityTiles';
import { OnboardingOrTrends } from '@/components/ray/home/OnboardingOrTrends';
import { useMasterPassword } from '@/hooks/useMasterPassword';

interface DashboardStats {
  passwordCount: number;
  weakPasswordCount: number;
  strongPasswordCount: number;
  scanCount: number;
  monitoredAssets: number;
}

interface ActivityItem {
  id: string;
  type: 'password' | 'scan' | 'breach' | 'asset';
  text: string;
  timestamp: string;
}

function SecurityScoreCard({ stats }: { stats: DashboardStats }) {
  // Calculate real security score based on password strength
  const calculateScore = () => {
    if (stats.passwordCount === 0) return 100;
    const strongRatio = stats.strongPasswordCount / stats.passwordCount;
    const weakRatio = stats.weakPasswordCount / stats.passwordCount;
    return Math.round(100 - (weakRatio * 40) + (strongRatio * 20));
  };

  const score = Math.max(0, Math.min(100, calculateScore()));
  const scoreColor = score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400';
  const strokeColor = score >= 80 ? 'stroke-green-500' : score >= 60 ? 'stroke-primary' : 'stroke-red-500';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <GlowContainer theme="watch" className="col-span-full md:col-span-2 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-violet-400" />
          <h3 className="font-semibold text-white text-sm sm:text-base">Security Score</h3>
        </div>
        <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6">
          Your overall security health across all Wrayth products
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
          <div className="relative">
            <svg className="h-32 w-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                className="stroke-white/10"
                strokeWidth="12"
                fill="none"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="56"
                className={cn('transition-all duration-500', strokeColor)}
                strokeWidth="12"
                fill="none"
                initial={{ strokeDasharray: '0 352' }}
                animate={{ strokeDasharray: `${(score / 100) * 352} 352` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.span 
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className={cn('text-3xl font-bold', scoreColor)}
              >
                {score}
              </motion.span>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            {stats.passwordCount === 0 ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Inbox className="h-4 w-4" />
                <span>Add passwords to see security insights</span>
              </div>
            ) : (
              <StaggerContainer>
                {stats.strongPasswordCount > 0 && (
                  <StaggerItem>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-gray-300">{stats.strongPasswordCount} strong password{stats.strongPasswordCount !== 1 ? 's' : ''} in vault</span>
                    </div>
                  </StaggerItem>
                )}
                {stats.weakPasswordCount > 0 && (
                  <StaggerItem>
                    <div className="flex items-center gap-2 text-sm mt-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                      <span className="text-gray-300">{stats.weakPasswordCount} weak password{stats.weakPasswordCount !== 1 ? 's' : ''} need attention</span>
                    </div>
                  </StaggerItem>
                )}
                {stats.weakPasswordCount === 0 && stats.passwordCount > 0 && (
                  <StaggerItem>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-gray-300">No weak passwords detected</span>
                    </div>
                  </StaggerItem>
                )}
              </StaggerContainer>
            )}
          </div>
        </div>
      </GlowContainer>
    </motion.div>
  );
}

function QuickActionsCard() {
  const [value, setValue] = useState('');
  const submit = () => {
    if (typeof window === 'undefined') return;
    if (value.trim()) {
      window.dispatchEvent(new CustomEvent('ray:ask', { detail: value.trim() }));
    }
    // Open the Ask Ray palette
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <div className="wrayth-chamfer border border-border bg-card/40 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-violet-400"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          Ask Ray
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-300/70 shrink-0" />
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder="Ask Ray anything…"
            className="flex-1 bg-transparent border-0 outline-none text-sm sm:text-base text-foreground placeholder:text-muted-foreground min-h-[36px]"
          />
          <button
            onClick={submit}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ⌘K
          </button>
        </div>
      </div>
    </motion.div>
  );
}

const LOCKED_LABELS: Record<string, { tier: string; feature: string }> = {
  vault:  { tier: 'PRO', feature: 'Unlimited Vault' },
  scan:   { tier: 'PRO', feature: 'Advanced Threat Scans' },
  watch:  { tier: 'PRO', feature: 'Dark Web Monitoring' },
};

function ProductCard({
  product,
  isLocked,
  stat,
  index
}: {
  product: { id: string; productLogo: string; title: string; description: string; path: string };
  isLocked: boolean;
  stat: { label: string; value: number };
  index: number;
}) {
  const theme = product.id as keyof typeof SAFESUITE_THEMES;
  const colors = SAFESUITE_THEMES[theme] || SAFESUITE_THEMES.scan;
  const lockLabel = LOCKED_LABELS[product.id];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * (index + 3) }}
      whileHover={{ y: -2 }}
      className="h-full group"
    >
      <Link to={product.path} className="block h-full">
        <GlowContainer
          theme={theme}
          className={cn(
            'p-4 sm:p-6 h-full transition-all duration-300',
            'group-hover:shadow-[0_10px_40px_-10px_hsl(262_60%_50%/0.35)] group-hover:border-violet-400/30',
            isLocked && 'opacity-70'
          )}
        >
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div
              className={cn(
                'p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-transform duration-300 group-hover:scale-105',
                colors.bg
              )}
            >
              <img
                src={product.productLogo}
                alt={product.title}
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg object-contain"
              />
            </div>
            {isLocked ? (
              <div className="flex flex-col items-end gap-0.5">
                <Badge variant="outline" className="gap-1 border-violet-400/40 text-violet-300 bg-violet-500/10 text-[10px] tracking-wider">
                  <Lock className="h-2.5 w-2.5" />
                  {lockLabel?.tier ?? 'PRO'}
                </Badge>
                {lockLabel?.feature && (
                  <span className="text-[10px] text-muted-foreground">{lockLabel.feature}</span>
                )}
              </div>
            ) : (
              <ArrowRight className="h-5 w-5 text-gray-500 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-violet-300" />
            )}
          </div>
          <h3 className="font-semibold text-white mb-1">{product.title}</h3>
          <p className="text-sm text-gray-400 mb-4">{product.description}</p>
          {!isLocked && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="text-sm"
            >
              <span className={cn('text-3xl font-bold', colors.text)}>{stat.value}</span>
              <span className="text-gray-400 ml-2">{stat.label}</span>
            </motion.div>
          )}
        </GlowContainer>
      </Link>
    </motion.div>
  );
}

function RecentActivityCard({ activities }: { activities: ActivityItem[] }) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'password': return KeyRound;
      case 'scan': return ScanSearch;
      case 'breach': return Globe;
      case 'asset': return Package;
      default: return CheckCircle;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'password': return 'text-primary bg-primary/10';
      case 'scan': return 'text-red-400 bg-red-500/10';
      case 'breach': return 'text-violet-400 bg-violet-500/10';
      case 'asset': return 'text-green-400 bg-green-500/10';
      default: return 'text-gray-400 bg-white/10';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <GlowContainer theme="scan" className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-red-400" />
          <h3 className="font-semibold text-white">Recent Activity</h3>
        </div>
        
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-3"
            >
              <Inbox className="h-8 w-8 text-gray-500" />
            </motion.div>
            <p className="text-sm text-gray-400">No recent activity</p>
            <p className="text-xs text-gray-500">Your actions will appear here</p>
          </div>
        ) : (
          <StaggerContainer>
            {activities.map((activity) => {
              const Icon = getIcon(activity.type);
              const colorClasses = getIconColor(activity.type);
              return (
                <StaggerItem key={activity.id}>
                  <motion.div 
                    className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0"
                    whileHover={{ x: 4 }}
                  >
                    <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0', colorClasses)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-200">{activity.text}</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </GlowContainer>
    </motion.div>
  );
}

const productCardsConfig = [
  {
    id: 'vault',
    feature: 'vault' as keyof TierFeatures,
    productLogo: safeSuiteProducts.vault.logo,
    title: 'Vault',
    description: 'Ray keeps every credential strong and unique.',
    path: '/app/passwords',
    statLabel: 'Stored'
  },
  {
    id: 'scan',
    feature: 'scan' as keyof TierFeatures,
    productLogo: safeSuiteProducts.scan.logo,
    title: 'Threats',
    description: 'Ray analyzes anything suspicious you send over.',
    path: '/app/threats',
    statLabel: 'Analyzed this month'
  },
  {
    id: 'watch',
    feature: 'watch' as keyof TierFeatures,
    productLogo: safeSuiteProducts.watch.logo,
    title: 'Identity Monitoring',
    description: 'Ray watches the open and dark web for your monitored identities.',
    path: '/app/exposure',
    statLabel: 'Monitored identities'
  },
];

/**
 * Renders either the "Protect your passwords" onboarding card (when the
 * vault is empty) or the full Morning Brief. This guarantees the Home
 * dashboard, Passwords page, and Recommendations engine all reflect the
 * same lifecycle stage instead of showing conflicting CTAs.
 */
function LifecycleAwareTop({ firstName }: { firstName: string }) {
  const { stage, passwordCount } = usePasswordLifecycle();
  if (stage === 'not_started') {
    // Ray owns ONE recommendation at this stage — the protection card.
    // MorningBrief still greets, but suppresses its recommendations list
    // so the user never sees "Protect your passwords" duplicated.
    return (
      <div data-tour="security-score" className="space-y-4 sm:space-y-6">
        <PasswordProtectionCard />
        <MorningBriefHero firstName={firstName} showFullBriefLink={false} hideRecommendations />
      </div>
    );
  }
  if (stage === 'imported') {
    return (
      <div data-tour="security-score" className="space-y-4 sm:space-y-6">
        <PasswordAnalyzingCard count={passwordCount} />
        <MorningBriefHero firstName={firstName} showFullBriefLink={false} hideRecommendations />
      </div>
    );
  }
  return (
    <div data-tour="security-score">
      <MorningBriefHero firstName={firstName} />
    </div>
  );
}

export default function WraythDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tier, tierConfig, isSubscribed } = useWraythSubscription();
  const { canUseFeature } = useFeatureAccess();
  const { entries } = useVault();
  const { isUnlocked, hasUserSetMasterPassword } = useMasterPassword();
  const vaultLocked = hasUserSetMasterPassword() && !isUnlocked;
  // Track 1: refresh Ray's unified findings from Vault/Scan/Watch on mount.
  useRayLiveSignals();

  // First-run gate: read onboarding state from the database. Using an effect
  // (instead of an early return) preserves React's rules of hooks below.
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('ray_profiles')
        .select('onboarded_at')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!active) return;
      if (!data?.onboarded_at) navigate('/onboarding/ray', { replace: true });
    })();
    return () => { active = false; };
  }, [user, navigate]);

  const [stats, setStats] = useState<DashboardStats>({
    passwordCount: 0,
    weakPasswordCount: 0,
    strongPasswordCount: 0,
    scanCount: 0,
    monitoredAssets: 0
  });
  const [breachedEmailCount, setBreachedEmailCount] = useState(0);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sealedVaultCount, setSealedVaultCount] = useState<number | null>(null);
  const [lastHealthCheckAt, setLastHealthCheckAt] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        const scansResult = await supabase
          .from('audit_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('resource_type', 'scan')
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
        
        // Watch: Query safeweb_assets table for accurate count
        const monitorsResult = await supabase
          .from('safeweb_assets')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'active');

        // Breached email assets — feeds Ray's CISO synthesis.
        const breachedAssetsResult = await supabase
          .from('safeweb_assets')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'active')
          .eq('asset_type', 'email')
          .gt('threats_found', 0);
        setBreachedEmailCount(breachedAssetsResult.count || 0);
        
        const auditLogsResult = await supabase
          .from('audit_logs')
          .select('id, action, details, created_at, resource_type')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        const weakCount = entries.filter(e => e.password_strength_score < 60).length;
        const strongCount = entries.filter(e => e.password_strength_score >= 80).length;

        setStats({
          passwordCount: entries.length,
          weakPasswordCount: weakCount,
          strongPasswordCount: strongCount,
          scanCount: scansResult.count || 0,
          monitoredAssets: monitorsResult.count || 0
        });

        const mappedActivities: ActivityItem[] = (auditLogsResult.data || []).map(log => {
          let text = log.action;
          let type: 'password' | 'scan' | 'breach' | 'asset' = 'password';
          const details = log.details as any;
          const actionLower = (log.action || '').toLowerCase();
          const resourceLower = (log.resource_type || '').toLowerCase();

          if (resourceLower === 'password_entry') {
            type = 'password';
            if (log.action === 'created') {
              text = `Ray saved a password${details?.title ? ` for ${details.title}` : ''}`;
            } else if (log.action === 'updated') {
              text = `Ray updated a password${details?.title ? ` for ${details.title}` : ''}`;
            } else if (log.action === 'deleted') {
              text = `Ray removed a password${details?.title ? ` for ${details.title}` : ''}`;
            }
          } else if (resourceLower === 'scan') {
            type = 'scan';
            text = 'Ray analyzed a threat';
          } else if (resourceLower === 'breach_check') {
            type = 'breach';
            text = 'Ray checked your monitored identities';
          } else if (actionLower.includes('ray') || actionLower.includes('assist')) {
            type = 'password';
            text = 'Ray conversation';
          } else {
            text = 'Ray activity';
          }

          return {
            id: log.id,
            type,
            text,
            timestamp: log.created_at
          };
        });

        setActivities(mappedActivities);
      } catch (error) {
        console.error('Failed to fetch dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, entries]);

  // Persistent sealed-vault metadata: row count + last health check timestamp.
  // Safe to fetch regardless of unlock state — this is metadata, not contents.
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const [{ count }, { data: lastCheck }] = await Promise.all([
        supabase
          .from('safepass_entries')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('password_audit_logs')
          .select('created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (!active) return;
      setSealedVaultCount(count ?? 0);
      setLastHealthCheckAt(lastCheck?.created_at ?? null);
    })();
    return () => { active = false; };
  }, [user]);


  // Persistent inventory count — prefers safe metadata (row count from DB)
  // so the tile stays accurate even when the vault is sealed.
  const persistentVaultCount = sealedVaultCount ?? stats.passwordCount;

  const getStatForProduct = (productId: string): { label: string; value: number } => {
    switch (productId) {
      case 'vault':
        return {
          label: vaultLocked ? 'Sealed · unlock to analyze health' : 'Stored',
          value: persistentVaultCount,
        };
      case 'scan':
        return { label: 'Scans this month', value: stats.scanCount };
      case 'watch':
        return { label: 'Identities watched', value: stats.monitoredAssets };
      default:
        return { label: '', value: 0 };
    }
  };


  // Ray's continuity briefing — feels like returning to a teammate, not opening software.
  const totalIssues = stats.weakPasswordCount;
  const score = stats.passwordCount === 0
    ? 100
    : Math.max(0, Math.min(100, Math.round(100 - (stats.weakPasswordCount / stats.passwordCount) * 40 + (stats.strongPasswordCount / stats.passwordCount) * 20)));
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '';

  // "Since we last talked..." — continuity bullets, leading with what Ray did.
  const sinceLines: { tone: 'good' | 'warn'; text: string }[] = [];
  if (stats.strongPasswordCount > 0) {
    sinceLines.push({ tone: 'good', text: `${stats.strongPasswordCount} password${stats.strongPasswordCount === 1 ? '' : 's'} looking strong` });
  }
  sinceLines.push({ tone: 'good', text: 'No new breaches detected' });
  if (stats.monitoredAssets > 0) {
    sinceLines.push({ tone: 'good', text: `Watching ${stats.monitoredAssets} identit${stats.monitoredAssets === 1 ? 'y' : 'ies'} for you` });
  }
  if (stats.weakPasswordCount > 0) {
    sinceLines.push({ tone: 'warn', text: `${stats.weakPasswordCount} password${stats.weakPasswordCount === 1 ? '' : 's'} I'd like to strengthen with you` });
  } else {
    sinceLines.push({ tone: 'good', text: 'Everything looks healthy' });
  }

  // Pick the single most urgent account so Ray's CISO directive can name it.
  const weakestEntry = !vaultLocked
    ? [...entries]
        .filter((e) => e.title && typeof e.password_strength_score === 'number')
        .sort((a, b) => (a.password_strength_score ?? 100) - (b.password_strength_score ?? 100))[0]
    : undefined;
  const topAccountTitle = weakestEntry?.title;
  const topAccountReason: 'weak' | undefined =
    weakestEntry && (weakestEntry.password_strength_score ?? 100) < 60 ? 'weak' : undefined;

  const cisoDirective = nextBestAction({
    vaultCount: persistentVaultCount,
    weakCount: stats.weakPasswordCount,
    strongCount: stats.strongPasswordCount,
    breachedEmailCount,
    monitoredAssets: stats.monitoredAssets,
    monitoredEmailsWithoutVaultLink: 0,
    vaultUnlocked: !vaultLocked,
    topAccountTitle,
    topAccountReason,
  });

  return (
    <div className="min-h-screen bg-background -m-4 lg:-m-6 p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* 1. CISO hero — the single answer to "what would you tell me to do next?"
           Shows when we have inventory OR any monitored/breach signal, even sealed.
           Ray's copy is confidence-aware and explains what he can and can't yet see. */}
      {(persistentVaultCount > 0 || breachedEmailCount > 0 || stats.monitoredAssets > 0) && (
        <CisoNextAction directive={cisoDirective} />
      )}

      {/* 2. Morning Brief (lifecycle-aware) — narrative context under the directive. */}
      <LifecycleAwareTop firstName={firstName} />

      {/* 2b. Vault: encrypted black box until unlocked. */}
      {vaultLocked && (
        <VaultLockedCard
          vaultCount={persistentVaultCount}
          lastHealthCheckAt={lastHealthCheckAt}
        />
      )}

      {/* 2c. Cross-domain context bridge — Ray names what he's missing. */}
      <HomeContextBridge
        vaultLockedCardVisible={vaultLocked}
        vaultCount={stats.passwordCount}
      />


      {/* 2d. Capability spine — surfaces devices, priorities, live activity,
           M365, org memory, and agent releases so Home reflects everything
           Ray has been built to do. */}
      <HomeCapabilityTiles />

      {/* 2. Ask Ray — reinforces AI-first experience */}
      <div data-tour="quick-actions">
        <QuickActionsCard />
      </div>

      {/* 3. Outcome tiles — Vault / Threats / Exposure */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
        {productCardsConfig.map((product, index) => (
          <div key={product.id} data-tour={product.id}>
            <ProductCard
              product={product}
              isLocked={!canUseFeature(product.feature)}
              stat={getStatForProduct(product.id)}
              index={index}
            />
          </div>
        ))}
      </div>

      {/* 4. Recommendations — Ray watching + notices + account health.
          Password count mirrors the Vault tile above (entry count is not
          secret; only contents are protected by the zero-knowledge vault). */}
      <RayWatchingCard
        passwordCount={persistentVaultCount}
        identityCount={stats.monitoredAssets}
        threatCount={0}
      />
      <RayNoticesPanel variant="hero" />
      {!vaultLocked && <AccountHealthPanel />}

      {/* Usage limit banners (only render when hit) */}
      <div className="space-y-2">
        <UsageLimitBanner feature="scan" />
        <UsageLimitBanner feature="vault" />
      </div>

      {/* 5. Timeline — compressed today-only tail. Deep history lives at /app/timeline. */}
      <div className="wrayth-chamfer border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-violet-300/80">Today so far</div>
            <h2 className="mt-1 text-lg font-light text-foreground">What Ray touched today</h2>
          </div>
          <Link to="/app/timeline" className="text-xs text-violet-300 hover:text-violet-200 inline-flex items-center gap-1">
            Full timeline <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <RayTimeline limit={5} embedded />
      </div>

      {/* 6. Getting Started → Security Trends once onboarding is done. */}
      <OnboardingOrTrends />

      {/* 7. Upgrade — framed as Ray's recommendation */}
      <SubscriptionBanner />


      {/* Product Tour */}
      <ProductTour 
        tourId="safesuite-intro" 
        steps={SAFESUITE_TOUR_STEPS}
        autoStart={true}
      />
    </div>
  );
}
