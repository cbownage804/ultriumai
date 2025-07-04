import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Mail, Plus, Edit, Eye, Trash2, Send, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string;
  template_type: string;
  is_active: boolean;
  variables: string[];
  created_at: string;
  updated_at: string;
}

const EmailTemplates = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    subject: "",
    body_html: "",
    body_text: "",
    template_type: "notification",
    variables: [] as string[]
  });

  const templateTypes = [
    { value: 'notification', label: 'Notification' },
    { value: 'welcome', label: 'Welcome Email' },
    { value: 'gpt_shared', label: 'GPT Shared' },
    { value: 'api_key_created', label: 'API Key Created' },
    { value: 'subscription_changed', label: 'Subscription Changed' },
    { value: 'custom', label: 'Custom' }
  ];

  useEffect(() => {
    if (user) {
      loadTemplates();
    }
  }, [user]);

  const loadTemplates = async () => {
    try {
      // Mock data for now until types are updated
      const mockTemplates: EmailTemplate[] = [
        {
          id: '1',
          name: 'Welcome Email',
          subject: 'Welcome to {{app_name}}, {{user_name}}!',
          body_html: '<h1>Welcome {{user_name}}!</h1><p>Thank you for joining {{app_name}}.</p>',
          body_text: 'Welcome {{user_name}}! Thank you for joining {{app_name}}.',
          template_type: 'welcome',
          is_active: true,
          variables: ['app_name', 'user_name'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.subject.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please fill in name and subject",
        variant: "destructive",
      });
      return;
    }

    try {
      // Mock creation for now until database types are updated
      const newTemplateWithId: EmailTemplate = {
        id: Date.now().toString(),
        ...newTemplate,
        variables: extractVariables(newTemplate.body_html + ' ' + newTemplate.subject),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setTemplates(prev => [newTemplateWithId, ...prev]);
      setNewTemplate({
        name: "",
        subject: "",
        body_html: "",
        body_text: "",
        template_type: "notification",
        variables: []
      });
      setShowCreateForm(false);
      
      toast({
        title: "Template Created",
        description: "Email template has been created successfully",
      });
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: "Error",
        description: "Failed to create email template",
        variant: "destructive",
      });
    }
  };

  const updateTemplate = async () => {
    if (!editingTemplate) return;

    try {
      // Mock update for now until database types are updated
      const updatedTemplate = {
        ...editingTemplate,
        variables: extractVariables(editingTemplate.body_html + ' ' + editingTemplate.subject),
        updated_at: new Date().toISOString()
      };

      setTemplates(prev => 
        prev.map(template => 
          template.id === editingTemplate.id ? updatedTemplate : template
        )
      );
      setEditingTemplate(null);
      
      toast({
        title: "Template Updated",
        description: "Email template has been updated successfully",
      });
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: "Error",
        description: "Failed to update email template",
        variant: "destructive",
      });
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      // Mock deletion for now until database types are updated
      setTemplates(prev => prev.filter(template => template.id !== templateId));
      toast({
        title: "Template Deleted",
        description: "Email template has been deleted",
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete email template",
        variant: "destructive",
      });
    }
  };

  const toggleTemplateStatus = async (templateId: string, isActive: boolean) => {
    try {
      // Mock toggle for now until database types are updated
      setTemplates(prev => 
        prev.map(template => 
          template.id === templateId 
            ? { ...template, is_active: !isActive, updated_at: new Date().toISOString() }
            : template
        )
      );
    } catch (error) {
      console.error('Error toggling template status:', error);
    }
  };

  const extractVariables = (text: string): string[] => {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    let match;
    
    while ((match = variableRegex.exec(text)) !== null) {
      variables.add(match[1]);
    }
    
    return Array.from(variables);
  };

  const testTemplate = async (template: EmailTemplate) => {
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          templateId: template.id,
          to: user?.email,
          variables: {
            user_name: user?.email || 'Test User',
            app_name: 'UltriumGPT',
            timestamp: new Date().toLocaleString()
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Test Email Sent",
        description: `Test email sent to ${user?.email}`,
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading email templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Email Templates</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage email templates for automated notifications
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="btn-gradient">
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingTemplate) && (
        <Card className="card-glow">
          <CardHeader>
            <CardTitle>
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </CardTitle>
            <CardDescription>
              Design email templates with variables for dynamic content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  placeholder="e.g., Welcome Email"
                  value={editingTemplate ? editingTemplate.name : newTemplate.name}
                  onChange={(e) => {
                    if (editingTemplate) {
                      setEditingTemplate({...editingTemplate, name: e.target.value});
                    } else {
                      setNewTemplate({...newTemplate, name: e.target.value});
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="templateType">Template Type</Label>
                <Select
                  value={editingTemplate ? editingTemplate.template_type : newTemplate.template_type}
                  onValueChange={(value) => {
                    if (editingTemplate) {
                      setEditingTemplate({...editingTemplate, template_type: value});
                    } else {
                      setNewTemplate({...newTemplate, template_type: value});
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templateTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                placeholder="Use {{variable}} for dynamic content"
                value={editingTemplate ? editingTemplate.subject : newTemplate.subject}
                onChange={(e) => {
                  if (editingTemplate) {
                    setEditingTemplate({...editingTemplate, subject: e.target.value});
                  } else {
                    setNewTemplate({...newTemplate, subject: e.target.value});
                  }
                }}
              />
            </div>

            <Tabs defaultValue="html">
              <TabsList>
                <TabsTrigger value="html">HTML Content</TabsTrigger>
                <TabsTrigger value="text">Plain Text</TabsTrigger>
              </TabsList>
              
              <TabsContent value="html">
                <div>
                  <Label htmlFor="bodyHtml">HTML Body</Label>
                  <Textarea
                    id="bodyHtml"
                    rows={10}
                    placeholder="<h1>Hello {{user_name}}</h1><p>Welcome to {{app_name}}!</p>"
                    value={editingTemplate ? editingTemplate.body_html : newTemplate.body_html}
                    onChange={(e) => {
                      if (editingTemplate) {
                        setEditingTemplate({...editingTemplate, body_html: e.target.value});
                      } else {
                        setNewTemplate({...newTemplate, body_html: e.target.value});
                      }
                    }}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="text">
                <div>
                  <Label htmlFor="bodyText">Plain Text Body</Label>
                  <Textarea
                    id="bodyText"
                    rows={10}
                    placeholder="Hello {{user_name}}, Welcome to {{app_name}}!"
                    value={editingTemplate ? editingTemplate.body_text : newTemplate.body_text}
                    onChange={(e) => {
                      if (editingTemplate) {
                        setEditingTemplate({...editingTemplate, body_text: e.target.value});
                      } else {
                        setNewTemplate({...newTemplate, body_text: e.target.value});
                      }
                    }}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-2">
              <Button 
                onClick={editingTemplate ? updateTemplate : createTemplate} 
                className="btn-gradient"
              >
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingTemplate(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates List */}
      <div className="space-y-4">
        {templates.map((template) => (
          <Card key={template.id} className="card-elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>{template.name}</CardTitle>
                    <Badge variant={template.is_active ? "default" : "secondary"}>
                      {template.is_active ? "Active" : "Disabled"}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {template.template_type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <CardDescription className="mt-1">
                    Subject: {template.subject}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => testTemplate(template)}>
                    <Send className="w-4 h-4 mr-1" />
                    Test
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditingTemplate(template)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Switch
                    checked={template.is_active}
                    onCheckedChange={() => toggleTemplateStatus(template.id, template.is_active)}
                  />
                  <Button variant="outline" size="sm" onClick={() => deleteTemplate(template.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <Label className="text-sm">Variables Used:</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {template.variables.map((variable) => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                    {template.variables.length === 0 && (
                      <span className="text-xs text-muted-foreground">No variables</span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Created: {new Date(template.created_at).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {templates.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Email Templates</h3>
              <p className="text-muted-foreground mb-4">
                Create your first email template to start sending automated notifications
              </p>
              <Button onClick={() => setShowCreateForm(true)} className="btn-gradient">
                Create Template
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EmailTemplates;