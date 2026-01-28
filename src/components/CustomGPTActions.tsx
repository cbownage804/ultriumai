import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Code, Globe, Plus, Settings, Trash2, Play, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCustomGPTs } from "@/hooks/useCustomGPTs";
import { supabase } from "@/integrations/supabase/client";


interface Action {
  id: string;
  gpt_id?: string;
  name: string;
  description: string;
  action_type: 'api' | 'webhook' | 'security';
  config: any;
  is_enabled: boolean;
  is_beta?: boolean;
  created_at?: string;
  updated_at?: string;
}

const CustomGPTActions = () => {
  const { user } = useAuth();
  const { gpts } = useCustomGPTs();
  const { toast } = useToast();
  
  const [actions, setActions] = useState<Action[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newAction, setNewAction] = useState({
    name: '',
    description: '',
    action_type: 'api' as Action['action_type'],
    config: {}
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGPT, setSelectedGPT] = useState<string>('');

  // Load actions from database
  useEffect(() => {
    loadActions();
  }, [user, selectedGPT]);

  // Auto-select first GPT if available
  useEffect(() => {
    if (gpts.length > 0 && !selectedGPT) {
      setSelectedGPT(gpts[0].id);
    }
  }, [gpts, selectedGPT]);

  const loadActions = async () => {
    if (!user || !selectedGPT) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gpt_actions')
        .select('*')
        .eq('user_id', user.id)
        .eq('gpt_id', selectedGPT)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActions((data || []) as Action[]);
    } catch (error) {
      console.error('Error loading actions:', error);
      toast({
        title: "Error",
        description: "Failed to load actions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const actionTypes = [
    { value: 'api', label: 'API Integration', icon: Globe, color: 'text-green-600' },
    { value: 'webhook', label: 'Webhook Trigger', icon: Code, color: 'text-purple-600' },
    { value: 'security', label: 'SafeScan Integration', icon: Settings, color: 'text-red-600' }
  ];

  const toggleAction = async (id: string) => {
    const action = actions.find(a => a.id === id);
    if (!action) return;

    try {
      const { error } = await supabase
        .from('gpt_actions')
        .update({ is_enabled: !action.is_enabled })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setActions(prev => prev.map(a => 
        a.id === id ? { ...a, is_enabled: !a.is_enabled } : a
      ));

      toast({
        title: action.is_enabled ? "Action disabled" : "Action enabled",
        description: `${action.name} has been ${action.is_enabled ? 'disabled' : 'enabled'}.`,
      });
    } catch (error) {
      console.error('Error toggling action:', error);
      toast({
        title: "Error",
        description: "Failed to update action. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteAction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('gpt_actions')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setActions(prev => prev.filter(action => action.id !== id));
      toast({
        title: "Action deleted",
        description: "The action has been removed from your GPT",
      });
    } catch (error) {
      console.error('Error deleting action:', error);
      toast({
        title: "Error",
        description: "Failed to delete action. Please try again.",
        variant: "destructive",
      });
    }
  };

  const createAction = async () => {
    if (!newAction.name.trim() || !user || !selectedGPT) return;

    try {
      const { data, error } = await supabase
        .from('gpt_actions')
        .insert({
          gpt_id: selectedGPT,
          user_id: user.id,
          name: newAction.name,
          description: newAction.description,
          action_type: newAction.action_type,
          config: newAction.config,
        })
        .select()
        .single();

      if (error) throw error;

      setActions(prev => [data as Action, ...prev]);
      setNewAction({ name: '', description: '', action_type: 'api', config: {} });
      setIsDialogOpen(false);
      
      toast({
        title: "Action created",
        description: `${newAction.name} has been added to your GPT`,
      });
    } catch (error) {
      console.error('Error creating action:', error);
      toast({
        title: "Error",
        description: "Failed to create action. Please try again.",
        variant: "destructive",
      });
    }
  };

  const testAction = async (action: Action) => {
    try {
      const { data, error } = await supabase.functions.invoke('execute-action', {
        body: {
          actionId: action.id,
          testMode: true,
          inputData: { test: true }
        }
      });

      if (error) throw error;

      toast({
        title: "Action test completed",
        description: `Test run for ${action.name} completed successfully.`,
      });
    } catch (error) {
      console.error('Error testing action:', error);
      toast({
        title: "Test failed",
        description: `Failed to test ${action.name}. Please check the configuration.`,
        variant: "destructive",
      });
    }
  };

  const useTemplate = (template: any) => {
    setNewAction({
      name: template.name,
      description: template.description,
      action_type: template.action_type,
      config: template.action_type === 'security' ? { 
        scannerType: template.name.includes('SafeLink') ? 'link' : 
                    template.name.includes('Email') ? 'email' : 'attachment',
        threatLevel: 'standard',
        autoBlock: true 
      } : {}
    });
  };

  const getActionIcon = (action_type: Action['action_type']) => {
    const actionType = actionTypes.find(t => t.value === action_type);
    if (!actionType) return Settings;
    return actionType.icon;
  };

  const getActionColor = (action_type: Action['action_type']) => {
    const actionType = actionTypes.find(t => t.value === action_type);
    return actionType?.color || 'text-gray-600';
  };

  if (!selectedGPT && gpts.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Actions</h1>
          <p className="text-muted-foreground mt-2">
            Add powerful capabilities to your Custom GPT
          </p>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Custom GPT Found</h3>
              <p className="text-sm mb-4">
                You need to create a Custom GPT first before adding actions.
              </p>
              <Button onClick={() => window.location.href = '/dashboard/custom-gpts/personalize'}>
                Create Your GPT
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* GPT Selection */}
      {gpts.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Custom GPT</CardTitle>
            <CardDescription>
              Choose which GPT to manage actions for
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedGPT} onValueChange={setSelectedGPT}>
              <SelectTrigger>
                <SelectValue placeholder="Select a Custom GPT" />
              </SelectTrigger>
              <SelectContent>
                {gpts.map((gpt) => (
                  <SelectItem key={gpt.id} value={gpt.id}>
                    {gpt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Actions</h1>
          <p className="text-muted-foreground mt-2">
            Add powerful capabilities to your Custom GPT
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              ✨ More agentic actions coming soon...
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Action
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Action</DialogTitle>
              <DialogDescription>
                Add a new capability to your Custom GPT
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="config">Configuration</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="action-name">Action Name</Label>
                  <Input
                    id="action-name"
                    placeholder="e.g. Email Sender, Data Analyzer"
                    value={newAction.name}
                    onChange={(e) => setNewAction(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="action-description">Description</Label>
                  <Textarea
                    id="action-description"
                    placeholder="Describe what this action does..."
                    value={newAction.description}
                    onChange={(e) => setNewAction(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Action Type</Label>
                  <Select 
                    value={newAction.action_type} 
                    onValueChange={(value: Action['action_type']) => setNewAction(prev => ({ ...prev, action_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {actionTypes.map(type => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${type.color}`} />
                              {type.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              
              <TabsContent value="config" className="space-y-4">
                {newAction.action_type === 'api' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>API Endpoint</Label>
                      <Input placeholder="https://api.example.com/endpoint" />
                    </div>
                    <div className="space-y-2">
                      <Label>HTTP Method</Label>
                      <Select defaultValue="POST">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Headers (JSON)</Label>
                      <Textarea placeholder='{"Authorization": "Bearer token"}' rows={3} />
                    </div>
                  </div>
                )}
                
                {newAction.action_type === 'webhook' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Webhook URL</Label>
                      <Input placeholder="https://hooks.example.com/webhook" />
                    </div>
                    <div className="space-y-2">
                      <Label>Trigger Event</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select trigger..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="message">New Message</SelectItem>
                          <SelectItem value="conversation_start">Conversation Start</SelectItem>
                          <SelectItem value="conversation_end">Conversation End</SelectItem>
                          <SelectItem value="custom">Custom Trigger</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                
                {newAction.action_type === 'security' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>SafeSuite Integration</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select integration type..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="url">SafeScan - URL Security Check</SelectItem>
                          <SelectItem value="breach">SafeWeb - Breach Detection</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Scan Depth</Label>
                      <Select defaultValue="standard">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Quick Scan</SelectItem>
                          <SelectItem value="standard">Standard Scan</SelectItem>
                          <SelectItem value="advanced">Deep Scan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Auto-Alert on Threats</Label>
                      <div className="flex items-center space-x-2">
                        <Switch defaultChecked />
                        <span className="text-sm text-muted-foreground">Automatically alert on detected threats or breaches</span>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={createAction}>Create Action</Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading actions...</p>
        </div>
      ) : (
        <>
          {/* Actions List */}
          <div className="grid gap-4">
            {actions.map((action) => {
              const Icon = getActionIcon(action.action_type);
              return (
                <Card key={action.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg bg-muted`}>
                          <Icon className={`h-5 w-5 ${getActionColor(action.action_type)}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{action.name}</h3>
                            {action.is_beta && (
                              <Badge variant="secondary" className="text-xs">Beta</Badge>
                            )}
                            <Badge variant="outline" className="text-xs capitalize">
                              {action.action_type}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {action.description}
                          </p>
                          
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={action.is_enabled}
                              onCheckedChange={() => toggleAction(action.id)}
                            />
                            <span className="text-xs text-muted-foreground">
                              {action.is_enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 ml-4">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => testAction(action)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteAction(action.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {actions.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-muted-foreground">
                    <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No actions created yet</h3>
                    <p className="text-sm mb-4">
                      Actions allow your GPT to perform tasks like analyzing documents, 
                      calling APIs, or connecting to databases.
                    </p>
                    <Button onClick={() => setIsDialogOpen(true)}>
                      Create Your First Action
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Actions Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Action Templates</CardTitle>
              <CardDescription>
                Get started quickly with pre-built action templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[
                  // SafeSuite Integration Templates
                  {
                    name: 'SafeScan URL Checker',
                    description: 'Scan URLs for malware, phishing, and security threats',
                    action_type: 'security' as const,
                    icon: Settings,
                    isInternal: false
                  },
                  {
                    name: 'SafeWeb Breach Alert',
                    description: 'Check if credentials appear in dark web breaches',
                    action_type: 'security' as const,
                    icon: Settings,
                    isInternal: false
                  },
                  // General Integration Templates
                  {
                    name: 'Autotask Ticket Creator',
                    description: 'Automatically create tickets in Autotask PSA',
                    action_type: 'api' as const,
                    icon: Globe,
                    isInternal: false
                  },
                  {
                    name: 'Email Notification',
                    description: 'Send email alerts via SendGrid, Mailgun, or SMTP',
                    action_type: 'api' as const,
                    icon: Globe,
                    isInternal: false
                  },
                  {
                    name: 'Slack Webhook',
                    description: 'Send messages and alerts to Slack channels',
                    action_type: 'webhook' as const,
                    icon: Code,
                    isInternal: false
                  },
                  {
                    name: 'Microsoft Teams Webhook',
                    description: 'Post notifications to Microsoft Teams channels',
                    action_type: 'webhook' as const,
                    icon: Code,
                    isInternal: false
                  }
                ].map((template, index) => {
                  const Icon = template.icon;
                  return (
                    <Card 
                      key={index} 
                      className={`cursor-pointer hover:shadow-md transition-shadow ${template.isInternal ? 'border-primary/30' : ''}`}
                      onClick={() => {
                        useTemplate(template);
                        setIsDialogOpen(true);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded ${template.isInternal ? 'bg-primary/10' : 'bg-muted'}`}>
                            <Icon className={`h-4 w-4 ${template.isInternal ? 'text-primary' : ''}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm">{template.name}</h4>
                              {template.isInternal && (
                                <Badge variant="outline" className="text-xs text-primary border-primary/30">Internal</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {template.description}
                            </p>
                            <Badge variant="outline" className="text-xs mt-2 capitalize">
                              {template.action_type}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default CustomGPTActions;