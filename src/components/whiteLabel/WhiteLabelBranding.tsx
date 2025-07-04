import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Palette, Upload } from "lucide-react";
import { WhiteLabelConfig } from "@/types/whiteLabel";

interface WhiteLabelBrandingProps {
  config: WhiteLabelConfig;
  setConfig: (config: WhiteLabelConfig | ((prev: WhiteLabelConfig) => WhiteLabelConfig)) => void;
  uploadFile: (file: File, type: 'logo' | 'favicon') => Promise<void>;
}

export const WhiteLabelBranding = ({ config, setConfig, uploadFile }: WhiteLabelBrandingProps) => {
  return (
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
                if (file) uploadFile(file, 'logo');
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
                if (file) uploadFile(file, 'favicon');
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
  );
};