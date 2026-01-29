import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Globe,
  Settings,
  Ticket,
  Heart,
  BookOpen,
  Shield,
  Copy,
  ExternalLink,
  Save,
  Loader2,
  Users,
  Mail,
  Phone,
  Palette,
  Lock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface PortalSettings {
  id?: string;
  portal_name: string;
  portal_logo_url: string;
  primary_color: string;
  enable_tickets: boolean;
  enable_health_status: boolean;
  enable_knowledge_base: boolean;
  enable_safepass: boolean;
  safepass_subscription_required: boolean;
  welcome_message: string;
  support_email: string;
  support_phone: string;
  custom_css: string;
}

const defaultSettings: PortalSettings = {
  portal_name: "Customer Portal",
  portal_logo_url: "",
  primary_color: "#0891b2",
  enable_tickets: true,
  enable_health_status: true,
  enable_knowledge_base: true,
  enable_safepass: false,
  safepass_subscription_required: true,
  welcome_message: "Welcome to your IT support portal. How can we help you today?",
  support_email: "",
  support_phone: "",
  custom_css: "",
};

export default function VanguardPortalSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PortalSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const portalUrl = `${window.location.origin}/customer-portal`;

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("vanguard_portal_settings")
        .select("*")
        .eq("user_id", user.id)
        .is("client_id", null)
        .maybeSingle();

      if (data) {
        setSettings({
          id: data.id,
          portal_name: data.portal_name || defaultSettings.portal_name,
          portal_logo_url: data.portal_logo_url || "",
          primary_color: data.primary_color || defaultSettings.primary_color,
          enable_tickets: data.enable_tickets ?? true,
          enable_health_status: data.enable_health_status ?? true,
          enable_knowledge_base: data.enable_knowledge_base ?? true,
          enable_safepass: data.enable_safepass ?? false,
          safepass_subscription_required: data.safepass_subscription_required ?? true,
          welcome_message: data.welcome_message || defaultSettings.welcome_message,
          support_email: data.support_email || "",
          support_phone: data.support_phone || "",
          custom_css: data.custom_css || "",
        });
      }
    } catch (err) {
      console.error("Error loading portal settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const payload = {
        user_id: user.id,
        client_id: null,
        ...settings,
      };

      if (settings.id) {
        const { error } = await supabase
          .from("vanguard_portal_settings")
          .update(payload)
          .eq("id", settings.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("vanguard_portal_settings")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        setSettings({ ...settings, id: data.id });
      }

      toast.success("Portal settings saved");
      setHasChanges(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof PortalSettings>(key: K, value: PortalSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const copyPortalUrl = () => {
    navigator.clipboard.writeText(portalUrl);
    toast.success("Portal URL copied to clipboard");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Globe className="h-8 w-8 text-cyan-500" />
              Customer Portal
            </h1>
            <p className="text-slate-400 mt-1">
              Configure the self-service portal for your customers
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
              onClick={() => window.open(portalUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview Portal
            </Button>
            <Button
              onClick={saveSettings}
              disabled={isSaving || !hasChanges}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        {/* Portal URL Card */}
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Your Customer Portal URL</p>
                  <p className="text-white font-mono text-sm">{portalUrl}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={copyPortalUrl}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Settings */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-cyan-500/20">
            <TabsTrigger value="general" className="data-[state=active]:bg-cyan-500/20">
              <Settings className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="features" className="data-[state=active]:bg-cyan-500/20">
              <Ticket className="h-4 w-4 mr-2" />
              Features
            </TabsTrigger>
            <TabsTrigger value="safepass" className="data-[state=active]:bg-cyan-500/20">
              <Shield className="h-4 w-4 mr-2" />
              SafePass
            </TabsTrigger>
            <TabsTrigger value="branding" className="data-[state=active]:bg-cyan-500/20">
              <Palette className="h-4 w-4 mr-2" />
              Branding
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white">General Settings</CardTitle>
                <CardDescription className="text-slate-400">
                  Configure basic portal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Portal Name</Label>
                    <Input
                      value={settings.portal_name}
                      onChange={(e) => updateSetting("portal_name", e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      placeholder="My IT Support Portal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Logo URL</Label>
                    <Input
                      value={settings.portal_logo_url}
                      onChange={(e) => updateSetting("portal_logo_url", e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Welcome Message</Label>
                  <Textarea
                    value={settings.welcome_message}
                    onChange={(e) => updateSetting("welcome_message", e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white min-h-[100px]"
                    placeholder="Welcome to your IT support portal..."
                  />
                </div>

                <Separator className="bg-slate-700" />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-slate-300 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Support Email
                    </Label>
                    <Input
                      value={settings.support_email}
                      onChange={(e) => updateSetting("support_email", e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      placeholder="support@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Support Phone
                    </Label>
                    <Input
                      value={settings.support_phone}
                      onChange={(e) => updateSetting("support_phone", e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features">
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white">Portal Features</CardTitle>
                <CardDescription className="text-slate-400">
                  Enable or disable portal features for your customers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Ticket className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Support Tickets</p>
                        <p className="text-sm text-slate-400">
                          Let customers create and track support requests
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.enable_tickets}
                      onCheckedChange={(checked) => updateSetting("enable_tickets", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Heart className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">System Health Status</p>
                        <p className="text-sm text-slate-400">
                          Show device health, antivirus, and backup status
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.enable_health_status}
                      onCheckedChange={(checked) => updateSetting("enable_health_status", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Knowledge Base</p>
                        <p className="text-sm text-slate-400">
                          Self-service documentation and FAQs
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.enable_knowledge_base}
                      onCheckedChange={(checked) => updateSetting("enable_knowledge_base", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="safepass">
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-amber-500/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white">SafePass Integration</CardTitle>
                    <CardDescription className="text-slate-400">
                      Allow customers to access their password vault from the portal
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-amber-500/30">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-amber-400" />
                    <div>
                      <p className="text-white font-medium">Enable SafePass in Portal</p>
                      <p className="text-sm text-slate-400">
                        Customers can access their password vault
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.enable_safepass}
                    onCheckedChange={(checked) => updateSetting("enable_safepass", checked)}
                  />
                </div>

                {settings.enable_safepass && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                        <div>
                          <p className="text-white font-medium">Require SafeSuite Subscription</p>
                          <p className="text-sm text-slate-400">
                            Only show SafePass to customers with active SafeSuite subscription
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.safepass_subscription_required}
                        onCheckedChange={(checked) =>
                          updateSetting("safepass_subscription_required", checked)
                        }
                      />
                    </div>

                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-200">
                          <p className="font-medium">SafePass requires SafeSuite subscription</p>
                          <p className="mt-1 text-amber-300/80">
                            Customers will need an active SafeSuite subscription to access the password
                            manager. Non-subscribed users will see an upgrade prompt.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding">
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white">Branding & Appearance</CardTitle>
                <CardDescription className="text-slate-400">
                  Customize the look and feel of your customer portal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-slate-300">Primary Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) => updateSetting("primary_color", e.target.value)}
                      className="h-10 w-20 rounded cursor-pointer"
                    />
                    <Input
                      value={settings.primary_color}
                      onChange={(e) => updateSetting("primary_color", e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white font-mono w-32"
                      placeholder="#0891b2"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Custom CSS (Advanced)</Label>
                  <Textarea
                    value={settings.custom_css}
                    onChange={(e) => updateSetting("custom_css", e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white font-mono min-h-[150px]"
                    placeholder=".portal-header { background: #1e293b; }"
                  />
                  <p className="text-xs text-slate-500">
                    Add custom CSS to further customize the portal appearance
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
