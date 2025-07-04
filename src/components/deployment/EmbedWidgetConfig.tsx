import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Copy, Code, Crown } from "lucide-react";

interface EmbedSettings {
  width: string;
  height: string;
  theme: string;
  position: string;
  customDomain: string;
  allowFullscreen: boolean;
  showBranding: boolean;
}

interface EmbedWidgetConfigProps {
  isPremiumFeature: (feature: string) => boolean;
  embedSettings: EmbedSettings;
  setEmbedSettings: React.Dispatch<React.SetStateAction<EmbedSettings>>;
  embedCode: string;
  copyToClipboard: (text: string, label: string) => void;
}

const EmbedWidgetConfig = ({
  isPremiumFeature,
  embedSettings,
  setEmbedSettings,
  embedCode,
  copyToClipboard
}: EmbedWidgetConfigProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          Embed Widget
          {isPremiumFeature('embed') && (
            <Badge variant="secondary" className="ml-2">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Add your GPT to any website with our embeddable widget
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isPremiumFeature('embed') ? (
          <Alert>
            <Crown className="h-4 w-4" />
            <AlertDescription>
              Embed widgets are available with Premium plans. Upgrade to unlock this feature.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="width">Width (px)</Label>
                <Input
                  id="width"
                  value={embedSettings.width}
                  onChange={(e) => setEmbedSettings(prev => ({ ...prev, width: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (px)</Label>
                <Input
                  id="height"
                  value={embedSettings.height}
                  onChange={(e) => setEmbedSettings(prev => ({ ...prev, height: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={embedSettings.theme}
                  onValueChange={(value) => setEmbedSettings(prev => ({ ...prev, theme: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Select
                  value={embedSettings.position}
                  onValueChange={(value) => setEmbedSettings(prev => ({ ...prev, position: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                    <SelectItem value="top-left">Top Left</SelectItem>
                    <SelectItem value="inline">Inline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="allowFullscreen"
                  checked={embedSettings.allowFullscreen}
                  onCheckedChange={(checked) => setEmbedSettings(prev => ({ ...prev, allowFullscreen: checked }))}
                />
                <Label htmlFor="allowFullscreen">Allow fullscreen</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="showBranding"
                  checked={embedSettings.showBranding}
                  onCheckedChange={(checked) => setEmbedSettings(prev => ({ ...prev, showBranding: checked }))}
                  disabled={isPremiumFeature('removeBranding')}
                />
                <Label htmlFor="showBranding">
                  Show UltriumAI branding
                  {isPremiumFeature('removeBranding') && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium to remove
                    </Badge>
                  )}
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-domain">Custom Domain (Optional)</Label>
              <Input
                id="custom-domain"
                placeholder="your-domain.com"
                value={embedSettings.customDomain}
                onChange={(e) => setEmbedSettings(prev => ({ ...prev, customDomain: e.target.value }))}
                disabled={isPremiumFeature('customDomain')}
              />
              {isPremiumFeature('customDomain') && (
                <p className="text-sm text-muted-foreground">
                  Custom domains available with Premium plans
                </p>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Embed Code</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(embedCode, "Embed code")}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
              </div>
              <Textarea
                value={embedCode}
                readOnly
                className="font-mono text-sm h-32"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default EmbedWidgetConfig;