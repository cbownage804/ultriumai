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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UsageLimitBanner } from '@/components/safesuite/SafeSuitePaywall';
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
  Inbox
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
    if (stats.passwordCount === 0) return 100; // No passwords = no risk
    const strongRatio = stats.strongPasswordCount / stats.passwordCount;
    const weakRatio = stats.weakPasswordCount / stats.passwordCount;
    return Math.round(100 - (weakRatio * 40) + (strongRatio * 20));
  };

  const score = Math.max(0, Math.min(100, calculateScore()));
  const scoreColor = score >= 80 ? 'text-success' : score >= 60 ? 'text-warning' : 'text-destructive';

  return (
    <Card className="col-span-full md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Score
        </CardTitle>
        <CardDescription>
          Your overall security health across all SafeSuite products
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-8">
          <div className="relative">
            <svg className="h-32 w-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                className="stroke-muted"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                className={cn('transition-all duration-500', scoreColor.replace('text-', 'stroke-'))}
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${(score / 100) * 352} 352`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn('text-3xl font-bold', scoreColor)}>{score}</span>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            {stats.passwordCount === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Inbox className="h-4 w-4" />
                <span>Add passwords to see security insights</span>
              </div>
            ) : (
              <>
                {stats.strongPasswordCount > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span>{stats.strongPasswordCount} strong password{stats.strongPasswordCount !== 1 ? 's' : ''} in vault</span>
                  </div>
                )}
                {stats.weakPasswordCount > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span>{stats.weakPasswordCount} weak password{stats.weakPasswordCount !== 1 ? 's' : ''} need attention</span>
                  </div>
                )}
                {stats.weakPasswordCount === 0 && stats.passwordCount > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span>No weak passwords detected</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Link to="/safesuite/pass">
          <Button variant="outline" className="w-full justify-start gap-2">
            <KeyRound className="h-4 w-4" />
            Add New Password
          </Button>
        </Link>
        <Link to="/safesuite/scan">
          <Button variant="outline" className="w-full justify-start gap-2">
            <ScanSearch className="h-4 w-4" />
            Scan a URL
          </Button>
        </Link>
        <Link to="/safesuite/web">
          <Button variant="outline" className="w-full justify-start gap-2">
            <Globe className="h-4 w-4" />
            Check for Breaches
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function ProductCard({ 
  product,
  isLocked,
  stat
}: { 
  product: { id: string; icon: any; title: string; description: string; path: string; color: string; bgColor: string };
  isLocked: boolean;
  stat: { label: string; value: number };
}) {
  const Icon = product.icon;

  return (
    <Link to={product.path}>
      <Card className={cn(
        'h-full transition-all duration-200 hover:shadow-md',
        isLocked && 'opacity-60'
      )}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center', product.bgColor)}>
              <Icon className={cn('h-6 w-6', product.color)} />
            </div>
            {isLocked ? (
              <Badge variant="secondary" className="gap-1">
                <Lock className="h-3 w-3" />
                Upgrade
              </Badge>
            ) : (
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <h3 className="font-semibold mb-1">{product.title}</h3>
          <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
          {!isLocked && (
            <div className="text-sm">
              <span className="text-2xl font-bold">{stat.value}</span>
              <span className="text-muted-foreground ml-1">{stat.label}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
            <p className="text-xs">Your actions will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = getIcon(activity.type);
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm">{activity.text}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const productCardsConfig = [
  {
    id: 'safepass',
    feature: 'safepass' as keyof TierFeatures,
    icon: KeyRound,
    title: 'SafePass',
    description: 'Password Manager',
    path: '/safesuite/pass',
    statLabel: 'Passwords',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  },
  {
    id: 'safescan',
    feature: 'safescan' as keyof TierFeatures,
    icon: ScanSearch,
    title: 'SafeScan',
    description: 'Security Scanner',
    path: '/safesuite/scan',
    statLabel: 'Scans this month',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10'
  },
  {
    id: 'safeweb',
    feature: 'safeweb' as keyof TierFeatures,
    icon: Globe,
    title: 'SafeWeb',
    description: 'Dark Web Monitoring',
    path: '/safesuite/web',
    statLabel: 'Assets monitored',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10'
  },
  {
    id: 'safetrack',
    feature: 'safetrack' as keyof TierFeatures,
    icon: Package,
    title: 'SafeTrack',
    description: 'Asset Management',
    path: '/safesuite/track',
    statLabel: 'Assets tracked',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10'
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
        // Fetch real counts from database using simple queries
        const scansResult = await supabase
          .from('audit_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('resource_type', 'scan')
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
        
        const monitorsResult = await supabase
          .from('dark_web_monitors')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
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

        // Calculate password stats from entries
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

        // Map audit logs to activities
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
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground">
            Here's your security overview for today
          </p>
        </div>
        {!isSubscribed && (
          <Link to="/safesuite/billing">
            <Button className="gap-2">
              <Sparkles className="h-4 w-4" />
              Upgrade to Pro
            </Button>
          </Link>
        )}
      </div>

      {/* Usage limit banners */}
      <div className="space-y-2">
        <UsageLimitBanner feature="safescan" />
        <UsageLimitBanner feature="safepass" />
      </div>

      {/* Main grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Security Score */}
        <SecurityScoreCard stats={stats} />

        {/* Quick Actions */}
        <QuickActionsCard />

        {/* Product Cards */}
        {productCardsConfig.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isLocked={!canUseFeature(product.feature)}
            stat={getStatForProduct(product.id)}
          />
        ))}

        {/* Recent Activity */}
        <RecentActivityCard activities={activities} />
      </div>
    </div>
  );
}
