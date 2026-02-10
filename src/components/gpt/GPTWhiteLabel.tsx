import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCustomGPTs } from "@/hooks/useCustomGPTs";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Palette, 
  Globe, 
  Upload, 
  Image, 
  ArrowLeft,
  Eye,
  Save,
  Loader2,
  Bot,
  MessageSquare,
  CheckCircle
} from "lucide-react";

interface WhiteLabelConfig {
  logo_url: string;
  avatar_url: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  theme_color: string;
  title_color: string;
  remove_branding: boolean;
  whitelisted_domains: string;
  custom_loading_message: string;
  placeholder_prompt: string;
  terms_of_service: string;
}

const GPTWhiteLabel = () => {
  const { gpts } = useCustomGPTs();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gptIdFromUrl = searchParams.get('gpt');
  
  const [selectedGPTId, setSelectedGPTId] = useState<string>(gptIdFromUrl || "");
  const [config, setConfig] = useState<WhiteLabelConfig>({
    logo_url: "",
    avatar_url: "",
    primary_color: "#3B82F6",
    secondary_color: "#1E40AF",
    background_color: "#0A0A0B",
    theme_color: "#3B82F6",
    title_color: "#FFFFFF",
    remove_branding: false,
    whitelisted_domains: "",
    custom_loading_message: "",
    placeholder_prompt: "",
    terms_of_service: ""
  });
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const selectedGPT = gpts.find(gpt => gpt.id === selectedGPTId);

  // Load GPT config when selected
  useEffect(() => {
    if (selectedGPT) {
      setConfig({
        logo_url: selectedGPT.logo_url || "",
        avatar_url: selectedGPT.avatar_url || "",
        primary_color: selectedGPT.primary_color || "#3B82F6",
        secondary_color: selectedGPT.secondary_color || "#1E40AF",
        background_color: selectedGPT.background_color || "#0A0A0B",
        theme_color: selectedGPT.theme_color || "#3B82F6",
        title_color: selectedGPT.title_color || "#FFFFFF",
        remove_branding: selectedGPT.remove_branding || false,
        whitelisted_domains: selectedGPT.whitelisted_domains || "",
        custom_loading_message: selectedGPT.custom_loading_message || "",
        placeholder_prompt: selectedGPT.placeholder_prompt || "",
        terms_of_service: selectedGPT.terms_of_service || ""
      });
    }
  }, [selectedGPT]);

  // Auto-select GPT from URL or first available
  useEffect(() => {
    if (gptIdFromUrl && gpts.some(g => g.id === gptIdFromUrl)) {
      setSelectedGPTId(gptIdFromUrl);
    } else if (!selectedGPTId && gpts.length > 0) {
      setSelectedGPTId(gpts[0].id);
    }
  }, [gpts, gptIdFromUrl, selectedGPTId]);

  const handleSave = async () => {
    if (!selectedGPTId) {
      toast({
        title: "No GPT selected",
        description: "Please select a GPT to save white-label settings.",
        variant: "destructive"
      });
      return;
    }

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
          theme_color: config.theme_color,
          title_color: config.title_color,
          remove_branding: config.remove_branding,
          whitelisted_domains: config.whitelisted_domains,
          custom_loading_message: config.custom_loading_message,
          placeholder_prompt: config.placeholder_prompt,
          terms_of_service: config.terms_of_service
        })
        .eq('id', selectedGPTId);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "White-label settings have been updated for this GPT."
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

  if (gpts.length === 0) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/gpt')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to My GPTs
        </Button>
        
        <Card className="text-center py-12">
          <CardContent>
            <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No GPTs Available</h3>
            <p className="text-muted-foreground mb-4">
              Create a GPT first to configure white-label settings
            </p>
            <Button onClick={() => navigate('/ai-studio/gpt-builder')}>
              Create Your First GPT
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/gpt')} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to My GPTs
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Palette className="h-8 w-8 text-primary" />
            GPT White-Label Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Customize branding, colors, and appearance for each GPT
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={previewMode} onCheckedChange={setPreviewMode} />
            <Label>Preview</Label>
          </div>
          <Button onClick={handleSave} disabled={saving || !selectedGPTId}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Settings
          </Button>
        </div>
      </div>

      {/* GPT Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select GPT</CardTitle>
          <CardDescription>Choose which GPT to customize</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedGPTId} onValueChange={setSelectedGPTId}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select a GPT" />
            </SelectTrigger>
            <SelectContent>
              {gpts.map((gpt) => (
                <SelectItem key={gpt.id} value={gpt.id}>
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    {gpt.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="branding" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="text">Text & Messages</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            {/* Branding Tab */}
            <TabsContent value="branding" className="space-y-4">
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
                <CardContent className="space-y-6">
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
                        Hide "Powered by UltriumAI" from the chat interface
                      </p>
                    </div>
                    <Switch
                      checked={config.remove_branding}
                      onCheckedChange={(checked) => updateConfig('remove_branding', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Colors Tab */}
            <TabsContent value="colors" className="space-y-4">
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
                <CardContent className="space-y-6">
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
                          placeholder="#3B82F6"
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
                          placeholder="#1E40AF"
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
                          placeholder="#0A0A0B"
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
                          placeholder="#FFFFFF"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label>Theme/Accent Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={config.theme_color}
                          onChange={(e) => updateConfig('theme_color', e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={config.theme_color}
                          onChange={(e) => updateConfig('theme_color', e.target.value)}
                          placeholder="#3B82F6"
                          className="flex-1"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Used for buttons, links, and accent elements
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Text & Messages Tab */}
            <TabsContent value="text" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Custom Messages
                  </CardTitle>
                  <CardDescription>
                    Customize text displayed in the chat interface
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Input Placeholder</Label>
                    <Input
                      placeholder="Ask me anything..."
                      value={config.placeholder_prompt}
                      onChange={(e) => updateConfig('placeholder_prompt', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Text shown in the chat input field
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Loading Message</Label>
                    <Input
                      placeholder="Thinking..."
                      value={config.custom_loading_message}
                      onChange={(e) => updateConfig('custom_loading_message', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Message shown while generating a response
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Terms of Service URL</Label>
                    <Input
                      placeholder="https://your-domain.com/terms"
                      value={config.terms_of_service}
                      onChange={(e) => updateConfig('terms_of_service', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Link to your terms of service (shown in chat footer)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Domain & Embedding
                  </CardTitle>
                  <CardDescription>
                    Configure where this GPT can be embedded
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Whitelisted Domains</Label>
                    <Textarea
                      placeholder="example.com&#10;subdomain.example.com&#10;another-site.com"
                      value={config.whitelisted_domains}
                      onChange={(e) => updateConfig('whitelisted_domains', e.target.value)}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter one domain per line. Leave empty to allow embedding anywhere.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Live Preview
            </CardTitle>
            <CardDescription>
              See how your GPT will look
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="rounded-lg overflow-hidden border"
              style={{ backgroundColor: config.background_color }}
            >
              {/* Header Preview */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  {config.avatar_url ? (
                    <img 
                      src={config.avatar_url} 
                      alt="Avatar" 
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
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
                    <p 
                      className="font-semibold"
                      style={{ color: config.title_color }}
                    >
                      {selectedGPT?.name || "Your GPT"}
                    </p>
                    <p className="text-xs" style={{ color: config.title_color + '80' }}>
                      Online
                    </p>
                  </div>
                </div>
                {config.logo_url && (
                  <img 
                    src={config.logo_url} 
                    alt="Logo" 
                    className="h-6 mt-3 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </div>

              {/* Chat Preview */}
              <div className="p-4 space-y-4 min-h-[200px]">
                <div className="flex gap-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: config.primary_color }}
                  >
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div 
                    className="rounded-lg p-3 max-w-[80%]"
                    style={{ backgroundColor: config.primary_color + '20' }}
                  >
                    <p className="text-sm" style={{ color: config.title_color }}>
                      Hello! How can I help you today?
                    </p>
                  </div>
                </div>
              </div>

              {/* Input Preview */}
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
                Changes preview in real-time
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Settings apply to embeds
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GPTWhiteLabel;
