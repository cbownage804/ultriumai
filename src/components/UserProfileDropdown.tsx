import { User, Crown, Coins, LogOut, Settings, Building2, Bell, CreditCard, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useAccountType } from '@/hooks/useAccountType';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useCreditThresholdPrompt, ContextualUpgradePrompt } from '@/components/billing/ContextualUpgradePrompt';

const UserProfileDropdown = () => {
  const { user } = useAuth();
  const { profile, subscription, loading } = useUserProfile();
  const { totalRemaining, credits: userCredits, dailyRemaining, monthlyRemaining } = useUserCredits();
  const { isMSPOrMSSP, accountType } = useAccountType();
  const navigate = useNavigate();
  const { toast } = useToast();
  const creditThreshold = useCreditThresholdPrompt(
    (userCredits.daily_credits_used + userCredits.monthly_credits_used),
    (userCredits.daily_credits_limit + userCredits.monthly_credits_limit + userCredits.bonus_credits)
  );

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error && error.message !== 'Session not found') {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    navigate('/');
  };

  const totalCapacity = userCredits.daily_credits_limit + userCredits.monthly_credits_limit + userCredits.bonus_credits;
  
  const getCreditsPercentage = () => {
    if (totalCapacity <= 0) return 0;
    const used = totalCapacity - totalRemaining;
    return Math.min((used / totalCapacity) * 100, 100);
  };

  const getCreditsColor = () => {
    const pct = getCreditsPercentage();
    if (pct >= 90) return 'bg-destructive';
    if (pct >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';

  if (!user) return null;

  const menuItems = [
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Building2, label: 'Organization', path: '/organization' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: CreditCard, label: 'Billing', path: '/billing' },
    { icon: Gift, label: 'Refer a Friend', path: '/referrals' },
    ...(isMSPOrMSSP ? [{ icon: Building2, label: 'MSP Control Center', path: '/msp-control-center' }] : []),
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-8 w-8">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="Profile" />}
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">Loading…</p>
          </div>
        ) : (
          <>
            {/* Profile header */}
            <div className="flex items-center gap-3 p-4">
              <Avatar className="h-10 w-10">
                {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="Profile" />}
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                {accountType && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary">
                    {accountType}
                  </span>
                )}
              </div>
            </div>

            <Separator />

            {/* Subscription & Credits */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Crown className="h-3 w-3" /> Plan
                </span>
                <span className="text-xs font-medium capitalize text-foreground">
                  {subscription?.subscription_tier || 'Free'}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Coins className="h-3 w-3" /> Credits
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {totalRemaining.toLocaleString()} left
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 flex overflow-hidden">
                  {totalCapacity > 0 && (
                    <>
                      {dailyRemaining > 0 && (
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${(dailyRemaining / totalCapacity) * 100}%` }}
                        />
                      )}
                      {monthlyRemaining > 0 && (
                        <div
                          className="h-full bg-violet-500 transition-all duration-300"
                          style={{ width: `${(monthlyRemaining / totalCapacity) * 100}%` }}
                        />
                      )}
                      {userCredits.bonus_credits > 0 && (
                        <div
                          className="h-full bg-amber-500 transition-all duration-300"
                          style={{ width: `${(userCredits.bonus_credits / totalCapacity) * 100}%` }}
                        />
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  {dailyRemaining > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 inline-block" />
                      Daily
                    </span>
                  )}
                  {monthlyRemaining > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-500 inline-block" />
                      Monthly
                    </span>
                  )}
                  {userCredits.bonus_credits > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
                      Bonus
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Credit threshold warning */}
            {creditThreshold.show && creditThreshold.props && (
              <div className="px-4 pb-3">
                <ContextualUpgradePrompt {...creditThreshold.props} className="text-xs" />
              </div>
            )}

            <Separator />

            {/* Menu items */}
            <div className="p-1.5">
              {menuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  {item.label}
                </button>
              ))}
            </div>

            <Separator />

            {/* Sign out */}
            <div className="p-1.5">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default UserProfileDropdown;
