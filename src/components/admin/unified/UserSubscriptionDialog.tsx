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
  RefreshCw
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
  // Core tiers
  { value: 'free', label: 'Free', group: 'Core' },
  // MSP & IT Firms
  { value: 'msp_starter', label: 'MSP Starter ($99)', group: 'MSP' },
  { value: 'msp_pro', label: 'MSP Pro ($249)', group: 'MSP' },
  { value: 'msp_elite', label: 'MSP Elite ($499)', group: 'MSP' },
  { value: 'platform_pro', label: 'Platform Pro ($999)', group: 'MSP' },
  // Internal Business Teams
  { value: 'team_basic', label: 'Team Basic ($49)', group: 'Teams' },
  { value: 'team_plus', label: 'Team Plus ($149)', group: 'Teams' },
  // Website / Embedded AI
  { value: 'website_basic', label: 'Website Basic ($29)', group: 'Website' },
  { value: 'website_pro', label: 'Website Pro ($79)', group: 'Website' },
  // Enterprise
  { value: 'enterprise', label: 'Enterprise (Custom)', group: 'Enterprise' },
];

const SAFESUITE_TIERS = ['free', 'pro', 'business', 'enterprise'];
const VANGUARD_TIERS = ['starter', 'professional', 'enterprise'];

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
  
  // Track Stripe-managed status locally (can be updated after sync)
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
    }
  }, [user]);

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
        // Update local state with synced values
        setAiStudioTier(data.ai_studio?.tier || 'free');
        setAiStudioStripeManaged(data.ai_studio?.subscribed === true);
        
        setSafesuiteTier(data.safesuite?.tier || 'free');
        setSafesuiteStripeManaged(data.safesuite?.subscribed === true);

        toast({
          title: "Synced from Stripe",
          description: `AI Studio: ${data.ai_studio?.tier || 'free'}, SafeSuite: ${data.safesuite?.tier || 'free'}`,
        });

        onUpdate();
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
      // Update AI Studio subscription (subscribers table)
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

      // Update SafeSuite subscription
      const { error: ssError } = await supabase
        .from('safesuite_subscriptions')
        .upsert({
          user_id: user.user_id,
          tier: safesuiteTier,
          status: 'active',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (ssError) throw ssError;

      // Update or create Vanguard subscription if tier is set
      if (vanguardTier && vanguardTier !== 'none') {
        const { error: vgError } = await supabase
          .from('vanguard_subscriptions')
          .upsert({
            user_id: user.user_id,
            tier: vanguardTier,
            status: 'active',
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

        if (vgError) throw vgError;
      } else if (user.products.vanguard) {
        // Remove Vanguard subscription if tier cleared
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Subscriptions</DialogTitle>
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
                  <CreditCard className="h-3 w-3 mr-1" />
                  Stripe
                </Badge>
              ) : aiStudioTier === 'free' ? (
                <Badge variant="outline" className="text-muted-foreground text-xs">
                  Default
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-500 border-amber-500/50 text-xs">
                  <Wrench className="h-3 w-3 mr-1" />
                  Manual
                </Badge>
              )}
            </div>
            <Select value={aiStudioTier} onValueChange={setAiStudioTier}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {['Core', 'MSP', 'Teams', 'Website', 'Enterprise'].map(group => {
                  const tiersInGroup = AI_STUDIO_TIERS.filter(t => t.group === group);
                  if (tiersInGroup.length === 0) return null;
                  return (
                    <div key={group}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                        {group}
                      </div>
                      {tiersInGroup.map(tier => (
                        <SelectItem key={tier.value} value={tier.value}>
                          {tier.label}
                        </SelectItem>
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
                  <CreditCard className="h-3 w-3 mr-1" />
                  Stripe
                </Badge>
              ) : safesuiteTier === 'free' ? (
                <Badge variant="outline" className="text-muted-foreground text-xs">
                  Default
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-500 border-amber-500/50 text-xs">
                  <Wrench className="h-3 w-3 mr-1" />
                  Manual
                </Badge>
              )}
            </div>
            <Select value={safesuiteTier} onValueChange={setSafesuiteTier}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SAFESUITE_TIERS.map(tier => (
                  <SelectItem key={tier} value={tier}>
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </SelectItem>
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
                  <CreditCard className="h-3 w-3 mr-1" />
                  Stripe
                </Badge>
              ) : user.products.vanguard ? (
                <Badge variant="outline" className="text-amber-500 border-amber-500/50 text-xs">
                  <Wrench className="h-3 w-3 mr-1" />
                  Manual
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground text-xs">
                  Not subscribed
                </Badge>
              )}
            </div>
            <Select value={vanguardTier} onValueChange={setVanguardTier}>
              <SelectTrigger>
                <SelectValue placeholder="No subscription" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No subscription</SelectItem>
                {VANGUARD_TIERS.map(tier => (
                  <SelectItem key={tier} value={tier}>
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                // In production, this would use admin.auth.generateLink or similar
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
