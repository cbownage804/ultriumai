import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Key, 
  Scan, 
  MessageSquare, 
  Copy, 
  Download,
  ExternalLink,
  CheckCircle2,
  Building2,
  Users,
  Settings2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WraythTeamsAppsProps {
  organizationName?: string;
}

const WraythTeamsApps = ({ organizationName = "Your Company" }: WraythTeamsAppsProps) => {
  const { toast } = useToast();
  const [customBranding, setCustomBranding] = useState({
    companyName: organizationName,
    primaryColor: "#0078d4",
    logoUrl: ""
  });

  const baseUrl = window.location.origin;

  const safeSuiteApps = [
    {
      id: "safescan",
      name: "Scan",
      icon: Scan,
      description: "URL threat scanner for checking links before clicking",
      color: "#2563eb",
      embedPath: "/safesuite/scan",
      features: ["Link Scanning", "Threat Detection", "Real-time Analysis"]
    },
    {
      id: "safepass",
      name: "Vault",
      icon: Key,
      description: "Secure password manager with auto-fill capabilities",
      color: "#059669",
      embedPath: "/safesuite/pass",
      features: ["Password Vault", "Secure Sharing", "Breach Monitoring"]
    },
    {
      id: "safeassist",
      name: "SafeAssist",
      icon: MessageSquare,
      description: "AI-powered IT support assistant with voice capabilities",
      color: "#7c3aed",
      embedPath: "/safesuite/assist",
      features: ["AI Chat", "Voice Support", "Ticket Creation"]
    },
    {
      id: "safeshield",
      name: "SafeShield",
      icon: Shield,
      description: "Unified security dashboard for threat monitoring",
      color: "#dc2626",
      embedPath: "/safeshield",
      features: ["Security Alerts", "Threat Dashboard", "Incident Response"]
    }
  ];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`
    });
  };

  const generateTeamsManifest = (app: typeof safeSuiteApps[0]) => {
    const manifest = {
      "$schema": "https://developer.microsoft.com/en-us/json-schemas/teams/v1.16/MicrosoftTeams.schema.json",
      "manifestVersion": "1.16",
      "version": "1.0.0",
      "id": `safesuite-${app.id}-${Date.now()}`,
      "packageName": `com.safesuite.${app.id}`,
      "developer": {
        "name": customBranding.companyName || "Wrayth",
        "websiteUrl": baseUrl,
        "privacyUrl": `${baseUrl}/privacy`,
        "termsOfUseUrl": `${baseUrl}/terms`
      },
      "name": {
        "short": `${customBranding.companyName} ${app.name}`.slice(0, 30),
        "full": `${customBranding.companyName} ${app.name} - Enterprise Security`
      },
      "description": {
        "short": app.description,
        "full": `${app.description} Deploy ${app.name} as a Teams app for your organization.`
      },
      "icons": {
        "outline": "outline.png",
        "color": "color.png"
      },
      "accentColor": customBranding.primaryColor || app.color,
      "staticTabs": [
        {
          "entityId": app.id,
          "name": app.name,
          "contentUrl": `${baseUrl}${app.embedPath}?embed=true&org=${encodeURIComponent(customBranding.companyName)}`,
          "websiteUrl": `${baseUrl}${app.embedPath}`,
          "scopes": ["personal"]
        }
      ],
      "permissions": ["identity", "messageTeamMembers"],
      "validDomains": [
        new URL(baseUrl).hostname,
        "*.ultriumai.com",
        "*.safesuite.app"
      ]
    };
    return manifest;
  };

  const downloadManifest = (app: typeof safeSuiteApps[0]) => {
    const manifest = generateTeamsManifest(app);
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${customBranding.companyName.replace(/\s+/g, '-').toLowerCase()}-${app.id}-manifest.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Manifest Downloaded",
      description: `${app.name} Teams manifest saved. Add your icons and zip the files for deployment.`
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Wrayth Teams Apps
          </h2>
          <p className="text-muted-foreground mt-1">
            Deploy Wrayth security tools as white-labeled Microsoft Teams apps for your organization
          </p>
        </div>
      </div>

      {/* Branding Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            White-Label Branding
          </CardTitle>
          <CardDescription>
            Customize the apps with your company branding before deploying to Teams
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={customBranding.companyName}
                onChange={(e) => setCustomBranding(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Your Company Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={customBranding.primaryColor}
                  onChange={(e) => setCustomBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="w-14 h-10 p-1"
                />
                <Input
                  value={customBranding.primaryColor}
                  onChange={(e) => setCustomBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                  placeholder="#0078d4"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
              <Input
                id="logoUrl"
                value={customBranding.logoUrl}
                onChange={(e) => setCustomBranding(prev => ({ ...prev, logoUrl: e.target.value }))}
                placeholder="https://your-domain.com/logo.png"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Apps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {safeSuiteApps.map((app) => {
          const IconComponent = app.icon;
          const embedUrl = `${baseUrl}${app.embedPath}?embed=true&org=${encodeURIComponent(customBranding.companyName)}`;
          
          return (
            <Card key={app.id} className="relative overflow-hidden">
              <div 
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: app.color }}
              />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${app.color}20` }}
                    >
                      <IconComponent className="h-6 w-6" style={{ color: app.color }} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{customBranding.companyName} {app.name}</CardTitle>
                      <CardDescription className="mt-1">{app.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">Available</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Features */}
                <div className="flex flex-wrap gap-2">
                  {app.features.map((feature) => (
                    <Badge key={feature} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>

                {/* Actions */}
                <Tabs defaultValue="quick" className="mt-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="quick">Quick Add</TabsTrigger>
                    <TabsTrigger value="custom">Custom App</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="quick" className="space-y-3 pt-3">
                    <div className="text-sm text-muted-foreground">
                      Add as a Website tab in any Teams channel:
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        value={embedUrl} 
                        readOnly 
                        className="font-mono text-xs"
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => copyToClipboard(embedUrl, "Embed URL")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      asChild
                    >
                      <a 
                        href={embedUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Preview
                      </a>
                    </Button>
                  </TabsContent>

                  <TabsContent value="custom" className="space-y-3 pt-3">
                    <div className="text-sm text-muted-foreground">
                      Deploy as a custom Teams app with your branding:
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => downloadManifest(app)}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Manifest
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => copyToClipboard(JSON.stringify(generateTeamsManifest(app), null, 2), "Manifest JSON")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        After downloading, add icon files and upload to Teams Admin Center
                      </AlertDescription>
                    </Alert>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Business Features Info */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Business Account Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Team Management</p>
                <p className="text-sm text-muted-foreground">Admin portal to manage employee access</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">SSO Integration</p>
                <p className="text-sm text-muted-foreground">Sign in with Microsoft 365 credentials</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Usage Analytics</p>
                <p className="text-sm text-muted-foreground">Track adoption and usage across team</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WraythTeamsApps;
