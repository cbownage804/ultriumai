import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBillingData, formatCurrency } from "@/hooks/useBillingData";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { Shield, Calendar, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const productIcons: Record<string, React.ReactNode> = {
  wrayth: <Shield className="h-5 w-5 text-violet-400" />,
};

const productColors: Record<string, string> = {
  wrayth: 'border-violet-500/30 bg-gradient-to-r from-violet-500/5 to-purple-500/5',
};

export const SubscriptionOverview = () => {
  const { subscriptions, loading, error } = useBillingData();
  const { openCustomerPortal, loading: portalLoading } = useStripeCheckout();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Subscriptions</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Failed to load subscriptions</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeSubscriptions = (subscriptions || []).filter(s => s.status === 'active' || s.status === 'trialing');

  if (activeSubscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Subscriptions</CardTitle>
          <CardDescription>You don't have any active Wrayth subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              Unlock Pro, Business, or Enterprise features by upgrading your plan.
            </p>
            <Button asChild>
              <Link to="/pricing">View Wrayth plans</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Your Subscriptions</CardTitle>
          <CardDescription>
            Manage your active subscriptions across all products
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          onClick={openCustomerPortal}
          disabled={portalLoading}
          className="gap-2"
        >
          {portalLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4" />
          )}
          Manage All
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeSubscriptions.map((sub) => (
          <div
            key={sub.id}
            className={cn(
              "p-4 rounded-lg border",
              productColors[sub.product] || 'bg-muted/50'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center shadow-sm">
                  {productIcons[sub.product] || <Shield className="h-5 w-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{sub.productName}</h4>
                    <Badge variant={sub.status === 'trialing' ? 'secondary' : 'default'}>
                      {sub.status === 'trialing' ? 'Trial' : sub.tier}
                    </Badge>
                    {sub.cancelAtPeriodEnd && (
                      <Badge variant="destructive">Canceling</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {sub.cancelAtPeriodEnd ? 'Ends' : 'Renews'} {format(new Date(sub.currentPeriodEnd), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  {formatCurrency(sub.amount, sub.currency)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{sub.interval}
                  </span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
