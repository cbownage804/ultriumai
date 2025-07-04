import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Palette, Globe, Eye, Download, Upload, Save, RefreshCw } from "lucide-react";
import { ColorResult, SketchPicker } from 'react-color';

interface WhiteLabelConfig {
  id?: string;
  user_id?: string;
  company_name: string;
  company_logo: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  custom_domain: string;
  favicon_url: string;
  custom_css: string;
  footer_text: string;
  hide_powered_by: boolean;
  custom_login_page: boolean;
  email_templates: {
    welcome: string;
    password_reset: string;
    invitation: string;
  };
  created_at?: string;
  updated_at?: string;
}

const WhiteLabelCustomization = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<WhiteLabelConfig>({
    company_name: "",
    company_logo: "",
    primary_color: "#3b82f6",
    secondary_color: "#8b5cf6",
    background_color: "#ffffff",
    text_color: "#000000",
    custom_domain: "",
    favicon_url: "",
    custom_css: "",
    footer_text: "Powered by UltriumGPT",
    hide_powered_by: false,
    custom_login_page: false,
    email_templates: {
      welcome: "Welcome to {{company_name}}! Your account has been created successfully.",
      password_reset: "Click the link below to reset your password for {{company_name}}.",
      invitation: "You've been invited to join {{company_name}}. Click here to get started."
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    loadWhiteLabelConfig();
  }, [user]);

  const loadWhiteLabelConfig = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('whitelabel_configs' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const configData = data as unknown as WhiteLabelConfig;
        setConfig({
          ...config,
          ...configData,
          email_templates: configData.email_templates || config.email_templates
        });
      }
    } catch (error) {
      console.error('Error loading white-label config:', error);
    }
  };

  const saveConfig = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('whitelabel_configs' as any)
        .upsert({
          user_id: user.id,
          ...config
        });

      if (error) throw error;

      toast({
        title: "Configuration saved",
        description: "Your white-label settings have been updated.",
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Error",
        description: "Failed to save configuration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (field: string, color: ColorResult) => {
    setConfig(prev => ({
      ...prev,
      [field]: color.hex
    }));
  };

  const uploadLogo = async (file: File, type: 'logo' | 'favicon') => {
    if (!user) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${type}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('whitelabel-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('whitelabel-assets')
        .getPublicUrl(filePath);

      const field = type === 'logo' ? 'company_logo' : 'favicon_url';
      setConfig(prev => ({
        ...prev,
        [field]: data.publicUrl
      }));

      toast({
        title: "Upload successful",
        description: `${type} has been uploaded.`,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: `Failed to upload ${type}.`,
        variant: "destructive",
      });
    }
  };

  const generatePreviewCSS = () => {
    return `
      :root {
        --primary: ${config.primary_color};
        --secondary: ${config.secondary_color};
        --background: ${config.background_color};
        --foreground: ${config.text_color};
      }
      
      .preview-container {
        background-color: ${config.background_color};
        color: ${config.text_color};
        min-height: 400px;
        padding: 2rem;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
      }
      
      .preview-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid ${config.primary_color}33;
      }
      
      .preview-logo {
        width: 48px;
        height: 48px;
        border-radius: 0.5rem;
        background: ${config.primary_color};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
      }
      
      .preview-button {
        background: ${config.primary_color};
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        border: none;
        cursor: pointer;
        margin-right: 0.5rem;
        margin-bottom: 0.5rem;
      }
      
      .preview-button-secondary {
        background: ${config.secondary_color};
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        border: none;
        cursor: pointer;
        margin-right: 0.5rem;
        margin-bottom: 0.5rem;
      }
      
      ${config.custom_css}
    `;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">White-label Customization</h2>
          <p className="text-muted-foreground">Customize the branding and appearance of your UltriumGPT deployment.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={previewMode}
            onCheckedChange={setPreviewMode}
          />
          <Label>Preview Mode</Label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="branding" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="domain">Domain</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="branding" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Brand Identity
                  </CardTitle>
                  <CardDescription>Configure your company branding and visual identity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input
                      id="company-name"
                      value={config.company_name}
                      onChange={(e) => setConfig(prev => ({ ...prev, company_name: e.target.value }))}
                      placeholder="Your Company Name"
                    />
                  </div>

                  <div>
                    <Label>Company Logo</Label>
                    <div className="flex items-center space-x-4 mt-2">
                      {config.company_logo && (
                        <img src={config.company_logo} alt="Logo" className="h-12 w-12 object-contain" />
                      )}
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('logo-upload')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Logo
                      </Button>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadLogo(file, 'logo');
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Favicon</Label>
                    <div className="flex items-center space-x-4 mt-2">
                      {config.favicon_url && (
                        <img src={config.favicon_url} alt="Favicon" className="h-8 w-8 object-contain" />
                      )}
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('favicon-upload')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Favicon
                      </Button>
                      <input
                        id="favicon-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadLogo(file, 'favicon');
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="footer-text">Footer Text</Label>
                    <Input
                      id="footer-text"
                      value={config.footer_text}
                      onChange={(e) => setConfig(prev => ({ ...prev, footer_text: e.target.value }))}
                      placeholder="© 2024 Your Company. All rights reserved."
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.hide_powered_by}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, hide_powered_by: checked }))}
                    />
                    <Label>Hide "Powered by UltriumGPT"</Label>
                    <Badge variant="outline">Premium</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="colors" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Color Scheme</CardTitle>
                  <CardDescription>Customize your brand colors and theme</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    { key: 'primary_color', label: 'Primary Color', description: 'Main brand color for buttons and accents' },
                    { key: 'secondary_color', label: 'Secondary Color', description: 'Supporting color for highlights' },
                    { key: 'background_color', label: 'Background Color', description: 'Main background color' },
                    { key: 'text_color', label: 'Text Color', description: 'Primary text color' }
                  ].map((colorOption) => (
                    <div key={colorOption.key} className="space-y-2">
                      <Label>{colorOption.label}</Label>
                      <p className="text-sm text-muted-foreground">{colorOption.description}</p>
                      <div className="flex items-center space-x-4">
                        <div
                          className="h-10 w-20 rounded border cursor-pointer"
                          style={{ backgroundColor: config[colorOption.key as keyof WhiteLabelConfig] as string }}
                          onClick={() => setShowColorPicker(showColorPicker === colorOption.key ? null : colorOption.key)}
                        />
                        <Input
                          value={config[colorOption.key as keyof WhiteLabelConfig] as string}
                          onChange={(e) => setConfig(prev => ({ ...prev, [colorOption.key]: e.target.value }))}
                          className="font-mono text-sm w-32"
                        />
                      </div>
                      {showColorPicker === colorOption.key && (
                        <div className="absolute z-50">
                          <div
                            className="fixed inset-0"
                            onClick={() => setShowColorPicker(null)}
                          />
                          <SketchPicker
                            color={config[colorOption.key as keyof WhiteLabelConfig] as string}
                            onChange={(color) => handleColorChange(colorOption.key, color)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="domain" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Custom Domain
                  </CardTitle>
                  <CardDescription>Configure your custom domain and deployment settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="custom-domain">Custom Domain</Label>
                    <Input
                      id="custom-domain"
                      value={config.custom_domain}
                      onChange={(e) => setConfig(prev => ({ ...prev, custom_domain: e.target.value }))}
                      placeholder="your-domain.com"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Enter your custom domain. DNS configuration will be provided after setup.
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">DNS Configuration</h4>
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-sm">CNAME</span>
                        <span className="font-mono text-sm">your-app.ultriumgpt.com</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-sm">TXT</span>
                        <span className="font-mono text-sm">ultriumgpt-verify=abc123</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.custom_login_page}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, custom_login_page: checked }))}
                    />
                    <Label>Custom Login Page</Label>
                    <Badge variant="outline">Enterprise</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Customization</CardTitle>
                  <CardDescription>Custom CSS and email templates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="custom-css">Custom CSS</Label>
                    <Textarea
                      id="custom-css"
                      value={config.custom_css}
                      onChange={(e) => setConfig(prev => ({ ...prev, custom_css: e.target.value }))}
                      placeholder="/* Your custom CSS */\n.custom-class {\n  color: #333;\n}"
                      className="h-32 font-mono text-sm"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Email Templates</h4>
                    
                    <div>
                      <Label htmlFor="welcome-template">Welcome Email</Label>
                      <Textarea
                        id="welcome-template"
                        value={config.email_templates.welcome}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          email_templates: { ...prev.email_templates, welcome: e.target.value }
                        }))}
                        placeholder="Welcome email template"
                        className="h-20"
                      />
                    </div>

                    <div>
                      <Label htmlFor="reset-template">Password Reset Email</Label>
                      <Textarea
                        id="reset-template"
                        value={config.email_templates.password_reset}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          email_templates: { ...prev.email_templates, password_reset: e.target.value }
                        }))}
                        placeholder="Password reset email template"
                        className="h-20"
                      />
                    </div>

                    <div>
                      <Label htmlFor="invitation-template">Invitation Email</Label>
                      <Textarea
                        id="invitation-template"
                        value={config.email_templates.invitation}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          email_templates: { ...prev.email_templates, invitation: e.target.value }
                        }))}
                        placeholder="Invitation email template"
                        className="h-20"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <style dangerouslySetInnerHTML={{ __html: generatePreviewCSS() }} />
              <div className="preview-container">
                <div className="preview-header">
                  <div className="preview-logo">
                    {config.company_logo ? (
                      <img src={config.company_logo} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      config.company_name.charAt(0) || 'C'
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{config.company_name || 'Company Name'}</h3>
                    <p className="text-sm opacity-75">Your AI Assistant Platform</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Sample Interface</h4>
                  <button className="preview-button">Primary Button</button>
                  <button className="preview-button-secondary">Secondary Button</button>
                  
                  <div className="mt-4 p-4 rounded border">
                    <p className="text-sm">This is how your customized interface will look to your users.</p>
                  </div>
                  
                  <div className="mt-8 pt-4 border-t text-xs opacity-60">
                    {config.footer_text}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deployment Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={saveConfig} disabled={loading} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Save Configuration"}
              </Button>
              
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export Theme
              </Button>
              
              <Button variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Deploy Changes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WhiteLabelCustomization;