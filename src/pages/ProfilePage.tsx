import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserCredits } from "@/hooks/useUserCredits";
import { 
  Save, 
  Upload, 
  User, 
  Mail, 
  Calendar, 
  Crown, 
  CreditCard, 
  Zap, 
  Settings,
  RefreshCw,
  TrendingUp
} from "lucide-react";

const ProfilePage = () => {
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    avatar_url: "",
    bio: ""
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { subscription, createCheckout, openCustomerPortal, isLoading: isSubscriptionLoading } = useSubscription();
  const { credits, isLoading: isCreditsLoading, refreshCredits, remainingCredits, usagePercentage } = useUserCredits();

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setIsLoadingProfile(true);
      
      // Try to load profile from database
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        throw error;
      }

      // Use database profile if exists, otherwise use auth metadata
      setProfile({
        full_name: data?.full_name || user.user_metadata?.full_name || "",
        email: user.email || "",
        avatar_url: data?.avatar_url || "",
        bio: data?.bio || ""
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      // Fallback to auth metadata
      setProfile({
        full_name: user.user_metadata?.full_name || "",
        email: user.email || "",
        avatar_url: "",
        bio: ""
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Upsert profile data
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          email: user.email || "",
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          bio: profile.bio
        });

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // For now, we'll just show a placeholder since we haven't set up storage
    toast({
      title: "Feature coming soon",
      description: "Avatar upload will be available in the next update.",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoadingProfile) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your personal information, subscription, and AI credits.</p>
      </div>

      {/* Subscription Status Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Subscription Status
          </CardTitle>
          <CardDescription>
            Current plan and billing information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={subscription.subscribed ? "default" : "secondary"} className="capitalize">
                  {subscription.subscription_tier} Plan
                </Badge>
                {subscription.subscribed && (
                  <Badge variant="outline" className="text-green-600">
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {subscription.subscribed 
                  ? `Renews on ${subscription.subscription_end ? new Date(subscription.subscription_end).toLocaleDateString() : 'Unknown'}`
                  : 'Upgrade to unlock premium features'
                }
              </p>
            </div>
            <div className="flex gap-2">
              {subscription.subscribed ? (
                <Button 
                  variant="outline" 
                  onClick={openCustomerPortal}
                  disabled={isSubscriptionLoading}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => createCheckout('premium', 'monthly')}
                    disabled={isSubscriptionLoading}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Premium
                  </Button>
                  <Button 
                    variant="hero" 
                    onClick={() => createCheckout('enterprise', 'monthly')}
                    disabled={isSubscriptionLoading}
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Enterprise
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Credits Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            AI Credits
          </CardTitle>
          <CardDescription>
            Track your monthly AI usage and limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-2xl font-bold">{remainingCredits.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Credits remaining</p>
            </div>
            <Button variant="outline" size="sm" onClick={refreshCredits} disabled={isCreditsLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isCreditsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Usage this month</span>
              <span>{credits.credits_used.toLocaleString()} / {credits.credits_limit.toLocaleString()}</span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <TrendingUp className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm font-medium">{credits.credits_used.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Used</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <Calendar className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm font-medium">
                {new Date(credits.reset_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
              <p className="text-xs text-muted-foreground">Resets</p>
            </div>
          </div>
          
          {usagePercentage > 80 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ You're approaching your monthly limit. Consider upgrading for more credits.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Update your profile details and avatar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
              <AvatarFallback className="text-lg">
                {profile.full_name ? getInitials(profile.full_name) : <User className="w-8 h-8" />}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Change Avatar
                  </span>
                </Button>
              </Label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">
                JPG, PNG or GIF. Max size 2MB.
              </p>
            </div>
          </div>

          <Separator />

          {/* Profile Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="pl-10 bg-muted"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Email address cannot be changed. Contact support if you need to update it.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                className="w-full min-h-[100px] p-3 border border-input rounded-md bg-background resize-none"
                value={profile.bio}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us a bit about yourself..."
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {profile.bio.length}/500 characters
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Member Since</Label>
              <p className="text-sm text-muted-foreground">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Unknown'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Last Sign In</Label>
              <p className="text-sm text-muted-foreground">
                {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Unknown'}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-medium">User ID</Label>
            <p className="text-sm text-muted-foreground font-mono">
              {user?.id}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveProfile} disabled={isLoading} variant="hero">
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </div>
  );
};

export default ProfilePage;