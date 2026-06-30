import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { 
  CreditCard, 
  Crown, 
  Calendar, 
  ArrowUpRight, 
  Settings, 
  RefreshCw,
  Check,
  Loader2,
  ExternalLink,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface UserBillingDashboardProps {
  product?: 'safesuite' | 'ai_studio' | 'vanguard';
}

export const UserBillingDashboard = ({ product = 'safesuite' }: UserBillingDashboardProps) => {
  const { 
    subscribed, 
    tier, 
    subscriptionEnd, 
    productAccess, 
    loading: subscriptionLoading,
    refreshSubscription 
  } = useUserSubscription();
  const { loading: checkoutLoading, openCustomerPortal, startCheckout } = useStripeCheckout();
  const [refreshing, setRefreshing] = useState(false);

  const currentAccess = productAccess[product];
  const currentTier = currentAccess?.tier || tier || 'free';
  const expiresAt = currentAccess?.expires_at || subscriptionEnd;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshSubscription();
    setRefreshing(false);
  };

  const tierConfig: Record<string, { name: string; color: string; features: string[] }> = {
    free: {
      name: 'Free',
      color: 'bg-muted text-muted-foreground',
      features: ['25 password entries', '5 threat scans/month', 'Basic dark web alerts'],
    },
    pro: {
      name: 'Pro',
      color: 'bg-emerald-500 text-white',
      features: ['Unlimited passwords', '100 threat scans/month', '5 monitored assets', 'Priority support'],
    },
    business: {
      name: 'Business',
      color: 'bg-blue-500 text-white',
      features: ['Everything in Pro', 'Unlimited team members', 'Shared vaults', 'SSO integration'],
    },
    enterprise: {
      name: 'Enterprise',
      color: 'bg-purple-500 text-white',
      features: ['Everything in Business', 'Dedicated support', 'Custom integrations', 'SLA guarantee'],
    },
  };

  const currentTierConfig = tierConfig[currentTier] || tierConfig.free;

  // Usage stats (mock - would come from API)
  const usageStats = {
    passwords: { used: currentTier === 'free' ? 18 : 156, limit: currentTier === 'free' ? 25 : null },
    scans: { used: currentTier === 'free' ? 3 : 42, limit: currentTier === 'free' ? 5 : 100 },
    assets: { used: currentTier === 'free' ? 0 : 3, limit: currentTier === 'free' ? 0 : 5 },
  };

  const getProgressValue = (used: number, limit: number | null) => {
    if (!limit) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Your Subscription
            </CardTitle>
            <CardDescription>Manage your Wrayth subscription</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Tier Display */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${currentTierConfig.color}`}>
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold">{currentTierConfig.name}</h3>
                  <Badge className={currentTierConfig.color}>{subscribed ? 'Active' : 'Free'}</Badge>
                </div>
                {expiresAt && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {subscribed ? 'Renews' : 'Expires'}: {format(new Date(expiresAt), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {subscribed ? (
                <Button variant="outline" onClick={openCustomerPortal} disabled={checkoutLoading}>
                  {checkoutLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Settings className="h-4 w-4 mr-2" />
                  )}
                  Manage Subscription
                </Button>
              ) : (
                <Button asChild>
                  <Link to="/pricing">
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Upgrade
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Features Included */}
          <div>
            <h4 className="text-sm font-medium mb-3">Features included:</h4>
            <div className="grid grid-cols-2 gap-2">
              {currentTierConfig.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-emerald-500" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Usage This Month
          </CardTitle>
          <CardDescription>Track your feature usage and limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Passwords */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Password Entries</span>
              <span className="text-muted-foreground">
                {usageStats.passwords.used}
                {usageStats.passwords.limit && ` / ${usageStats.passwords.limit}`}
                {!usageStats.passwords.limit && ' (Unlimited)'}
              </span>
            </div>
            {usageStats.passwords.limit && (
              <Progress value={getProgressValue(usageStats.passwords.used, usageStats.passwords.limit)} />
            )}
          </div>

          <Separator />

          {/* Threat Scans */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Threat Scans</span>
              <span className="text-muted-foreground">
                {usageStats.scans.used}
                {usageStats.scans.limit && ` / ${usageStats.scans.limit}`}
              </span>
            </div>
            {usageStats.scans.limit && (
              <Progress value={getProgressValue(usageStats.scans.used, usageStats.scans.limit)} />
            )}
          </div>

          <Separator />

          {/* Monitored Assets */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Monitored Assets</span>
              <span className="text-muted-foreground">
                {usageStats.assets.used}
                {usageStats.assets.limit ? ` / ${usageStats.assets.limit}` : ' (Not available)'}
              </span>
            </div>
            {usageStats.assets.limit && usageStats.assets.limit > 0 && (
              <Progress value={getProgressValue(usageStats.assets.used, usageStats.assets.limit)} />
            )}
          </div>

          {currentTier === 'free' && (
            <div className="pt-4">
              <Button className="w-full" asChild>
                <Link to="/pricing">
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Upgrade for Unlimited Access
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method & Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-500" />
            Payment & Billing
          </CardTitle>
          <CardDescription>Manage payment methods and view invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {subscribed ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Manage your payment methods, view invoices, and update billing information through the Stripe Customer Portal.
              </p>
              <Button variant="outline" onClick={openCustomerPortal} disabled={checkoutLoading}>
                {checkoutLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Open Billing Portal
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              You're currently on the free plan. Upgrade to access billing management and invoice history.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Prompt for Free Users */}
      {currentTier === 'free' && (
        <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">Unlock Full Security</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upgrade to Wrayth Pro for unlimited passwords, advanced threat protection, and priority support.
                </p>
                <ul className="space-y-1 mb-4">
                  {['Unlimited password storage', 'Dark web monitoring', 'Priority support'].map((feature, i) => (
                    <li key={i} className="text-sm flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <Badge className="bg-emerald-500 text-white">$9.99/mo</Badge>
            </div>
            <Button className="w-full bg-emerald-500 hover:bg-emerald-600" asChild>
              <Link to="/pricing">
                Start 14-Day Free Trial
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
