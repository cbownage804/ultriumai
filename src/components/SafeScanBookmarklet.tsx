import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Bookmark, 
  Copy, 
  Download, 
  Globe, 
  Shield, 
  Smartphone,
  Monitor,
  Info,
  QrCode,
  Code,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const SafeScanBookmarklet = () => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

  const baseUrl = window.location.origin;

  // The bookmarklet code that opens SafeScan in a popup
  const bookmarkletCode = `javascript:(function(){
    var popup = window.open('${baseUrl}/dashboard/safescan-embed?source=bookmarklet', 
    'SafeScan', 
    'width=900,height=700,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no');
    popup.focus();
  })();`;

  // Embed iframe code for Teams/SharePoint
  const embedCode = `<iframe 
  src="${baseUrl}/dashboard/safescan-embed?source=teams" 
  width="100%" 
  height="600" 
  frameborder="0" 
  style="border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
</iframe>`;

  // Teams app manifest URL
  const teamsUrl = `https://teams.microsoft.com/l/app/00000000-0000-0000-0000-000000000000?url=${encodeURIComponent(baseUrl + '/dashboard/safescan-embed?source=teams')}`;
  
  // SharePoint embed URL
  const sharePointUrl = `${baseUrl}/dashboard/safescan-embed?source=sharepoint`;

  const copyBookmarklet = async () => {
    try {
      await navigator.clipboard.writeText(bookmarkletCode);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Bookmarklet code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy bookmarklet",
        variant: "destructive",
      });
    }
  };

  const copyEmbedCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setEmbedCopied(true);
      toast({
        title: "Copied!",
        description: "Embed code copied to clipboard",
      });
      setTimeout(() => setEmbedCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy embed code",
        variant: "destructive",
      });
    }
  };

  const downloadInstructions = () => {
    const instructions = `
SafeScan Integration Guide
=========================

## Bookmarklet Installation
1. Copy the bookmarklet code from the MSP dashboard
2. Open your browser's bookmark manager (Ctrl+Shift+O or Cmd+Shift+O)
3. Create a new bookmark with:
   - Name: "SafeScan Security"
   - URL: [paste the bookmarklet code]
4. Click the bookmark anytime to open SafeScan

## Teams Integration
1. Go to your Microsoft Teams channel
2. Click the "+" tab to add a new tab
3. Select "Website" or "Custom App"
4. Paste this URL: ${sharePointUrl}
5. Set tab name as "SafeScan Security"

## SharePoint Integration
1. Edit your SharePoint page
2. Add a new web part
3. Select "Embed" web part
4. Paste the iframe embed code
5. Save the page

## Iframe Embed Code
${embedCode}

Direct Links:
- Teams: ${teamsUrl}
- SharePoint: ${sharePointUrl}
- Standalone: ${baseUrl}/dashboard/safescan-embed

Supported Platforms: Teams, SharePoint, Confluence, Notion, any iframe-capable platform
    `;

    const blob = new Blob([instructions], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'safescan-integration-guide.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Integration guide downloaded",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Client Integration Options
          </CardTitle>
          <CardDescription>
            Multiple ways to deploy SafeScan to your client endpoints and platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Teams/SharePoint Integration */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="default">New</Badge>
              <h3 className="text-lg font-semibold">Teams & SharePoint Integration</h3>
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Embed SafeScan directly into Microsoft Teams channels or SharePoint pages. Perfect for enterprise environments.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Direct Links
                </h4>
                <div className="space-y-2">
                  <div className="p-2 bg-muted rounded text-sm font-mono break-all">
                    {sharePointUrl}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(sharePointUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Test Link
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={copyEmbedCode}
                      disabled={embedCopied}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {embedCopied ? 'Copied!' : 'Copy URL'}
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Iframe Embed
                </h4>
                <div className="space-y-2">
                  <div className="p-2 bg-muted rounded text-xs font-mono break-all max-h-20 overflow-y-auto">
                    {embedCode}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={copyEmbedCode}
                    disabled={embedCopied}
                    className="w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {embedCopied ? 'Copied!' : 'Copy Embed Code'}
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* Bookmarklet Option */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Universal</Badge>
              <h3 className="text-lg font-semibold">Browser Bookmarklet</h3>
            </div>
            
            <Alert>
              <Bookmark className="h-4 w-4" />
              <AlertDescription>
                One-click access from any webpage. Works on any device with a web browser.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium">For Your Clients:</h4>
                <div className="p-4 bg-muted rounded-lg">
                  <a 
                    href={bookmarkletCode}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors no-underline"
                    draggable="true"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Shield className="h-4 w-4" />
                    SafeScan Security
                  </a>
                </div>
                <p className="text-xs text-muted-foreground">
                  Drag this button to bookmarks bar or right-click to bookmark
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">For MSP Deployment:</h4>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={copyBookmarklet}
                    disabled={copied}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copied ? 'Copied!' : 'Copy Code'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={downloadInstructions}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Full Guide
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Integration Examples */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Teams Tab */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="h-4 w-4" />
                  Teams Tab
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Add as a Teams channel tab for easy team access
                </p>
                <Button variant="outline" size="sm" className="w-full" onClick={() => window.open(sharePointUrl, '_blank')}>
                  Preview Integration
                </Button>
              </CardContent>
            </Card>

            {/* SharePoint Page */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Monitor className="h-4 w-4" />
                  SharePoint
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Embed in SharePoint pages as a web part
                </p>
                <Button variant="outline" size="sm" className="w-full" onClick={copyEmbedCode}>
                  <Code className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
              </CardContent>
            </Card>

            {/* Mobile Access */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Smartphone className="h-4 w-4" />
                  Mobile PWA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Install as mobile app from browser
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  <QrCode className="h-4 w-4 mr-2" />
                  QR Code
                </Button>
              </CardContent>
            </Card>

            {/* Desktop Widget */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Monitor className="h-4 w-4" />
                  Desktop
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Standalone desktop shortcut or widget
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Create Shortcut
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Deployment Instructions */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Enterprise Integration:</strong> Use the Teams/SharePoint embed for enterprise clients, bookmarklet for general access. All options provide the same security scanning capabilities with SSO integration.
            </AlertDescription>
          </Alert>

        </CardContent>
      </Card>
    </div>
  );
};
