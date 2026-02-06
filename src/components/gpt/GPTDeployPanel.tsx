import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Rocket, Code, Link, Copy, ExternalLink, CheckCircle,
  Globe, Smartphone, Monitor, QrCode, Blocks
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GPTAppBlocks } from "./GPTAppBlocks";

interface GPTDeployPanelProps {
  gptId: string;
  gptName: string;
  themeColor: string;
}

export function GPTDeployPanel({ gptId, gptName, themeColor }: GPTDeployPanelProps) {
  const { toast } = useToast();
  const [isPublic, setIsPublic] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  
  const baseUrl = window.location.origin;
  const chatUrl = `${baseUrl}/embed/${gptId}`;
  const publicUrl = `${baseUrl}/chat/public/${gptId}`;
  
  const embedCode = `<iframe
  src="${chatUrl}"
  width="400"
  height="600"
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"
></iframe>`;

  const bubbleCode = `<script>
  window.UltriumAI = {
    gptId: "${gptId}",
    position: "bottom-right",
    theme: "${themeColor}"
  };
</script>
<script src="${baseUrl}/embed/chat-bubble.js" async></script>`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`
    });
  };

  return (
    <div className="space-y-6">
      {/* Deployment Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Deployment Status
              </CardTitle>
              <CardDescription>
                Manage how your GPT is deployed and accessed
              </CardDescription>
            </div>
            <Badge variant={isPublic ? "default" : "secondary"} className="text-sm">
              {isPublic ? "Live" : "Private"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Public Access</p>
              <p className="text-sm text-muted-foreground">
                Allow anyone with the link to access this GPT
              </p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
        </CardContent>
      </Card>

      {/* Deployment Options */}
      <Tabs defaultValue="link" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="link" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Direct Link
          </TabsTrigger>
          <TabsTrigger value="embed" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Embed
          </TabsTrigger>
          <TabsTrigger value="widget" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Widget
          </TabsTrigger>
          <TabsTrigger value="blocks" className="flex items-center gap-2">
            <Blocks className="h-4 w-4" />
            AI Blocks
          </TabsTrigger>
        </TabsList>

        {/* Direct Link */}
        <TabsContent value="link">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Public Chat Link
              </CardTitle>
              <CardDescription>
                Share this link to let others chat with your GPT
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={publicUrl} readOnly className="font-mono text-sm" />
                <Button 
                  variant="outline" 
                  onClick={() => copyToClipboard(publicUrl, 'Link')}
                >
                  {copied === 'Link' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="outline" onClick={() => window.open(publicUrl, '_blank')}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-4 border rounded-lg text-center">
                  <QrCode className="h-20 w-20 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">QR Code</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Download
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Share via</h4>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Email</Button>
                    <Button variant="outline" size="sm">Slack</Button>
                    <Button variant="outline" size="sm">Teams</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Embed iFrame */}
        <TabsContent value="embed">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Embed on Your Website
              </CardTitle>
              <CardDescription>
                Add this code to your website to embed the chat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{embedCode}</code>
                </pre>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(embedCode, 'Embed code')}
                >
                  {copied === 'Embed code' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Width</Label>
                  <Input defaultValue="400" />
                </div>
                <div className="space-y-2">
                  <Label>Height</Label>
                  <Input defaultValue="600" />
                </div>
                <div className="space-y-2">
                  <Label>Border Radius</Label>
                  <Input defaultValue="12" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat Widget */}
        <TabsContent value="widget">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Chat Bubble Widget
              </CardTitle>
              <CardDescription>
                Add a floating chat bubble to your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{bubbleCode}</code>
                </pre>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(bubbleCode, 'Widget code')}
                >
                  {copied === 'Widget code' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Position</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">Bottom Left</Button>
                    <Button variant="default" size="sm">Bottom Right</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Theme Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={themeColor} className="w-12 h-10 p-1" readOnly />
                    <Input value={themeColor} readOnly />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="border rounded-lg p-8 bg-muted/30 relative min-h-[200px]">
                <p className="text-sm text-muted-foreground text-center">Widget Preview</p>
                <div 
                  className="absolute bottom-4 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform"
                  style={{ backgroundColor: themeColor }}
                >
                  <Smartphone className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI App Blocks Tab */}
        <TabsContent value="blocks">
          <GPTAppBlocks gptId={gptId} gptName={gptName} themeColor={themeColor} />
        </TabsContent>
      </Tabs>

      {/* Analytics Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Deployment Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 border rounded-lg">
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Embeds Active</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Link Visits</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Widget Loads</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
