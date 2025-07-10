import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Plus, Edit, Trash2, Eye, Send } from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  template_type: string;
  subject: string;
  body_html: string;
  body_text: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const templateTypes = [
  { value: 'ticket_created', label: 'Ticket Created' },
  { value: 'ticket_updated', label: 'Ticket Updated' },
  { value: 'ticket_resolved', label: 'Ticket Resolved' },
  { value: 'sla_breach', label: 'SLA Breach Warning' },
  { value: 'escalation', label: 'Ticket Escalation' },
  { value: 'auto_response', label: 'Auto Response' },
];

const availableVariables = [
  '{{ticket_number}}',
  '{{ticket_subject}}',
  '{{ticket_description}}',
  '{{ticket_priority}}',
  '{{ticket_status}}',
  '{{client_name}}',
  '{{agent_name}}',
  '{{created_date}}',
  '{{due_date}}',
  '{{ticket_url}}',
];

export const EmailTemplateManager = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('user_id', user.user.id)
        .order('template_type', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
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

  const saveTemplate = async (templateData: Partial<EmailTemplate>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      if (editingTemplate) {
        const { error } = await supabase
          .from('email_templates')
          .update({
            name: templateData.name,
            template_type: templateData.template_type,
            subject: templateData.subject,
            body_html: templateData.body_html,
            body_text: templateData.body_text,
            variables: templateData.variables,
            is_active: templateData.is_active,
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('email_templates')
          .insert({
            user_id: user.user.id,
            name: templateData.name,
            template_type: templateData.template_type,
            subject: templateData.subject,
            body_html: templateData.body_html,
            body_text: templateData.body_text,
            variables: templateData.variables,
            is_active: templateData.is_active,
          });

        if (error) throw error;
      }

      toast({
        title: "✅ Template Saved",
        description: `Email template "${templateData.name}" has been saved successfully`,
      });

      setShowDialog(false);
      setEditingTemplate(null);
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save email template",
        variant: "destructive",
      });
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: "✅ Template Deleted",
        description: "Email template has been deleted successfully",
      });

      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete email template",
        variant: "destructive",
      });
    }
  };

  const testTemplate = async (template: EmailTemplate) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Call the send-email edge function with test data
      const response = await supabase.functions.invoke('send-email', {
        body: {
          templateId: template.id,
          to: user.user.email,
          variables: {
            ticket_number: 'TEST-001',
            ticket_subject: 'Test Email Template',
            ticket_description: 'This is a test email from the template system.',
            ticket_priority: 'Medium',
            ticket_status: 'Open',
            client_name: 'Test Client',
            agent_name: 'Test Agent',
            created_date: new Date().toLocaleDateString(),
            due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString(),
            ticket_url: window.location.origin + '/tickets/test-001',
          }
        }
      });

      if (response.error) throw response.error;

      toast({
        title: "✅ Test Email Sent",
        description: `Test email sent to ${user.user.email}`,
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Email Templates
          </h2>
          <p className="text-muted-foreground">
            Manage automated email templates for ticket notifications
          </p>
        </div>
        
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingTemplate(null);
              setPreviewMode(false);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Email Template' : 'Create Email Template'}
              </DialogTitle>
            </DialogHeader>
            <EmailTemplateForm
              template={editingTemplate}
              onSave={saveTemplate}
              onCancel={() => setShowDialog(false)}
              previewMode={previewMode}
              onTogglePreview={() => setPreviewMode(!previewMode)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {templateTypes.find(t => t.value === template.template_type)?.label}
                  </p>
                </div>
                <Badge variant={template.is_active ? "default" : "secondary"}>
                  {template.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Subject</Label>
                  <p className="text-sm text-muted-foreground truncate">
                    {template.subject}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Variables Used</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {template.variables.slice(0, 3).map((variable, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                    {template.variables.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.variables.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingTemplate(template);
                      setPreviewMode(true);
                      setShowDialog(true);
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingTemplate(template);
                      setPreviewMode(false);
                      setShowDialog(true);
                    }}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testTemplate(template)}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Test
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full"
                  onClick={() => deleteTemplate(template.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {templates.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No Email Templates</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first email template to get started with automated notifications
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface EmailTemplateFormProps {
  template: EmailTemplate | null;
  onSave: (data: Partial<EmailTemplate>) => void;
  onCancel: () => void;
  previewMode: boolean;
  onTogglePreview: () => void;
}

const EmailTemplateForm = ({ template, onSave, onCancel, previewMode, onTogglePreview }: EmailTemplateFormProps) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    template_type: template?.template_type || 'ticket_created',
    subject: template?.subject || '',
    body_html: template?.body_html || '',
    body_text: template?.body_text || '',
    variables: template?.variables || [],
    is_active: template?.is_active ?? true,
  });

  const insertVariable = (variable: string, field: 'subject' | 'body_html' | 'body_text') => {
    const newValue = formData[field] + ' ' + variable;
    setFormData({ ...formData, [field]: newValue });
    
    // Add to variables array if not already present
    if (!formData.variables.includes(variable)) {
      setFormData(prev => ({
        ...prev,
        variables: [...prev.variables, variable]
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (previewMode) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Email Preview</h3>
          <Button variant="outline" onClick={onTogglePreview}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Template
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Subject: {formData.subject}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: formData.body_html }} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="type">Template Type</Label>
          <Select
            value={formData.template_type}
            onValueChange={(value) => setFormData({ ...formData, template_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {templateTypes.map(type => (
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
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          required
        />
        <div className="flex flex-wrap gap-1 mt-2">
          {availableVariables.map(variable => (
            <Button
              key={variable}
              type="button"
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => insertVariable(variable, 'subject')}
            >
              {variable}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="body_html">HTML Body</Label>
        <Textarea
          id="body_html"
          value={formData.body_html}
          onChange={(e) => setFormData({ ...formData, body_html: e.target.value })}
          rows={10}
          required
        />
        <div className="flex flex-wrap gap-1 mt-2">
          {availableVariables.map(variable => (
            <Button
              key={variable}
              type="button"
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => insertVariable(variable, 'body_html')}
            >
              {variable}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="body_text">Text Body</Label>
        <Textarea
          id="body_text"
          value={formData.body_text}
          onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
          rows={6}
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label htmlFor="is_active">Active Template</Label>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onTogglePreview}>
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {template ? 'Update Template' : 'Create Template'}
          </Button>
        </div>
      </div>
    </form>
  );
};