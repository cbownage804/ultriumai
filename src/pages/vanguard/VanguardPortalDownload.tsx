import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Monitor,
  Settings,
  Copy,
  CheckCircle,
  Loader2,
  Key,
  RefreshCw,
  FileCode,
  Package,
  Globe,
  Shield,
  ExternalLink,
  AlertCircle,
  Image,
  Palette,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import JSZip from "jszip";

interface PortalSettings {
  id?: string;
  portal_name: string;
  portal_logo_url: string;
  portal_key: string;
  primary_color: string;
  custom_icon_url: string;
  portal_app_enabled: boolean;
}

const PORTAL_EXE_URL = "https://github.com/your-org/vanguard-portal/releases/latest/download/VanguardPortal-win-x64.exe";

export default function VanguardPortalDownload() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PortalSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const portalUrl = `${window.location.origin}/customer-portal`;

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("vanguard_portal_settings")
        .select("id, portal_name, portal_logo_url, portal_key, primary_color, custom_icon_url, portal_app_enabled")
        .eq("user_id", user.id)
        .is("client_id", null)
        .maybeSingle();

      if (data) {
        setSettings(data as PortalSettings);
      } else {
        // Create default settings with portal key
        const { data: newData, error: insertError } = await supabase
          .from("vanguard_portal_settings")
          .insert({
            user_id: user.id,
            portal_name: "Customer Portal",
            portal_app_enabled: false,
          })
          .select("id, portal_name, portal_logo_url, portal_key, primary_color, custom_icon_url, portal_app_enabled")
          .single();

        if (newData) {
          setSettings(newData as PortalSettings);
        }
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateKey = async () => {
    if (!settings?.id) return;
    
    setIsGenerating(true);
    try {
      const newKey = crypto.randomUUID();
      const { error } = await supabase
        .from("vanguard_portal_settings")
        .update({ 
          portal_key: newKey,
          portal_key_created_at: new Date().toISOString()
        })
        .eq("id", settings.id);

      if (error) throw error;

      setSettings({ ...settings, portal_key: newKey });
      toast.success("Portal key regenerated. Existing installations will need to be updated.");
    } catch (err: any) {
      toast.error(err.message || "Failed to regenerate key");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const generateConfig = () => {
    if (!settings) return "";
    
    return JSON.stringify({
      portal_key: settings.portal_key,
      portal_name: settings.portal_name,
      portal_url: portalUrl,
      api_endpoint: `${window.location.origin}/api`,
      logo_url: settings.portal_logo_url || null,
      primary_color: settings.primary_color || "#0891b2",
      msp_user_id: user?.id,
    }, null, 2);
  };

  const downloadConfigOnly = () => {
    const config = generateConfig();
    const blob = new Blob([config], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "config.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Configuration file downloaded");
  };

  const downloadInstaller = async () => {
    if (!settings) return;
    
    setIsDownloading(true);
    try {
      // Create ZIP with installer script and config
      const zip = new JSZip();
      
      // Add config.json
      const config = generateConfig();
      zip.file("config.json", config);
      
      // Add install script
      const installScript = `@echo off
echo =========================================
echo   ${settings.portal_name} - Installer
echo =========================================
echo.

:: Check for admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Please run as Administrator
    pause
    exit /b 1
)

:: Create program directory
set "INSTALL_DIR=%ProgramFiles%\\VanguardPortal"
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

:: Copy files
echo Installing files...
copy /Y "VanguardPortal.exe" "%INSTALL_DIR%\\" >nul
copy /Y "config.json" "%INSTALL_DIR%\\" >nul

:: Create shortcut in startup folder
echo Creating startup shortcut...
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\${settings.portal_name}.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\\VanguardPortal.exe'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Save()"

:: Create desktop shortcut
echo Creating desktop shortcut...
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\\Desktop\\${settings.portal_name}.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\\VanguardPortal.exe'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Save()"

echo.
echo =========================================
echo   Installation Complete!
echo =========================================
echo.
echo The portal will start automatically on login.
echo Starting portal now...
echo.

start "" "%INSTALL_DIR%\\VanguardPortal.exe"

pause
`;
      zip.file("install.bat", installScript);
      
      // Add uninstall script
      const uninstallScript = `@echo off
echo =========================================
echo   ${settings.portal_name} - Uninstaller
echo =========================================
echo.

:: Check for admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Please run as Administrator
    pause
    exit /b 1
)

:: Kill running process
taskkill /F /IM VanguardPortal.exe 2>nul

:: Remove files
set "INSTALL_DIR=%ProgramFiles%\\VanguardPortal"
if exist "%INSTALL_DIR%" rmdir /S /Q "%INSTALL_DIR%"

:: Remove shortcuts
del "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\${settings.portal_name}.lnk" 2>nul
del "%USERPROFILE%\\Desktop\\${settings.portal_name}.lnk" 2>nul

echo.
echo Uninstallation complete.
pause
`;
      zip.file("uninstall.bat", uninstallScript);
      
      // Add README
      const readme = `# ${settings.portal_name} - System Tray Application

## Installation

1. Download VanguardPortal.exe from the releases page
2. Place it in this folder
3. Run install.bat as Administrator

## Manual Installation

1. Copy VanguardPortal.exe and config.json to a folder
2. Run VanguardPortal.exe

## Configuration

The config.json file contains your portal settings. Do not share this file
as it contains your unique portal key.

## Support

Contact your IT administrator for support.
`;
      zip.file("README.txt", readme);
      
      // Generate and download ZIP
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${settings.portal_name.replace(/[^a-z0-9]/gi, "-")}-Installer.zip`;
      a.click();
      URL.revokeObjectURL(url);
      
      // Track download
      await supabase.from("vanguard_portal_downloads").insert({
        portal_settings_id: settings.id,
        user_id: user?.id,
        download_type: "installer",
        platform: "win-x64",
      });
      
      toast.success("Installer package downloaded! Add VanguardPortal.exe from releases.");
    } catch (err: any) {
      toast.error(err.message || "Failed to create installer package");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Download className="h-8 w-8 text-cyan-500" />
            Portal Desktop App
          </h1>
          <p className="text-slate-400 mt-1">
            Download and deploy the system tray portal application for your customers
          </p>
        </div>

        {/* Portal Key Card */}
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Key className="h-5 w-5 text-cyan-400" />
              Portal Integration Key
            </CardTitle>
            <CardDescription className="text-slate-400">
              This unique key links customer installations to your Vanguard instance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg p-3 font-mono text-sm text-white overflow-x-auto">
                {settings?.portal_key}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(settings?.portal_key || "")}
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
              >
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={regenerateKey}
                disabled={isGenerating}
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              <AlertCircle className="h-3 w-3 inline mr-1" />
              Regenerating the key will invalidate all existing installations
            </p>
          </CardContent>
        </Card>

        {/* Download Options */}
        <Tabs defaultValue="installer" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-cyan-500/20">
            <TabsTrigger value="installer" className="data-[state=active]:bg-cyan-500/20">
              <Package className="h-4 w-4 mr-2" />
              Full Installer
            </TabsTrigger>
            <TabsTrigger value="config" className="data-[state=active]:bg-cyan-500/20">
              <FileCode className="h-4 w-4 mr-2" />
              Config Only
            </TabsTrigger>
            <TabsTrigger value="branding" className="data-[state=active]:bg-cyan-500/20">
              <Palette className="h-4 w-4 mr-2" />
              White-Label
            </TabsTrigger>
          </TabsList>

          <TabsContent value="installer">
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white">Download Installer Package</CardTitle>
                <CardDescription className="text-slate-400">
                  Complete installation package with scripts and configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-cyan-500/30">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <Monitor className="h-5 w-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Windows x64</p>
                        <p className="text-xs text-slate-400">For 64-bit Windows</p>
                      </div>
                    </div>
                    <Button
                      onClick={downloadInstaller}
                      disabled={isDownloading}
                      className="w-full bg-cyan-600 hover:bg-cyan-700"
                    >
                      {isDownloading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Download Installer
                    </Button>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-slate-700 flex items-center justify-center">
                        <Monitor className="h-5 w-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Windows ARM64</p>
                        <p className="text-xs text-slate-400">For ARM-based Windows</p>
                      </div>
                    </div>
                    <Button variant="outline" disabled className="w-full">
                      Coming Soon
                    </Button>
                  </div>
                </div>

                <Separator className="bg-slate-700" />

                <div className="space-y-3">
                  <h4 className="text-white font-medium">Installation Steps</h4>
                  <div className="space-y-2 text-sm text-slate-400">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs">1</Badge>
                      <span>Download the installer package (ZIP file)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs">2</Badge>
                      <span>
                        Download VanguardPortal.exe from{" "}
                        <a
                          href="https://github.com/your-org/vanguard-portal/releases"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:underline"
                        >
                          GitHub Releases
                          <ExternalLink className="h-3 w-3 inline ml-1" />
                        </a>
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs">3</Badge>
                      <span>Place the EXE in the extracted folder</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs">4</Badge>
                      <span>Run install.bat as Administrator</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config">
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white">Configuration File</CardTitle>
                <CardDescription className="text-slate-400">
                  Download or view the config.json for manual deployments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-800 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-slate-300 font-mono whitespace-pre">
                    {generateConfig()}
                  </pre>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(generateConfig())}
                    className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Config
                  </Button>
                  <Button
                    onClick={downloadConfigOnly}
                    className="bg-cyan-600 hover:bg-cyan-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download config.json
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding">
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white">White-Label Configuration</CardTitle>
                <CardDescription className="text-slate-400">
                  Customize the portal appearance for your customers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />
                    <div className="text-sm text-amber-200">
                      <p className="font-medium">Configure in Portal Settings</p>
                      <p className="mt-1 text-amber-300/80">
                        White-label settings like portal name, logo, and colors are configured in the{" "}
                        <a href="/vanguard/app/portal" className="underline">
                          Customer Portal Settings
                        </a>{" "}
                        page. Changes there will automatically apply to new installer downloads.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center gap-3 mb-3">
                      <Globe className="h-5 w-5 text-cyan-400" />
                      <span className="text-white font-medium">Portal Name</span>
                    </div>
                    <p className="text-sm text-slate-400">
                      {settings?.portal_name || "Customer Portal"}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      Appears in taskbar tooltip and window title
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center gap-3 mb-3">
                      <Image className="h-5 w-5 text-cyan-400" />
                      <span className="text-white font-medium">Logo</span>
                    </div>
                    {settings?.portal_logo_url ? (
                      <img
                        src={settings.portal_logo_url}
                        alt="Portal logo"
                        className="h-8 w-auto"
                      />
                    ) : (
                      <p className="text-sm text-slate-400">Default icon</p>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                      Used for taskbar icon and window header
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center gap-3 mb-3">
                      <Palette className="h-5 w-5 text-cyan-400" />
                      <span className="text-white font-medium">Primary Color</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-6 w-6 rounded"
                        style={{ backgroundColor: settings?.primary_color || "#0891b2" }}
                      />
                      <span className="text-sm text-slate-400 font-mono">
                        {settings?.primary_color || "#0891b2"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Accent color for buttons and highlights
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center gap-3 mb-3">
                      <Shield className="h-5 w-5 text-cyan-400" />
                      <span className="text-white font-medium">SafeSuite</span>
                    </div>
                    <p className="text-sm text-slate-400">
                      Integrated in portal menu
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      SafePass, SafeScan, SafeWeb, SafeTrack
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
