import { useState } from 'react';
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
  ExternalLink
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

const AI_STUDIO_TIERS = ['free', 'starter', 'professional', 'enterprise'];
const SAFESUITE_TIERS = ['free', 'pro', 'business'];
const VANGUARD_TIERS = ['starter', 'professional', 'enterprise'];

export const UserSubscriptionDialog = ({
  open,
  onOpenChange,
  user,
  onUpdate
}: UserSubscriptionDialogProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [aiStudioTier, setAiStudioTier] = useState(user?.products.ai_studio?.tier || 'free');
  const [safesuiteTier, setSafesuiteTier] = useState(user?.products.safesuite?.tier || 'free');
  const [vanguardTier, setVanguardTier] = useState(user?.products.vanguard?.tier || '');

  // Reset state when user changes
  useState(() => {
    if (user) {
      setAiStudioTier(user.products.ai_studio?.tier || 'free');
      setSafesuiteTier(user.products.safesuite?.tier || 'free');
      setVanguardTier(user.products.vanguard?.tier || '');
    }
  });

  const isStripeManaged = (stripeId: string | null | undefined) => !!stripeId;

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
      if (vanguardTier) {
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
              {isStripeManaged(user.products.ai_studio?.stripe_subscription_id) ? (
                <Badge variant="outline" className="text-blue-500 border-blue-500/50 text-xs">
                  <CreditCard className="h-3 w-3 mr-1" />
                  Stripe
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
              <SelectContent>
                {AI_STUDIO_TIERS.map(tier => (
                  <SelectItem key={tier} value={tier}>
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </SelectItem>
                ))}
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
              {isStripeManaged(user.products.safesuite?.stripe_subscription_id) ? (
                <Badge variant="outline" className="text-blue-500 border-blue-500/50 text-xs">
                  <CreditCard className="h-3 w-3 mr-1" />
                  Stripe
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
                <SelectItem value="">No subscription</SelectItem>
                {VANGUARD_TIERS.map(tier => (
                  <SelectItem key={tier} value={tier}>
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
