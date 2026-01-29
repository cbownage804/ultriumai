import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, X } from "lucide-react";

type FieldType = 'text' | 'number' | 'date' | 'checkbox' | 'dropdown';

interface AddCustomFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (field: {
    name: string;
    type: FieldType;
    value: any;
    options?: string[];
  }) => Promise<void>;
}

export function AddCustomFieldDialog({ open, onOpenChange, onSave }: AddCustomFieldDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<FieldType>("text");
  const [textValue, setTextValue] = useState("");
  const [numberValue, setNumberValue] = useState("");
  const [dateValue, setDateValue] = useState("");
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState<string[]>([""]);
  const [selectedDropdownValue, setSelectedDropdownValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setName("");
    setType("text");
    setTextValue("");
    setNumberValue("");
    setDateValue("");
    setCheckboxValue(false);
    setDropdownOptions([""]);
    setSelectedDropdownValue("");
  };

  const getValue = () => {
    switch (type) {
      case 'text': return textValue;
      case 'number': return numberValue ? Number(numberValue) : null;
      case 'date': return dateValue || null;
      case 'checkbox': return checkboxValue;
      case 'dropdown': return selectedDropdownValue || null;
      default: return null;
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    
    setIsSaving(true);
    try {
      const value = getValue();
      const options = type === 'dropdown' 
        ? dropdownOptions.filter(o => o.trim()) 
        : undefined;
      
      await onSave({
        name: name.trim(),
        type,
        value,
        options,
      });
      
      resetForm();
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const addDropdownOption = () => {
    setDropdownOptions([...dropdownOptions, ""]);
  };

  const updateDropdownOption = (index: number, value: string) => {
    const newOptions = [...dropdownOptions];
    newOptions[index] = value;
    setDropdownOptions(newOptions);
  };

  const removeDropdownOption = (index: number) => {
    if (dropdownOptions.length > 1) {
      setDropdownOptions(dropdownOptions.filter((_, i) => i !== index));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Custom Field</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fieldName">Field Name *</Label>
            <Input
              id="fieldName"
              placeholder="e.g., Asset Tag, Purchase Date"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fieldType">Field Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as FieldType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
                <SelectItem value="dropdown">Dropdown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Value input based on type */}
          {type === 'text' && (
            <div className="space-y-2">
              <Label htmlFor="textValue">Value</Label>
              <Input
                id="textValue"
                placeholder="Enter text value"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
              />
            </div>
          )}

          {type === 'number' && (
            <div className="space-y-2">
              <Label htmlFor="numberValue">Value</Label>
              <Input
                id="numberValue"
                type="number"
                placeholder="Enter number"
                value={numberValue}
                onChange={(e) => setNumberValue(e.target.value)}
              />
            </div>
          )}

          {type === 'date' && (
            <div className="space-y-2">
              <Label htmlFor="dateValue">Value</Label>
              <Input
                id="dateValue"
                type="date"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
              />
            </div>
          )}

          {type === 'checkbox' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="checkboxValue"
                checked={checkboxValue}
                onCheckedChange={(checked) => setCheckboxValue(checked as boolean)}
              />
              <Label htmlFor="checkboxValue">Initial value (checked)</Label>
            </div>
          )}

          {type === 'dropdown' && (
            <div className="space-y-2">
              <Label>Dropdown Options</Label>
              {dropdownOptions.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => updateDropdownOption(index, e.target.value)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDropdownOption(index)}
                    disabled={dropdownOptions.length <= 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addDropdownOption}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Option
              </Button>
              
              {dropdownOptions.filter(o => o.trim()).length > 0 && (
                <div className="pt-2">
                  <Label>Selected Value</Label>
                  <Select value={selectedDropdownValue} onValueChange={setSelectedDropdownValue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select initial value" />
                    </SelectTrigger>
                    <SelectContent>
                      {dropdownOptions.filter(o => o.trim()).map((option, index) => (
                        <SelectItem key={index} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !name.trim()}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Field
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
