import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  TrendingUp,
  ArrowLeft,
  Shield,
  Brain,
  Database,
  Trash2,
  Bot,
  MessageSquare,
  Mic,
  Globe,
  Check,
  X,
  Lock
} from "lucide-react";

interface UserSettings {
  preferred_model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  auto_save: boolean;
  theme: string;
  voice_enabled: boolean;
  file_upload_enabled: boolean;
  web_search_enabled: boolean;
}

interface AIFeature {
  id: string;
  name: string;
  description: string;
  icon: any;
  available: boolean;
  requiresTier: 'free' | 'premium' | 'enterprise';
  category: 'core' | 'advanced' | 'enterprise';
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    avatar_url: "",
    bio: ""
  });

  // AI Settings state
  const [settings, setSettings] = useState<UserSettings>({
    preferred_model: "gpt-4.1-2025-04-14",
    temperature: 0.7,
    max_tokens: 1500,
    system_prompt: "You are UltriumGPT, a helpful AI assistant created by UltriumAI. You help users with various tasks including answering questions, providing information, and assisting with problem-solving. Be concise but thorough in your responses.",
    auto_save: true,
    theme: "system",
    voice_enabled: true,
    file_upload_enabled: true,
    web_search_enabled: true
  });

  const [conversationCount, setConversationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { subscription, createCheckout, openCustomerPortal, checkSubscription, isLoading: isSubscriptionLoading } = useSubscription();
  const { credits, isLoading: isCreditsLoading, refreshCredits, remainingCredits, usagePercentage } = useUserCredits();

  // Define AI features based on subscription tiers
  const aiFeatures: AIFeature[] = [
    // Core Features (Free tier)
    {
      id: 'chat',
      name: 'AI Chat Assistant',
      description: 'Chat with UltriumGPT for general assistance and questions',
      icon: MessageSquare,
      available: true,
      requiresTier: 'free',
      category: 'core'
    },
    {
      id: 'contextual',
      name: 'Contextual Assistance',
      description: 'AI adapts based on current page/application context',
      icon: Brain,
      available: true,
      requiresTier: 'free',
      category: 'core'
    },
    {
      id: 'conversation_history',
      name: 'Conversation History',
      description: 'Save and retrieve previous conversations',
      icon: Database,
      available: true,
      requiresTier: 'free',
      category: 'core'
    },
    
    // Advanced Features (Premium tier)
    {
      id: 'voice_input',
      name: 'Voice Input & Output',
      description: 'Speak to UltriumGPT and hear responses with ElevenLabs voice',
      icon: Mic,
      available: subscription.subscription_tier !== 'free',
      requiresTier: 'premium',
      category: 'advanced'
    },
    {
      id: 'file_upload',
      name: 'File Analysis',
      description: 'Upload and analyze documents, images, and other files',
      icon: Upload,
      available: subscription.subscription_tier !== 'free',
      requiresTier: 'premium',
      category: 'advanced'
    },
    {
      id: 'web_search',
      name: 'Real-time Web Search',
      description: 'Access current information through web search capabilities',
      icon: Globe,
      available: subscription.subscription_tier !== 'free',
      requiresTier: 'premium',
      category: 'advanced'
    },
    {
      id: 'specialized_modes',
      name: 'Specialized AI Modes',
      description: 'Security, Helpdesk, RMM, and SafeScan specialized assistants',
      icon: Shield,
      available: subscription.subscription_tier !== 'free',
      requiresTier: 'premium',
      category: 'advanced'
    },
    
    // Enterprise Features
    {
      id: 'custom_models',
      name: 'Custom AI Models',
      description: 'Access to advanced models and custom training',
      icon: Brain,
      available: subscription.subscription_tier === 'enterprise',
      requiresTier: 'enterprise',
      category: 'enterprise'
    },
    {
      id: 'api_access',
      name: 'API Integration',
      description: 'Integrate UltriumGPT into your own applications',
      icon: Bot,
      available: subscription.subscription_tier === 'enterprise',
      requiresTier: 'enterprise',
      category: 'enterprise'
    }
  ];

  // Get pages user has access to based on subscription
  const getAccessiblePages = () => {
    const basePages = [
      { name: 'Dashboard', path: '/dashboard', tier: 'free' },
      { name: 'AI Assistant', path: '/dashboard/ai-assistant', tier: 'free' },
      { name: 'Profile', path: '/dashboard/profile', tier: 'free' }
    ];

    const premiumPages = [
      { name: 'Custom GPTs', path: '/dashboard/gpt', tier: 'premium' },
      { name: 'SafeScan Security', path: '/dashboard/safescan', tier: 'premium' },
      { name: 'Analytics', path: '/dashboard/analytics', tier: 'premium' }
    ];

    const enterprisePages = [
      { name: 'API Management', path: '/dashboard/api-management', tier: 'enterprise' },
      { name: 'White-label Branding', path: '/dashboard/white-label', tier: 'enterprise' },
      { name: 'Team Management', path: '/dashboard/teams', tier: 'enterprise' },
      { name: 'SafeShield EDR', path: '/dashboard/safeshield', tier: 'enterprise' },
      { name: 'RMM Platform', path: '/dashboard/rmm', tier: 'enterprise' },
      { name: 'Helpdesk System', path: '/dashboard/helpdesk', tier: 'enterprise' }
    ];

    let accessiblePages = [...basePages];
    
    if (subscription.subscription_tier === 'premium' || subscription.subscription_tier === 'enterprise') {
      accessiblePages = [...accessiblePages, ...premiumPages];
    }
    
    if (subscription.subscription_tier === 'enterprise') {
      accessiblePages = [...accessiblePages, ...enterprisePages];
    }

    return accessiblePages;
  };

  useEffect(() => {
    if (user) {
      loadProfile();
      loadStats();
      checkAdminStatus();
    }
  }, [user]);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('ultrium_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }
  }, []);

  const checkAdminStatus = () => {
    if (user?.email?.endsWith('@ultriumai.com')) {
      setIsAdmin(true);
    }
  };

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

  const loadStats = async () => {
    if (!user) return;

    try {
      // Load conversation count
      const { count: convCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Load message count differently
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id);

      if (conversations) {
        const conversationIds = conversations.map(c => c.id);
        
        if (conversationIds.length > 0) {
          const { count: msgCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .in('conversation_id', conversationIds);
          
          setMessageCount(msgCount || 0);
        } else {
          setMessageCount(0);
        }
      }

      setConversationCount(convCount || 0);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Update existing profile data
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          bio: profile.bio
        })
        .eq('user_id', user.id);

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

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem('ultrium_settings', JSON.stringify(settings));
      
      toast({
        title: "Settings saved",
        description: "Your AI preferences have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAllData = async () => {
    if (!user) return;
    
    if (!confirm("Are you sure you want to delete ALL conversations and messages? This action cannot be undone.")) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setConversationCount(0);
      setMessageCount(0);

      toast({
        title: "Data cleared",
        description: "All conversations and messages have been deleted.",
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to clear data. Please try again.",
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

  const getTierBadge = (tier: string) => {
    const colors = {
      free: "bg-gray-100 text-gray-800",
      premium: "bg-purple-100 text-purple-800",
      enterprise: "bg-orange-100 text-orange-800"
    };
    return (
      <Badge className={colors[tier as keyof typeof colors] || colors.free}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </Badge>
    );
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/dashboard')}
          className="hover:bg-muted"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Account & Settings</h1>
          <p className="text-muted-foreground">Manage your profile, subscription, and UltriumGPT preferences.</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="ai-features">AI Features</TabsTrigger>
          <TabsTrigger value="ai-settings">AI Settings</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
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

              <Separator />

              {/* Account Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Account Information</h3>
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

                <div>
                  <Label className="text-sm font-medium">User ID</Label>
                  <p className="text-sm text-muted-foreground font-mono">
                    {user?.id}
                  </p>
                </div>
              </div>

              {/* Account Actions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Account Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Button variant="outline">
                    Change Password
                  </Button>
                  <Button variant="outline">
                    Export Account Data
                  </Button>
                </div>
              </div>

              {isAdmin && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Administrator Access
                    </h3>
                <Button 
                  variant="outline" 
                  className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
                  onClick={() => navigate('/admin')}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Open Admin Portal
                </Button>
                    <p className="text-xs text-muted-foreground">
                      Access administrative functions and system management tools.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4">
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
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={async () => {
                      try {
                        await checkSubscription();
                        toast({
                          title: "Subscription status refreshed",
                          description: "Your subscription status has been updated.",
                        });
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to refresh subscription status.",
                          variant: "destructive",
                        });
                      }
                    }}
                    disabled={isSubscriptionLoading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isSubscriptionLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  {subscription.subscribed ? (
                    <Button 
                      variant="outline" 
                      onClick={() => openCustomerPortal('safesuite')}
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshCredits} 
                  disabled={isCreditsLoading}
                >
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

          {/* Page Access */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Page Access & Permissions
              </CardTitle>
              <CardDescription>
                See which pages and features you have access to based on your subscription.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <h3 className="font-medium">Current Plan Access</h3>
                    <p className="text-sm text-muted-foreground">
                      You have access to {getAccessiblePages().length} pages
                    </p>
                  </div>
                  {getTierBadge(subscription.subscription_tier)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {getAccessiblePages().map((page) => (
                    <div key={page.path} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium text-sm">{page.name}</h4>
                        <p className="text-xs text-muted-foreground">{page.path}</p>
                      </div>
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                  ))}
                </div>

                {subscription.subscription_tier === 'free' && (
                  <div className="mt-6 p-4 border border-orange-200 rounded-lg bg-orange-50">
                    <h4 className="font-medium text-orange-800 mb-2">Unlock More Features</h4>
                    <p className="text-sm text-orange-700 mb-3">
                      Upgrade to Premium or Enterprise to access additional pages like Custom GPTs, Security Tools, and Analytics.
                    </p>
                    <Button size="sm" variant="outline">
                      View Pricing
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                UltriumGPT Features & Capabilities
              </CardTitle>
              <CardDescription>
                See what AI features are available in your current subscription tier.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Core Features */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Core Features (Free)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiFeatures.filter(f => f.category === 'core').map((feature) => (
                      <div key={feature.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <feature.icon className="w-5 h-5 mt-0.5 text-green-500" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{feature.name}</h4>
                            <Check className="w-3 h-3 text-green-500" />
                          </div>
                          <p className="text-xs text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Advanced Features */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    {subscription.subscription_tier !== 'free' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Lock className="w-4 h-4 text-orange-500" />
                    )}
                    Advanced Features (Premium)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiFeatures.filter(f => f.category === 'advanced').map((feature) => (
                      <div key={feature.id} className={`flex items-start gap-3 p-3 border rounded-lg ${!feature.available ? 'opacity-60' : ''}`}>
                        <feature.icon className={`w-5 h-5 mt-0.5 ${feature.available ? 'text-green-500' : 'text-gray-400'}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{feature.name}</h4>
                            {feature.available ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <X className="w-3 h-3 text-gray-400" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{feature.description}</p>
                          {!feature.available && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              Requires {feature.requiresTier}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enterprise Features */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    {subscription.subscription_tier === 'enterprise' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Lock className="w-4 h-4 text-orange-500" />
                    )}
                    Enterprise Features
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiFeatures.filter(f => f.category === 'enterprise').map((feature) => (
                      <div key={feature.id} className={`flex items-start gap-3 p-3 border rounded-lg ${!feature.available ? 'opacity-60' : ''}`}>
                        <feature.icon className={`w-5 h-5 mt-0.5 ${feature.available ? 'text-green-500' : 'text-gray-400'}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{feature.name}</h4>
                            {feature.available ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <X className="w-3 h-3 text-gray-400" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{feature.description}</p>
                          {!feature.available && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              Requires Enterprise
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Model Settings
              </CardTitle>
              <CardDescription>
                Configure how UltriumGPT responds to your messages.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="model">Preferred AI Model</Label>
                <Select 
                  value={settings.preferred_model} 
                  onValueChange={(value) => setSettings(prev => ({ ...prev, preferred_model: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select AI model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4.1-2025-04-14">GPT-4.1 (Recommended)</SelectItem>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini (Faster)</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o (Advanced)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature">Creativity Level: {settings.temperature}</Label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Focused</span>
                  <span>Creative</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_tokens">Max Response Length</Label>
                <Input
                  id="max_tokens"
                  type="number"
                  min="100"
                  max="4000"
                  value={settings.max_tokens}
                  onChange={(e) => setSettings(prev => ({ ...prev, max_tokens: parseInt(e.target.value) }))}
                />
                <p className="text-xs text-muted-foreground">
                  Higher values allow longer responses but cost more
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="system_prompt">System Prompt</Label>
                <textarea
                  id="system_prompt"
                  className="w-full min-h-[100px] p-3 border border-input rounded-md bg-background"
                  value={settings.system_prompt}
                  onChange={(e) => setSettings(prev => ({ ...prev, system_prompt: e.target.value }))}
                  placeholder="Enter instructions for how the AI should behave..."
                />
                <p className="text-xs text-muted-foreground">
                  This message guides the AI's personality and behavior
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Feature Settings</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-save conversations</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically save your conversations to the database
                    </p>
                  </div>
                  <Switch
                    checked={settings.auto_save}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_save: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Voice interaction</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable voice input and output features
                    </p>
                  </div>
                  <Switch
                    checked={settings.voice_enabled && subscription.subscription_tier !== 'free'}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, voice_enabled: checked }))}
                    disabled={subscription.subscription_tier === 'free'}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>File upload & analysis</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow uploading files for AI analysis
                    </p>
                  </div>
                  <Switch
                    checked={settings.file_upload_enabled && subscription.subscription_tier !== 'free'}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, file_upload_enabled: checked }))}
                    disabled={subscription.subscription_tier === 'free'}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Web search integration</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable real-time web search capabilities
                    </p>
                  </div>
                  <Switch
                    checked={settings.web_search_enabled && subscription.subscription_tier !== 'free'}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, web_search_enabled: checked }))}
                    disabled={subscription.subscription_tier === 'free'}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                View your usage statistics and manage your data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{conversationCount}</div>
                  <div className="text-sm text-muted-foreground">Conversations</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{messageCount}</div>
                  <div className="text-sm text-muted-foreground">Messages</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
                <div className="border border-destructive/20 rounded-lg p-4 space-y-3">
                  <div>
                    <h4 className="font-medium">Clear All Data</h4>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete all your conversations and messages. This action cannot be undone.
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={handleClearAllData}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete All Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button onClick={handleSaveSettings} disabled={isLoading} variant="outline">
          <Save className="w-4 h-4 mr-2" />
          Save AI Settings
        </Button>
        <Button onClick={handleSaveProfile} disabled={isLoading} variant="hero">
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </div>
  );
};

export default ProfilePage;