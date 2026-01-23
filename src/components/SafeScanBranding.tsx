import { useState, useEffect } from "react";
import DOMPurify from 'dompurify';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Palette, Upload, Eye, Save, Lock, Crown } from "lucide-react";
import { useWhiteLabelConfig } from "@/hooks/useWhiteLabelConfig";
import { useSafeSuiteSubscription } from "@/hooks/useSafeSuite";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const SafeScanBranding = () => {
  const { config, setConfig, loading, saveConfig, uploadFile } = useWhiteLabelConfig();
  const { isBusiness, tier, loading: subLoading } = useSafeSuiteSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [previewMode, setPreviewMode] = useState(false);

  // Gate: Only Business tier can access whitelabeling
  if (!subLoading && !isBusiness) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 bg-amber-100 rounded-full mb-4">
          <Lock className="h-10 w-10 text-amber-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2">SafeScan Branding is a Business Feature</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          Custom branding for SafeScan is only available on the Business plan.
          {tier === 'free' && " Upgrade to unlock this and other premium features."}
          {tier === 'pro' && " Upgrade from Pro to Business to unlock branding."}
        </p>
        <Button onClick={() => navigate('/safesuite/billing')} className="gap-2">
          <Crown className="h-4 w-4" />
          Upgrade to Business
        </Button>
      </div>
    );
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = event.target.files?.[0];
    if (file) {
      await uploadFile(file, type);
    }
  };

  const handleSave = async () => {
    await saveConfig();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">SafeScan Branding</h2>
          <p className="text-muted-foreground">
            Customize the appearance of SafeScan for your organization
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={previewMode}
              onCheckedChange={setPreviewMode}
            />
            <Label>Preview Mode</Label>
          </div>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branding Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Brand Identity
              </CardTitle>
              <CardDescription>
                Configure your organization's brand identity for SafeScan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={config.company_name}
                  onChange={(e) => setConfig(prev => ({ ...prev, company_name: e.target.value }))}
                  placeholder="Your Company Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo-upload">Company Logo</Label>
                <div className="flex items-center gap-4">
                  {config.company_logo && (
                    <img 
                      src={config.company_logo} 
                      alt="Company Logo" 
                      className="h-12 w-12 object-contain border rounded"
                    />
                  )}
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'logo')}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="favicon-upload">Favicon</Label>
                <div className="flex items-center gap-4">
                  {config.favicon_url && (
                    <img 
                      src={config.favicon_url} 
                      alt="Favicon" 
                      className="h-8 w-8 object-contain border rounded"
                    />
                  )}
                  <Input
                    id="favicon-upload"
                    type="file"
                    accept="image/x-icon,image/png"
                    onChange={(e) => handleFileUpload(e, 'favicon')}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="footer-text">Footer Text</Label>
                <Input
                  id="footer-text"
                  value={config.footer_text}
                  onChange={(e) => setConfig(prev => ({ ...prev, footer_text: e.target.value }))}
                  placeholder="Powered by Your Company"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="hide-powered-by"
                  checked={config.hide_powered_by}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, hide_powered_by: checked }))}
                />
                <Label htmlFor="hide-powered-by">Hide "Powered by" branding</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Color Scheme</CardTitle>
              <CardDescription>
                Customize the colors to match your brand
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={config.primary_color}
                      onChange={(e) => setConfig(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={config.primary_color}
                      onChange={(e) => setConfig(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={config.secondary_color}
                      onChange={(e) => setConfig(prev => ({ ...prev, secondary_color: e.target.value }))}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={config.secondary_color}
                      onChange={(e) => setConfig(prev => ({ ...prev, secondary_color: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="background-color">Background Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="background-color"
                      type="color"
                      value={config.background_color}
                      onChange={(e) => setConfig(prev => ({ ...prev, background_color: e.target.value }))}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={config.background_color}
                      onChange={(e) => setConfig(prev => ({ ...prev, background_color: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text-color">Text Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="text-color"
                      type="color"
                      value={config.text_color}
                      onChange={(e) => setConfig(prev => ({ ...prev, text_color: e.target.value }))}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={config.text_color}
                      onChange={(e) => setConfig(prev => ({ ...prev, text_color: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom CSS</CardTitle>
              <CardDescription>
                Advanced styling customizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="custom-css">Custom CSS</Label>
                <Textarea
                  id="custom-css"
                  value={config.custom_css}
                  onChange={(e) => setConfig(prev => ({ ...prev, custom_css: e.target.value }))}
                  placeholder="/* Your custom CSS here */"
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Preview
              </CardTitle>
              <CardDescription>
                See how your SafeScan branding will appear
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="border rounded-lg p-4 space-y-4 min-h-[400px]"
                style={{
                  backgroundColor: config.background_color,
                  color: config.text_color
                }}
              >
                {/* Header Preview */}
                <div className="flex items-center gap-3 pb-4 border-b">
                  {config.company_logo && (
                    <img 
                      src={config.company_logo} 
                      alt="Logo" 
                      className="h-8 w-8 object-contain"
                    />
                  )}
                  <h1 
                    className="text-xl font-bold"
                    style={{ color: config.primary_color }}
                  >
                    {config.company_name || 'Your Company'} SafeScan
                  </h1>
                </div>

                {/* Sample Content */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: config.primary_color }}
                    />
                    <span className="text-sm">Security scanning in progress...</span>
                  </div>
                  
                  <div 
                    className="p-3 rounded border"
                    style={{ borderColor: config.secondary_color }}
                  >
                    <p className="text-sm">Sample scan result</p>
                    <div className="flex gap-2 mt-2">
                      <button 
                        className="px-3 py-1 rounded text-sm text-white"
                        style={{ backgroundColor: config.primary_color }}
                      >
                        View Details
                      </button>
                      <button 
                        className="px-3 py-1 rounded text-sm border"
                        style={{ 
                          borderColor: config.secondary_color,
                          color: config.secondary_color 
                        }}
                      >
                        Export Report
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Preview */}
                <div className="pt-4 border-t text-center">
                  <p className="text-xs opacity-75">
                    {config.hide_powered_by ? '' : config.footer_text}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Integration Instructions</CardTitle>
              <CardDescription>
                How to apply your branding to SafeScan deployments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded">
                <h4 className="font-semibold mb-2">Embed Code</h4>
                <code className="text-sm block">
                  {`<script src="https://your-domain.com/safescan-widget.js"
        data-company="${config.company_name}"
        data-primary-color="${config.primary_color}"
        data-logo="${config.company_logo}">
</script>`}
                </code>
              </div>
              
              <div className="bg-muted p-4 rounded">
                <h4 className="font-semibold mb-2">API Configuration</h4>
                <code className="text-sm block">
                  {`{
  "branding": {
    "company_name": "${config.company_name}",
    "primary_color": "${config.primary_color}",
    "logo_url": "${config.company_logo}"
  }
}`}
                </code>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Custom CSS Preview */}
      {config.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(config.custom_css, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }) }} />
      )}
    </div>
  );
};