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
  config?: any;
}

const ACTION_TEMPLATES: ActionTemplate[] = [
  // SafeSuite Security Actions
  {
    id: 'safescan-url-checker',
    name: 'SafeScan URL Checker',
    description: 'Scan URLs for malware, phishing, and security threats',
    type: 'security',
    endpoint: '',
    icon: <Shield className="h-5 w-5" />,
    category: 'SafeSuite Security',
    config: {
      security: {
        scannerType: 'url',
        threatLevel: 'standard',
        autoBlock: true,
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'URL to scan for threats' }
          },
          required: ['url']
        }
      }
    }
  },
  {
    id: 'safeweb-breach-alert',
    name: 'SafeWeb Breach Alert',
    description: 'Check if emails have been compromised in data breaches',
    type: 'security',
    endpoint: '',
    icon: <Shield className="h-5 w-5" />,
    category: 'SafeSuite Security',
    config: {
      security: {
        scannerType: 'breach',
        threatLevel: 'standard',
        autoBlock: false,
        inputSchema: {
          type: 'object',
          properties: {
            email: { type: 'string', description: 'Email address to check for breaches' }
          },
          required: ['email']
        }
      }
    }
  },
  {
    id: 'advanced-threat-scanner',
    name: 'Advanced Threat Scanner',
    description: 'Deep scan with AI-powered threat detection',
    type: 'security',
    endpoint: '',
    icon: <Shield className="h-5 w-5" />,
    category: 'SafeSuite Security',
    config: {
      security: {
        scannerType: 'advanced',
        threatLevel: 'advanced',
        autoBlock: true,
        inputSchema: {
          type: 'object',
          properties: {
            target: { type: 'string', description: 'URL, IP, or domain to scan' },
            scanDepth: { type: 'string', enum: ['shallow', 'deep'], default: 'deep' }
          },
          required: ['target']
        }
      }
    }
  },
  {
    id: 'password-strength-check',
    name: 'Password Strength Analyzer',
    description: 'Evaluate password security and provide improvement suggestions',
    type: 'security',
    endpoint: '',
    icon: <Lock className="h-5 w-5" />,
    category: 'SafeSuite Security',
    config: {
      security: {
        scannerType: 'password',
        threatLevel: 'standard',
        inputSchema: {
          type: 'object',
          properties: {
            password: { type: 'string', description: 'Password to analyze (not stored)' }
          },
          required: ['password']
        }
      }
    }
  },
  // Support
  {
    id: 'create-ticket',
    name: 'Create Ticket',
    description: 'Creates a support ticket in your helpdesk system',
    type: 'webhook',
    endpoint: '',
    icon: <Ticket className="h-5 w-5" />,
    category: 'Support',
    config: {
      webhook: {
        url: '',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        inputSchema: {
          type: 'object',
          properties: {
            subject: { type: 'string', description: 'Ticket subject line' },
            description: { type: 'string', description: 'Detailed description of the issue' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
            requesterEmail: { type: 'string', description: 'Email of the person reporting' }
          },
          required: ['subject', 'description']
        }
      }
    }
  },
  {
    id: 'escalate-ticket',
    name: 'Escalate Ticket',
    description: 'Escalates an existing ticket to higher priority or team',
    type: 'webhook',
    endpoint: '',
    icon: <Ticket className="h-5 w-5" />,
    category: 'Support',
    config: {
      webhook: {
        url: '',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        inputSchema: {
          type: 'object',
          properties: {
            ticketId: { type: 'string', description: 'ID of the ticket to escalate' },
            reason: { type: 'string', description: 'Reason for escalation' },
            targetTeam: { type: 'string', description: 'Team to escalate to' }
          },
          required: ['ticketId', 'reason']
        }
      }
    }
  },
  // Communication
  {
    id: 'send-email',
    name: 'Send Email',
    description: 'Sends an email notification to specified recipients',
    type: 'api',
    endpoint: '',
    icon: <Mail className="h-5 w-5" />,
    category: 'Communication',
    config: {
      api: {
        endpoint: '',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        inputSchema: {
          type: 'object',
          properties: {
            to: { type: 'string', description: 'Recipient email address' },
            subject: { type: 'string', description: 'Email subject line' },
            body: { type: 'string', description: 'Email body content' },
            isHtml: { type: 'boolean', default: false, description: 'Whether body is HTML' }
          },
          required: ['to', 'subject', 'body']
        }
      }
    }
  },
  {
    id: 'slack-notification',
    name: 'Slack Notification',
    description: 'Posts a message to a Slack channel via webhook',
    type: 'webhook',
    endpoint: '',
    icon: <MessageSquare className="h-5 w-5" />,
    category: 'Communication',
    config: {
      webhook: {
        url: '',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'Message text to post' },
            channel: { type: 'string', description: 'Channel name (optional, uses webhook default)' }
          },
          required: ['text']
        }
      }
    }
  },
  {
    id: 'teams-notification',
    name: 'Teams Notification',
    description: 'Posts a message to a Microsoft Teams channel',
    type: 'webhook',
    endpoint: '',
    icon: <MessageSquare className="h-5 w-5" />,
    category: 'Communication',
    config: {
      webhook: {
        url: '',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Message card title' },
            text: { type: 'string', description: 'Message content' },
            themeColor: { type: 'string', default: '0076D7', description: 'Accent color hex' }
          },
          required: ['text']
        }
      }
    }
  },
  {
    id: 'sms-notification',
    name: 'SMS Notification',
    description: 'Sends an SMS message via Twilio or similar provider',
    type: 'api',
    endpoint: '',
    icon: <Bell className="h-5 w-5" />,
    category: 'Communication',
    config: {
      api: {
        endpoint: '',
        method: 'POST',
        inputSchema: {
          type: 'object',
          properties: {
            to: { type: 'string', description: 'Phone number in E.164 format' },
            message: { type: 'string', description: 'SMS message content (max 160 chars)' }
          },
          required: ['to', 'message']
        }
      }
    }
  },
  // Productivity
  {
    id: 'create-calendar-event',
    name: 'Create Calendar Event',
    description: 'Schedules a new event on your calendar',
    type: 'api',
    endpoint: '',
    icon: <Calendar className="h-5 w-5" />,
    category: 'Productivity',
    config: {
      api: {
        endpoint: '',
        method: 'POST',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Event title' },
            description: { type: 'string', description: 'Event description' },
            startTime: { type: 'string', description: 'Start time (ISO 8601)' },
            endTime: { type: 'string', description: 'End time (ISO 8601)' },
            attendees: { type: 'array', items: { type: 'string' }, description: 'List of attendee emails' }
          },
          required: ['title', 'startTime', 'endTime']
        }
      }
    }
  },
  {
    id: 'create-task',
    name: 'Create Task',
    description: 'Creates a new task in your task management system',
    type: 'webhook',
    endpoint: '',
    icon: <FileText className="h-5 w-5" />,
    category: 'Productivity',
    config: {
      webhook: {
        url: '',
        method: 'POST',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Task title' },
            description: { type: 'string', description: 'Task details' },
            dueDate: { type: 'string', description: 'Due date (ISO 8601)' },
            priority: { type: 'string', enum: ['low', 'medium', 'high'] },
            assignee: { type: 'string', description: 'Email of assignee' }
          },
          required: ['title']
        }
      }
    }
  },
  {
    id: 'generate-report',
    name: 'Generate Report',
    description: 'Creates a formatted report from provided data',
    type: 'function',
    endpoint: '',
    icon: <FileText className="h-5 w-5" />,
    category: 'Productivity',
    config: {
      function: {
        name: 'generate_report',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Report title' },
            data: { type: 'object', description: 'Data to include in report' },
            format: { type: 'string', enum: ['pdf', 'html', 'markdown'], default: 'markdown' }
          },
          required: ['title', 'data']
        }
      }
    }
  },
  {
    id: 'summarize-content',
    name: 'Summarize Content',
    description: 'AI-powered content summarization',
    type: 'function',
    endpoint: '',
    icon: <Sparkles className="h-5 w-5" />,
    category: 'Productivity',
    config: {
      function: {
        name: 'summarize_content',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Content to summarize' },
            maxLength: { type: 'number', default: 200, description: 'Maximum summary length in words' },
            style: { type: 'string', enum: ['bullet', 'paragraph', 'executive'], default: 'paragraph' }
          },
          required: ['content']
        }
      }
    }
  },
  // Data
  {
    id: 'database-query',
    name: 'Database Query',
    description: 'Executes a safe read query against your database',
    type: 'function',
    endpoint: '',
    icon: <Database className="h-5 w-5" />,
    category: 'Data',
    config: {
      function: {
        name: 'database_query',
        inputSchema: {
          type: 'object',
          properties: {
            table: { type: 'string', description: 'Table name to query' },
            filters: { type: 'object', description: 'Filter conditions' },
            select: { type: 'array', items: { type: 'string' }, description: 'Columns to return' },
            limit: { type: 'number', default: 100, description: 'Maximum rows to return' }
          },
          required: ['table']
        }
      }
    }
  },
  {
    id: 'web-search',
    name: 'Web Search',
    description: 'Searches the web for real-time information',
    type: 'api',
    endpoint: '',
    icon: <Search className="h-5 w-5" />,
    category: 'Data',
    config: {
      api: {
        endpoint: '',
        method: 'GET',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            maxResults: { type: 'number', default: 5, description: 'Maximum results to return' }
          },
          required: ['query']
        }
      }
    }
  },
  {
    id: 'fetch-url',
    name: 'Fetch URL Content',
    description: 'Retrieves and parses content from a web URL',
    type: 'function',
    endpoint: '',
    icon: <ExternalLink className="h-5 w-5" />,
    category: 'Data',
    config: {
      function: {
        name: 'fetch_url',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'URL to fetch' },
            format: { type: 'string', enum: ['text', 'markdown', 'json'], default: 'text' }
          },
          required: ['url']
        }
      }
    }
  },
  {
    id: 'extract-data',
    name: 'Extract Structured Data',
    description: 'Extracts structured data from unstructured text using AI',
    type: 'function',
    endpoint: '',
    icon: <Database className="h-5 w-5" />,
    category: 'Data',
    config: {
      function: {
        name: 'extract_data',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'Text to extract data from' },
            schema: { type: 'object', description: 'Expected output schema' }
          },
          required: ['text', 'schema']
        }
      }
    }
  },
  // Automation
  {
    id: 'zapier-trigger',
    name: 'Zapier Webhook',
    description: 'Triggers a Zapier workflow via webhook',
    type: 'webhook',
    endpoint: '',
    icon: <Zap className="h-5 w-5" />,
    category: 'Automation',
    config: {
      webhook: {
        url: '',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        inputSchema: {
          type: 'object',
          properties: {
            data: { type: 'object', description: 'Data payload to send to Zapier' }
          },
          required: ['data']
        }
      }
    }
  },
  {
    id: 'make-scenario',
    name: 'Make (Integromat) Trigger',
    description: 'Triggers a Make.com scenario via webhook',
    type: 'webhook',
    endpoint: '',
    icon: <Zap className="h-5 w-5" />,
    category: 'Automation',
    config: {
      webhook: {
        url: '',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        inputSchema: {
          type: 'object',
          properties: {
            data: { type: 'object', description: 'Data payload to send to Make' }
          },
          required: ['data']
        }
      }
    }
  },
  {
    id: 'custom-webhook',
    name: 'Custom Webhook',
    description: 'Send data to any custom webhook endpoint',
    type: 'webhook',
    endpoint: '',
    icon: <Webhook className="h-5 w-5" />,
    category: 'Automation',
    config: {
      webhook: {
        url: '',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        inputSchema: {
          type: 'object',
          properties: {
            payload: { type: 'object', description: 'JSON payload to send' }
          },
          required: ['payload']
        }
      }
    }
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
    isEnabled: true,
    config: null as any
  });
  const [selectedTemplate, setSelectedTemplate] = useState<ActionTemplate | null>(null);

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
      // Use template config if available, otherwise build from form
      let config: any;
      
      if (formData.config) {
        // Use the template's pre-built config
        config = formData.config;
      } else if (formData.type === 'security') {
        // Build security config
        config = {
          security: {
            scannerType: 'url',
            threatLevel: 'standard',
            autoBlock: true
          }
        };
      } else {
        // Build standard config for api/webhook/function
        config = {
          [formData.type]: {
            endpoint: formData.endpoint,
            url: formData.endpoint,
            method: 'POST',
            headers: {}
          }
        };
      }

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
      setSelectedTemplate(null);
      setFormData({
        name: '',
        description: '',
        type: 'webhook',
        endpoint: '',
        isEnabled: true,
        config: null
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
      isEnabled: action.isEnabled,
      config: action.config || null
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

  const handleUseTemplate = async (template: ActionTemplate) => {
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
      // Directly create the action from template
      const config = template.config || {
        [template.type]: {
          endpoint: template.endpoint,
          url: template.endpoint,
          method: 'POST',
          headers: {}
        }
      };

      const { error } = await supabase
        .from('gpt_actions')
        .insert({
          gpt_id: gptId,
          user_id: user.id,
          name: template.name,
          description: template.description,
          action_type: template.type,
          config,
          is_enabled: true
        });

      if (error) throw error;

      toast({
        title: "Action added",
        description: `${template.name} has been added to your GPT`
      });
      
      fetchActions();
    } catch (error) {
      console.error('Error creating action from template:', error);
      toast({
        title: "Error",
        description: "Failed to add action",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
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
                    isEnabled: true,
                    config: null
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
