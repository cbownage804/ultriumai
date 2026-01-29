/**
 * SafeSuite Dashboard - Unified overview of all security tools
 * All data is fetched from real database - no mock data
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSafeSuiteSubscription, useFeatureAccess } from '@/hooks/useSafeSuite';
import { useSafePass } from '@/hooks/useSafePass';
import { SAFESUITE_TIERS, FEATURE_DESCRIPTIONS, TierFeatures } from '@/config/safeSuiteTiers';
import { supabase } from '@/integrations/supabase/client';
import { safeSuiteProducts } from '@/components/safesuite/SafeSuiteProductIcons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UsageLimitBanner } from '@/components/safesuite/SafeSuitePaywall';
import { SubscriptionBanner } from '@/components/safesuite/SubscriptionBanner';
import { OnboardingChecklist } from '@/components/onboarding';
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
      <GlowContainer theme="safeweb" className="col-span-full md:col-span-2 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-violet-400" />
          <h3 className="font-semibold text-white">Security Score</h3>
        </div>
        <p className="text-gray-400 text-sm mb-6">
          Your overall security health across all SafeSuite products
        </p>
        
        <div className="flex items-center gap-8">
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
    >
      <GlowContainer theme="safepass" className="p-6 h-full">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-amber-400" />
          <h3 className="font-semibold text-white">Quick Actions</h3>
        </div>
        
        <div className="space-y-3">
          {[
            { to: '/safesuite/pass', icon: safeSuiteProducts.safepass.logo, label: 'Add New Password', theme: 'safepass' },
            { to: '/safesuite/scan', icon: safeSuiteProducts.safescan.logo, label: 'Scan a URL', theme: 'safescan' },
            { to: '/safesuite/web', icon: safeSuiteProducts.safeweb.logo, label: 'Check for Breaches', theme: 'safeweb' }
          ].map((action, idx) => (
            <motion.div
              key={action.to}
              whileHover={{ x: 4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link to={action.to}>
                <Button 
                  variant="outline" 
                  className={cn(
                    'w-full justify-start gap-3 h-12',
                    'bg-white/5 border-white/10 hover:bg-white/10',
                    'transition-all duration-200'
                  )}
                >
                  <img src={action.icon} alt="" className="h-5 w-5 rounded object-contain" />
                  <span className="text-gray-200">{action.label}</span>
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
      whileHover={{ y: -4, scale: 1.02 }}
    >
      <Link to={product.path}>
        <GlowContainer 
          theme={theme}
          className={cn(
            'p-6 h-full transition-all duration-300',
            isLocked && 'opacity-60'
          )}
        >
          <div className="flex items-start justify-between mb-4">
            <motion.div
              whileHover={{ rotate: 5, scale: 1.1 }}
              className={cn(
                'p-2 rounded-xl',
                colors.bg
              )}
            >
              <img 
                src={product.productLogo} 
                alt={product.title} 
                className="h-10 w-10 rounded-lg object-contain"
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
    title: 'SafePass',
    description: 'Password Manager',
    path: '/safesuite/pass',
    statLabel: 'Passwords'
  },
  {
    id: 'safescan',
    feature: 'safescan' as keyof TierFeatures,
    productLogo: safeSuiteProducts.safescan.logo,
    title: 'SafeScan',
    description: 'Security Scanner',
    path: '/safesuite/scan',
    statLabel: 'Scans this month'
  },
  {
    id: 'safeweb',
    feature: 'safeweb' as keyof TierFeatures,
    productLogo: safeSuiteProducts.safeweb.logo,
    title: 'SafeWeb',
    description: 'Dark Web Monitoring',
    path: '/safesuite/web',
    statLabel: 'Assets monitored'
  },
  {
    id: 'safetrack',
    feature: 'safetrack' as keyof TierFeatures,
    productLogo: safeSuiteProducts.safetrack.logo,
    title: 'SafeTrack',
    description: 'Asset Tracking',
    path: '/safesuite/track',
    statLabel: 'Assets tracked'
  }
];

export default function SafeSuiteDashboard() {
  const { user } = useAuth();
  const { tier, tierConfig, isSubscribed } = useSafeSuiteSubscription();
  const { canUseFeature } = useFeatureAccess();
  const { entries } = useSafePass();
  
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
        
        // SafeWeb: Query safeweb_assets table for accurate count
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] -m-6 p-6 space-y-6">
      {/* Welcome header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back!</h1>
          <p className="text-gray-400">
            Here's your security overview for today
          </p>
        </div>
        {!isSubscribed && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/safesuite/billing">
              <Button className="gap-2 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-lg shadow-violet-500/20">
                <Sparkles className="h-4 w-4" />
                Upgrade to Pro
              </Button>
            </Link>
          </motion.div>
        )}
      </motion.div>

      {/* Subscription Status Banner */}
      <SubscriptionBanner />

      {/* Onboarding Checklist for new users */}
      <OnboardingChecklist product="safesuite" />

      {/* Usage limit banners */}
      <div className="space-y-2">
        <UsageLimitBanner feature="safescan" />
        <UsageLimitBanner feature="safepass" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AnimatedStatsCard
          icon={<KeyRound className="h-5 w-5" />}
          label="Passwords"
          value={stats.passwordCount}
          theme="safepass"
          delay={0}
        />
        <AnimatedStatsCard
          icon={<ScanSearch className="h-5 w-5" />}
          label="Scans"
          value={stats.scanCount}
          theme="safescan"
          delay={0.1}
        />
        <AnimatedStatsCard
          icon={<Globe className="h-5 w-5" />}
          label="Monitored"
          value={stats.monitoredAssets}
          theme="safeweb"
          delay={0.2}
        />
        <AnimatedStatsCard
          icon={<Package className="h-5 w-5" />}
          label="Assets"
          value={stats.trackedAssets}
          theme="safetrack"
          delay={0.3}
        />
      </div>

      {/* Main grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Security Score */}
        <div className="md:col-span-2">
          <SecurityScoreCard stats={stats} />
        </div>

        {/* Quick Actions */}
        <QuickActionsCard />

        {/* Product Cards */}
        {productCardsConfig.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            isLocked={!canUseFeature(product.feature)}
            stat={getStatForProduct(product.id)}
            index={index}
          />
        ))}

        {/* Recent Activity */}
        <RecentActivityCard activities={activities} />
      </div>
    </div>
  );
}
