import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Zap, 
  Plus, 
  Webhook, 
  Code, 
  Trash2,
  ExternalLink,
  Settings,
  Loader2,
  Shield,
  Mail,
  Ticket,
  Bell,
  Database,
  FileText,
  Calendar,
  MessageSquare,
  Search,
  Lock,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface GPTActionsPanelProps {
  gptId: string;
  gptName: string;
  themeColor: string;
}

interface Action {
  id: string;
  name: string;
  description: string;
  type: 'webhook' | 'api' | 'function' | 'security';
  endpoint?: string;
  isEnabled: boolean;
  lastRun?: string;
  successRate?: number;
  config?: any;
}

interface ActionTemplate {
  id: string;
  name: string;
  description: string;
  type: Action['type'];
  endpoint: string;
  icon: React.ReactNode;
  category: string;
}

const ACTION_TEMPLATES: ActionTemplate[] = [
  {
    id: 'create-ticket',
    name: 'Create Ticket',
    description: 'Creates a support ticket in your helpdesk system',
    type: 'webhook',
    endpoint: 'https://api.helpdesk.com/tickets',
    icon: <Ticket className="h-5 w-5" />,
    category: 'Support'
  },
  {
    id: 'send-email',
    name: 'Send Email',
    description: 'Sends an email notification to specified recipients',
    type: 'api',
    endpoint: 'https://api.sendgrid.com/v3/mail/send',
    icon: <Mail className="h-5 w-5" />,
    category: 'Communication'
  },
  {
    id: 'slack-notification',
    name: 'Slack Notification',
    description: 'Posts a message to a Slack channel',
    type: 'webhook',
    endpoint: 'https://hooks.slack.com/services/...',
    icon: <MessageSquare className="h-5 w-5" />,
    category: 'Communication'
  },
  {
    id: 'create-calendar-event',
    name: 'Create Calendar Event',
    description: 'Schedules a new event on Google Calendar',
    type: 'api',
    endpoint: 'https://www.googleapis.com/calendar/v3/calendars',
    icon: <Calendar className="h-5 w-5" />,
    category: 'Productivity'
  },
  {
    id: 'database-query',
    name: 'Database Query',
    description: 'Executes a safe read query against your database',
    type: 'function',
    endpoint: '',
    icon: <Database className="h-5 w-5" />,
    category: 'Data'
  },
  {
    id: 'generate-report',
    name: 'Generate Report',
    description: 'Creates a PDF report from provided data',
    type: 'function',
    endpoint: '',
    icon: <FileText className="h-5 w-5" />,
    category: 'Productivity'
  },
  {
    id: 'web-search',
    name: 'Web Search',
    description: 'Searches the web for real-time information',
    type: 'api',
    endpoint: 'https://api.bing.microsoft.com/v7.0/search',
    icon: <Search className="h-5 w-5" />,
    category: 'Data'
  },
  {
    id: 'security-scan',
    name: 'Security Scan',
    description: 'Performs a security check on URLs or emails',
    type: 'security',
    endpoint: '',
    icon: <Shield className="h-5 w-5" />,
    category: 'Security'
  },
  {
    id: 'push-notification',
    name: 'Push Notification',
    description: 'Sends a push notification to mobile devices',
    type: 'webhook',
    endpoint: 'https://fcm.googleapis.com/fcm/send',
    icon: <Bell className="h-5 w-5" />,
    category: 'Communication'
  },
  {
    id: 'authenticate-user',
    name: 'Authenticate User',
    description: 'Verifies user identity and returns auth token',
    type: 'api',
    endpoint: '',
    icon: <Lock className="h-5 w-5" />,
    category: 'Security'
  }
];

export function GPTActionsPanel({ gptId, gptName, themeColor }: GPTActionsPanelProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [actions, setActions] = useState<Action[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'webhook' as Action['type'],
    endpoint: '',
    isEnabled: true
  });

  // Fetch real actions from the database
  const fetchActions = useCallback(async () => {
    if (!gptId) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('gpt_actions')
        .select('*')
        .eq('gpt_id', gptId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedActions: Action[] = (data || []).map((action: any) => ({
        id: action.id,
        name: action.name,
        description: action.description || '',
        type: action.action_type as Action['type'],
        endpoint: action.config?.api?.endpoint || action.config?.webhook?.url || '',
        isEnabled: action.is_enabled,
        config: action.config
      }));

      setActions(mappedActions);
    } catch (error) {
      console.error('Error fetching actions:', error);
      toast({
        title: "Error",
        description: "Failed to load actions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [gptId, toast]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  const handleSaveAction = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Action name is required",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      const config = {
        [formData.type]: {
          endpoint: formData.endpoint,
          url: formData.endpoint,
          method: 'POST',
          headers: {}
        }
      };

      if (editingAction) {
        const { error } = await supabase
          .from('gpt_actions')
          .update({
            name: formData.name,
            description: formData.description,
            action_type: formData.type,
            config,
            is_enabled: formData.isEnabled
          })
          .eq('id', editingAction.id);

        if (error) throw error;

        toast({
          title: "Action updated",
          description: `${formData.name} has been updated`
        });
      } else {
        const { error } = await supabase
          .from('gpt_actions')
          .insert({
            gpt_id: gptId,
            user_id: user.id,
            name: formData.name,
            description: formData.description,
            action_type: formData.type,
            config,
            is_enabled: formData.isEnabled
          });

        if (error) throw error;

        toast({
          title: "Action created",
          description: `${formData.name} has been added`
        });
      }

      setIsDialogOpen(false);
      setEditingAction(null);
      setFormData({
        name: '',
        description: '',
        type: 'webhook',
        endpoint: '',
        isEnabled: true
      });
      fetchActions();
    } catch (error) {
      console.error('Error saving action:', error);
      toast({
        title: "Error",
        description: "Failed to save action",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (action: Action) => {
    setEditingAction(action);
    setFormData({
      name: action.name,
      description: action.description,
      type: action.type,
      endpoint: action.endpoint || '',
      isEnabled: action.isEnabled
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('gpt_actions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setActions(prev => prev.filter(a => a.id !== id));
      toast({
        title: "Action deleted",
        description: "The action has been removed"
      });
    } catch (error) {
      console.error('Error deleting action:', error);
      toast({
        title: "Error",
        description: "Failed to delete action",
        variant: "destructive"
      });
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('gpt_actions')
        .update({ is_enabled: enabled })
        .eq('id', id);

      if (error) throw error;

      setActions(prev => prev.map(a => 
        a.id === id ? { ...a, isEnabled: enabled } : a
      ));
      toast({
        title: enabled ? "Action enabled" : "Action disabled",
        description: `The action has been ${enabled ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      console.error('Error toggling action:', error);
      toast({
        title: "Error",
        description: "Failed to update action",
        variant: "destructive"
      });
    }
  };

  const getTypeIcon = (type: Action['type']) => {
    switch (type) {
      case 'webhook':
        return <Webhook className="h-5 w-5 text-blue-500" />;
      case 'api':
        return <ExternalLink className="h-5 w-5 text-green-500" />;
      case 'function':
        return <Code className="h-5 w-5 text-purple-500" />;
      case 'security':
        return <Shield className="h-5 w-5 text-orange-500" />;
      default:
        return <Zap className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const handleUseTemplate = (template: ActionTemplate) => {
    setEditingAction(null);
    setFormData({
      name: template.name,
      description: template.description,
      type: template.type,
      endpoint: template.endpoint,
      isEnabled: true
    });
    setIsDialogOpen(true);
  };

  const categories = [...new Set(ACTION_TEMPLATES.map(t => t.category))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                GPT Actions
              </CardTitle>
              <CardDescription>
                Configure actions your GPT can perform
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingAction(null);
                  setFormData({
                    name: '',
                    description: '',
                    type: 'webhook',
                    endpoint: '',
                    isEnabled: true
                  });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Action
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingAction ? 'Edit Action' : 'Create New Action'}</DialogTitle>
                  <DialogDescription>
                    Define an action your GPT can execute
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Action Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Create Ticket"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="What does this action do?"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['webhook', 'api', 'function', 'security'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setFormData(prev => ({ ...prev, type: type as Action['type'] }))}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            formData.type === type
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <span className="text-sm capitalize">{type}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endpoint">Endpoint URL</Label>
                    <Input
                      id="endpoint"
                      value={formData.endpoint}
                      onChange={(e) => setFormData(prev => ({ ...prev, endpoint: e.target.value }))}
                      placeholder="https://api.example.com/action"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enabled">Enable Action</Label>
                    <Switch
                      id="enabled"
                      checked={formData.isEnabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isEnabled: checked }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveAction} disabled={isSaving}>
                    {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingAction ? 'Save Changes' : 'Create Action'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Action Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5" />
            Action Templates
          </CardTitle>
          <CardDescription>
            Quick-start with pre-configured action templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category}>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">{category}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ACTION_TEMPLATES.filter(t => t.category === category).map((template) => (
                    <motion.button
                      key={template.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleUseTemplate(template)}
                      className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-muted/50 transition-all text-left group"
                    >
                      <div 
                        className="p-2 rounded-lg shrink-0"
                        style={{ backgroundColor: `${themeColor}15` }}
                      >
                        <span style={{ color: themeColor }}>{template.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm group-hover:text-primary transition-colors">
                          {template.name}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {template.description}
                        </p>
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {template.type}
                        </Badge>
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configured Actions</CardTitle>
          <CardDescription>
            {actions.length} action{actions.length !== 1 ? 's' : ''} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : actions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No actions configured yet</p>
              <p className="text-sm">Add actions to extend your GPT's capabilities</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {actions.map((action) => (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getTypeIcon(action.type)}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{action.name}</p>
                          {action.isEnabled ? (
                            <Badge variant="outline" className="text-green-500 text-xs">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground text-xs">Disabled</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                        {action.successRate !== undefined && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Success rate: {action.successRate}%
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={action.isEnabled}
                        onCheckedChange={(checked) => handleToggle(action.id, checked)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(action)}>
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(action.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
