import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Save, Eye, Globe } from "lucide-react";
import { toast } from "sonner";

interface CoManagedBrandingEditorProps {
  organizationId: string;
}

export function CoManagedBrandingEditor({ organizationId }: CoManagedBrandingEditorProps) {
  const [branding, setBranding] = useState({
    logo_url: "",
    favicon_url: "",
    primary_color: "#0066cc",
    secondary_color: "#004499",
    accent_color: "#00aaff",
    portal_title: "IT Support Portal",
    portal_welcome_message: "Welcome! How can we help you today?",
    portal_footer_text: "© 2026 IT Department. All rights reserved.",
    custom_css: "",
    custom_domain: ""
  });

  const handleSave = () => {
    toast.success("Branding settings saved");
  };

  return (
    <div className="space-y-6">
      {/* Visual Identity */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-white font-medium">Visual Identity</h4>
          
          <div className="flex items-start gap-4">
            <div className="space-y-2">
              <Label className="text-white/60 text-sm">Logo</Label>
              <div className="h-20 w-20 rounded-lg border-2 border-dashed border-cyan-500/30 flex items-center justify-center bg-black/20 cursor-pointer hover:bg-cyan-500/10 transition-colors">
                <Upload className="h-6 w-6 text-white/40" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white/60 text-sm">Favicon</Label>
              <div className="h-12 w-12 rounded-lg border-2 border-dashed border-cyan-500/30 flex items-center justify-center bg-black/20 cursor-pointer hover:bg-cyan-500/10 transition-colors">
                <Upload className="h-4 w-4 text-white/40" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-white/60 text-xs">Primary</Label>
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={branding.primary_color}
                  onChange={(e) => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="h-8 w-10 rounded cursor-pointer"
                />
                <Input
                  value={branding.primary_color}
                  onChange={(e) => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="bg-black/40 border-cyan-500/30 text-white text-xs h-8"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-white/60 text-xs">Secondary</Label>
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={branding.secondary_color}
                  onChange={(e) => setBranding(prev => ({ ...prev, secondary_color: e.target.value }))}
                  className="h-8 w-10 rounded cursor-pointer"
                />
                <Input
                  value={branding.secondary_color}
                  onChange={(e) => setBranding(prev => ({ ...prev, secondary_color: e.target.value }))}
                  className="bg-black/40 border-cyan-500/30 text-white text-xs h-8"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-white/60 text-xs">Accent</Label>
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={branding.accent_color}
                  onChange={(e) => setBranding(prev => ({ ...prev, accent_color: e.target.value }))}
                  className="h-8 w-10 rounded cursor-pointer"
                />
                <Input
                  value={branding.accent_color}
                  onChange={(e) => setBranding(prev => ({ ...prev, accent_color: e.target.value }))}
                  className="bg-black/40 border-cyan-500/30 text-white text-xs h-8"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-white font-medium">Portal Content</h4>
          
          <div className="space-y-2">
            <Label className="text-white/60 text-sm">Portal Title</Label>
            <Input
              value={branding.portal_title}
              onChange={(e) => setBranding(prev => ({ ...prev, portal_title: e.target.value }))}
              className="bg-black/40 border-cyan-500/30 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white/60 text-sm">Welcome Message</Label>
            <Textarea
              value={branding.portal_welcome_message}
              onChange={(e) => setBranding(prev => ({ ...prev, portal_welcome_message: e.target.value }))}
              className="bg-black/40 border-cyan-500/30 text-white"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white/60 text-sm">Footer Text</Label>
            <Input
              value={branding.portal_footer_text}
              onChange={(e) => setBranding(prev => ({ ...prev, portal_footer_text: e.target.value }))}
              className="bg-black/40 border-cyan-500/30 text-white"
            />
          </div>
        </div>
      </div>

      {/* Custom Domain */}
      <div className="space-y-2">
        <Label className="text-white/80 flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Custom Domain (Optional)
        </Label>
        <div className="flex items-center gap-2">
          <Input
            value={branding.custom_domain}
            onChange={(e) => setBranding(prev => ({ ...prev, custom_domain: e.target.value }))}
            className="bg-black/40 border-cyan-500/30 text-white"
            placeholder="support.clientdomain.com"
          />
          <Button variant="outline" className="border-cyan-500/30 hover:bg-cyan-500/10">
            Verify DNS
          </Button>
        </div>
        <p className="text-xs text-white/40">Point a CNAME record to: portal.yourmsp.com</p>
      </div>

      {/* Custom CSS */}
      <div className="space-y-2">
        <Label className="text-white/80">Custom CSS (Advanced)</Label>
        <Textarea
          value={branding.custom_css}
          onChange={(e) => setBranding(prev => ({ ...prev, custom_css: e.target.value }))}
          className="bg-black/40 border-cyan-500/30 text-white font-mono text-sm"
          rows={4}
          placeholder=".portal-header { background: linear-gradient(...) }"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-cyan-500/20">
        <Button variant="outline" className="border-cyan-500/30 hover:bg-cyan-500/10">
          <Eye className="h-4 w-4 mr-2" />
          Preview Portal
        </Button>
        <Button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-700">
          <Save className="h-4 w-4 mr-2" />
          Save Branding
        </Button>
      </div>
    </div>
  );
}
