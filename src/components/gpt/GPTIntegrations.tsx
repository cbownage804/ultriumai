import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Key,
  Code2,
  Webhook,
  Link2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  Play,
  Zap,
  Settings,
  MessageSquare,
  Globe,
  Shield,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsed?: string;
  permissions: string[];
  isActive: boolean;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggered?: string;
}

interface GPTIntegrationsProps {
  gptId: string;
  gptName: string;
  apiEnabled?: boolean;
  embedEnabled?: boolean;
  apiKeys?: ApiKey[];
  webhooks?: Webhook[];
  onToggleApi?: (enabled: boolean) => void;
  onToggleEmbed?: (enabled: boolean) => void;
  onCreateApiKey?: (name: string) => void;
  onDeleteApiKey?: (keyId: string) => void;
  onCreateWebhook?: (name: string, url: string, events: string[]) => void;
  onDeleteWebhook?: (webhookId: string) => void;
  themeColor?: string;
}

const mockApiKeys: ApiKey[] = [
  {
    id: '1',
    name: 'Production Key',
    prefix: 'sk-...abc123',
    createdAt: '2024-01-15',
    lastUsed: '2024-02-10',
    permissions: ['read', 'write'],
    isActive: true,
  },
  {
    id: '2',
    name: 'Development Key',
    prefix: 'sk-...def456',
    createdAt: '2024-02-01',
    permissions: ['read'],
    isActive: true,
  },
];

const mockWebhooks: Webhook[] = [
  {
    id: '1',
    name: 'Slack Notifications',
    url: 'https://hooks.slack.com/services/xxx',
    events: ['message.created', 'session.started'],
    isActive: true,
    lastTriggered: '2024-02-10',
  },
];

const webhookEvents = [
  { id: 'message.created', label: 'Message Created', description: 'When a new message is sent' },
  { id: 'session.started', label: 'Session Started', description: 'When a chat session begins' },
  { id: 'session.ended', label: 'Session Ended', description: 'When a chat session ends' },
  { id: 'feedback.received', label: 'Feedback Received', description: 'When user provides feedback' },
];

export function GPTIntegrations({
  gptId,
  gptName,
  apiEnabled = false,
  embedEnabled = false,
  apiKeys = mockApiKeys,
  webhooks = mockWebhooks,
  onToggleApi,
  onToggleEmbed,
  onCreateApiKey,
  onDeleteApiKey,
  onCreateWebhook,
  onDeleteWebhook,
  themeColor = "#3b82f6"
}: GPTIntegrationsProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [newWebhookName, setNewWebhookName] = useState("");
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);

  const baseUrl = `https://api.example.com/v1/gpt/${gptId}`;
  const embedCode = `<script src="https://embed.example.com/widget.js" data-gpt-id="${gptId}"></script>`;

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      toast({ title: "Copied to clipboard!" });
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;
    onCreateApiKey?.(newKeyName);
    toast({ title: "API key created", description: `Key "${newKeyName}" has been created` });
    setNewKeyName("");
    setKeyDialogOpen(false);
  };

  const handleCreateWebhook = () => {
    if (!newWebhookName.trim() || !newWebhookUrl.trim()) return;
    onCreateWebhook?.(newWebhookName, newWebhookUrl, selectedEvents);
    toast({ title: "Webhook created", description: `Webhook "${newWebhookName}" has been created` });
    setNewWebhookName("");
    setNewWebhookUrl("");
    setSelectedEvents([]);
    setWebhookDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="api" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Access
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="embed" className="flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            Embed
          </TabsTrigger>
        </TabsList>

        {/* API Access Tab */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5" style={{ color: themeColor }} />
                    API Access
                  </CardTitle>
                  <CardDescription>
                    Enable programmatic access to "{gptName}"
                  </CardDescription>
                </div>
                <Switch 
                  checked={apiEnabled} 
                  onCheckedChange={onToggleApi}
                />
              </div>
            </CardHeader>
            {apiEnabled && (
              <CardContent className="space-y-4">
                {/* API Endpoint */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">API Endpoint</Label>
                  <div className="flex gap-2">
                    <Input value={baseUrl} readOnly className="font-mono text-sm bg-muted" />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleCopy(baseUrl, 'endpoint')}
                    >
                      {copied === 'endpoint' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* API Keys */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>API Keys</Label>
                    <Dialog open={keyDialogOpen} onOpenChange={setKeyDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Key
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create API Key</DialogTitle>
                          <DialogDescription>
                            Create a new API key to access this GPT programmatically
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Key Name</Label>
                            <Input
                              placeholder="e.g., Production Server"
                              value={newKeyName}
                              onChange={(e) => setNewKeyName(e.target.value)}
                            />
                          </div>
                          <Button onClick={handleCreateKey} className="w-full" style={{ backgroundColor: themeColor }}>
                            Create API Key
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {apiKeys.map((key) => (
                        <motion.div
                          key={key.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                        >
                          <Key className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{key.name}</p>
                              <Badge variant={key.isActive ? "default" : "secondary"} className="text-[10px] h-4">
                                {key.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <code className="font-mono">
                                {showKey === key.id ? 'sk-abc123...xyz789' : key.prefix}
                              </code>
                              <button 
                                onClick={() => setShowKey(showKey === key.id ? null : key.id)}
                                className="hover:text-foreground"
                              >
                                {showKey === key.id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleCopy(key.prefix, key.id)}
                            >
                              {copied === key.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => onDeleteApiKey?.(key.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Quick Reference */}
                <Card className="bg-muted/30">
                  <CardHeader className="py-3">
                    <CardTitle className="text-xs flex items-center gap-2">
                      <Code2 className="h-4 w-4" />
                      Quick Start
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-0 pb-3">
                    <pre className="text-xs bg-background p-3 rounded-lg overflow-x-auto">
{`curl -X POST ${baseUrl}/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello!"}'`}
                    </pre>
                  </CardContent>
                </Card>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Webhook className="h-5 w-5" style={{ color: themeColor }} />
                    Webhooks
                  </CardTitle>
                  <CardDescription>
                    Receive real-time notifications for GPT events
                  </CardDescription>
                </div>
                <Dialog open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" style={{ backgroundColor: themeColor }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Webhook
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Webhook</DialogTitle>
                      <DialogDescription>
                        Configure a webhook endpoint to receive event notifications
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Webhook Name</Label>
                        <Input
                          placeholder="e.g., Slack Notifications"
                          value={newWebhookName}
                          onChange={(e) => setNewWebhookName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Endpoint URL</Label>
                        <Input
                          placeholder="https://your-server.com/webhook"
                          value={newWebhookUrl}
                          onChange={(e) => setNewWebhookUrl(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Events</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {webhookEvents.map((event) => (
                            <div
                              key={event.id}
                              className={cn(
                                "p-2 rounded-lg border cursor-pointer transition-colors",
                                selectedEvents.includes(event.id) 
                                  ? "border-primary bg-primary/5" 
                                  : "hover:bg-muted/50"
                              )}
                              onClick={() => {
                                setSelectedEvents(prev => 
                                  prev.includes(event.id) 
                                    ? prev.filter(e => e !== event.id)
                                    : [...prev, event.id]
                                );
                              }}
                            >
                              <p className="text-xs font-medium">{event.label}</p>
                              <p className="text-[10px] text-muted-foreground">{event.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button onClick={handleCreateWebhook} className="w-full" style={{ backgroundColor: themeColor }}>
                        Create Webhook
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {webhooks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Webhook className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No webhooks configured</p>
                </div>
              ) : (
                <ScrollArea className="h-[250px]">
                  <div className="space-y-2">
                    {webhooks.map((webhook) => (
                      <div key={webhook.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          webhook.isActive ? "bg-green-500" : "bg-gray-400"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{webhook.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{webhook.url}</p>
                          <div className="flex gap-1 mt-1">
                            {webhook.events.map((event) => (
                              <Badge key={event} variant="outline" className="text-[10px] h-4">
                                {event}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive"
                            onClick={() => onDeleteWebhook?.(webhook.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Embed Tab */}
        <TabsContent value="embed" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="h-5 w-5" style={{ color: themeColor }} />
                    Embed Widget
                  </CardTitle>
                  <CardDescription>
                    Add a chat widget to your website
                  </CardDescription>
                </div>
                <Switch 
                  checked={embedEnabled} 
                  onCheckedChange={onToggleEmbed}
                />
              </div>
            </CardHeader>
            {embedEnabled && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Embed Code</Label>
                  <div className="relative">
                    <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                      {embedCode}
                    </pre>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="absolute top-2 right-2"
                      onClick={() => handleCopy(embedCode, 'embed')}
                    >
                      {copied === 'embed' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Widget Preview */}
                <Card className="overflow-hidden">
                  <CardHeader className="py-2 px-3 bg-muted/50">
                    <CardTitle className="text-xs">Widget Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="w-64 h-80 border rounded-lg shadow-lg mx-auto overflow-hidden">
                      <div className="h-12 flex items-center px-3 border-b" style={{ backgroundColor: themeColor }}>
                        <MessageSquare className="h-5 w-5 text-white mr-2" />
                        <span className="text-white text-sm font-medium">{gptName}</span>
                      </div>
                      <div className="flex-1 p-3 bg-background">
                        <div className="bg-muted rounded-lg p-2 text-xs max-w-[80%]">
                          Hi! How can I help you today?
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Widget Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Position</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="text-xs">Bottom Right</Button>
                      <Button variant="ghost" size="sm" className="text-xs">Bottom Left</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Theme</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="text-xs">Auto</Button>
                      <Button variant="ghost" size="sm" className="text-xs">Custom</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
