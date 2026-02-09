import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, GripVertical, FileText, Eye, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'date' | 'email';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface CustomForm {
  id: string;
  form_name: string;
  category: string | null;
  description: string | null;
  fields: FormField[];
  is_active: boolean;
  is_default: boolean;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'email', label: 'Email' }
];

export function CustomTicketForms() {
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [forms, setForms] = useState<CustomForm[]>([]);

  useEffect(() => {
    if (user) loadForms();
  }, [user]);

  const loadForms = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from('vanguard_custom_ticket_forms')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setForms(data.map((f: any) => ({
        id: f.id,
        form_name: f.form_name,
        category: f.category,
        description: f.description,
        fields: f.fields || [],
        is_active: f.is_active ?? true,
        is_default: f.is_default ?? false,
      })));
    }
  };
  const [newForm, setNewForm] = useState({
    form_name: '',
    category: '',
    description: '',
    fields: [] as FormField[],
    is_active: true,
    is_default: false
  });
  const [newField, setNewField] = useState<Partial<FormField>>({
    type: 'text',
    label: '',
    placeholder: '',
    required: false,
    options: []
  });

  const handleCreateForm = async () => {
    if (!user) return;
    try {
      const { error } = await (supabase as any)
        .from('vanguard_custom_ticket_forms')
        .insert({
          user_id: user.id,
          form_name: newForm.form_name,
          category: newForm.category || null,
          description: newForm.description || null,
          fields: newForm.fields,
          is_active: newForm.is_active,
          is_default: newForm.is_default,
        });
      if (error) throw error;
      setIsCreateOpen(false);
      setNewForm({ form_name: '', category: '', description: '', fields: [], is_active: true, is_default: false });
      toast.success('Form created successfully');
      loadForms();
    } catch (err) {
      console.error('Error creating form:', err);
      toast.error('Failed to create form');
    }
  };

  const handleDeleteForm = async (id: string) => {
    try {
      await (supabase as any).from('vanguard_custom_ticket_forms').delete().eq('id', id);
      setForms(forms.filter(f => f.id !== id));
      toast.success('Form deleted');
    } catch (err) {
      console.error('Error deleting form:', err);
    }
  };

  const addField = () => {
    if (!newField.label) return;
    const field: FormField = {
      id: crypto.randomUUID(),
      type: newField.type as FormField['type'],
      label: newField.label,
      placeholder: newField.placeholder,
      required: newField.required || false,
      options: newField.type === 'select' ? newField.options : undefined
    };
    setNewForm({ ...newForm, fields: [...newForm.fields, field] });
    setNewField({ type: 'text', label: '', placeholder: '', required: false, options: [] });
  };

  const removeField = (id: string) => {
    setNewForm({ ...newForm, fields: newForm.fields.filter(f => f.id !== id) });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Custom Ticket Forms</h2>
          <p className="text-sm text-muted-foreground">Create category-specific ticket submission forms</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Form
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Custom Form</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Form Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Form Name *</Label>
                  <Input
                    value={newForm.form_name}
                    onChange={(e) => setNewForm({ ...newForm, form_name: e.target.value })}
                    placeholder="Hardware Request Form"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    value={newForm.category}
                    onChange={(e) => setNewForm({ ...newForm, category: e.target.value })}
                    placeholder="Hardware"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newForm.description}
                  onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                  placeholder="Form description..."
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newForm.is_active}
                    onCheckedChange={(v) => setNewForm({ ...newForm, is_active: v })}
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newForm.is_default}
                    onCheckedChange={(v) => setNewForm({ ...newForm, is_default: v })}
                  />
                  <Label>Default Form</Label>
                </div>
              </div>

              {/* Field Builder */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Form Fields</Label>
                <Card className="bg-muted/50">
                  <CardContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Field Type</Label>
                        <Select
                          value={newField.type}
                          onValueChange={(v) => setNewField({ ...newField, type: v as FormField['type'] })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map(ft => (
                              <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Label *</Label>
                        <Input
                          value={newField.label}
                          onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                          placeholder="Field label"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Placeholder</Label>
                        <Input
                          value={newField.placeholder}
                          onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                          placeholder="Placeholder text"
                        />
                      </div>
                    </div>
                    {newField.type === 'select' && (
                      <div className="space-y-2">
                        <Label>Options (comma-separated)</Label>
                        <Input
                          value={newField.options?.join(', ')}
                          onChange={(e) => setNewField({ ...newField, options: e.target.value.split(',').map(o => o.trim()) })}
                          placeholder="Option 1, Option 2, Option 3"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={newField.required}
                          onCheckedChange={(v) => setNewField({ ...newField, required: v })}
                        />
                        <Label>Required</Label>
                      </div>
                      <Button onClick={addField} disabled={!newField.label}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Field
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Field List */}
                {newForm.fields.length > 0 && (
                  <div className="space-y-2">
                    {newForm.fields.map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <Badge variant="outline">{field.type}</Badge>
                        <span className="font-medium flex-1">{field.label}</span>
                        {field.required && (
                          <Badge variant="secondary">Required</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeField(field.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                className="w-full"
                onClick={handleCreateForm}
                disabled={!newForm.form_name || newForm.fields.length === 0}
              >
                Create Form
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Forms List */}
      {forms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No custom forms created. Create your first form above.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {forms.map((form) => (
            <Card key={form.id} className={!form.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {form.form_name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {form.is_default && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                    <Badge variant={form.is_active ? 'default' : 'outline'}>
                      {form.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                {form.category && (
                  <p className="text-sm text-muted-foreground">Category: {form.category}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {form.description && (
                    <p className="text-sm text-muted-foreground">{form.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {form.fields.slice(0, 4).map((field) => (
                      <Badge key={field.id} variant="outline" className="text-xs">
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </Badge>
                    ))}
                    {form.fields.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{form.fields.length - 4} more
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteForm(form.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
