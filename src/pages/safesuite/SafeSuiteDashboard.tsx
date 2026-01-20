/**
 * SafeSuite Dashboard - Unified overview of all security tools
 */

import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSafeSuiteSubscription, useFeatureAccess } from '@/hooks/useSafeSuite';
import { SAFESUITE_TIERS, FEATURE_DESCRIPTIONS, TierFeatures } from '@/config/safeSuiteTiers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

const productCards = [
  {
    id: 'safepass',
    feature: 'safepass' as keyof TierFeatures,
    icon: KeyRound,
    title: 'SafePass',
    description: 'Password Manager',
    path: '/safesuite/pass',
    stat: { label: 'Passwords', value: 0 },
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
    stat: { label: 'Scans this month', value: 0 },
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
    stat: { label: 'Assets monitored', value: 0 },
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
    stat: { label: 'Assets tracked', value: 0 },
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10'
  }
];

function SecurityScoreCard() {
  // TODO: Calculate actual security score from vault data
  const score = 78;
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
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>Strong passwords in vault</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>No breaches detected</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span>2 weak passwords need attention</span>
            </div>
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
  isLocked 
}: { 
  product: typeof productCards[0];
  isLocked: boolean;
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
              <span className="text-2xl font-bold">{product.stat.value}</span>
              <span className="text-muted-foreground ml-1">{product.stat.label}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function RecentActivityCard() {
  // TODO: Fetch actual activity from backend
  const activities = [
    { icon: KeyRound, text: 'Added password for github.com', time: '2 hours ago' },
    { icon: ScanSearch, text: 'Scanned suspicious email link', time: '5 hours ago' },
    { icon: CheckCircle, text: 'No breaches found for your email', time: '1 day ago' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, i) => {
            const Icon = activity.icon;
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm">{activity.text}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SafeSuiteDashboard() {
  const { user } = useAuth();
  const { tier, tierConfig, isSubscribed } = useSafeSuiteSubscription();
  const { canUseFeature } = useFeatureAccess();

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
        <SecurityScoreCard />

        {/* Quick Actions */}
        <QuickActionsCard />

        {/* Product Cards */}
        {productCards.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isLocked={!canUseFeature(product.feature)}
          />
        ))}

        {/* Recent Activity */}
        <RecentActivityCard />
      </div>
    </div>
  );
}
