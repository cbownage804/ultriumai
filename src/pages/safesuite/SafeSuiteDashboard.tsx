/**
 * Wrayth Dashboard - Unified overview of all security tools
 * All data is fetched from real database - no mock data
 */

import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
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
import { OnboardingChecklist, ProductTour } from '@/components/onboarding';
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

interface DashboardStats {
  passwordCount: number;
  weakPasswordCount: number;
  strongPasswordCount: number;
  scanCount: number;
  monitoredAssets: number;
  trackedAssets: number;
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
  const scoreColor = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400';
  const strokeColor = score >= 80 ? 'stroke-emerald-500' : score >= 60 ? 'stroke-yellow-500' : 'stroke-red-500';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <GlowContainer theme="safeweb" className="col-span-full md:col-span-2 p-4 sm:p-6">
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
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
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
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="h-full"
    >
      <GlowContainer theme="safepass" className="p-4 sm:p-6 h-full">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
          <h3 className="font-semibold text-white text-sm sm:text-base">Quick Actions</h3>
        </div>
        
        <div className="space-y-2 sm:space-y-3">
          {[
            { to: '/safesuite/pass', icon: safeSuiteProducts.safepass.logo, label: 'Add New Password', theme: 'safepass' },
            { to: '/safesuite/scan', icon: safeSuiteProducts.safescan.logo, label: 'Scan a URL', theme: 'safescan' },
            { to: '/safesuite/web', icon: safeSuiteProducts.safeweb.logo, label: 'Check for Breaches', theme: 'safeweb' }
          ].map((action, idx) => (
            <motion.div
              key={action.to}
              whileHover={{ x: 4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link to={action.to}>
                <Button 
                  variant="outline" 
                  className={cn(
                    'w-full justify-start gap-2 sm:gap-3 min-h-[44px] sm:h-12 px-3 sm:px-4',
                    'bg-white/5 border-white/10 hover:bg-white/10',
                    'transition-all duration-200 text-sm sm:text-base'
                  )}
                >
                  <img src={action.icon} alt="" className="h-4 w-4 sm:h-5 sm:w-5 rounded object-contain flex-shrink-0" />
                  <span className="text-gray-200 truncate">{action.label}</span>
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </GlowContainer>
    </motion.div>
  );
}

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
  const colors = SAFESUITE_THEMES[theme] || SAFESUITE_THEMES.safescan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * (index + 3) }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="h-full"
    >
      <Link to={product.path} className="block h-full">
        <GlowContainer 
          theme={theme}
          className={cn(
            'p-4 sm:p-6 h-full transition-all duration-300',
            isLocked && 'opacity-60'
          )}
        >
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <motion.div
              whileHover={{ rotate: 5, scale: 1.1 }}
              className={cn(
                'p-1.5 sm:p-2 rounded-lg sm:rounded-xl',
                colors.bg
              )}
            >
              <img 
                src={product.productLogo} 
                alt={product.title} 
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg object-contain"
              />
            </motion.div>
            {isLocked ? (
              <Badge variant="secondary" className="gap-1 bg-white/10">
                <Lock className="h-3 w-3" />
                Upgrade
              </Badge>
            ) : (
              <ArrowRight className="h-5 w-5 text-gray-500" />
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
      case 'password': return 'text-amber-400 bg-amber-500/10';
      case 'scan': return 'text-red-400 bg-red-500/10';
      case 'breach': return 'text-violet-400 bg-violet-500/10';
      case 'asset': return 'text-emerald-400 bg-emerald-500/10';
      default: return 'text-gray-400 bg-white/10';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <GlowContainer theme="safescan" className="p-6">
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
    id: 'safepass',
    feature: 'safepass' as keyof TierFeatures,
    productLogo: safeSuiteProducts.safepass.logo,
    title: 'Vault',
    description: 'Password Manager',
    path: '/safesuite/pass',
    statLabel: 'Passwords'
  },
  {
    id: 'safescan',
    feature: 'safescan' as keyof TierFeatures,
    productLogo: safeSuiteProducts.safescan.logo,
    title: 'Scan',
    description: 'Security Scanner',
    path: '/safesuite/scan',
    statLabel: 'Scans this month'
  },
  {
    id: 'safeweb',
    feature: 'safeweb' as keyof TierFeatures,
    productLogo: safeSuiteProducts.safeweb.logo,
    title: 'Watch',
    description: 'Dark Web Monitoring',
    path: '/safesuite/web',
    statLabel: 'Assets monitored'
  },
];

export default function WraythDashboard() {
  const { user } = useAuth();
  const { tier, tierConfig, isSubscribed } = useWraythSubscription();
  const { canUseFeature } = useFeatureAccess();
  const { entries } = useVault();

  // First-run: send users to Ray's onboarding before they land here.
  if (user && typeof window !== 'undefined' &&
      localStorage.getItem(`wrayth.ray.onboarded:${user.id}`) !== 'true') {
    return <Navigate to="/onboarding/ray" replace />;
  }

  
  const [stats, setStats] = useState<DashboardStats>({
    passwordCount: 0,
    weakPasswordCount: 0,
    strongPasswordCount: 0,
    scanCount: 0,
    monitoredAssets: 0,
    trackedAssets: 0
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        
        const assetsResult = await supabase
          .from('assets')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
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
          monitoredAssets: monitorsResult.count || 0,
          trackedAssets: assetsResult.count || 0
        });

        const mappedActivities: ActivityItem[] = (auditLogsResult.data || []).map(log => {
          let text = log.action;
          let type: 'password' | 'scan' | 'breach' | 'asset' = 'password';
          
          if (log.resource_type === 'password_entry') {
            type = 'password';
            const details = log.details as any;
            if (log.action === 'created') {
              text = `Added password${details?.title ? ` for ${details.title}` : ''}`;
            } else if (log.action === 'updated') {
              text = `Updated password${details?.title ? ` for ${details.title}` : ''}`;
            } else if (log.action === 'deleted') {
              text = `Deleted password${details?.title ? ` for ${details.title}` : ''}`;
            }
          } else if (log.resource_type === 'scan') {
            type = 'scan';
            text = 'Completed security scan';
          } else if (log.resource_type === 'breach_check') {
            type = 'breach';
            text = 'Ran breach check';
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

  const getStatForProduct = (productId: string): { label: string; value: number } => {
    switch (productId) {
      case 'safepass':
        return { label: 'Passwords', value: stats.passwordCount };
      case 'safescan':
        return { label: 'Scans this month', value: stats.scanCount };
      case 'safeweb':
        return { label: 'Assets monitored', value: stats.monitoredAssets };
      case 'safetrack':
        return { label: 'Assets tracked', value: stats.trackedAssets };
      default:
        return { label: '', value: 0 };
    }
  };

  // Ray's briefing — derived from real stats so Ray "already knows".
  const totalIssues = stats.weakPasswordCount;
  const score = stats.passwordCount === 0
    ? 100
    : Math.max(0, Math.min(100, Math.round(100 - (stats.weakPasswordCount / stats.passwordCount) * 40 + (stats.strongPasswordCount / stats.passwordCount) * 20)));
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '';

  const briefingLines: string[] = [];
  if (stats.weakPasswordCount > 0) {
    briefingLines.push(`${stats.weakPasswordCount} password${stats.weakPasswordCount === 1 ? '' : 's'} in your vault could be stronger.`);
  }
  if (stats.monitoredAssets === 0) {
    briefingLines.push('You haven\'t set up Watch yet — I can monitor your identities for breach exposure when you\'re ready.');
  } else {
    briefingLines.push(`I\'m watching ${stats.monitoredAssets} identit${stats.monitoredAssets === 1 ? 'y' : 'ies'} for exposure.`);
  }
  if (stats.scanCount > 0) {
    briefingLines.push(`I\'ve run ${stats.scanCount} scan${stats.scanCount === 1 ? '' : 's'} this month.`);
  }
  if (briefingLines.length === 0) {
    briefingLines.push('Everything looks healthy. Nothing needs your attention right now.');
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] -m-4 lg:-m-6 p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Ray's briefing */}
      <motion.section
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="wrayth-chamfer border border-[#3A3A3A] bg-[#181818] p-5 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Ray · briefing
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#F3F3F3]">
              {greeting}{firstName ? `, ${firstName}` : ''}.
            </h1>
            <p className="text-sm text-muted-foreground">Here's what I noticed today.</p>
            <ul className="space-y-1.5 text-sm text-[#F3F3F3] pt-1">
              {briefingLines.map((line, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-muted-foreground select-none">·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground pt-2">What would you like to work on?</p>
          </div>
          <div className="hidden sm:flex flex-col items-end shrink-0">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Security score</div>
            <div className="text-4xl font-semibold text-[#F3F3F3] tabular-nums">{score}<span className="text-lg text-muted-foreground">%</span></div>
            {totalIssues > 0 && (
              <div className="text-[11px] text-primary mt-1">{totalIssues} item{totalIssues === 1 ? '' : 's'} to address</div>
            )}
          </div>
        </div>
        {!isSubscribed && (
          <div className="mt-5 pt-5 border-t border-[#3A3A3A] flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">Unlock more capabilities and more questions per day.</span>
            <Link to="/safesuite/billing">
              <Button variant="outline" className="wrayth-chamfer-sm border-primary/40 text-primary hover:bg-primary/10">
                Upgrade
              </Button>
            </Link>
          </div>
        )}
      </motion.section>

      {/* Subscription Status Banner */}
      <SubscriptionBanner />

      {/* Onboarding Checklist for new users */}
      <OnboardingChecklist product="safesuite" />

      {/* Usage limit banners */}
      <div className="space-y-2">
        <UsageLimitBanner feature="safescan" />
        <UsageLimitBanner feature="safepass" />
      </div>

      {/* Stats row - responsive grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <AnimatedStatsCard
          icon={<KeyRound className="h-4 w-4 sm:h-5 sm:w-5" />}
          label="Passwords"
          value={stats.passwordCount}
          theme="safepass"
          delay={0}
        />
        <AnimatedStatsCard
          icon={<ScanSearch className="h-4 w-4 sm:h-5 sm:w-5" />}
          label="Scans"
          value={stats.scanCount}
          theme="safescan"
          delay={0.1}
        />
        <AnimatedStatsCard
          icon={<Globe className="h-4 w-4 sm:h-5 sm:w-5" />}
          label="Monitored"
          value={stats.monitoredAssets}
          theme="safeweb"
          delay={0.2}
        />
      </div>

      {/* Main grid - responsive layout */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Security Score - full width on mobile, 2 cols on tablet+ */}
        <div className="col-span-1 md:col-span-2" data-tour="security-score">
          <SecurityScoreCard stats={stats} />
        </div>

        {/* Quick Actions */}
        <div className="col-span-1" data-tour="quick-actions">
          <QuickActionsCard />
        </div>

        {/* Product Cards - responsive */}
        {productCardsConfig.map((product, index) => (
          <div key={product.id} className="col-span-1" data-tour={product.id}>
            <ProductCard
              product={product}
              isLocked={!canUseFeature(product.feature)}
              stat={getStatForProduct(product.id)}
              index={index}
            />
          </div>
        ))}

        {/* Recent Activity */}
        <div className="col-span-1 md:col-span-2 lg:col-span-1">
          <RecentActivityCard activities={activities} />
        </div>
      </div>

      {/* Product Tour */}
      <ProductTour 
        tourId="safesuite-intro" 
        steps={SAFESUITE_TOUR_STEPS}
        autoStart={true}
      />
    </div>
  );
}
