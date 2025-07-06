import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Palette,
  Upload,
  Eye,
  Save,
  Building2,
  Mail,
  Phone,
  Globe,
  Shield
} from "lucide-react";

interface WhiteLabelConfig {
  id?: string;
  company_name: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  custom_domain: string;
  support_email: string;
  support_phone: string;
  terms_of_service_url: string;
  privacy_policy_url: string;
}

export const MSPWhiteLabelConfig = () => {
  const [config, setConfig] = useState<WhiteLabelConfig>({
    company_name: '',
    logo_url: '',
    primary_color: '#3b82f6',
    secondary_color: '#1e40af',
    background_color: '#ffffff',
    custom_domain: '',
    support_email: '',
    support_phone: '',
    terms_of_service_url: '',
    privacy_policy_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadWhiteLabelConfig();
  }, []);

  const loadWhiteLabelConfig = async () => {
    try {
      // For now, load from localStorage until database table is ready
      const saved = localStorage.getItem('ultrium_white_label_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        setConfig(prev => ({...prev, ...parsed}));
      }
    } catch (error) {
      console.error('Error loading white label config:', error);
      toast({
        title: "Error",
        description: "Failed to load white label configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveWhiteLabelConfig = async () => {
    try {
      setSaving(true);
      
      // Save to localStorage for now until database table is ready
      localStorage.setItem('ultrium_white_label_config', JSON.stringify(config));

      toast({
        title: "Success", 
        description: "White label configuration saved successfully",
      });
    } catch (error) {
      console.error('Error saving white label config:', error);
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof WhiteLabelConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.user.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('gpt-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('gpt-logos')
        .getPublicUrl(fileName);

      setConfig(prev => ({
        ...prev,
        logo_url: publicUrl
      }));

      toast({
        title: "Logo Uploaded",
        description: "Logo uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="h-6 w-6" />
            White Label Configuration
          </h2>
          <p className="text-muted-foreground">
            Customize SafeShield with your MSP branding
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button onClick={saveWhiteLabelConfig} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>

      {previewMode ? (
        /* Preview Mode */
        <Card className="border-2 border-dashed">
          <CardContent className="p-8">
            <div 
              className="text-center space-y-6 p-8 rounded-lg"
              style={{ 
                backgroundColor: config.background_color,
                borderColor: config.primary_color,
                borderWidth: '2px'
              }}
            >
              {config.logo_url && (
                <img 
                  src={config.logo_url} 
                  alt="MSP Logo" 
                  className="mx-auto h-16 object-contain"
                />
              )}
              <h1 
                className="text-3xl font-bold"
                style={{ color: config.primary_color }}
              >
                {config.company_name || 'Your MSP Name'} Security Portal
              </h1>
              <div className="flex justify-center gap-4">
                <div 
                  className="px-4 py-2 rounded-lg text-white font-medium"
                  style={{ backgroundColor: config.primary_color }}
                >
                  Primary Button
                </div>
                <div 
                  className="px-4 py-2 rounded-lg text-white font-medium"
                  style={{ backgroundColor: config.secondary_color }}
                >
                  Secondary Button
                </div>
              </div>
              <p className="text-muted-foreground">
                Preview of your white-labeled SafeShield portal
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Configuration Mode */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={config.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  placeholder="Your MSP Company Name"
                />
              </div>

              <div>
                <Label htmlFor="logo_upload">Company Logo</Label>
                <div className="space-y-2">
                  <Input
                    id="logo_upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />
                  {config.logo_url && (
                    <div className="flex items-center gap-2 p-2 border rounded">
                      <img src={config.logo_url} alt="Logo" className="h-8 w-8 object-contain" />
                      <span className="text-sm text-muted-foreground">Current logo</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="custom_domain">Custom Domain</Label>
                <Input
                  id="custom_domain"
                  value={config.custom_domain}
                  onChange={(e) => handleInputChange('custom_domain', e.target.value)}
                  placeholder="security.yourdomain.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Color Scheme */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Color Scheme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="primary_color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary_color"
                    type="color"
                    value={config.primary_color}
                    onChange={(e) => handleInputChange('primary_color', e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    value={config.primary_color}
                    onChange={(e) => handleInputChange('primary_color', e.target.value)}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="secondary_color">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary_color"
                    type="color"
                    value={config.secondary_color}
                    onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    value={config.secondary_color}
                    onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                    placeholder="#1e40af"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="background_color">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="background_color"
                    type="color"
                    value={config.background_color}
                    onChange={(e) => handleInputChange('background_color', e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    value={config.background_color}
                    onChange={(e) => handleInputChange('background_color', e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Support Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="support_email">Support Email</Label>
                <Input
                  id="support_email"
                  type="email"
                  value={config.support_email}
                  onChange={(e) => handleInputChange('support_email', e.target.value)}
                  placeholder="support@yourcompany.com"
                />
              </div>

              <div>
                <Label htmlFor="support_phone">Support Phone</Label>
                <Input
                  id="support_phone"
                  value={config.support_phone}
                  onChange={(e) => handleInputChange('support_phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </CardContent>
          </Card>

          {/* Legal Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Legal & Policy Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="terms_url">Terms of Service URL</Label>
                <Input
                  id="terms_url"
                  value={config.terms_of_service_url}
                  onChange={(e) => handleInputChange('terms_of_service_url', e.target.value)}
                  placeholder="https://yourcompany.com/terms"
                />
              </div>

              <div>
                <Label htmlFor="privacy_url">Privacy Policy URL</Label>
                <Input
                  id="privacy_url"
                  value={config.privacy_policy_url}
                  onChange={(e) => handleInputChange('privacy_policy_url', e.target.value)}
                  placeholder="https://yourcompany.com/privacy"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};