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
  QrCode
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const SafeScanBookmarklet = () => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // The bookmarklet code that opens SafeScan in a popup
  const bookmarkletCode = `javascript:(function(){
    var popup = window.open('${window.location.origin}/dashboard/safescan?embed=true&source=bookmarklet', 
    'SafeScan', 
    'width=800,height=600,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no');
    popup.focus();
  })();`;

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

  const downloadInstructions = () => {
    const instructions = `
SafeScan Bookmarklet Installation Instructions
============================================

1. Copy the bookmarklet code from the MSP dashboard
2. Open your browser's bookmark manager (Ctrl+Shift+O or Cmd+Shift+O)
3. Create a new bookmark with:
   - Name: "SafeScan Security"
   - URL: [paste the bookmarklet code]
4. Click the bookmark anytime to open SafeScan

Quick Installation:
- Drag the "SafeScan" button from the MSP dashboard to your bookmarks bar
- Or right-click the button and select "Bookmark this link"

Supported Browsers: Chrome, Firefox, Safari, Edge
Works on: Windows, Mac, Linux, mobile devices
    `;

    const blob = new Blob([instructions], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'safescan-installation-instructions.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Installation instructions downloaded",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            Client Endpoint Deployment
          </CardTitle>
          <CardDescription>
            Easy ways for your clients to access SafeScan on all their devices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Bookmarklet Option */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="default">Recommended</Badge>
              <h3 className="text-lg font-semibold">Browser Bookmarklet</h3>
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Universal solution that works on any device with a web browser. One-click access from any webpage.
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
                    Instructions
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Other Deployment Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Desktop Widget */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Monitor className="h-4 w-4" />
                  Desktop Widget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Standalone desktop app for Windows/Mac/Linux
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Generate Installer
                </Button>
              </CardContent>
            </Card>

            {/* Mobile App */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Smartphone className="h-4 w-4" />
                  Mobile App
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  iOS/Android app for mobile devices
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  <QrCode className="h-4 w-4 mr-2" />
                  QR Code
                </Button>
              </CardContent>
            </Card>

            {/* Browser Extension */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="h-4 w-4" />
                  Browser Extension
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Chrome/Firefox extension with right-click scanning
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Install Guide
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Deployment Instructions */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>MSP Deployment Tip:</strong> Send clients the bookmarklet link via email or include it in your onboarding documentation. Works immediately on all devices without any installation.
            </AlertDescription>
          </Alert>

        </CardContent>
      </Card>
    </div>
  );
};
