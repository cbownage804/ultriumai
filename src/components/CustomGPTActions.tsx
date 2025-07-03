import { useState } from "react";
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
import { FileText, Code, Globe, Database, Plus, Settings, Trash2, Play, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Action {
  id: string;
  name: string;
  description: string;
  type: 'document' | 'api' | 'webhook' | 'database';
  config: any;
  enabled: boolean;
  beta?: boolean;
}

const CustomGPTActions = () => {
  const [actions, setActions] = useState<Action[]>([
    {
      id: '1',
      name: 'Document Analyst',
      description: 'Allow your users to attach documents to conversation and ask agent to analyze them.',
      type: 'document',
      config: {
        supportedFormats: ['pdf', 'docx', 'txt', 'md'],
        maxFileSize: 10,
        analysisType: 'comprehensive'
      },
      enabled: true,
      beta: true
    }
  ]);

  const [newAction, setNewAction] = useState({
    name: '',
    description: '',
    type: 'document' as Action['type'],
    config: {}
  });

  const { toast } = useToast();

  const actionTypes = [
    { value: 'document', label: 'Document Analysis', icon: FileText, color: 'text-blue-600' },
    { value: 'api', label: 'API Integration', icon: Globe, color: 'text-green-600' },
    { value: 'webhook', label: 'Webhook Action', icon: Code, color: 'text-purple-600' },
    { value: 'database', label: 'Database Query', icon: Database, color: 'text-orange-600' }
  ];

  const toggleAction = (id: string) => {
    setActions(prev => prev.map(action => 
      action.id === id ? { ...action, enabled: !action.enabled } : action
    ));
  };

  const deleteAction = (id: string) => {
    setActions(prev => prev.filter(action => action.id !== id));
    toast({
      title: "Action deleted",
      description: "The action has been removed from your GPT",
    });
  };

  const createAction = () => {
    if (!newAction.name.trim()) return;

    const action: Action = {
      id: Date.now().toString(),
      name: newAction.name,
      description: newAction.description,
      type: newAction.type,
      config: newAction.config,
      enabled: true
    };

    setActions(prev => [...prev, action]);
    setNewAction({ name: '', description: '', type: 'document', config: {} });
    
    toast({
      title: "Action created",
      description: `${newAction.name} has been added to your GPT`,
    });
  };

  const testAction = (action: Action) => {
    toast({
      title: "Testing action",
      description: `Running test for ${action.name}...`,
    });
  };

  const getActionIcon = (type: Action['type']) => {
    const actionType = actionTypes.find(t => t.value === type);
    if (!actionType) return FileText;
    return actionType.icon;
  };

  const getActionColor = (type: Action['type']) => {
    const actionType = actionTypes.find(t => t.value === type);
    return actionType?.color || 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
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
        
        <Dialog>
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
                    value={newAction.type} 
                    onValueChange={(value: Action['type']) => setNewAction(prev => ({ ...prev, type: value }))}
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
                {newAction.type === 'document' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Supported File Formats</Label>
                      <div className="flex gap-2 flex-wrap">
                        {['PDF', 'DOCX', 'TXT', 'MD', 'CSV'].map(format => (
                          <Badge key={format} variant="outline" className="cursor-pointer">
                            {format}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Max File Size (MB)</Label>
                      <Input type="number" placeholder="10" defaultValue="10" />
                    </div>
                  </div>
                )}
                
                {newAction.type === 'api' && (
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
                
                {newAction.type === 'webhook' && (
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
                
                {newAction.type === 'database' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Database Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select database..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="postgresql">PostgreSQL</SelectItem>
                          <SelectItem value="mysql">MySQL</SelectItem>
                          <SelectItem value="mongodb">MongoDB</SelectItem>
                          <SelectItem value="supabase">Supabase</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Connection String</Label>
                      <Input type="password" placeholder="postgresql://user:pass@host:port/db" />
                    </div>
                    <div className="space-y-2">
                      <Label>Default Query</Label>
                      <Textarea placeholder="SELECT * FROM users WHERE..." rows={3} />
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button onClick={createAction}>Create Action</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Actions List */}
      <div className="grid gap-4">
        {actions.map((action) => {
          const Icon = getActionIcon(action.type);
          return (
            <Card key={action.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg bg-muted`}>
                      <Icon className={`h-5 w-5 ${getActionColor(action.type)}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{action.name}</h3>
                        {action.beta && (
                          <Badge variant="secondary" className="text-xs">Beta</Badge>
                        )}
                        <Badge variant="outline" className="text-xs capitalize">
                          {action.type}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {action.description}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={action.enabled}
                          onCheckedChange={() => toggleAction(action.id)}
                        />
                        <span className="text-xs text-muted-foreground">
                          {action.enabled ? 'Enabled' : 'Disabled'}
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
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Create Your First Action</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    {/* Same dialog content as above */}
                  </DialogContent>
                </Dialog>
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
              {
                name: 'Email Sender',
                description: 'Send emails through SMTP or email service APIs',
                type: 'api',
                icon: Globe
              },
              {
                name: 'Calendar Integration',
                description: 'Create and manage calendar events',
                type: 'api',
                icon: Globe
              },
              {
                name: 'Slack Notifier',
                description: 'Send messages to Slack channels',
                type: 'webhook',
                icon: Code
              },
              {
                name: 'CRM Lookup',
                description: 'Query customer data from CRM systems',
                type: 'database',
                icon: Database
              },
              {
                name: 'PDF Generator',
                description: 'Generate PDF reports and documents',
                type: 'api',
                icon: FileText
              },
              {
                name: 'Data Validator',
                description: 'Validate and clean data inputs',
                type: 'api',
                icon: Settings
              }
            ].map((template, index) => {
              const Icon = template.icon;
              return (
                <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded bg-muted">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{template.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {template.description}
                        </p>
                        <Badge variant="outline" className="text-xs mt-2 capitalize">
                          {template.type}
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
    </div>
  );
};

export default CustomGPTActions;