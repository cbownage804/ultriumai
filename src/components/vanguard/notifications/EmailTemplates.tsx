import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Plus, Edit, Trash2, Copy, Eye, Code, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PremiumCard } from '../ui';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EmailTemplate {
  id: string;
  name: string;
  template_type: string;
  subject: string;
  body_html: string | null;
  body_text: string | null;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const EmailTemplates = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    if (user) loadTemplates();
  }, [user]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates((data || []) as EmailTemplate[]);
    } catch (error: any) {
      console.error('Error loading templates:', error);
      toast({ title: 'Error loading templates', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (template: EmailTemplate) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;
      setTemplates(prev => prev.map(t => 
        t.id === template.id ? { ...t, is_active: !t.is_active } : t
      ));
      toast({ title: `Template ${template.is_active ? 'disabled' : 'enabled'}` });
    } catch (error: any) {
      toast({ title: 'Error updating template', variant: 'destructive' });
    }
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          user_id: user.id,
          name: `${template.name} (Copy)`,
          template_type: template.template_type,
          subject: template.subject,
          body_html: template.body_html,
          body_text: template.body_text,
          variables: template.variables,
          is_active: false,
        })
        .select()
        .single();

      if (error) throw error;
      setTemplates(prev => [data as EmailTemplate, ...prev]);
      toast({ title: 'Template duplicated' });
    } catch (error: any) {
      toast({ title: 'Error duplicating template', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast({ title: 'Template deleted' });
    } catch (error: any) {
      toast({ title: 'Error deleting template', variant: 'destructive' });
    }
  };

  const handleSave = async (templateData: Partial<EmailTemplate>) => {
    if (!user) return;
    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from('email_templates')
          .update({
            name: templateData.name,
            template_type: templateData.template_type,
            subject: templateData.subject,
            body_html: templateData.body_html,
            body_text: templateData.body_text,
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;
        setTemplates(prev => prev.map(t => 
          t.id === editingTemplate.id ? { ...t, ...templateData } : t
        ));
        toast({ title: 'Template updated' });
      } else {
        const { data, error } = await supabase
          .from('email_templates')
          .insert({
            user_id: user.id,
            name: templateData.name,
            template_type: templateData.template_type || 'general',
            subject: templateData.subject,
            body_html: templateData.body_html,
            body_text: templateData.body_text,
          })
          .select()
          .single();

        if (error) throw error;
        setTemplates(prev => [data as EmailTemplate, ...prev]);
        toast({ title: 'Template created' });
      }
      setIsCreateOpen(false);
      setEditingTemplate(null);
    } catch (error: any) {
      toast({ title: 'Error saving template', variant: 'destructive' });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Email Templates</h3>
          <p className="text-sm text-muted-foreground">Manage notification email templates with variables</p>
        </div>
        <Dialog open={isCreateOpen || !!editingTemplate} onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingTemplate(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-[hsl(var(--vanguard-card))] border-white/10">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Email Template'}</DialogTitle>
            </DialogHeader>
            <TemplateEditor 
              template={editingTemplate} 
              onSave={handleSave}
              onCancel={() => {
                setIsCreateOpen(false);
                setEditingTemplate(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <PremiumCard variant="glass" className="p-8 text-center">
          <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h4 className="text-lg font-medium mb-2">No templates yet</h4>
          <p className="text-sm text-muted-foreground mb-4">Create your first email template to get started</p>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-gradient-to-r from-cyan-500 to-blue-500">
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </PremiumCard>
      ) : (
        <div className="grid gap-4">
          {templates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <PremiumCard variant="glass" className="p-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                    <Mail className="h-5 w-5 text-cyan-400" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{template.name}</h4>
                      <Badge variant="outline" className="text-xs capitalize">
                        {template.template_type}
                      </Badge>
                      {!template.is_active && (
                        <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-400">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{template.subject}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Modified: {formatDate(template.updated_at)}</span>
                      {template.variables?.length > 0 && (
                        <span>{template.variables.length} variables</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={template.is_active}
                      onCheckedChange={() => handleToggleActive(template)}
                    />
                    
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewTemplate(template)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setEditingTemplate(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleDuplicate(template)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-400 hover:text-red-300"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </PremiumCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl bg-[hsl(var(--vanguard-card))] border-white/10">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-white/5">
                <p className="text-xs text-muted-foreground mb-1">Subject</p>
                <p className="font-medium">{previewTemplate.subject}</p>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <p className="text-xs text-muted-foreground mb-1">Body</p>
                <div 
                  className="prose prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewTemplate.body_html || '<p>No content</p>' }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Available Variables Reference */}
      <PremiumCard variant="glass" className="p-6">
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <Code className="h-4 w-4 text-cyan-400" />
          Available Template Variables
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            '{{ticket_id}}', '{{subject}}', '{{priority}}', '{{status}}',
            '{{assignee}}', '{{client_name}}', '{{created_at}}', '{{due_date}}',
            '{{incident_title}}', '{{severity}}', '{{date_range}}', '{{user_name}}',
          ].map((variable) => (
            <code 
              key={variable}
              className="px-3 py-2 rounded-lg bg-white/5 text-cyan-400 text-sm cursor-pointer hover:bg-white/10 transition-colors"
              onClick={() => {
                navigator.clipboard.writeText(variable);
                toast({ title: 'Copied to clipboard' });
              }}
            >
              {variable}
            </code>
          ))}
        </div>
      </PremiumCard>
    </div>
  );
};

interface TemplateEditorProps {
  template?: EmailTemplate | null;
  onSave: (data: Partial<EmailTemplate>) => void;
  onCancel: () => void;
}

const TemplateEditor = ({ template, onSave, onCancel }: TemplateEditorProps) => {
  const [name, setName] = useState(template?.name || '');
  const [subject, setSubject] = useState(template?.subject || '');
  const [templateType, setTemplateType] = useState(template?.template_type || 'general');
  const [bodyHtml, setBodyHtml] = useState(template?.body_html || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name || !subject) return;
    setIsSaving(true);
    await onSave({ name, subject, template_type: templateType, body_html: bodyHtml });
    setIsSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Template Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Ticket Created"
            className="bg-white/5 border-white/10"
          />
        </div>
        <div className="space-y-2">
          <Label>Template Type</Label>
          <Select value={templateType} onValueChange={setTemplateType}>
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {['ticket', 'alert', 'report', 'auth', 'incident', 'general'].map(type => (
                <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Email Subject</Label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g., New Ticket: {{ticket_id}} - {{subject}}"
          className="bg-white/5 border-white/10"
        />
      </div>

      <div className="space-y-2">
        <Label>Email Body (HTML)</Label>
        <Textarea
          value={bodyHtml}
          onChange={(e) => setBodyHtml(e.target.value)}
          placeholder="<h1>Hello {{user_name}},</h1><p>A new ticket has been created...</p>"
          className="bg-white/5 border-white/10 min-h-[200px] font-mono text-sm"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" className="border-white/10" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          className="bg-gradient-to-r from-cyan-500 to-blue-500"
          disabled={isSaving || !name || !subject}
        >
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {template ? 'Update Template' : 'Save Template'}
        </Button>
      </div>
    </div>
  );
};
