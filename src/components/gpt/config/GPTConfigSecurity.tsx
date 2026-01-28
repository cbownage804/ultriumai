import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Shield, Eye, Lock, Clock, AlertTriangle, Globe } from "lucide-react";

interface GPTConfigSecurityProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  themeColor: string;
}

export function GPTConfigSecurity({ formData, onChange, themeColor }: GPTConfigSecurityProps) {
  return (
    <div className="space-y-6">
      {/* Anti-Hallucination */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Anti-Hallucination
          </CardTitle>
          <CardDescription>
            Reduces the AI's tendency to make up information when it doesn't know the answer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={formData.anti_hallucination ? "enabled" : "disabled"} 
            onValueChange={(value) => onChange("anti_hallucination", value === "enabled")}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="enabled" id="hallucination-enabled" />
              <Label htmlFor="hallucination-enabled">Enabled (Recommended)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="disabled" id="hallucination-disabled" />
              <Label htmlFor="hallucination-disabled">Disabled (not recommended)</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Agent Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="h-5 w-5" />
            Agent Visibility
          </CardTitle>
          <CardDescription>
            Control who can access your AI assistant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={formData.visibility || "private"} 
            onValueChange={(value) => onChange("visibility", value)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="private" id="visibility-private" />
              <Label htmlFor="visibility-private">Private (Only you can access)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="public" id="visibility-public" />
              <Label htmlFor="visibility-public">Public (Anyone can access)</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Data Protection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Protection</CardTitle>
          <CardDescription>
            Your data security and privacy information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            UltriumGPT is SOC 2 Type II certified and fully GDPR compliant. Your data and your users' data are safe with us.
          </p>
          <a href="#" className="text-sm text-primary hover:underline">
            More details available at our Trust Center.
          </a>
        </CardContent>
      </Card>

      {/* Recaptcha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Recaptcha
          </CardTitle>
          <CardDescription>
            Add bot protection to prevent automated abuse of your AI assistant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={formData.enable_recaptcha ? "enabled" : "disabled"} 
            onValueChange={(value) => onChange("enable_recaptcha", value === "enabled")}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="enabled" id="recaptcha-enabled" />
              <Label htmlFor="recaptcha-enabled">Enabled</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="disabled" id="recaptcha-disabled" />
              <Label htmlFor="recaptcha-disabled">Disabled</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Whitelisted Domains */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5" />
            Whitelisted Domains
          </CardTitle>
          <CardDescription>
            Restrict access to embedding your agent only on allowed domains. Provide domains list separated by spaces, tabs, new lines or commas. Input domain without scheme (e.g. domain.com). You can use * mark as placeholder which mean any count of chars (e.g. *.domain.com will allow any subdomains in domain.com).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.whitelisted_domains || ""}
            onChange={(e) => onChange("whitelisted_domains", e.target.value)}
            placeholder="example.com&#10;*.mycompany.com&#10;app.example.org"
            rows={4}
            className="bg-muted resize-none font-mono text-sm"
          />
        </CardContent>
      </Card>

      {/* Conversation Retention Period */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Conversation Retention Period
          </CardTitle>
          <CardDescription>
            How long conversation data is stored before automatic deletion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={formData.retention_period || "12_months"} 
            onValueChange={(value) => onChange("retention_period", value)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id="retention-custom" />
              <Label htmlFor="retention-custom">Custom (in days)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="12_months" id="retention-12" />
              <Label htmlFor="retention-12">12 months</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="never" id="retention-never" />
              <Label htmlFor="retention-never">Never delete</Label>
            </div>
          </RadioGroup>
          {formData.retention_period === "custom" && (
            <Input
              type="number"
              value={formData.retention_days || 90}
              onChange={(e) => onChange("retention_days", parseInt(e.target.value))}
              placeholder="90"
              className="bg-muted mt-3 w-32"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
