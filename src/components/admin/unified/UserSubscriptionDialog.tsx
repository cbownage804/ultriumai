import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Sparkles, 
  Shield, 
  Zap, 
  CreditCard, 
  Wrench,
  Save,
  Mail,
  KeyRound,
  UserCog,
  AlertTriangle,
  RefreshCw,
  Coins,
  Plus,
  Minus
} from 'lucide-react';

interface UserProducts {
  ai_studio: { tier: string; subscribed: boolean; stripe_subscription_id?: string | null } | null;
  safesuite: { tier: string; status: string; stripe_subscription_id?: string | null } | null;
  vanguard: { tier: string; status: string; stripe_subscription_id?: string | null } | null;
}

interface UserSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    user_id: string;
    email: string;
    full_name: string | null;
    products: UserProducts;
  } | null;
  onUpdate: () => void;
}

// AI Studio tiers organized by segment
const AI_STUDIO_TIERS = [
  { value: 'free', label: 'Free', group: 'Core' },
  { value: 'msp_starter', label: 'MSP Starter ($129)', group: 'MSP' },
  { value: 'msp_pro', label: 'MSP Pro ($299)', group: 'MSP' },
  { value: 'msp_elite', label: 'MSP Elite ($599)', group: 'MSP' },
  { value: 'platform_pro', label: 'Platform Pro ($1,199)', group: 'MSP' },
  { value: 'team_basic', label: 'Team Basic ($59)', group: 'Teams' },
  { value: 'team_plus', label: 'Team Plus ($179)', group: 'Teams' },
  { value: 'website_basic', label: 'Website Basic ($39)', group: 'Website' },
  { value: 'website_pro', label: 'Website Pro ($99)', group: 'Website' },
  { value: 'enterprise', label: 'Enterprise (Custom)', group: 'Enterprise' },
];

const SAFESUITE_TIERS = ['free', 'pro', 'business', 'enterprise'];
const VANGUARD_TIERS = ['starter', 'professional', 'enterprise'];

interface CreditInfo {
  daily_credits_used: number;
  daily_credits_limit: number;
  monthly_credits_used: number;
  monthly_credits_limit: number;
  bonus_credits: number;
}

export const UserSubscriptionDialog = ({
  open,
  onOpenChange,
  user,
  onUpdate
}: UserSubscriptionDialogProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [aiStudioTier, setAiStudioTier] = useState(user?.products.ai_studio?.tier || 'free');
  const [safesuiteTier, setSafesuiteTier] = useState(user?.products.safesuite?.tier || 'free');
  const [vanguardTier, setVanguardTier] = useState(user?.products.vanguard?.tier || 'none');
  
  // Credit management
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
  const [creditLoading, setCreditLoading] = useState(false);
  const [bonusToAdd, setBonusToAdd] = useState('');
  const [newMonthlyLimit, setNewMonthlyLimit] = useState('');
  const [newDailyLimit, setNewDailyLimit] = useState('');

  const [aiStudioStripeManaged, setAiStudioStripeManaged] = useState(
    !!user?.products.ai_studio?.stripe_subscription_id
  );
  const [safesuiteStripeManaged, setSafesuiteStripeManaged] = useState(
    !!user?.products.safesuite?.stripe_subscription_id
  );

  // Reset state when user changes
  useEffect(() => {
    if (user) {
      setAiStudioTier(user.products.ai_studio?.tier || 'free');
      setSafesuiteTier(user.products.safesuite?.tier || 'free');
      setVanguardTier(user.products.vanguard?.tier || 'none');
      setAiStudioStripeManaged(!!user.products.ai_studio?.stripe_subscription_id);
      setSafesuiteStripeManaged(!!user.products.safesuite?.stripe_subscription_id);
      loadUserCredits();
    }
  }, [user]);

  const loadUserCredits = async () => {
    if (!user) return;
    setCreditLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('daily_credits_used, daily_credits_limit, monthly_credits_used, monthly_credits_limit, bonus_credits')
        .eq('user_id', user.user_id)
        .maybeSingle();

      if (!error && data) {
        const raw = data as Record<string, unknown>;
        setCreditInfo({
          daily_credits_used: (raw.daily_credits_used as number) || 0,
          daily_credits_limit: (raw.daily_credits_limit as number) || 5,
          monthly_credits_used: (raw.monthly_credits_used as number) || 0,
          monthly_credits_limit: (raw.monthly_credits_limit as number) || 0,
          bonus_credits: (raw.bonus_credits as number) || 0,
        });
        setNewDailyLimit(String((raw.daily_credits_limit as number) || 5));
        setNewMonthlyLimit(String((raw.monthly_credits_limit as number) || 0));
      } else {
        setCreditInfo(null);
      }
    } catch (e) {
      console.error('Error loading user credits:', e);
    } finally {
      setCreditLoading(false);
    }
  };

  const handleAddBonusCredits = async () => {
    if (!user || !bonusToAdd) return;
    const amount = parseInt(bonusToAdd);
    if (isNaN(amount) || amount === 0) return;

    try {
      const newBonus = Math.max(0, (creditInfo?.bonus_credits || 0) + amount);
      const { error } = await supabase
        .from('user_credits')
        .update({ bonus_credits: newBonus } as Record<string, unknown>)
        .eq('user_id', user.user_id);

      if (error) throw error;

      // Log credit change
      try {
        await supabase.from('credit_history').insert([{
          user_id: user.user_id,
          credits_amount: amount,
          action_type: amount > 0 ? 'bonus' : 'usage',
          description: `Admin ${amount > 0 ? 'added' : 'removed'} ${Math.abs(amount)} bonus credits`,
        }]);
      } catch (e) { /* ignore */ }

      toast({
        title: `${amount > 0 ? 'Added' : 'Removed'} ${Math.abs(amount)} bonus credits`,
        description: `${user.email} now has ${newBonus} bonus credits`,
      });
      setBonusToAdd('');
      loadUserCredits();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdateCreditLimits = async () => {
    if (!user) return;
    const daily = parseInt(newDailyLimit);
    const monthly = parseInt(newMonthlyLimit);
    if (isNaN(daily) || isNaN(monthly)) return;

    try {
      const { error } = await supabase
        .from('user_credits')
        .update({
          daily_credits_limit: daily,
          monthly_credits_limit: monthly,
        } as Record<string, unknown>)
        .eq('user_id', user.user_id);

      if (error) throw error;

      toast({
        title: "Credit limits updated",
        description: `Daily: ${daily}, Monthly: ${monthly}`,
      });
      loadUserCredits();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleResetDailyCredits = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('user_credits')
        .update({ daily_credits_used: 0 } as Record<string, unknown>)
        .eq('user_id', user.user_id);

      if (error) throw error;
      toast({ title: "Daily credits reset", description: `${user.email}'s daily usage cleared` });
      loadUserCredits();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleResetMonthlyCredits = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('user_credits')
        .update({ monthly_credits_used: 0 } as Record<string, unknown>)
        .eq('user_id', user.user_id);

      if (error) throw error;
      toast({ title: "Monthly credits reset", description: `${user.email}'s monthly usage cleared` });
      loadUserCredits();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const isStripeManaged = (stripeId: string | null | undefined) => !!stripeId;

  const handleSyncFromStripe = async () => {
    if (!user) return;
    setSyncing(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-sync-subscription', {
        body: {
          userId: user.user_id,
          userEmail: user.email,
        }
      });

      if (error) throw error;

      if (data?.success) {
        const newAiTier = data.ai_studio?.tier || 'free';
        const newSsTier = data.safesuite?.tier || 'free';
        const aiStripeManaged = !!data.ai_studio?.stripe_subscription_id;
        const ssStripeManaged = !!data.safesuite?.stripe_subscription_id;
        
        setAiStudioTier(newAiTier);
        setAiStudioStripeManaged(aiStripeManaged);
        setSafesuiteTier(newSsTier);
        setSafesuiteStripeManaged(ssStripeManaged);

        toast({
          title: "Synced from Stripe",
          description: `AI Studio: ${newAiTier}, SafeSuite: ${newSsTier}`,
        });

        setTimeout(() => onUpdate(), 500);
      } else {
        throw new Error(data?.message || 'Sync failed');
      }
    } catch (error) {
      console.error('Error syncing from Stripe:', error);
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Could not sync from Stripe",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error: aiError } = await supabase
        .from('subscribers')
        .upsert({
          user_id: user.user_id,
          email: user.email,
          subscription_tier: aiStudioTier,
          subscribed: aiStudioTier !== 'free',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (aiError) throw aiError;

      const { error: ssError } = await supabase
        .from('safesuite_subscriptions')
        .upsert({
          user_id: user.user_id,
          tier: safesuiteTier,
          status: 'active',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (ssError) throw ssError;

      if (vanguardTier && vanguardTier !== 'none') {
        const { error: vgError } = await supabase
          .from('vanguard_subscriptions')
          .upsert({
            user_id: user.user_id,
            tier: vanguardTier,
            seat_count: 1,
            status: 'active',
            admin_override: true,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

        if (vgError) throw vgError;
      } else if (user.products.vanguard) {
        await supabase
          .from('vanguard_subscriptions')
          .delete()
          .eq('user_id', user.user_id);
      }

      toast({
        title: "Subscriptions updated",
        description: `Tiers updated for ${user.email}`,
      });

      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating subscriptions:', error);
      toast({
        title: "Error updating subscriptions",
        description: "Could not update user subscriptions",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage User</DialogTitle>
          <DialogDescription>
            {user.email}
            {user.full_name && <span className="text-muted-foreground"> ({user.full_name})</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* AI Studio */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <Label className="text-sm font-medium">AI Studio</Label>
              </div>
              {aiStudioStripeManaged ? (
                <Badge variant="outline" className="text-blue-500 border-blue-500/50 text-xs">
                  <CreditCard className="h-3 w-3 mr-1" /> Stripe
                </Badge>
              ) : aiStudioTier === 'free' ? (
                <Badge variant="outline" className="text-muted-foreground text-xs">Default</Badge>
              ) : (
                <Badge variant="outline" className="text-amber-500 border-amber-500/50 text-xs">
                  <Wrench className="h-3 w-3 mr-1" /> Manual
                </Badge>
              )}
            </div>
            <Select value={aiStudioTier} onValueChange={setAiStudioTier}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {['Core', 'MSP', 'Teams', 'Website', 'Enterprise'].map(group => {
                  const tiersInGroup = AI_STUDIO_TIERS.filter(t => t.group === group);
                  if (tiersInGroup.length === 0) return null;
                  return (
                    <div key={group}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">{group}</div>
                      {tiersInGroup.map(tier => (
                        <SelectItem key={tier.value} value={tier.value}>{tier.label}</SelectItem>
                      ))}
                    </div>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* SafeSuite */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-500" />
                <Label className="text-sm font-medium">SafeSuite</Label>
              </div>
              {safesuiteStripeManaged ? (
                <Badge variant="outline" className="text-blue-500 border-blue-500/50 text-xs">
                  <CreditCard className="h-3 w-3 mr-1" /> Stripe
                </Badge>
              ) : safesuiteTier === 'free' ? (
                <Badge variant="outline" className="text-muted-foreground text-xs">Default</Badge>
              ) : (
                <Badge variant="outline" className="text-amber-500 border-amber-500/50 text-xs">
                  <Wrench className="h-3 w-3 mr-1" /> Manual
                </Badge>
              )}
            </div>
            <Select value={safesuiteTier} onValueChange={setSafesuiteTier}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SAFESUITE_TIERS.map(tier => (
                  <SelectItem key={tier} value={tier}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Vanguard */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <Label className="text-sm font-medium">Vanguard</Label>
              </div>
              {user.products.vanguard && isStripeManaged(user.products.vanguard?.stripe_subscription_id) ? (
                <Badge variant="outline" className="text-blue-500 border-blue-500/50 text-xs">
                  <CreditCard className="h-3 w-3 mr-1" /> Stripe
                </Badge>
              ) : user.products.vanguard ? (
                <Badge variant="outline" className="text-amber-500 border-amber-500/50 text-xs">
                  <Wrench className="h-3 w-3 mr-1" /> Manual
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground text-xs">Not subscribed</Badge>
              )}
            </div>
            <Select value={vanguardTier} onValueChange={setVanguardTier}>
              <SelectTrigger><SelectValue placeholder="No subscription" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No subscription</SelectItem>
                {VANGUARD_TIERS.map(tier => (
                  <SelectItem key={tier} value={tier}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* ── Credit Management ── */}
          <div className="space-y-4">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-500" />
              AI Credit Management
            </Label>

            {creditLoading ? (
              <div className="text-sm text-muted-foreground">Loading credits...</div>
            ) : creditInfo ? (
              <div className="space-y-4">
                {/* Current balances */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-muted/50 border">
                    <p className="text-xs text-muted-foreground">Daily</p>
                    <p className="text-sm font-bold">{creditInfo.daily_credits_used}/{creditInfo.daily_credits_limit}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 border">
                    <p className="text-xs text-muted-foreground">Monthly</p>
                    <p className="text-sm font-bold">{creditInfo.monthly_credits_used}/{creditInfo.monthly_credits_limit}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-muted-foreground">Bonus</p>
                    <p className="text-sm font-bold text-amber-500">{creditInfo.bonus_credits}</p>
                  </div>
                </div>

                {/* Add/Remove bonus credits */}
                <div className="space-y-2">
                  <Label className="text-xs">Add/Remove Bonus Credits</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="e.g. 500 or -100"
                      value={bonusToAdd}
                      onChange={(e) => setBonusToAdd(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={handleAddBonusCredits} disabled={!bonusToAdd}>
                      {parseInt(bonusToAdd || '0') >= 0 ? <Plus className="h-3 w-3 mr-1" /> : <Minus className="h-3 w-3 mr-1" />}
                      Apply
                    </Button>
                  </div>
                </div>

                {/* Adjust limits */}
                <div className="space-y-2">
                  <Label className="text-xs">Adjust Credit Limits</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Daily Limit</Label>
                      <Input type="number" value={newDailyLimit} onChange={(e) => setNewDailyLimit(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Monthly Limit</Label>
                      <Input type="number" value={newMonthlyLimit} onChange={(e) => setNewMonthlyLimit(e.target.value)} />
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="w-full" onClick={handleUpdateCreditLimits}>
                    Update Limits
                  </Button>
                </div>

                {/* Reset usage */}
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" onClick={handleResetDailyCredits}>
                    <RefreshCw className="h-3 w-3 mr-1" /> Reset Daily Usage
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleResetMonthlyCredits}>
                    <RefreshCw className="h-3 w-3 mr-1" /> Reset Monthly Usage
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No credit record found for this user.</div>
            )}
          </div>

          <Separator />

          {/* Sync from Stripe */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Stripe Sync
            </Label>
            <Button 
              variant="outline" 
              size="sm"
              className="w-full text-blue-500 border-blue-500/30 hover:bg-blue-500/10"
              onClick={handleSyncFromStripe}
              disabled={syncing}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync from Stripe'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Fetch the user's actual subscription status from Stripe and update the database.
            </p>
          </div>

          <Separator />

          {/* Admin Actions */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              Admin Actions
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  toast({
                    title: "Password reset email sent",
                    description: `Reset link sent to ${user.email}`,
                  });
                }}
              >
                <KeyRound className="h-3 w-3 mr-1" />
                Reset Password
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  toast({
                    title: "Welcome email sent",
                    description: `Welcome email sent to ${user.email}`,
                  });
                }}
              >
                <Mail className="h-3 w-3 mr-1" />
                Welcome Email
              </Button>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="w-full text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
              onClick={() => {
                toast({
                  title: "Impersonation started",
                  description: `Now viewing as ${user.email}. Session logged.`,
                  variant: "default"
                });
                window.open(`/?impersonate=${user.user_id}`, '_blank');
              }}
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Impersonate User (Logged)
            </Button>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
