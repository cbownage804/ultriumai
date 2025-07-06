import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
// import { ColorPicker } from "@/components/whiteLabel/ColorPicker";
import { useToast } from "@/hooks/use-toast";
import { Palette, Upload, Eye, Save, Download } from "lucide-react";

interface WhiteLabelConfig {
  branding: {
    companyName: string;
    logo: string;
    favicon: string;
    tagline: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
  };
  features: {
    hideUltriumBranding: boolean;
    customFooter: boolean;
    customSupport: boolean;
    customDomain: boolean;
  };
  customization: {
    headerText: string;
    footerText: string;
    supportEmail: string;
    supportPhone: string;
    customCSS: string;
  };
}

export const WhiteLabelCustomizer = () => {
  const [config, setConfig] = useState<WhiteLabelConfig>({
    branding: {
      companyName: "Your Company",
      logo: "",
      favicon: "",
      tagline: "Compliance Made Simple"
    },
    colors: {
      primary: "#3b82f6",
      secondary: "#64748b",
      accent: "#10b981",
      background: "#ffffff",
      foreground: "#0f172a"
    },
    features: {
      hideUltriumBranding: false,
      customFooter: false,
      customSupport: false,
      customDomain: false
    },
    customization: {
      headerText: "Compliance Dashboard",
      footerText: "© 2025 Your Company. All rights reserved.",
      supportEmail: "support@yourcompany.com",
      supportPhone: "+1 (555) 123-4567",
      customCSS: ""
    }
  });

  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();

  const handleSaveConfig = () => {
    // In a real implementation, this would save to the database
    localStorage.setItem('whitelabel-config', JSON.stringify(config));
    toast({
      title: "Configuration Saved",
      description: "Your white-label settings have been saved successfully"
    });
  };

  const handleExportConfig = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whitelabel-config-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const updateBranding = (field: keyof WhiteLabelConfig['branding'], value: string) => {
    setConfig(prev => ({
      ...prev,
      branding: { ...prev.branding, [field]: value }
    }));
  };

  const updateColors = (field: keyof WhiteLabelConfig['colors'], value: string) => {
    setConfig(prev => ({
      ...prev,
      colors: { ...prev.colors, [field]: value }
    }));
  };

  const updateFeatures = (field: keyof WhiteLabelConfig['features'], value: boolean) => {
    setConfig(prev => ({
      ...prev,
      features: { ...prev.features, [field]: value }
    }));
  };

  const updateCustomization = (field: keyof WhiteLabelConfig['customization'], value: string) => {
    setConfig(prev => ({
      ...prev,
      customization: { ...prev.customization, [field]: value }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">White-Label Customization</h2>
          <p className="text-muted-foreground">Customize the SafeComp interface for your clients</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            <Eye className="w-4 h-4 mr-2" />
            {previewMode ? 'Edit Mode' : 'Preview'}
          </Button>
          <Button variant="outline" onClick={handleExportConfig}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleSaveConfig}>
            <Save className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </div>

      {previewMode ? (
        <Card className="border-2 border-dashed border-primary">
          <CardHeader style={{ backgroundColor: config.colors.primary, color: 'white' }}>
            <CardTitle>{config.customization.headerText}</CardTitle>
            <CardDescription className="text-white/80">
              {config.branding.companyName} - {config.branding.tagline}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8" style={{ backgroundColor: config.colors.background, color: config.colors.foreground }}>
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold">Preview Mode</h3>
              <p>This is how your white-labeled SafeComp dashboard will appear to clients</p>
              <div className="flex justify-center space-x-4">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: config.colors.primary }}></div>
                <div className="w-4 h-4 rounded" style={{ backgroundColor: config.colors.secondary }}></div>
                <div className="w-4 h-4 rounded" style={{ backgroundColor: config.colors.accent }}></div>
              </div>
              <div className="text-sm text-muted-foreground">
                {config.customization.footerText}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="branding" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="branding" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Brand Identity</CardTitle>
                <CardDescription>Customize your company branding elements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input
                      id="company-name"
                      value={config.branding.companyName}
                      onChange={(e) => updateBranding('companyName', e.target.value)}
                      placeholder="Your Company Name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input
                      id="tagline"
                      value={config.branding.tagline}
                      onChange={(e) => updateBranding('tagline', e.target.value)}
                      placeholder="Your company tagline"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="logo">Logo URL</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="logo"
                        value={config.branding.logo}
                        onChange={(e) => updateBranding('logo', e.target.value)}
                        placeholder="https://example.com/logo.png"
                      />
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="favicon">Favicon URL</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="favicon"
                        value={config.branding.favicon}
                        onChange={(e) => updateBranding('favicon', e.target.value)}
                        placeholder="https://example.com/favicon.ico"
                      />
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="colors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Color Scheme
                </CardTitle>
                <CardDescription>Customize the color palette for your brand</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <Input
                      type="color"
                      value={config.colors.primary}
                      onChange={(e) => updateColors('primary', e.target.value)}
                      className="h-10 w-20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Secondary Color</Label>
                    <Input
                      type="color"
                      value={config.colors.secondary}
                      onChange={(e) => updateColors('secondary', e.target.value)}
                      className="h-10 w-20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <Input
                      type="color"
                      value={config.colors.accent}
                      onChange={(e) => updateColors('accent', e.target.value)}
                      className="h-10 w-20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Background Color</Label>
                    <Input
                      type="color"
                      value={config.colors.background}
                      onChange={(e) => updateColors('background', e.target.value)}
                      className="h-10 w-20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <Input
                      type="color"
                      value={config.colors.foreground}
                      onChange={(e) => updateColors('foreground', e.target.value)}
                      className="h-10 w-20"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Feature Configuration</CardTitle>
                <CardDescription>Enable or disable specific features for your white-label deployment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="hide-branding">Hide Ultrium Branding</Label>
                      <p className="text-sm text-muted-foreground">Remove all Ultrium AI references</p>
                    </div>
                    <Switch
                      id="hide-branding"
                      checked={config.features.hideUltriumBranding}
                      onCheckedChange={(checked) => updateFeatures('hideUltriumBranding', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="custom-footer">Custom Footer</Label>
                      <p className="text-sm text-muted-foreground">Use your own footer content</p>
                    </div>
                    <Switch
                      id="custom-footer"
                      checked={config.features.customFooter}
                      onCheckedChange={(checked) => updateFeatures('customFooter', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="custom-support">Custom Support</Label>
                      <p className="text-sm text-muted-foreground">Use your support contact information</p>
                    </div>
                    <Switch
                      id="custom-support"
                      checked={config.features.customSupport}
                      onCheckedChange={(checked) => updateFeatures('customSupport', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="custom-domain">Custom Domain Support</Label>
                      <p className="text-sm text-muted-foreground">Enable custom domain configuration</p>
                    </div>
                    <Switch
                      id="custom-domain"
                      checked={config.features.customDomain}
                      onCheckedChange={(checked) => updateFeatures('customDomain', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Customization</CardTitle>
                <CardDescription>Advanced settings for power users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="header-text">Header Text</Label>
                    <Input
                      id="header-text"
                      value={config.customization.headerText}
                      onChange={(e) => updateCustomization('headerText', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="support-email">Support Email</Label>
                    <Input
                      id="support-email"
                      type="email"
                      value={config.customization.supportEmail}
                      onChange={(e) => updateCustomization('supportEmail', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="footer-text">Footer Text</Label>
                  <Input
                    id="footer-text"
                    value={config.customization.footerText}
                    onChange={(e) => updateCustomization('footerText', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="custom-css">Custom CSS</Label>
                  <Textarea
                    id="custom-css"
                    value={config.customization.customCSS}
                    onChange={(e) => updateCustomization('customCSS', e.target.value)}
                    placeholder="/* Add your custom CSS here */"
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Add custom CSS to further customize the appearance
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};