import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Save, User, Brain, Database, Trash2, Shield } from "lucide-react";

interface UserSettings {
  preferred_model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  auto_save: boolean;
  theme: string;
}

const SettingsPage = () => {
  const [settings, setSettings] = useState<UserSettings>({
    preferred_model: "gpt-4.1-2025-04-14",
    temperature: 0.7,
    max_tokens: 1500,
    system_prompt: "You are UltriumGPT, a helpful AI assistant created by UltriumAI. You help users with various tasks including answering questions, providing information, and assisting with problem-solving. Be concise but thorough in your responses.",
    auto_save: true,
    theme: "system"
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">UltriumGPT Settings</h1>
        <p className="text-muted-foreground">Configure your UltriumGPT experience, AI preferences, and account settings.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="ai">AI Settings</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                General Preferences
              </CardTitle>
              <CardDescription>
                Configure your basic UltriumGPT preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select 
                  value={settings.theme} 
                  onValueChange={(value) => setSettings(prev => ({ ...prev, theme: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Information
              </CardTitle>
              <CardDescription>
                View and manage your account details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed here. Contact support if needed.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Account Actions</h3>
                <Button variant="outline" className="w-full">
                  Change Password
                </Button>
                <Button variant="outline" className="w-full">
                  Export Account Data
                </Button>
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
                      onClick={() => window.open('/admin', '_blank')}
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