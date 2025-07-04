import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WhiteLabelConfig } from "@/types/whiteLabel";

interface WhiteLabelAdvancedProps {
  config: WhiteLabelConfig;
  setConfig: (config: WhiteLabelConfig | ((prev: WhiteLabelConfig) => WhiteLabelConfig)) => void;
}

export const WhiteLabelAdvanced = ({ config, setConfig }: WhiteLabelAdvancedProps) => {
  const updateEmailTemplate = (type: keyof typeof config.email_templates, value: string) => {
    setConfig(prev => ({
      ...prev,
      email_templates: { ...prev.email_templates, [type]: value }
    }));
  };

  return (
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
              onChange={(e) => updateEmailTemplate('welcome', e.target.value)}
              placeholder="Welcome email template"
              className="h-20"
            />
          </div>

          <div>
            <Label htmlFor="reset-template">Password Reset Email</Label>
            <Textarea
              id="reset-template"
              value={config.email_templates.password_reset}
              onChange={(e) => updateEmailTemplate('password_reset', e.target.value)}
              placeholder="Password reset email template"
              className="h-20"
            />
          </div>

          <div>
            <Label htmlFor="invitation-template">Invitation Email</Label>
            <Textarea
              id="invitation-template"
              value={config.email_templates.invitation}
              onChange={(e) => updateEmailTemplate('invitation', e.target.value)}
              placeholder="Invitation email template"
              className="h-20"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};