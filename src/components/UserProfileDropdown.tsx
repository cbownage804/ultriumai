import { useState } from 'react';
import { User, Crown, Coins, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const UserProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { profile, credits, subscription, loading } = useUserProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      navigate('/');
    }
  };

  const getSubscriptionBadgeColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'enterprise':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white';
      case 'premium':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getCreditsPercentage = () => {
    if (!credits) return 0;
    return Math.min((credits.credits_used / credits.credits_limit) * 100, 100);
  };

  const getCreditsColor = () => {
    const percentage = getCreditsPercentage();
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (!user) return null;

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <Button 
        variant="ghost" 
        size="icon" 
        className="hover:scale-110 transition-all duration-300"
      >
        <User className="h-5 w-5" />
      </Button>
      
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-80 bg-background/95 backdrop-blur-md border border-border/50 rounded-lg shadow-xl z-50 animate-fade-in animate-scale-in transform origin-top-right">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading...</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Profile Header */}
              <div className="flex items-center space-x-3 pb-3 border-b border-border/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Profile" 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {profile?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {profile?.email}
                  </p>
                </div>
              </div>

              {/* Subscription Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Subscription
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getSubscriptionBadgeColor(subscription?.subscription_tier || 'free')}`}>
                    {subscription?.subscription_tier || 'Free'}
                  </span>
                </div>
                {subscription?.subscription_end && subscription.subscribed && (
                  <p className="text-xs text-muted-foreground">
                    Valid until {new Date(subscription.subscription_end).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Credits Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Coins className="h-3 w-3" />
                    Credits
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">
                      {credits?.credits_used || 0} / {credits?.credits_limit || 100}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 px-2 text-xs hover:bg-primary/10 hover:text-primary"
                      onClick={() => window.open('/pricing', '_blank')}
                    >
                      Buy More
                    </Button>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getCreditsColor()}`}
                    style={{ width: `${getCreditsPercentage()}%` }}
                  ></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-border/50 space-y-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start hover:bg-muted/50"
                  onClick={() => navigate('/dashboard')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start hover:bg-muted/50"
                  onClick={() => navigate('/profile')}
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start hover:bg-muted/50 hover:text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;