import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Globe } from "lucide-react";
import { WhiteLabelConfig } from "@/types/whiteLabel";

interface WhiteLabelDomainProps {
  config: WhiteLabelConfig;
  setConfig: (config: WhiteLabelConfig | ((prev: WhiteLabelConfig) => WhiteLabelConfig)) => void;
}

export const WhiteLabelDomain = ({ config, setConfig }: WhiteLabelDomainProps) => {
  return (
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
  );
};