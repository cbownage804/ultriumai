import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  Palette, 
  Image, 
  Globe, 
  Save,
  Loader2,
  Eye,
  Bot,
  MessageSquare,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCustomGPTs } from "@/hooks/useCustomGPTs";

interface GPTWhiteLabelPanelProps {
  gptId: string;
  gptName: string;
  themeColor: string;
}

interface WhiteLabelConfig {
  logo_url: string;
  avatar_url: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  title_color: string;
  remove_branding: boolean;
  whitelisted_domains: string;
  custom_loading_message: string;
  placeholder_prompt: string;
}

export function GPTWhiteLabelPanel({ gptId, gptName, themeColor }: GPTWhiteLabelPanelProps) {
  const { toast } = useToast();
  const { gpts } = useCustomGPTs();
  const gpt = gpts.find(g => g.id === gptId);
  
  const [config, setConfig] = useState<WhiteLabelConfig>({
    logo_url: "",
    avatar_url: "",
    primary_color: themeColor,
    secondary_color: "#1E40AF",
    background_color: "#0A0A0B",
    title_color: "#FFFFFF",
    remove_branding: false,
    whitelisted_domains: "",
    custom_loading_message: "",
    placeholder_prompt: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (gpt) {
      setConfig({
        logo_url: gpt.logo_url || "",
        avatar_url: gpt.avatar_url || "",
        primary_color: gpt.primary_color || themeColor,
        secondary_color: gpt.secondary_color || "#1E40AF",
        background_color: gpt.background_color || "#0A0A0B",
        title_color: gpt.title_color || "#FFFFFF",
        remove_branding: gpt.remove_branding || false,
        whitelisted_domains: gpt.whitelisted_domains || "",
        custom_loading_message: gpt.custom_loading_message || "",
        placeholder_prompt: gpt.placeholder_prompt || ""
      });
    }
  }, [gpt, themeColor]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('custom_gpts')
        .update({
          logo_url: config.logo_url,
          avatar_url: config.avatar_url,
          primary_color: config.primary_color,
          secondary_color: config.secondary_color,
          background_color: config.background_color,
          title_color: config.title_color,
          remove_branding: config.remove_branding,
          whitelisted_domains: config.whitelisted_domains,
          custom_loading_message: config.custom_loading_message,
          placeholder_prompt: config.placeholder_prompt
        })
        .eq('id', gptId);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "White-label settings have been updated."
      });
    } catch (error) {
      console.error('Error saving white-label settings:', error);
      toast({
        title: "Error",
        description: "Failed to save white-label settings.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key: keyof WhiteLabelConfig, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Configuration */}
      <div className="lg:col-span-2 space-y-6">
        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Logo & Avatar
            </CardTitle>
            <CardDescription>
              Upload your brand logo and GPT avatar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input
                placeholder="https://your-domain.com/logo.png"
                value={config.logo_url}
                onChange={(e) => updateConfig('logo_url', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 200x50px transparent PNG
              </p>
            </div>

            <div className="space-y-2">
              <Label>Avatar URL</Label>
              <Input
                placeholder="https://your-domain.com/avatar.png"
                value={config.avatar_url}
                onChange={(e) => updateConfig('avatar_url', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 128x128px square image
              </p>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Remove UltriumAI Branding</p>
                <p className="text-sm text-muted-foreground">
                  Hide "Powered by UltriumAI" from the chat
                </p>
              </div>
              <Switch
                checked={config.remove_branding}
                onCheckedChange={(checked) => updateConfig('remove_branding', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Color Scheme
            </CardTitle>
            <CardDescription>
              Customize colors to match your brand
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.primary_color}
                    onChange={(e) => updateConfig('primary_color', e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={config.primary_color}
                    onChange={(e) => updateConfig('primary_color', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.secondary_color}
                    onChange={(e) => updateConfig('secondary_color', e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={config.secondary_color}
                    onChange={(e) => updateConfig('secondary_color', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.background_color}
                    onChange={(e) => updateConfig('background_color', e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={config.background_color}
                    onChange={(e) => updateConfig('background_color', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Title Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.title_color}
                    onChange={(e) => updateConfig('title_color', e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={config.title_color}
                    onChange={(e) => updateConfig('title_color', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Text & Domains */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Custom Text & Domains
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Input Placeholder</Label>
              <Input
                placeholder="Ask me anything..."
                value={config.placeholder_prompt}
                onChange={(e) => updateConfig('placeholder_prompt', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Loading Message</Label>
              <Input
                placeholder="Thinking..."
                value={config.custom_loading_message}
                onChange={(e) => updateConfig('custom_loading_message', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Whitelisted Domains</Label>
              <Textarea
                placeholder={"example.com\nsubdomain.example.com"}
                value={config.whitelisted_domains}
                onChange={(e) => updateConfig('whitelisted_domains', e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                One domain per line. Leave empty to allow embedding anywhere.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save White-Label Settings
          </Button>
        </div>
      </div>

      {/* Preview */}
      <Card className="lg:col-span-1 h-fit sticky top-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Live Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="rounded-lg overflow-hidden border"
            style={{ backgroundColor: config.background_color }}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                {config.avatar_url ? (
                  <img 
                    src={config.avatar_url} 
                    alt="Avatar" 
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: config.primary_color }}
                  >
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                )}
                <div>
                  <p className="font-semibold" style={{ color: config.title_color }}>
                    {gptName}
                  </p>
                  <p className="text-xs" style={{ color: config.title_color + '80' }}>
                    Online
                  </p>
                </div>
              </div>
            </div>

            {/* Chat */}
            <div className="p-4 min-h-[150px]">
              <div className="flex gap-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: config.primary_color }}
                >
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div 
                  className="rounded-lg p-3"
                  style={{ backgroundColor: config.primary_color + '20' }}
                >
                  <p className="text-sm" style={{ color: config.title_color }}>
                    Hello! How can I help you?
                  </p>
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
              <div 
                className="rounded-lg p-3 flex items-center gap-2"
                style={{ backgroundColor: config.title_color + '10' }}
              >
                <p 
                  className="text-sm flex-1 opacity-50"
                  style={{ color: config.title_color }}
                >
                  {config.placeholder_prompt || "Ask me anything..."}
                </p>
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: config.primary_color }}
                >
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
              </div>
              
              {!config.remove_branding && (
                <p className="text-[10px] text-center mt-2" style={{ color: config.title_color + '40' }}>
                  Powered by UltriumAI
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Real-time preview
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
