/**
 * Portal Branding Configuration
 * Manages white-label branding for customer portals
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Palette, 
  Building2, 
  Image, 
  Type,
  Globe,
  Mail,
  Phone,
  Save,
  Eye,
  Upload,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

export interface PortalBrandingConfig {
  companyName: string;
  companyLogo?: string;
  faviconUrl?: string;
  primaryColor: string;
  accentColor: string;
  headerBgColor: string;
  footerText: string;
  supportEmail: string;
  supportPhone: string;
  customCss?: string;
  welcomeMessage: string;
  showPoweredBy: boolean;
  customDomain?: string;
}

interface PortalBrandingProps {
  config: PortalBrandingConfig;
  onSave: (config: PortalBrandingConfig) => void;
  isLoading?: boolean;
}

export function PortalBranding({ config, onSave, isLoading }: PortalBrandingProps) {
  const [brandingConfig, setBrandingConfig] = useState<PortalBrandingConfig>(config);
  const [showPreview, setShowPreview] = useState(false);

  const handleSave = () => {
    onSave(brandingConfig);
    toast.success("Branding settings saved successfully");
  };

  const updateConfig = (key: keyof PortalBrandingConfig, value: any) => {
    setBrandingConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Portal Branding</h2>
          <p className="text-sm text-gray-500">
            Customize the look and feel of your customer portal
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-4 w-4 mr-1" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-1" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center gap-1">
            <Building2 className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-1">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-1">
            <Mail className="h-4 w-4" />
            Contact Info
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-1">
            <Globe className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Basic branding information for your portal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={brandingConfig.companyName}
                    onChange={(e) => updateConfig('companyName', e.target.value)}
                    placeholder="Your Company Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-domain">Custom Domain</Label>
                  <Input
                    id="custom-domain"
                    value={brandingConfig.customDomain || ''}
                    onChange={(e) => updateConfig('customDomain', e.target.value)}
                    placeholder="support.yourcompany.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcome-message">Welcome Message</Label>
                <Textarea
                  id="welcome-message"
                  value={brandingConfig.welcomeMessage}
                  onChange={(e) => updateConfig('welcomeMessage', e.target.value)}
                  placeholder="Welcome to our customer portal..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    {brandingConfig.companyLogo ? (
                      <img 
                        src={brandingConfig.companyLogo} 
                        alt="Logo" 
                        className="h-12 mx-auto mb-2"
                      />
                    ) : (
                      <Image className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    )}
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-1" />
                      Upload Logo
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      PNG, JPG up to 2MB. Recommended: 200x60px
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Favicon</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    {brandingConfig.faviconUrl ? (
                      <img 
                        src={brandingConfig.faviconUrl} 
                        alt="Favicon" 
                        className="h-8 w-8 mx-auto mb-2"
                      />
                    ) : (
                      <Image className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    )}
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-1" />
                      Upload Favicon
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      ICO or PNG, 32x32px
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Colors & Theme</CardTitle>
              <CardDescription>
                Customize the colors to match your brand
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <div 
                      className="h-10 w-10 rounded-lg border"
                      style={{ backgroundColor: brandingConfig.primaryColor }}
                    />
                    <Input
                      type="color"
                      value={brandingConfig.primaryColor}
                      onChange={(e) => updateConfig('primaryColor', e.target.value)}
                      className="w-full h-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex gap-2">
                    <div 
                      className="h-10 w-10 rounded-lg border"
                      style={{ backgroundColor: brandingConfig.accentColor }}
                    />
                    <Input
                      type="color"
                      value={brandingConfig.accentColor}
                      onChange={(e) => updateConfig('accentColor', e.target.value)}
                      className="w-full h-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Header Background</Label>
                  <div className="flex gap-2">
                    <div 
                      className="h-10 w-10 rounded-lg border"
                      style={{ backgroundColor: brandingConfig.headerBgColor }}
                    />
                    <Input
                      type="color"
                      value={brandingConfig.headerBgColor}
                      onChange={(e) => updateConfig('headerBgColor', e.target.value)}
                      className="w-full h-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="footer-text">Footer Text</Label>
                <Input
                  id="footer-text"
                  value={brandingConfig.footerText}
                  onChange={(e) => updateConfig('footerText', e.target.value)}
                  placeholder="© 2024 Your Company. All rights reserved."
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Show "Powered by" Badge</p>
                  <p className="text-sm text-gray-500">
                    Display "Powered by Vanguard" in the footer
                  </p>
                </div>
                <Switch
                  checked={brandingConfig.showPoweredBy}
                  onCheckedChange={(checked) => updateConfig('showPoweredBy', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Support Contact Information</CardTitle>
              <CardDescription>
                Contact details displayed in the portal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="support-email">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Support Email
                  </Label>
                  <Input
                    id="support-email"
                    type="email"
                    value={brandingConfig.supportEmail}
                    onChange={(e) => updateConfig('supportEmail', e.target.value)}
                    placeholder="support@yourcompany.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-phone">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Support Phone
                  </Label>
                  <Input
                    id="support-phone"
                    value={brandingConfig.supportPhone}
                    onChange={(e) => updateConfig('supportPhone', e.target.value)}
                    placeholder="1-800-555-0123"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom CSS</CardTitle>
              <CardDescription>
                Add custom CSS to further customize your portal (advanced)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={brandingConfig.customCss || ''}
                onChange={(e) => updateConfig('customCss', e.target.value)}
                placeholder={`/* Custom CSS */\n.portal-header {\n  /* your styles */\n}`}
                rows={10}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Live Preview */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="border rounded-lg overflow-hidden"
              style={{ 
                '--portal-primary': brandingConfig.primaryColor,
                '--portal-accent': brandingConfig.accentColor,
              } as React.CSSProperties}
            >
              {/* Preview Header */}
              <div 
                className="p-4 text-white"
                style={{ backgroundColor: brandingConfig.headerBgColor }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {brandingConfig.companyLogo ? (
                      <img src={brandingConfig.companyLogo} alt="Logo" className="h-8" />
                    ) : (
                      <Building2 className="h-8 w-8" />
                    )}
                    <span className="font-semibold text-lg">
                      {brandingConfig.companyName || 'Your Company'}
                    </span>
                  </div>
                  <Badge variant="secondary">Preview</Badge>
                </div>
              </div>
              
              {/* Preview Content */}
              <div className="p-6 bg-gray-50 min-h-[200px]">
                <div 
                  className="text-2xl font-bold mb-2"
                  style={{ color: brandingConfig.primaryColor }}
                >
                  Welcome to Your Portal
                </div>
                <p className="text-gray-600 mb-4">
                  {brandingConfig.welcomeMessage || 'How can we help you today?'}
                </p>
                <Button 
                  style={{ 
                    backgroundColor: brandingConfig.primaryColor,
                    color: 'white'
                  }}
                >
                  Submit Ticket
                </Button>
              </div>

              {/* Preview Footer */}
              <div className="p-4 bg-gray-100 text-center text-sm text-gray-500">
                {brandingConfig.footerText || '© 2024 Your Company'}
                {brandingConfig.showPoweredBy && (
                  <span className="block text-xs mt-1">Powered by Vanguard</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
