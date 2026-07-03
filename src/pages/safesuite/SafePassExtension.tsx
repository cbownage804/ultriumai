import { devLog } from '@/lib/logger';
import { useState } from "react";
import { FeatureGate } from '@/components/safesuite/SafeSuitePaywall';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Chrome, Globe, Flame, CheckCircle2, AlertTriangle, Beaker } from "lucide-react";
import JSZip from "jszip";
import { toast } from "sonner";

type Target = "chromium" | "firefox";

const SHARED_FILES = [
  'background.js',
  'browser-compat.js',
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
  'icons/icon128.png',
];

const ExtensionPage = () => {
  const [downloading, setDownloading] = useState<Target | null>(null);

  const buildZip = async (target: Target) => {
    setDownloading(target);
    try {
      const zip = new JSZip();
      const manifestFile = target === "firefox" ? "manifest.firefox.json" : "manifest.json";

      const manifestRes = await fetch(`/wrayth-vault-extension/${manifestFile}`);
      if (!manifestRes.ok) throw new Error("Manifest fetch failed");
      const manifestText = await manifestRes.text();
      zip.file("manifest.json", manifestText);

      for (const file of SHARED_FILES) {
        try {
          const response = await fetch(`/wrayth-vault-extension/${file}`);
          if (response.ok) {
            zip.file(file, await response.blob());
          }
        } catch (e) {
          devLog.warn(`Could not fetch ${file}`, e);
        }
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = target === "firefox" ? "wrayth-firefox.zip" : "wrayth-chrome-edge.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`${target === "firefox" ? "Firefox" : "Chrome / Edge"} extension ready`);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to build extension");
    } finally {
      setDownloading(null);
    }
  };

  const chromiumSteps = [
    "Download and unzip the file",
    "Open chrome://extensions (or edge://extensions, brave://extensions)",
    "Enable Developer mode in the top-right",
    "Click 'Load unpacked' and select the unzipped folder",
    "Pin Wrayth to your toolbar",
  ];

  const firefoxSteps = [
    "Download and unzip the file",
    "Open about:debugging in Firefox",
    "Click 'This Firefox' → 'Load Temporary Add-on…'",
    "Select the manifest.json inside the unzipped folder",
    "Wrayth stays until Firefox restarts (permanent install ships via AMO)",
  ];

  return (
    <FeatureGate feature="vault">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Wrayth Browser Extension</h1>
          <p className="text-muted-foreground mt-1">
            Ray in your browser — autofill, site trust, and identity awareness across every tab.
          </p>
        </div>

        <Alert className="bg-yellow-500/10 border-yellow-500/30">
          <AlertTriangle className="h-4 w-4 text-yellow-400" />
          <AlertDescription className="text-yellow-200/80">
            One-click store installs are coming after Chrome Web Store, Edge Add-ons, and Firefox AMO approval.
            Until then, install the packages below via developer mode.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Chrome className="h-5 w-5 text-primary" />
                Chrome, Edge, Brave, Arc, Opera
                <Badge variant="outline" className="ml-2 bg-green-500/10 text-green-400 border-green-500/30">
                  Production-ready
                </Badge>
              </CardTitle>
              <CardDescription>
                All Chromium browsers. Includes the Ray side panel and every keyboard shortcut. Store install coming soon.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => buildZip("chromium")}
                disabled={downloading !== null}
                className="w-full"
                size="lg"
              >
                <Download className="h-4 w-4 mr-2" />
                {downloading === "chromium" ? "Preparing…" : "Download for Chrome / Edge"}
              </Button>
              <ol className="space-y-2">
                {chromiumSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
              <p className="text-xs text-muted-foreground">Manifest V3 • Chrome 114+ • Edge 114+</p>
            </CardContent>
          </Card>

          <Card className="border-orange-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-400" />
                Firefox
                <Badge variant="outline" className="ml-2 bg-yellow-500/10 text-yellow-400 border-yellow-500/30 flex items-center gap-1">
                  <Beaker className="h-3 w-3" />
                  Beta
                </Badge>
              </CardTitle>
              <CardDescription>
                Native Firefox build using the Firefox sidebar in place of the Chromium side panel. Firefox Add-ons listing coming soon.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => buildZip("firefox")}
                disabled={downloading !== null}
                variant="outline"
                className="w-full border-orange-500/40"
                size="lg"
              >
                <Download className="h-4 w-4 mr-2" />
                {downloading === "firefox" ? "Preparing…" : "Download for Firefox"}
              </Button>
              <ol className="space-y-2">
                {firefoxSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500/10 text-orange-400 text-xs font-medium flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
              <p className="text-xs text-muted-foreground">Manifest V3 • Firefox 121+</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              What Ray does in your browser
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: "Auto-detect login forms", desc: "Ray finds username, password, and TOTP fields on every site." },
                { title: "One-click autofill", desc: "Fill saved credentials without opening the vault." },
                { title: "Encrypted vault sync", desc: "Syncs live with your Wrayth vault — AES-256, client-side keys." },
                { title: "Save new logins", desc: "Ray prompts to save credentials when you sign up or change a password." },
                { title: "Site trust in real time", desc: "Ray flags phishing, brand impersonation, and untrusted domains before you type." },
                { title: "Explain this page", desc: "Ask Ray to translate any page — terms, forms, privacy policies — in plain English." },
              ].map((f, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/50">
                  <h4 className="font-medium text-sm">{f.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-muted-foreground" />
              Coming to the stores
            </CardTitle>
            <CardDescription>
              We're preparing signed submissions so you can install Wrayth with one click.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Chrome Web Store — review submission in progress</li>
              <li>• Microsoft Edge Add-ons — same package, staged after Chrome</li>
              <li>• Firefox AMO (addons.mozilla.org) — signing queued behind Chromium release</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </FeatureGate>
  );
};

export default ExtensionPage;
