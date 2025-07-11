import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Zap, 
  Plus, 
  Settings, 
  ExternalLink, 
  Database, 
  Mail, 
  Slack, 
  Github, 
  Calendar,
  Webhook,
  Key,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  status: "connected" | "disconnected" | "error";
  lastSync?: string;
  config?: any;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggered?: string;
}

export const IntegrationHub = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "slack",
      name: "Slack",
      description: "Real-time alerts and notifications",
      icon: Slack,
      category: "communication",
      status: "connected",
      lastSync: "2 minutes ago"
    },
    {
      id: "microsoft-teams",
      name: "Microsoft Teams",
      description: "Team collaboration and alerts",
      icon: Mail,
      category: "communication",
      status: "disconnected"
    },
    {
      id: "zapier",
      name: "Zapier",
      description: "Automate workflows with 5,000+ apps",
      icon: Zap,
      category: "automation",
      status: "connected",
      lastSync: "1 hour ago"
    },
    {
      id: "github",
      name: "GitHub",
      description: "Code repository and issue tracking",
      icon: Github,
      category: "development",
      status: "error",
      lastSync: "Failed"
    },
    {
      id: "azure-ad",
      name: "Azure AD",
      description: "User authentication and management",
      icon: Database,
      category: "security",
      status: "connected",
      lastSync: "5 minutes ago"
    },
    {
      id: "google-workspace",
      name: "Google Workspace",
      description: "Email and calendar integration",
      icon: Calendar,
      category: "productivity",
      status: "disconnected"
    }
  ]);

  const [webhooks, setWebhooks] = useState<Webhook[]>([
    {
      id: "alert-webhook",
      name: "Critical Alert Notifications",
      url: "https://hooks.zapier.com/hooks/catch/12345/abcdef/",
      events: ["alert.critical", "incident.created"],
      isActive: true,
      lastTriggered: "15 minutes ago"
    },
    {
      id: "ticket-webhook",
      name: "New Ticket Notifications",
      url: "https://hooks.slack.com/services/T12345/B12345/abcdef",
      events: ["ticket.created", "ticket.updated"],
      isActive: true,
      lastTriggered: "2 hours ago"
    }
  ]);

  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [newWebhook, setNewWebhook] = useState({
    name: "",
    url: "",
    events: [] as string[]
  });
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const { toast } = useToast();

  const categories = [
    { id: "all", name: "All", count: integrations.length },
    { id: "communication", name: "Communication", count: integrations.filter(i => i.category === "communication").length },
    { id: "automation", name: "Automation", count: integrations.filter(i => i.category === "automation").length },
    { id: "security", name: "Security", count: integrations.filter(i => i.category === "security").length },
    { id: "productivity", name: "Productivity", count: integrations.filter(i => i.category === "productivity").length },
    { id: "development", name: "Development", count: integrations.filter(i => i.category === "development").length }
  ];

  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredIntegrations = selectedCategory === "all" 
    ? integrations 
    : integrations.filter(i => i.category === selectedCategory);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-100 text-green-800 border-green-200";
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleConnectIntegration = (integration: Integration) => {
    toast({
      title: "Integration Connected",
      description: `${integration.name} has been connected successfully.`
    });
    
    setIntegrations(prev => prev.map(i => 
      i.id === integration.id 
        ? { ...i, status: "connected" as const, lastSync: "Just now" }
        : i
    ));
  };

  const handleDisconnectIntegration = (integration: Integration) => {
    toast({
      title: "Integration Disconnected",
      description: `${integration.name} has been disconnected.`
    });
    
    setIntegrations(prev => prev.map(i => 
      i.id === integration.id 
        ? { ...i, status: "disconnected" as const, lastSync: undefined }
        : i
    ));
  };

  const addWebhook = () => {
    if (!newWebhook.name || !newWebhook.url) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const webhook: Webhook = {
      id: Date.now().toString(),
      ...newWebhook,
      isActive: true
    };

    setWebhooks(prev => [...prev, webhook]);
    setNewWebhook({ name: "", url: "", events: [] });
    setShowWebhookDialog(false);
    
    toast({
      title: "Webhook Added",
      description: "New webhook has been configured successfully."
    });
  };

  const toggleWebhook = (webhookId: string) => {
    setWebhooks(prev => prev.map(w => 
      w.id === webhookId 
        ? { ...w, isActive: !w.isActive }
        : w
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Integration Hub</h2>
          <p className="text-muted-foreground">
            Connect your favorite tools and automate workflows
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showWebhookDialog} onOpenChange={setShowWebhookDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Webhook className="h-4 w-4 mr-2" />
                Add Webhook
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Webhook</DialogTitle>
                <DialogDescription>
                  Configure a webhook to receive real-time notifications
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="webhook-name">Name</Label>
                  <Input
                    id="webhook-name"
                    value={newWebhook.name}
                    onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Slack Notifications"
                  />
                </div>
                <div>
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://hooks.example.com/webhook"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowWebhookDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addWebhook}>Add Webhook</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Browse Integrations
          </Button>
        </div>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-6">
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name} ({category.count})
              </Button>
            ))}
          </div>

          {/* Integrations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIntegrations.map((integration) => {
              const IconComponent = integration.icon;
              return (
                <Card key={integration.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <Badge variant="outline" className={getStatusColor(integration.status)}>
                            {getStatusIcon(integration.status)}
                            <span className="ml-1 capitalize">{integration.status}</span>
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <CardDescription>{integration.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {integration.lastSync && (
                          <span>Last sync: {integration.lastSync}</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedIntegration(integration)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        {integration.status === "connected" ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDisconnectIntegration(integration)}
                          >
                            Disconnect
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleConnectIntegration(integration)}
                          >
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <div className="grid gap-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{webhook.name}</CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {webhook.url}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={webhook.isActive}
                        onCheckedChange={() => toggleWebhook(webhook.id)}
                      />
                      <Badge variant={webhook.isActive ? "default" : "secondary"}>
                        {webhook.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {webhook.events.map((event) => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {webhook.lastTriggered && `Last triggered: ${webhook.lastTriggered}`}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage API keys for external integrations and automation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Ultrium API Key</h4>
                    <p className="text-sm text-muted-foreground">
                      For external system integrations
                    </p>
                  </div>
                  <Button variant="outline">
                    <Key className="h-4 w-4 mr-2" />
                    Generate Key
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Webhook Signature Key</h4>
                    <p className="text-sm text-muted-foreground">
                      For webhook payload verification
                    </p>
                  </div>
                  <Button variant="outline">
                    <Key className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};