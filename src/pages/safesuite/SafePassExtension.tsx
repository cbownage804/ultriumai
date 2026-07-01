import { devLog } from '@/lib/logger';
import { useState } from "react";
import { FeatureGate } from '@/components/safesuite/SafeSuitePaywall';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Globe, Monitor, CheckCircle2, AlertTriangle, Beaker } from "lucide-react";
import JSZip from "jszip";
import { toast } from "sonner";

const VaultExtension = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadExtension = async () => {
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      
      // Fetch all extension files
      const files = [
        'manifest.json',
        'background.js',
        'content.js',
        'content.css',
        'popup.html',
        'popup.js',
        'popup.css',
        'sidepanel.html',
        'sidepanel.js',
        'sidepanel.css',
        'content/detector.js',
        'content/context-bar.js',
        'content/concepts.js',
        'content/ray-overlay.css',

        'icons/icon16.png',
        'icons/icon32.png',
        'icons/icon48.png',
        'icons/icon128.png'
      ];


      for (const file of files) {
        try {
          const response = await fetch(`/wrayth-vault-extension/${file}`);
          if (response.ok) {
            const content = await response.blob();
            zip.file(file, content);
          }
        } catch (e) {
          devLog.warn(`Could not fetch ${file}`, e);
        }
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "wrayth-vault-extension.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Extension downloaded successfully!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download extension");
    } finally {
      setIsDownloading(false);
    }
  };

  const steps = [
    "Download the extension ZIP file",
    "Extract the ZIP to a folder on your computer",
    "Open Chrome/Edge and go to chrome://extensions or edge://extensions",
    "Enable 'Developer mode' (toggle in top right)",
    "Click 'Load unpacked' and select the extracted folder",
    "The Vault icon will appear in your browser toolbar"
  ];

  return (
    <FeatureGate feature="vault">
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Browser Extension</h1>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 flex items-center gap-1">
            <Beaker className="h-3 w-3" />
            BETA
          </Badge>
        </div>
        <p className="text-muted-foreground mt-1">
          Install the Vault extension for seamless autofill
        </p>
      </div>

      {/* Beta Disclaimer */}
      <Alert className="bg-amber-500/10 border-amber-500/30">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <AlertDescription className="text-amber-200/80">
          <span className="font-semibold text-amber-400">Beta Software:</span> This extension is currently in development. 
          While we've tested core functionality, you may encounter bugs or missing features. 
          Please report any issues to our support team. Your vault data remains encrypted and secure.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Download Extension
            </CardTitle>
            <CardDescription>
              Get the Vault browser extension for Chrome and Edge
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                <Globe className="h-5 w-5" />
                <span className="text-sm font-medium">Chrome</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                <Monitor className="h-5 w-5" />
                <span className="text-sm font-medium">Edge</span>
              </div>
            </div>
            
            <Button 
              onClick={downloadExtension} 
              disabled={isDownloading}
              className="w-full"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? "Preparing download..." : "Download Extension (ZIP)"}
            </Button>

            <p className="text-xs text-muted-foreground">
              Version 1.1.0 • Manifest V3 • Works on Chrome 88+ and Edge
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Installation Steps</CardTitle>
            <CardDescription>
              Follow these steps to install the extension
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {steps.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-sm text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Extension Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Auto-detect Login Forms", desc: "Automatically finds username and password fields" },
              { title: "One-Click Autofill", desc: "Fill credentials with a single click" },
              { title: "Secure Vault Sync", desc: "Syncs with your encrypted Vault vault" },
              { title: "Save New Passwords", desc: "Prompts to save new credentials when you sign up" },
              { title: "AES-256 Encryption", desc: "All data encrypted with your master password" },
              { title: "Offline Access", desc: "Cached credentials work without internet" }
            ].map((feature, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/50">
                <h4 className="font-medium text-sm">{feature.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{feature.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
    </FeatureGate>
  );
};

export default VaultExtension;
