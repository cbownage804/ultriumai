import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { 
  Plus, 
  Search, 
  Twitter, 
  Image, 
  Webhook, 
  Zap, 
  Settings, 
  Trash2,
  ExternalLink,
  Globe,
  MessageSquare,
  Brain,
  Crown,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface Integration {
  id: string;
  integration_type: string;
  integration_name: string;
  config: any;
  is_active: boolean;
  created_at: string;
}

interface IntegrationsManagerProps {
  gptId: string;
  gptName: string;
}

const INTEGRATION_TYPES = [
  {
    id: 'perplexity',
    name: 'Perplexity AI',
    description: 'Real-time web search and research capabilities',
    icon: Search,
    color: 'text-blue-500',
    tier: 'premium',
    category: 'ai'
  },
  {
    id: 'openai_images',
    name: 'OpenAI Images',
    description: 'Generate images using DALL-E and GPT-Image',
    icon: Image,
    color: 'text-purple-500',
    tier: 'premium',
    category: 'ai'
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    description: 'Post tweets and interact with social media',
    icon: Twitter,
    color: 'text-black',
    tier: 'premium',
    category: 'social'
  },
  {
    id: 'zapier',
    name: 'Zapier Webhooks',
    description: 'Connect to 6000+ apps via Zapier automation',
    icon: Zap,
    color: 'text-orange-500',
    tier: 'premium',
    category: 'automation'
  },
  {
    id: 'pipedream',
    name: 'Pipedream',
    description: 'Connect APIs and automate workflows with code',
    icon: Settings,
    color: 'text-blue-600',
    tier: 'premium',
    category: 'automation'
  },
  {
    id: 'webhook',
    name: 'Custom Webhooks',
    description: 'Send data to any HTTP endpoint',
    icon: Webhook,
    color: 'text-green-500',
    tier: 'premium',
    category: 'automation'
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send messages and interact with Slack channels',
    icon: MessageSquare,
    color: 'text-purple-600',
    tier: 'premium',
    category: 'communication'
  },
  {
    id: 'autotask',
    name: 'Autotask PSA',
    description: 'Create tickets and manage clients in Autotask',
    icon: Settings,
    color: 'text-blue-600',
    tier: 'premium',
    category: 'msp'
  },
  {
    id: 'atera',
    name: 'Atera',
    description: 'Manage incidents and alerts in Atera platform',
    icon: Settings,
    color: 'text-green-600',
    tier: 'premium',
    category: 'msp'
  },
  {
    id: 'ninjaone',
    name: 'NinjaOne',
    description: 'Create tickets and monitor endpoints in NinjaOne',
    icon: Settings,
    color: 'text-orange-600',
    tier: 'premium',
    category: 'msp'
  },
  {
    id: 'connectwise',
    name: 'ConnectWise Manage',
    description: 'Service ticket creation and client management',
    icon: Settings,
    color: 'text-red-600',
    tier: 'premium',
    category: 'msp'
  },
  {
    id: 'kaseya',
    name: 'Kaseya VSA',
    description: 'Generate tickets and endpoint alerts in Kaseya',
    icon: Settings,
    color: 'text-purple-500',
    tier: 'premium',
    category: 'msp'
  },
  {
    id: 'syncro',
    name: 'Syncro MSP',
    description: 'Automated ticket creation and client management',
    icon: Settings,
    color: 'text-teal-600',
    tier: 'premium',
    category: 'msp'
  }
];

const IntegrationsManager = ({ gptId, gptName }: IntegrationsManagerProps) => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("");
  const [newIntegration, setNewIntegration] = useState({
    name: "",
    config: {},
    credentials: ""
  });
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { subscription } = useSubscription();

  const canUseIntegrations = subscription.subscription_tier !== "free";

  useEffect(() => {
    loadIntegrations();
  }, [gptId]);

  const loadIntegrations = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('gpt_integrations')
        .select('*')
        .eq('gpt_id', gptId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error) {
      console.error('Error loading integrations:', error);
      toast({
        title: "Error",
        description: "Failed to load integrations.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addIntegration = async () => {
    if (!selectedType || !newIntegration.name) return;

    if (!canUseIntegrations) {
      toast({
        title: "Premium Feature",
        description: "Integrations are available for Premium and Enterprise plans.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('gpt_integrations')
        .insert({
          gpt_id: gptId,
          user_id: user?.id,
          integration_type: selectedType,
          integration_name: newIntegration.name,
          config: newIntegration.config,
          credentials_encrypted: newIntegration.credentials
        })
        .select()
        .single();

      if (error) throw error;

      setIntegrations(prev => [data, ...prev]);
      setIsAddDialogOpen(false);
      setSelectedType("");
      setNewIntegration({ name: "", config: {}, credentials: "" });

      toast({
        title: "Integration added",
        description: `${newIntegration.name} has been connected successfully.`,
      });
    } catch (error) {
      console.error('Error adding integration:', error);
      toast({
        title: "Error",
        description: "Failed to add integration. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleIntegration = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('gpt_integrations')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      setIntegrations(prev => 
        prev.map(int => int.id === id ? { ...int, is_active: isActive } : int)
      );

      toast({
        title: isActive ? "Integration enabled" : "Integration disabled",
        description: `Integration has been ${isActive ? 'activated' : 'deactivated'}.`,
      });
    } catch (error) {
      console.error('Error toggling integration:', error);
    }
  };

  const deleteIntegration = async (id: string) => {
    try {
      const { error } = await supabase
        .from('gpt_integrations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setIntegrations(prev => prev.filter(int => int.id !== id));

      toast({
        title: "Integration removed",
        description: "Integration has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting integration:', error);
      toast({
        title: "Error",
        description: "Failed to delete integration.",
        variant: "destructive",
      });
    }
  };

  const getIntegrationTypeInfo = (type: string) => {
    return INTEGRATION_TYPES.find(t => t.id === type);
  };

  const renderConfigForm = () => {
    const typeInfo = INTEGRATION_TYPES.find(t => t.id === selectedType);
    if (!typeInfo) return null;

    switch (selectedType) {
      case 'perplexity':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Perplexity API Key</Label>
              <Input
                type="password"
                placeholder="pplx-..."
                value={newIntegration.credentials}
                onChange={(e) => setNewIntegration(prev => ({ ...prev, credentials: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Get your API key from <a href="https://www.perplexity.ai/settings/api" target="_blank" className="text-primary hover:underline">Perplexity AI Settings</a>
              </p>
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Select
                value={(newIntegration.config as any).model || 'llama-3.1-sonar-small-128k-online'}
                onValueChange={(value) => setNewIntegration(prev => ({ 
                  ...prev, 
                  config: { ...prev.config, model: value }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="llama-3.1-sonar-small-128k-online">Sonar Small (8B) - Fast</SelectItem>
                  <SelectItem value="llama-3.1-sonar-large-128k-online">Sonar Large (70B) - Balanced</SelectItem>
                  <SelectItem value="llama-3.1-sonar-huge-128k-online">Sonar Huge (405B) - Best</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'twitter':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Consumer Key</Label>
                <Input
                  type="password"
                  placeholder="API Key"
                  value={(newIntegration.config as any).consumer_key || ""}
                  onChange={(e) => setNewIntegration(prev => ({ 
                    ...prev, 
                    config: { ...prev.config, consumer_key: e.target.value }
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Consumer Secret</Label>
                <Input
                  type="password"
                  placeholder="API Secret"
                  value={(newIntegration.config as any).consumer_secret || ""}
                  onChange={(e) => setNewIntegration(prev => ({ 
                    ...prev, 
                    config: { ...prev.config, consumer_secret: e.target.value }
                  }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Access Token</Label>
                <Input
                  type="password"
                  placeholder="Access Token"
                  value={(newIntegration.config as any).access_token || ""}
                  onChange={(e) => setNewIntegration(prev => ({ 
                    ...prev, 
                    config: { ...prev.config, access_token: e.target.value }
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Access Token Secret</Label>
                <Input
                  type="password"
                  placeholder="Access Token Secret"
                  value={(newIntegration.config as any).access_token_secret || ""}
                  onChange={(e) => setNewIntegration(prev => ({ 
                    ...prev, 
                    config: { ...prev.config, access_token_secret: e.target.value }
                  }))}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Get your credentials from <a href="https://developer.twitter.com/en/portal/dashboard" target="_blank" className="text-primary hover:underline">Twitter Developer Portal</a>
            </p>
          </div>
        );

      case 'zapier':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Zapier Webhook URL</Label>
              <Input
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                value={(newIntegration.config as any).webhook_url || ""}
                onChange={(e) => setNewIntegration(prev => ({ 
                  ...prev, 
                  config: { ...prev.config, webhook_url: e.target.value }
                }))}
              />
              <p className="text-xs text-muted-foreground">
                Create a webhook trigger in Zapier and paste the URL here
              </p>
            </div>
          </div>
        );

      case 'pipedream':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pipedream Webhook URL</Label>
              <Input
                placeholder="https://eoxxxxxxxxxxx.m.pipedream.net"
                value={(newIntegration.config as any).webhook_url || ""}
                onChange={(e) => setNewIntegration(prev => ({ 
                  ...prev, 
                  config: { ...prev.config, webhook_url: e.target.value }
                }))}
              />
              <p className="text-xs text-muted-foreground">
                Create a HTTP/Webhook trigger in Pipedream and paste the URL here
              </p>
            </div>
            <div className="space-y-2">
              <Label>Authentication Token (Optional)</Label>
              <Input
                type="password"
                placeholder="Bearer token for authentication"
                value={(newIntegration.config as any).auth_token || ""}
                onChange={(e) => setNewIntegration(prev => ({ 
                  ...prev, 
                  config: { ...prev.config, auth_token: e.target.value }
                }))}
              />
              <p className="text-xs text-muted-foreground">
                Optional: Add authentication token if your Pipedream workflow requires it
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">💡 Pipedream Setup Tips:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Create a new workflow in Pipedream</li>
                <li>• Add an HTTP/Webhook trigger as the first step</li>
                <li>• Connect any apps or APIs in subsequent steps</li>
                <li>• Copy the trigger URL and paste it above</li>
              </ul>
            </div>
          </div>
        );

      case 'webhook':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input
                placeholder="https://your-api.com/webhook"
                value={(newIntegration.config as any).url || ""}
                onChange={(e) => setNewIntegration(prev => ({ 
                  ...prev, 
                  config: { ...prev.config, url: e.target.value }
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label>HTTP Method</Label>
              <Select
                value={(newIntegration.config as any).method || 'POST'}
                onValueChange={(value) => setNewIntegration(prev => ({ 
                  ...prev, 
                  config: { ...prev.config, method: value }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Headers (JSON)</Label>
              <Textarea
                placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                value={(newIntegration.config as any).headers || ""}
                onChange={(e) => setNewIntegration(prev => ({ 
                  ...prev, 
                  config: { ...prev.config, headers: e.target.value }
                }))}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            Configuration form will appear here based on integration type
          </div>
        );
    }
  };

  const categories = [
    { id: 'all', name: 'All Integrations' },
    { id: 'ai', name: 'AI & Search' },
    { id: 'social', name: 'Social Media' },
    { id: 'automation', name: 'Automation' },
    { id: 'communication', name: 'Communication' },
    { id: 'msp', name: 'MSP Platforms' }
  ];

  const filteredTypes = selectedCategory === 'all' 
    ? INTEGRATION_TYPES 
    : INTEGRATION_TYPES.filter(type => type.category === selectedCategory);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Integrations for {gptName}</h3>
          <p className="text-muted-foreground">
            Connect your GPT to external services and APIs
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canUseIntegrations}>
              <Plus className="w-4 h-4 mr-2" />
              Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Integration</DialogTitle>
              <DialogDescription>
                Connect your GPT to external services to extend its capabilities.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs value={selectedType ? "config" : "select"} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="select">Select Service</TabsTrigger>
                <TabsTrigger value="config" disabled={!selectedType}>Configure</TabsTrigger>
              </TabsList>
              
              <TabsContent value="select" className="space-y-4">
                <div className="space-y-4">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredTypes.map((type) => (
                      <Card 
                        key={type.id} 
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                          selectedType === type.id ? 'border-primary bg-muted/30' : ''
                        }`}
                        onClick={() => setSelectedType(type.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <type.icon className={`w-6 h-6 mt-0.5 ${type.color}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{type.name}</h4>
                                {type.tier === 'premium' && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Crown className="w-3 h-3 mr-1" />
                                    Premium
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{type.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="config" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Integration Name</Label>
                    <Input
                      placeholder="Give this integration a name"
                      value={newIntegration.name}
                      onChange={(e) => setNewIntegration(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  {renderConfigForm()}
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={addIntegration}
                    disabled={!selectedType || !newIntegration.name}
                  >
                    Add Integration
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {!canUseIntegrations && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-yellow-600" />
              <div>
                <h4 className="font-medium text-yellow-800">Premium Feature</h4>
                <p className="text-sm text-yellow-700">
                  Integrations are available for Premium and Enterprise subscribers. Upgrade to connect your GPTs to external services.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Integrations */}
      <div className="space-y-4">
        <h4 className="font-medium">Active Integrations ({integrations.length})</h4>
        
        {integrations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Integrations Yet</h3>
              <p className="text-muted-foreground mb-4">
                Connect your GPT to external services to unlock powerful capabilities.
              </p>
              {canUseIntegrations && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Integration
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map((integration) => {
              const typeInfo = getIntegrationTypeInfo(integration.integration_type);
              return (
                <Card key={integration.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {typeInfo?.icon && (
                          <typeInfo.icon className={`w-5 h-5 mt-0.5 ${typeInfo.color}`} />
                        )}
                        <div>
                          <h4 className="font-medium">{integration.integration_name}</h4>
                          <p className="text-sm text-muted-foreground">{typeInfo?.name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={integration.is_active}
                          onCheckedChange={(checked) => toggleIntegration(integration.id, checked)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteIntegration(integration.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center gap-2">
                      {integration.is_active ? (
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                      
                      <span className="text-xs text-muted-foreground">
                        Added {new Date(integration.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrationsManager;