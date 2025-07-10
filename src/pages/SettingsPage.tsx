import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Save, User, Brain, Database, Trash2, Shield, Zap, Bot, MessageSquare, Mic, Upload, Globe, Crown, Check, X, Lock } from "lucide-react";

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

const SettingsPage = () => {
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
  
  const [profile, setProfile] = useState({
    full_name: "",
    email: ""
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [conversationCount, setConversationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { subscription } = useSubscription();

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
      { name: 'Settings', path: '/dashboard/settings', tier: 'free' }
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
      loadUserData();
      loadStats();
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = () => {
    if (user?.email?.endsWith('@ultriumai.com')) {
      setIsAdmin(true);
    }
  };

  const loadUserData = async () => {
    if (!user) return;
    
    setProfile({
      full_name: user.user_metadata?.full_name || "",
      email: user.email || ""
    });
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

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // For now, we'll store settings in localStorage
      // In a real app, you'd want a user_settings table
      localStorage.setItem('ultrium_settings', JSON.stringify(settings));
      
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
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

  // Load settings from localStorage on component mount
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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your UltriumAI experience, AI preferences, and account settings.</p>
      </div>

      <Tabs defaultValue="ultriumgpt" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ultriumgpt">UltriumGPT</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="access">Page Access</TabsTrigger>
          <TabsTrigger value="ai">AI Settings</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="ultriumgpt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                UltriumGPT Overview
              </CardTitle>
              <CardDescription>
                Your unified AI assistant that adapts to any context and provides specialized assistance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Current Subscription</h3>
                  <div className="flex items-center gap-2">
                    {getTierBadge(subscription.subscription_tier)}
                    <span className="text-sm text-muted-foreground">
                      {subscription.subscription_tier === 'enterprise' && 'Full access to all features'}
                      {subscription.subscription_tier === 'premium' && 'Advanced features unlocked'}
                      {subscription.subscription_tier === 'free' && 'Basic features available'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">AI Assistant Modes</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      <span>UltriumGPT</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      <span>Security</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      <span>Helpdesk</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bot className="w-3 h-3" />
                      <span>RMM</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Key Capabilities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-3 border rounded-lg">
                    <MessageSquare className="w-5 h-5 mb-2 text-primary" />
                    <h4 className="font-medium text-sm">Contextual Chat</h4>
                    <p className="text-xs text-muted-foreground">AI understands your current context</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <Database className="w-5 h-5 mb-2 text-primary" />
                    <h4 className="font-medium text-sm">Conversation History</h4>
                    <p className="text-xs text-muted-foreground">All conversations saved and searchable</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <Brain className="w-5 h-5 mb-2 text-primary" />
                    <h4 className="font-medium text-sm">Adaptive Intelligence</h4>
                    <p className="text-xs text-muted-foreground">Learns from your workflow patterns</p>
                  </div>
                </div>
              </div>

              {subscription.subscription_tier === 'free' && (
                <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <Crown className="w-4 h-4 text-purple-600" />
                    Unlock More with Premium
                  </h4>
                  <p className="text-sm text-purple-700 mb-3">
                    Upgrade to Premium or Enterprise to unlock advanced AI features like voice interaction, file analysis, and specialized assistant modes.
                  </p>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                    Upgrade Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Features & Capabilities
              </CardTitle>
              <CardDescription>
                See what features are available in your current subscription tier.
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

        <TabsContent value="access" className="space-y-4">
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
                    <h3 className="font-medium">Current Subscription</h3>
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

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Model Settings
              </CardTitle>
              <CardDescription>
                Configure how the AI responds to your messages.
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

      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={isLoading} variant="hero">
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;