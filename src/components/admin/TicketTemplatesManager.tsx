import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Plus, Edit, Trash2, Copy } from "lucide-react";

interface TicketTemplate {
  id: string;
  user_id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string;
  template_type: string;
  variables: string[] | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export const TicketTemplatesManager = () => {
  const [templates, setTemplates] = useState<TicketTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<TicketTemplate | null>(null);
  const [showDialog, setShowDialog] = useState(false);
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
        .eq('template_type', 'ticket')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading ticket templates:', error);
      toast({
        title: "Error",
        description: "Failed to load ticket templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async (templateData: Partial<TicketTemplate>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      if (editingTemplate) {
        const { error } = await supabase
          .from('email_templates')
          .update({
            name: templateData.name,
            body_html: templateData.body_html,
            body_text: templateData.body_text,
            subject: templateData.subject,
            variables: templateData.variables || [],
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
            template_type: 'ticket',
            body_html: templateData.body_html,
            body_text: templateData.body_text,
            subject: templateData.subject,
            variables: templateData.variables || [],
            is_active: templateData.is_active,
          });

        if (error) throw error;
      }

      toast({
        title: "✅ Template Saved",
        description: `Ticket template "${templateData.name}" has been saved successfully`,
      });

      setShowDialog(false);
      setEditingTemplate(null);
      loadTemplates();
    } catch (error) {
      console.error('Error saving ticket template:', error);
      toast({
        title: "Error",
        description: "Failed to save ticket template",
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
        description: "Ticket template has been deleted successfully",
      });

      loadTemplates();
    } catch (error) {
      console.error('Error deleting ticket template:', error);
      toast({
        title: "Error",
        description: "Failed to delete ticket template",
        variant: "destructive",
      });
    }
  };

  const duplicateTemplate = async (template: TicketTemplate) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from('email_templates')
        .insert({
          user_id: user.user.id,
          name: `${template.name} (Copy)`,
          template_type: 'ticket',
          body_html: template.body_html,
          body_text: template.body_text,
          subject: template.subject,
          variables: template.variables,
          is_active: false,
        });

      if (error) throw error;

      toast({
        title: "✅ Template Duplicated",
        description: "Template has been duplicated successfully",
      });

      loadTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast({
        title: "Error",
        description: "Failed to duplicate template",
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
            <FileText className="h-6 w-6 text-primary" />
            Ticket Templates
          </h2>
          <p className="text-muted-foreground">
            Create reusable templates for common ticket types
          </p>
        </div>
        
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTemplate(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </DialogTitle>
            </DialogHeader>
            <TicketTemplateForm
              template={editingTemplate}
              onSave={saveTemplate}
              onCancel={() => setShowDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {templates.map((template) => {
          return (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={template.is_active ? "default" : "secondary"}>
                        {template.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Subject</p>
                      <p className="text-sm truncate">{template.subject}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Body Preview</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.body_text.substring(0, 100)}...
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{template.variables?.length || 0} variables</span>
                    <span>Created {new Date(template.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => duplicateTemplate(template)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingTemplate(template);
                        setShowDialog(true);
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {templates.length === 0 && (
          <div className="col-span-full text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No Templates</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create templates to streamline ticket creation for common issues
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface TicketTemplateFormProps {
  template: TicketTemplate | null;
  onSave: (data: Partial<TicketTemplate>) => void;
  onCancel: () => void;
}

const TicketTemplateForm = ({ template, onSave, onCancel }: TicketTemplateFormProps) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    subject: template?.subject || '',
    body_html: template?.body_html || '',
    body_text: template?.body_text || '',
    variables: template?.variables || [],
    is_active: template?.is_active ?? true,
  });

  const [newVariable, setNewVariable] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addVariable = () => {
    if (newVariable.trim() && !formData.variables?.includes(newVariable.trim())) {
      setFormData(prev => ({
        ...prev,
        variables: [...(prev.variables || []), newVariable.trim()]
      }));
      setNewVariable('');
    }
  };

  const removeVariable = (variableToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables?.filter(variable => variable !== variableToRemove) || []
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Template Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="e.g., Password Reset Template"
        />
      </div>

      <div>
        <Label htmlFor="subject">Subject Template</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          placeholder="e.g., Password Reset Request for {{customer_name}}"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Use {"{{variable_name}}"} for dynamic content
        </p>
      </div>

      <div>
        <Label htmlFor="body_text">Body Template (Text)</Label>
        <Textarea
          id="body_text"
          value={formData.body_text}
          onChange={(e) => setFormData({ 
            ...formData, 
            body_text: e.target.value,
            body_html: e.target.value // Keep them in sync for simplicity
          })}
          rows={6}
          placeholder="Dear {{customer_name}},&#10;&#10;We have received your request for...&#10;&#10;Best regards,&#10;{{agent_name}}"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Use {"{{variable_name}}"} for dynamic content
        </p>
      </div>

      <div>
        <Label>Template Variables</Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={newVariable}
            onChange={(e) => setNewVariable(e.target.value)}
            placeholder="e.g., customer_name"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariable())}
          />
          <Button type="button" onClick={addVariable}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {formData.variables?.map((variable) => (
            <Badge key={variable} variant="secondary" className="cursor-pointer" onClick={() => removeVariable(variable)}>
              {`{{${variable}}}`} ×
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Add variables that can be replaced with dynamic content
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={!!formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label htmlFor="is_active">Active Template</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {template ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </form>
  );
};