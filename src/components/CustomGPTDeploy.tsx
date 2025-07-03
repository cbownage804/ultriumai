import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Rocket, Globe, Code, Key, ExternalLink } from "lucide-react";
import IntegrationsManager from "./IntegrationsManager";

const CustomGPTDeploy = () => {
  const [deploySettings, setDeploySettings] = useState({
    apiEnabled: false,
    embedEnabled: false,
    publicAccess: false,
    customDomain: ""
  });

  const [apiKey] = useState("gpt_" + Math.random().toString(36).substr(2, 16));

  const toggleSetting = (key: keyof typeof deploySettings) => {
    setDeploySettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Deploy Your GPT</h1>
        <p className="text-muted-foreground mt-2">
          Configure deployment options and integrations
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* API Access */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Access
            </CardTitle>
            <CardDescription>
              Enable programmatic access to your Custom GPT
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Enable API Access</Label>
                <p className="text-sm text-muted-foreground">
                  Allow external applications to use your GPT
                </p>
              </div>
              <Switch
                checked={deploySettings.apiEnabled}
                onCheckedChange={() => toggleSetting('apiEnabled')}
              />
            </div>

            {deploySettings.apiEnabled && (
              <div className="space-y-3 pt-3 border-t">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <div className="flex gap-2">
                    <Input value={apiKey} readOnly className="font-mono text-sm" />
                    <Button variant="outline" size="sm">
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Keep this key secure. It provides full access to your GPT.
                  </p>
                </div>
                
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">API Endpoint</h4>
                  <code className="text-sm">
                    POST https://api.ultriumgpt.com/v1/chat/completions
                  </code>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Embed Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Embed Widget
            </CardTitle>
            <CardDescription>
              Add your GPT to websites as a chat widget
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Enable Embed Widget</Label>
                <p className="text-sm text-muted-foreground">
                  Generate embeddable chat widget code
                </p>
              </div>
              <Switch
                checked={deploySettings.embedEnabled}
                onCheckedChange={() => toggleSetting('embedEnabled')}
              />
            </div>

            {deploySettings.embedEnabled && (
              <div className="space-y-3 pt-3 border-t">
                <div className="space-y-2">
                  <Label>Widget Size</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">Small</Button>
                    <Button variant="outline" size="sm">Large</Button>
                  </div>
                </div>
                
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Embed Code</h4>
                  <code className="text-xs block whitespace-pre-wrap">
                    {`<script src="https://cdn.ultriumgpt.com/widget.js"></script>
<div id="ultrium-gpt" data-gpt-id="your-gpt-id"></div>`}
                  </code>
                  <Button variant="outline" size="sm" className="mt-2">
                    Copy Code
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Public Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Public Access
          </CardTitle>
          <CardDescription>
            Make your GPT available to the public
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Public Access</Label>
              <p className="text-sm text-muted-foreground">
                Allow anyone to use your GPT without authentication
              </p>
            </div>
            <Switch
              checked={deploySettings.publicAccess}
              onCheckedChange={() => toggleSetting('publicAccess')}
            />
          </div>

          {deploySettings.publicAccess && (
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Public URL</Badge>
                <span className="text-sm text-muted-foreground">
                  https://chat.ultriumgpt.com/my-custom-gpt
                </span>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="custom-domain">Custom Domain (Optional)</Label>
                <Input
                  id="custom-domain"
                  placeholder="chat.yourdomain.com"
                  value={deploySettings.customDomain}
                  onChange={(e) => setDeploySettings(prev => ({ ...prev, customDomain: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Use your own domain for the public chat interface
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integrations */}
      <IntegrationsManager gptId="sample-gpt-id" gptName="My Custom GPT" />

      <div className="flex justify-end gap-2">
        <Button variant="outline">Save Draft</Button>
        <Button className="flex items-center gap-2">
          <Rocket className="h-4 w-4" />
          Deploy GPT
        </Button>
      </div>
    </div>
  );
};

export default CustomGPTDeploy;