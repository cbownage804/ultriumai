/**
 * Wrayth Billing Page
 * Subscription management and tier upgrades
 */

import { useState } from 'react';
import { useWraythSubscription, useWraythCheckout } from '@/hooks/useSafeSuite';
import { SAFESUITE_TIERS, FEATURE_DESCRIPTIONS, formatMonthlyPrice, formatLimitWithUnit, WraythTier, TierFeatures } from '@/config/safeSuiteTiers';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Check,
  Crown,
  Sparkles,
  Lock,
  CreditCard,
  Calendar,
  Loader2,
  ExternalLink,
  Users,
  Star,
  Zap,
  Shield,
  Eye
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { UsageSummary } from '@/components/safesuite/UsageMeter';

import { InvoiceHistory } from '@/components/billing/InvoiceHistory';
import { SubscriptionOverview } from '@/components/billing/SubscriptionOverview';

export default function WraythBilling() {
  const { subscription, tier, tierConfig, loading: subLoading } = useWraythSubscription();
  const { createCheckout, openCustomerPortal, loading: checkoutLoading } = useWraythCheckout();
  const [yearlyBilling, setYearlyBilling] = useState(false);
  const [seatSelectorOpen, setSeatSelectorOpen] = useState(false);
  const [seats, setSeats] = useState(5);

  const handleUpgrade = async (targetTier: WraythTier) => {
    // Business tier requires seat selection
    if (targetTier === 'business') {
      setSeatSelectorOpen(true);
      return;
    }

    const result = await createCheckout(targetTier, yearlyBilling ? 'yearly' : 'monthly');
    if (result) {
      if (result.upgraded) {
        // Subscription was upgraded directly (no checkout needed)
        toast.success(result.message || 'Subscription upgraded successfully!');
        if (result.redirectUrl) {
          window.location.href = result.redirectUrl;
        }
      } else if (result.url) {
        window.open(result.url, '_blank');
      }
    } else {
      toast.error('Failed to create checkout session');
    }
  };

  const handleBusinessCheckout = async () => {
    setSeatSelectorOpen(false);
    const result = await createCheckout('business', yearlyBilling ? 'yearly' : 'monthly', seats);
    if (result) {
      if (result.upgraded) {
        toast.success(result.message || 'Subscription upgraded successfully!');
        if (result.redirectUrl) {
          window.location.href = result.redirectUrl;
        }
      } else if (result.url) {
        window.open(result.url, '_blank');
      }
    } else {
      toast.error('Failed to create checkout session');
    }
  };

  const handleManageSubscription = async () => {
    const url = await openCustomerPortal();
    if (url) {
      window.open(url, '_blank');
    } else {
      toast.error('Failed to open customer portal');
    }
  };

  const pricePerSeat = yearlyBilling ? 23.99 : 29.99; // Matches live Stripe Business price ($287.90/yr ≈ $23.99/mo, $29.99/mo)
  const totalPrice = pricePerSeat * seats;

  const tiers = Object.values(SAFESUITE_TIERS);

  return (
    
    <div className="space-y-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your Wrayth subscription and billing
        </p>
      </motion.div>

      {/* Current Plan Card - Enhanced */}
      {subscription && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={cn(
            'overflow-hidden',
            tier === 'business' && 'border-yellow-500/30 bg-gradient-to-r from-yellow-500/5 to-yellow-500/5',
            tier === 'pro' && 'border-violet-500/30 bg-gradient-to-r from-violet-500/5 to-purple-500/5'
          )}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {tier === 'business' && <Crown className="h-5 w-5 text-yellow-500" />}
                {tier === 'pro' && <Zap className="h-5 w-5 text-violet-500" />}
                {tier === 'free' && <Shield className="h-5 w-5" />}
                Current Plan
                <span className="ml-2 text-[10px] uppercase tracking-[0.2em] text-violet-300/80 font-normal">Managed by Ray</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-semibold">{tierConfig.name}</span>
                    <Badge 
                      variant={tier === 'free' ? 'secondary' : 'default'}
                      className={cn(
                        tier === 'business' && 'bg-gradient-to-r from-yellow-500 to-yellow-500 border-0',
                        tier === 'pro' && 'bg-gradient-to-r from-violet-500 to-purple-500 border-0'
                      )}
                    >
                      {tier === 'business' && <Crown className="h-3 w-3 mr-1" />}
                      {tier === 'pro' && <Sparkles className="h-3 w-3 mr-1" />}
                      {tierConfig.badge}
                    </Badge>
                  </div>

                  {subscription.currentPeriodEnd && tier !== 'free' && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {tier !== 'free' && (
                  <Button variant="outline" onClick={handleManageSubscription} disabled={checkoutLoading}>
                    {checkoutLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Manage Subscription
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Usage Summary */}
              {tier !== 'business' && (
                <div className="pt-4 border-t border-border/50">
                  <h4 className="text-sm font-medium mb-3">Your Usage</h4>
                  <UsageSummary features={['vault', 'scan', 'watch']} />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Billing Toggle */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-center gap-4 py-4"
      >
        <Label htmlFor="billing-toggle" className={cn(!yearlyBilling && 'text-foreground font-medium')}>
          Monthly
        </Label>
        <Switch
          id="billing-toggle"
          checked={yearlyBilling}
          onCheckedChange={setYearlyBilling}
        />
        <Label htmlFor="billing-toggle" className={cn(yearlyBilling && 'text-foreground font-medium')}>
          Yearly
          <Badge variant="secondary" className="ml-2 bg-green-500/20 text-green-400">Save 20%</Badge>
        </Label>
      </motion.div>

      {/* Pricing Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((tierConfig) => {
          const isCurrentTier = tier === tierConfig.id;
          const isDowngrade = 
            (tier === 'business' && (tierConfig.id === 'pro' || tierConfig.id === 'free')) ||
            (tier === 'pro' && tierConfig.id === 'free');
          const isUpgrade = 
            (tier === 'free' && (tierConfig.id === 'pro' || tierConfig.id === 'business')) ||
            (tier === 'pro' && tierConfig.id === 'business');

          return (
            <Card
              key={tierConfig.id}
              className={cn(
                'relative',
                isCurrentTier && 'border-primary shadow-lg',
                tierConfig.popular && 'border-primary/50'
              )}
            >
              {isCurrentTier && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary">Current Plan</Badge>
                </div>
              )}
              {!isCurrentTier && tierConfig.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="secondary" className="gap-1 border-violet-500/40 bg-violet-500/10 text-violet-200">
                    <Eye className="h-3 w-3" />
                    Ray recommends
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {tierConfig.id === 'business' && <Crown className="h-5 w-5 text-yellow-500" />}
                  <CardTitle>{tierConfig.name}</CardTitle>
                </div>
                <CardDescription>{tierConfig.description}</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-bold">
                    {tierConfig.price === 0 ? 'Free' : formatMonthlyPrice(tierConfig, yearlyBilling)}
                  </span>
                  {tierConfig.price > 0 && (
                    <span className="text-muted-foreground block text-sm mt-1">
                      billed {yearlyBilling ? 'annually' : 'monthly'}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Separator className="mb-4" />
                <ul className="space-y-3">
                  {Object.entries(tierConfig.features).map(([key, value]) => {
                    const featureInfo = FEATURE_DESCRIPTIONS[key as keyof TierFeatures];
                    return (
                      <li key={key} className="flex items-center gap-2">
                        {value.enabled ? (
                          <Check className="h-4 w-4 text-success flex-shrink-0" />
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className={cn(!value.enabled && 'text-muted-foreground')}>
                          {featureInfo.name}
                          {value.enabled && value.limit !== 0 && (
                            <span className="text-muted-foreground text-sm ml-1">
                              ({formatLimitWithUnit(key as keyof TierFeatures, value.limit)})
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
              <CardFooter>
                {isCurrentTier ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : isDowngrade ? (
                  <Button variant="ghost" className="w-full" onClick={handleManageSubscription}>
                    Downgrade
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    variant={tierConfig.popular ? 'default' : 'outline'}
                    onClick={() => handleUpgrade(tierConfig.id)}
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      `Upgrade to ${tierConfig.name}`
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* All Subscriptions Overview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <SubscriptionOverview />
      </motion.div>

      {/* Invoice History */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <InvoiceHistory />
      </motion.div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">Can I cancel anytime?</h4>
            <p className="text-sm text-muted-foreground">
              Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
            </p>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium mb-1">What happens to my data if I downgrade?</h4>
            <p className="text-sm text-muted-foreground">
              Your data is never deleted. If you downgrade and exceed limits, you'll still be able to view your data but won't be able to add new items until you're under the limit.
            </p>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium mb-1">Do you offer refunds?</h4>
            <p className="text-sm text-muted-foreground">
              We offer a 14-day money-back guarantee on all paid plans. Contact support if you're not satisfied.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Business Tier Seat Selector Dialog */}
      <Dialog open={seatSelectorOpen} onOpenChange={setSeatSelectorOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Upgrade to Business
            </DialogTitle>
            <DialogDescription>
              Choose how many team seats you need. You can add more seats later.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="seats">Number of Team Seats</Label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSeats(Math.max(1, seats - 1))}
                  disabled={seats <= 1}
                >
                  -
                </Button>
                <Input
                  id="seats"
                  type="number"
                  min={1}
                  max={100}
                  value={seats}
                  onChange={(e) => setSeats(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                  className="w-20 text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSeats(Math.min(100, seats + 1))}
                  disabled={seats >= 100}
                >
                  +
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Minimum 1 seat, you can invite team members after checkout.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {seats} seat{seats > 1 ? 's' : ''}
                </span>
                <span>${pricePerSeat}/seat/mo</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${totalPrice}/mo</span>
              </div>
              {yearlyBilling && (
                <p className="text-xs text-muted-foreground text-right">
                  Billed annually as ${totalPrice * 12}/year
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSeatSelectorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBusinessCheckout} disabled={checkoutLoading} className="gap-2">
              {checkoutLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Crown className="h-4 w-4" />
                  Continue to Checkout
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    
  );
}
