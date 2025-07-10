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
import { Settings, Plus, Edit, Trash2, GripVertical, Type, Hash, Calendar, CheckSquare, List } from "lucide-react";

interface CustomField {
  id: string;
  user_id: string;
  name: string;
  field_type: string;
  label: string;
  description: string | null;
  required: boolean;
  options: any; // Will be JSON array from database
  default_value: string | null;
  validation_rules: any; // Will be JSON object from database
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const fieldTypes = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'textarea', label: 'Text Area', icon: Type },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { value: 'select', label: 'Select', icon: List },
  { value: 'multiselect', label: 'Multi-Select', icon: List },
];

export const CustomFieldsManager = () => {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('custom_ticket_fields')
        .select('*')
        .eq('user_id', user.user.id)
        .order('position', { ascending: true });

      if (error) throw error;
      setFields(data || []);
    } catch (error) {
      console.error('Error loading custom fields:', error);
      toast({
        title: "Error",
        description: "Failed to load custom fields",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveField = async (fieldData: Partial<CustomField>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Set position for new fields
      const position = editingField ? editingField.position : fields.length;

      if (editingField) {
        const { error } = await supabase
          .from('custom_ticket_fields')
          .update({
            name: fieldData.name,
            field_type: fieldData.field_type,
            label: fieldData.label,
            description: fieldData.description,
            required: fieldData.required,
            options: fieldData.options,
            default_value: fieldData.default_value,
            validation_rules: fieldData.validation_rules,
            is_active: fieldData.is_active,
          })
          .eq('id', editingField.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('custom_ticket_fields')
          .insert({
            user_id: user.user.id,
            name: fieldData.name,
            field_type: fieldData.field_type,
            label: fieldData.label,
            description: fieldData.description,
            required: fieldData.required,
            options: fieldData.options,
            default_value: fieldData.default_value,
            validation_rules: fieldData.validation_rules,
            position: position,
            is_active: fieldData.is_active,
          });

        if (error) throw error;
      }

      toast({
        title: "✅ Field Saved",
        description: `Custom field "${fieldData.label}" has been saved successfully`,
      });

      setShowDialog(false);
      setEditingField(null);
      loadFields();
    } catch (error) {
      console.error('Error saving custom field:', error);
      toast({
        title: "Error",
        description: "Failed to save custom field",
        variant: "destructive",
      });
    }
  };

  const deleteField = async (fieldId: string) => {
    try {
      const { error } = await supabase
        .from('custom_ticket_fields')
        .delete()
        .eq('id', fieldId);

      if (error) throw error;

      toast({
        title: "✅ Field Deleted",
        description: "Custom field has been deleted successfully",
      });

      loadFields();
    } catch (error) {
      console.error('Error deleting custom field:', error);
      toast({
        title: "Error",
        description: "Failed to delete custom field",
        variant: "destructive",
      });
    }
  };

  const reorderField = async (fieldId: string, newPosition: number) => {
    try {
      const { error } = await supabase
        .from('custom_ticket_fields')
        .update({ position: newPosition })
        .eq('id', fieldId);

      if (error) throw error;
      loadFields();
    } catch (error) {
      console.error('Error reordering field:', error);
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
            <Settings className="h-6 w-6 text-primary" />
            Custom Fields
          </h2>
          <p className="text-muted-foreground">
            Create custom fields to capture additional ticket information
          </p>
        </div>
        
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingField(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingField ? 'Edit Custom Field' : 'Create Custom Field'}
              </DialogTitle>
            </DialogHeader>
            <CustomFieldForm
              field={editingField}
              onSave={saveField}
              onCancel={() => setShowDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Fields List */}
      <div className="space-y-4">
        {fields.map((field, index) => {
          const FieldTypeIcon = fieldTypes.find(ft => ft.value === field.field_type)?.icon || Type;
          
          return (
            <Card key={field.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2 cursor-move">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <FieldTypeIcon className="h-5 w-5 text-primary" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{field.label}</h3>
                        {field.required && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                        {!field.is_active && (
                          <Badge variant="secondary" className="text-xs">Inactive</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>Type: {fieldTypes.find(ft => ft.value === field.field_type)?.label}</span>
                        <span>Name: {field.name}</span>
                        {field.description && (
                          <span className="max-w-xs truncate">{field.description}</span>
                        )}
                      </div>
                      
                      {(field.field_type === 'select' || field.field_type === 'multiselect') && Array.isArray(field.options) && field.options.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {field.options.slice(0, 3).map((option: string, optIndex: number) => (
                            <Badge key={optIndex} variant="outline" className="text-xs">
                              {option}
                            </Badge>
                          ))}
                          {field.options.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{field.options.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingField(field);
                        setShowDialog(true);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteField(field.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {fields.length === 0 && (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No Custom Fields</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create custom fields to capture additional information in your tickets
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface CustomFieldFormProps {
  field: CustomField | null;
  onSave: (data: Partial<CustomField>) => void;
  onCancel: () => void;
}

const CustomFieldForm = ({ field, onSave, onCancel }: CustomFieldFormProps) => {
  const [formData, setFormData] = useState({
    name: field?.name || '',
    field_type: field?.field_type || 'text',
    label: field?.label || '',
    description: field?.description || '',
    required: field?.required ?? false,
    options: (Array.isArray(field?.options) ? field.options : []) as string[],
    default_value: field?.default_value || '',
    is_active: field?.is_active ?? true,
  });

  const [optionInput, setOptionInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      validation_rules: {},
    });
  };

  const addOption = () => {
    if (optionInput.trim() && !formData.options.includes(optionInput.trim())) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, optionInput.trim()]
      }));
      setOptionInput('');
    }
  };

  const removeOption = (optionToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter(option => option !== optionToRemove)
    }));
  };

  const showOptions = formData.field_type === 'select' || formData.field_type === 'multiselect';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="label">Field Label</Label>
          <Input
            id="label"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="name">Field Name (ID)</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
            placeholder="field_name"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="field_type">Field Type</Label>
        <Select
          value={formData.field_type}
          onValueChange={(value) => setFormData({ ...formData, field_type: value, options: [] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fieldTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  <type.icon className="h-4 w-4" />
                  {type.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
          placeholder="Help text for this field"
        />
      </div>

      {showOptions && (
        <div>
          <Label>Options</Label>
          <div className="flex gap-2 mt-1">
            <Input
              value={optionInput}
              onChange={(e) => setOptionInput(e.target.value)}
              placeholder="Add an option"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
            />
            <Button type="button" onClick={addOption}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {formData.options.map((option, index) => (
              <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeOption(option)}>
                {option} ×
              </Badge>
            ))}
          </div>
        </div>
      )}

      {!showOptions && formData.field_type !== 'checkbox' && (
        <div>
          <Label htmlFor="default_value">Default Value (Optional)</Label>
          <Input
            id="default_value"
            value={formData.default_value}
            onChange={(e) => setFormData({ ...formData, default_value: e.target.value })}
            placeholder="Default value for this field"
          />
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="required"
            checked={formData.required}
            onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
          />
          <Label htmlFor="required">Required Field</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active">Active</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {field ? 'Update Field' : 'Create Field'}
        </Button>
      </div>
    </form>
  );
};