import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Plus, Edit, FileText, Calendar, Hash, CheckSquare, List } from "lucide-react";
import { useState } from "react";
import { VanguardAgent } from "@/hooks/useVanguardAgents";
import { format } from "date-fns";

interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'checkbox' | 'dropdown';
  value: any;
  options?: string[]; // For dropdown
}

interface DeviceCustomFieldsTabProps {
  agent: VanguardAgent;
  onAddField: () => void;
}

export function DeviceCustomFieldsTab({ agent, onAddField }: DeviceCustomFieldsTabProps) {
  // Extract custom fields from agent config
  const customFields: CustomField[] = agent.config?.custom_fields || [];

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <FileText className="h-4 w-4 text-gray-400" />;
      case 'number':
        return <Hash className="h-4 w-4 text-blue-400" />;
      case 'date':
        return <Calendar className="h-4 w-4 text-green-400" />;
      case 'checkbox':
        return <CheckSquare className="h-4 w-4 text-purple-400" />;
      case 'dropdown':
        return <List className="h-4 w-4 text-orange-400" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatValue = (field: CustomField) => {
    if (field.value === null || field.value === undefined) return "—";
    
    switch (field.type) {
      case 'checkbox':
        return field.value ? "Yes" : "No";
      case 'date':
        return format(new Date(field.value), "MMM d, yyyy");
      default:
        return String(field.value);
    }
  };

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-medium text-gray-900">Custom Fields</CardTitle>
          <p className="text-xs text-gray-500 mt-1">
            Agent-related custom fields: text, number, date, checkbox, dropdown
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={onAddField} className="gap-1">
          <Plus className="h-4 w-4" />
          Add field
        </Button>
      </CardHeader>
      <CardContent>
        {customFields.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-2">No custom fields configured</p>
            <p className="text-xs text-gray-400 mb-4">
              Add custom fields to track additional device information
            </p>
            <Button variant="outline" size="sm" onClick={onAddField} className="gap-1">
              <Plus className="h-4 w-4" />
              Add first field
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">Type</TableHead>
                <TableHead>Field Name</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="w-[60px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customFields.map((field) => (
                <TableRow key={field.id}>
                  <TableCell>{getFieldIcon(field.type)}</TableCell>
                  <TableCell className="font-medium">{field.name}</TableCell>
                  <TableCell className="text-gray-700">{formatValue(field)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Edit className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
