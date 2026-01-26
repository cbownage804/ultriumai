import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Copy, 
  Download, 
  ExternalLink, 
  MessageSquare, 
  FileCode,
  CheckCircle2,
  Info
} from "lucide-react";

interface TeamsIntegrationConfigProps {
  gptId: string;
  gptName: string;
  copyToClipboard: (text: string, label: string) => void;
}

const TeamsIntegrationConfig = ({ gptId, gptName, copyToClipboard }: TeamsIntegrationConfigProps) => {
  const [tabHeight, setTabHeight] = useState("600");
  
  const baseUrl = window.location.origin;
  const embedUrl = `${baseUrl}/gpt/${gptId}/embed?embed=true`;
  const fullPageUrl = `${baseUrl}/gpt/${gptId}`;
  
  // Teams Tab iframe code
  const teamsTabCode = `<iframe 
  src="${embedUrl}"
  width="100%" 
  height="${tabHeight}px"
  frameborder="0"
  style="border: none; border-radius: 8px;"
  allow="clipboard-write"
></iframe>`;

  // Teams App Manifest
  const teamsManifest = {
    "$schema": "https://developer.microsoft.com/en-us/json-schemas/teams/v1.16/MicrosoftTeams.schema.json",
    "manifestVersion": "1.16",
    "version": "1.0.0",
    "id": gptId,
    "packageName": `com.ultriumai.gpt.${gptId.slice(0, 8)}`,
    "developer": {
      "name": "UltriumAI",
      "websiteUrl": "https://ultriumai.com",
      "privacyUrl": "https://ultriumai.com/privacy",
      "termsOfUseUrl": "https://ultriumai.com/terms"
    },
    "name": {
      "short": gptName.slice(0, 30),
      "full": gptName
    },
    "description": {
      "short": `AI Assistant: ${gptName}`,
      "full": `${gptName} - Powered by UltriumAI. A custom AI assistant built for your organization.`
    },
    "icons": {
      "outline": "outline.png",
      "color": "color.png"
    },
    "accentColor": "#0078D4",
    "staticTabs": [
      {
        "entityId": "chat",
        "name": gptName.slice(0, 16),
        "contentUrl": embedUrl,
        "websiteUrl": fullPageUrl,
        "scopes": ["personal"]
      }
    ],
    "permissions": ["identity", "messageTeamMembers"],
    "validDomains": [
      new URL(baseUrl).hostname,
      "*.ultriumai.com"
    ]
  };

  const downloadManifest = () => {
    const blob = new Blob([JSON.stringify(teamsManifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${gptName.replace(/\s+/g, '-').toLowerCase()}-teams-manifest.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Microsoft Teams Integration
          <Badge variant="secondary" className="ml-2">Available</Badge>
        </CardTitle>
        <CardDescription>
          Deploy your AI assistant directly into Microsoft Teams as a personal app or tab
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="quick" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quick">Quick Setup</TabsTrigger>
            <TabsTrigger value="tab">Website Tab</TabsTrigger>
            <TabsTrigger value="manifest">Custom App</TabsTrigger>
          </TabsList>

          {/* Quick Setup */}
          <TabsContent value="quick" className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                The fastest way to add your AI to Teams - no admin approval required for Website tabs.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Works with any Teams channel or chat</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>No IT admin approval needed</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Takes less than 2 minutes</span>
              </div>
            </div>

            <div className="bg-muted rounded-lg p-4 space-y-3">
              <h4 className="font-medium">Quick Setup Steps:</h4>
              <ol className="space-y-2 text-sm list-decimal list-inside">
                <li>Open Microsoft Teams</li>
                <li>Click the <strong>+</strong> button to add a tab</li>
                <li>Search for "Website" and select it</li>
                <li>Paste this URL:</li>
              </ol>
              
              <div className="flex items-center gap-2 mt-2">
                <Input value={embedUrl} readOnly className="font-mono text-xs" />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(embedUrl, "Teams URL")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <ol className="space-y-2 text-sm list-decimal list-inside" start={5}>
                <li>Name your tab (e.g., "{gptName}")</li>
                <li>Click <strong>Save</strong></li>
              </ol>
            </div>

            <Button className="w-full" variant="outline" asChild>
              <a 
                href={`https://teams.microsoft.com/l/entity/com.microsoft.teamspace.tab.web/_djb2_msteams_prefix_${encodeURIComponent(embedUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Teams (Direct Link)
              </a>
            </Button>
          </TabsContent>

          {/* Website Tab */}
          <TabsContent value="tab" className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Use this iframe code to embed your AI in SharePoint pages or custom Teams tabs.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="tabHeight">Tab Height (pixels)</Label>
              <Input
                id="tabHeight"
                type="number"
                value={tabHeight}
                onChange={(e) => setTabHeight(e.target.value)}
                placeholder="600"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Iframe Embed Code</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(teamsTabCode, "Iframe code")}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
              </div>
              <Textarea
                value={teamsTabCode}
                readOnly
                className="font-mono text-xs h-32"
              />
            </div>

            <div className="bg-muted rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm">Works great with:</h4>
              <ul className="text-sm space-y-1">
                <li>• SharePoint Online pages</li>
                <li>• Microsoft Viva Connections</li>
                <li>• Power Apps portals</li>
                <li>• Custom Teams apps</li>
              </ul>
            </div>
          </TabsContent>

          {/* Custom App Manifest */}
          <TabsContent value="manifest" className="space-y-4">
            <Alert>
              <FileCode className="h-4 w-4" />
              <AlertDescription>
                Create a custom Teams app for the best experience. Requires IT admin approval to deploy organization-wide.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Appears in Teams app bar</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Custom branding and icon</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Deploy to entire organization</span>
              </div>
            </div>

            <div className="bg-muted rounded-lg p-4 space-y-3">
              <h4 className="font-medium">Setup Instructions:</h4>
              <ol className="space-y-2 text-sm list-decimal list-inside">
                <li>Download the manifest.json below</li>
                <li>Create two icon files (192x192 color.png, 32x32 outline.png)</li>
                <li>Zip all three files together</li>
                <li>Upload to Teams Admin Center → Manage apps → Upload</li>
                <li>Or sideload in Teams → Apps → Upload a custom app</li>
              </ol>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>App Manifest (manifest.json)</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(teamsManifest, null, 2), "Manifest JSON")}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={downloadManifest}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
              <Textarea
                value={JSON.stringify(teamsManifest, null, 2)}
                readOnly
                className="font-mono text-xs h-48"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TeamsIntegrationConfig;
