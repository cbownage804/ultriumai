import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Plus, Edit, Trash2, Copy, Eye, Code, Palette } from 'lucide-react';
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

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: string;
  isActive: boolean;
  lastModified: string;
  usageCount: number;
}

export const EmailTemplates = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([
    { id: '1', name: 'Ticket Created', subject: 'New Ticket: {{ticket_id}} - {{subject}}', category: 'Tickets', isActive: true, lastModified: '2 days ago', usageCount: 1250 },
    { id: '2', name: 'SLA Breach Warning', subject: '⚠️ SLA Breach Alert: {{ticket_id}}', category: 'Alerts', isActive: true, lastModified: '1 week ago', usageCount: 89 },
    { id: '3', name: 'Weekly Report', subject: 'Weekly Security Report - {{date_range}}', category: 'Reports', isActive: true, lastModified: '3 days ago', usageCount: 52 },
    { id: '4', name: 'Password Reset', subject: 'Reset Your Password', category: 'Auth', isActive: true, lastModified: '1 month ago', usageCount: 340 },
    { id: '5', name: 'Incident Escalation', subject: '🚨 ESCALATION: {{incident_title}}', category: 'Incidents', isActive: false, lastModified: '2 weeks ago', usageCount: 23 },
  ]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  const categories = ['Tickets', 'Alerts', 'Reports', 'Auth', 'Incidents', 'General'];

  const handleToggleActive = (id: string) => {
    setTemplates(prev => prev.map(t => 
      t.id === id ? { ...t, isActive: !t.isActive } : t
    ));
    toast({ title: 'Template status updated' });
  };

  const handleDuplicate = (template: EmailTemplate) => {
    const newTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      usageCount: 0,
      lastModified: 'Just now',
    };
    setTemplates(prev => [...prev, newTemplate]);
    toast({ title: 'Template duplicated' });
  };

  const handleDelete = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast({ title: 'Template deleted', variant: 'destructive' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Email Templates</h3>
          <p className="text-sm text-muted-foreground">Manage notification email templates with variables</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500">
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-[hsl(var(--vanguard-card))] border-white/10">
            <DialogHeader>
              <DialogTitle>Create Email Template</DialogTitle>
            </DialogHeader>
            <TemplateEditor onSave={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

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
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                    {!template.isActive && (
                      <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-400">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{template.subject}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Modified: {template.lastModified}</span>
                    <span>Used: {template.usageCount.toLocaleString()} times</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={template.isActive}
                    onCheckedChange={() => handleToggleActive(template.id)}
                  />
                  
                  <Button variant="ghost" size="icon" className="h-8 w-8">
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
              onClick={() => navigator.clipboard.writeText(variable)}
            >
              {variable}
            </code>
          ))}
        </div>
      </PremiumCard>
    </div>
  );
};

const TemplateEditor = ({ onSave }: { onSave: () => void }) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [body, setBody] = useState('');

  const handleSave = () => {
    toast({ title: 'Template saved successfully' });
    onSave();
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
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {['Tickets', 'Alerts', 'Reports', 'Auth', 'Incidents', 'General'].map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="<h1>Hello {{user_name}},</h1><p>A new ticket has been created...</p>"
          className="bg-white/5 border-white/10 min-h-[200px] font-mono text-sm"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" className="border-white/10">
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button onClick={handleSave} className="bg-gradient-to-r from-cyan-500 to-blue-500">
          Save Template
        </Button>
      </div>
    </div>
  );
};
