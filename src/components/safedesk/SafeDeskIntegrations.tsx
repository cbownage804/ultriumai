import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Key, Sparkles, ExternalLink } from "lucide-react";
import { EmailSettingsManager } from "./EmailSettingsManager";
import { APIKeyManager } from "./APIKeyManager";

export const SafeDeskIntegrations = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">SafeDesk Integrations</h2>
          <p className="text-muted-foreground">
            Connect SafeDesk with your existing tools and workflows
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          AI-Powered
        </Badge>
      </div>

      <Tabs defaultValue="email" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email-to-Ticket
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Integration
          </TabsTrigger>
          <TabsTrigger value="examples" className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Use Cases
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="space-y-6">
          <EmailSettingsManager />
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <APIKeyManager />
        </TabsContent>

        <TabsContent value="examples" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-500" />
                  Microsoft Forms Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Connect Microsoft Forms to automatically create tickets with structured data.
                </p>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Setup Steps:</h4>
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Create an API key in the API Integration tab</li>
                    <li>In Microsoft Forms, add a Power Automate flow</li>
                    <li>Use the HTTP POST action to send form data to SafeDesk</li>
                    <li>Map form fields to ticket properties</li>
                  </ol>
                </div>
                <Badge variant="outline" className="text-xs">Power Automate Required</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-green-500" />
                  Power Apps Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Build custom ticket submission apps with Power Apps and SafeDesk API.
                </p>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Benefits:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Custom UI for different user types</li>
                    <li>Real-time validation and routing</li>
                    <li>Integration with SharePoint and Teams</li>
                    <li>Mobile-friendly ticket submission</li>
                  </ul>
                </div>
                <Badge variant="outline" className="text-xs">Custom Canvas App</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Email-to-Ticket Automation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Set up dedicated email addresses that automatically create and route tickets.
                </p>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">AI Features:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Automatic priority detection from email content</li>
                    <li>AI-generated ticket summaries</li>
                    <li>Smart categorization and routing</li>
                    <li>Auto-reply with ticket confirmation</li>
                  </ul>
                </div>
                <Badge variant="outline" className="text-xs">No Coding Required</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-orange-500" />
                  Third-Party Integrations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Connect with monitoring tools, webhooks, and other business applications.
                </p>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Supported Integrations:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Monitoring systems (Nagios, PRTG, etc.)</li>
                    <li>Webhook endpoints for instant notifications</li>
                    <li>Custom applications via REST API</li>
                    <li>Zapier and other automation platforms</li>
                  </ul>
                </div>
                <Badge variant="outline" className="text-xs">RESTful API</Badge>
              </CardContent>
            </Card>
          </div>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI-Powered Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                All SafeDesk integrations include built-in AI capabilities to enhance ticket management:
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Smart Summaries</h4>
                  <p className="text-xs text-muted-foreground">
                    AI automatically generates concise ticket summaries highlighting key issues and recommended actions.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Priority Detection</h4>
                  <p className="text-xs text-muted-foreground">
                    Automatic priority assignment based on content analysis and urgency keywords.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Solution Suggestions</h4>
                  <p className="text-xs text-muted-foreground">
                    AI provides step-by-step solution recommendations with confidence scores.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};