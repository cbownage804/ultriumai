import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Copy, Globe, Code, Share2, Download, Eye, EyeOff, Zap, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCustomGPTs } from "@/hooks/useCustomGPTs";
import { useSubscription } from "@/hooks/useSubscription";

const GPTDeployment = () => {
  const { gpts: customGPTs } = useCustomGPTs();
  const { subscription } = useSubscription();
  const { toast } = useToast();
  const [selectedGPT, setSelectedGPT] = useState<string>("");
  const [isPublic, setIsPublic] = useState(false);
  const [embedSettings, setEmbedSettings] = useState({
    width: "400",
    height: "600",
    theme: "light",
    position: "bottom-right",
    customDomain: "",
    allowFullscreen: true,
    showBranding: true
  });

  const selectedGPTData = customGPTs.find(gpt => gpt.id === selectedGPT);
  const publicUrl = selectedGPTData ? `https://gpt.ultriumai.com/${selectedGPTData.id}` : "";
  const apiEndpoint = selectedGPTData ? `https://api.ultriumai.com/v1/gpt/${selectedGPTData.id}/chat` : "";

  const embedCode = `<!-- UltriumGPT Embed Widget -->
<div id="ultrium-gpt-widget"></div>
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://cdn.ultriumai.com/widget.js';
    script.onload = function() {
      UltriumGPT.init({
        gptId: '${selectedGPT}',
        width: '${embedSettings.width}px',
        height: '${embedSettings.height}px',
        theme: '${embedSettings.theme}',
        position: '${embedSettings.position}',
        allowFullscreen: ${embedSettings.allowFullscreen},
        showBranding: ${embedSettings.showBranding},
        customDomain: '${embedSettings.customDomain}'
      });
    };
    document.head.appendChild(script);
  })();
</script>`;

  const apiExample = `// Example API call
fetch('${apiEndpoint}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    message: 'Hello, how can you help me?',
    conversation_id: 'optional-conversation-id'
  })
})
.then(response => response.json())
.then(data => console.log(data));`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const handleDeploy = async () => {
    if (!selectedGPTData) return;

    try {
      // Here you would make an API call to deploy the GPT
      toast({
        title: "GPT Deployed!",
        description: `${selectedGPTData.name} is now live and accessible`,
      });
    } catch (error) {
      toast({
        title: "Deployment failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const isPremiumFeature = (feature: string) => {
    const premiumFeatures = ['embed', 'api', 'customDomain', 'removeBranding'];
    return premiumFeatures.includes(feature) && subscription.subscription_tier === "free";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Deploy & Share</h1>
          <p className="text-muted-foreground mt-2">
            Make your Custom GPT accessible to the world
          </p>
        </div>
        {selectedGPTData && (
          <Badge variant={isPublic ? "default" : "secondary"} className="gap-2">
            {isPublic ? <Globe className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            {isPublic ? "Public" : "Private"}
          </Badge>
        )}
      </div>

      {/* GPT Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Select GPT to Deploy
          </CardTitle>
          <CardDescription>
            Choose which Custom GPT you want to make public
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gpt-select">Custom GPT</Label>
            <Select value={selectedGPT} onValueChange={setSelectedGPT}>
              <SelectTrigger>
                <SelectValue placeholder="Select a Custom GPT" />
              </SelectTrigger>
              <SelectContent>
                {customGPTs.map((gpt) => (
                  <SelectItem key={gpt.id} value={gpt.id}>
                    <div className="flex items-center gap-2">
                      <span>{gpt.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {gpt.chat_count} chats
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedGPTData && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="public-access"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label htmlFor="public-access">Make publicly accessible</Label>
              </div>

              {isPublic && (
                <Alert>
                  <Globe className="h-4 w-4" />
                  <AlertDescription>
                    Your GPT will be accessible at: {publicUrl}
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={handleDeploy} className="w-full" disabled={!isPublic}>
                <Zap className="h-4 w-4 mr-2" />
                Deploy GPT
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedGPTData && isPublic && (
        <Tabs defaultValue="embed" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="embed" className="relative">
              Embed Widget
              {isPremiumFeature('embed') && <Crown className="h-3 w-3 ml-1 text-yellow-500" />}
            </TabsTrigger>
            <TabsTrigger value="api" className="relative">
              API Access
              {isPremiumFeature('api') && <Crown className="h-3 w-3 ml-1 text-yellow-500" />}
            </TabsTrigger>
            <TabsTrigger value="share">Share Link</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Embed Widget */}
          <TabsContent value="embed">
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
          </TabsContent>

          {/* API Access */}
          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  API Access
                  {isPremiumFeature('api') && (
                    <Badge variant="secondary" className="ml-2">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Integrate your GPT with external applications via REST API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isPremiumFeature('api') ? (
                  <Alert>
                    <Crown className="h-4 w-4" />
                    <AlertDescription>
                      API access is available with Premium plans. Upgrade to unlock this feature.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>API Endpoint</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(apiEndpoint, "API endpoint")}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                        </div>
                        <Input value={apiEndpoint} readOnly />
                      </div>

                      <div className="space-y-2">
                        <Label>API Key</Label>
                        <div className="flex gap-2">
                          <Input value="sk-..." readOnly className="flex-1" />
                          <Button variant="outline" size="sm">
                            Generate New Key
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Example Code</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(apiExample, "API example")}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Code
                        </Button>
                      </div>
                      <Textarea
                        value={apiExample}
                        readOnly
                        className="font-mono text-sm h-40"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Share Link */}
          <TabsContent value="share">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Share Link
                </CardTitle>
                <CardDescription>
                  Share your GPT with others via direct link
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Public URL</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(publicUrl, "Public URL")}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                  </div>
                  <Input value={publicUrl} readOnly />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download QR Code
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Deployment Analytics</CardTitle>
                <CardDescription>
                  Track usage and performance of your deployed GPT
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">1,247</div>
                    <div className="text-sm text-muted-foreground">Total Interactions</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">342</div>
                    <div className="text-sm text-muted-foreground">Unique Users</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">98.5%</div>
                    <div className="text-sm text-muted-foreground">Uptime</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default GPTDeployment;