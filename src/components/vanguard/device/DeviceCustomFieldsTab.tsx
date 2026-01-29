import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Plus, Edit, FileText, Calendar, Hash, CheckSquare, List, Trash2, Tags } from "lucide-react";
import { VanguardAgent } from "@/hooks/useVanguardAgents";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  onDeleteField?: (id: string) => Promise<void>;
}

export function DeviceCustomFieldsTab({ agent, onAddField, onDeleteField }: DeviceCustomFieldsTabProps) {
  // Extract custom fields from agent config
  const customFields: CustomField[] = agent.config?.custom_fields || [];

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <FileText className="h-4 w-4 text-cyan-400" />;
      case 'number':
        return <Hash className="h-4 w-4 text-blue-400" />;
      case 'date':
        return <Calendar className="h-4 w-4 text-green-400" />;
      case 'checkbox':
        return <CheckSquare className="h-4 w-4 text-purple-400" />;
      case 'dropdown':
        return <List className="h-4 w-4 text-orange-400" />;
      default:
        return <FileText className="h-4 w-4 text-slate-400" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      text: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      number: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      date: "bg-green-500/20 text-green-400 border-green-500/30",
      checkbox: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      dropdown: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    };
    return colors[type] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
  };

  const formatValue = (field: CustomField) => {
    if (field.value === null || field.value === undefined) return "—";
    
    switch (field.type) {
      case 'checkbox':
        return (
          <Badge className={cn(
            field.value 
              ? "bg-green-500/20 text-green-400 border-green-500/30" 
              : "bg-slate-500/20 text-slate-400 border-slate-500/30"
          )}>
            {field.value ? "Yes" : "No"}
          </Badge>
        );
      case 'date':
        return format(new Date(field.value), "MMM d, yyyy");
      default:
        return String(field.value);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <Tags className="h-4 w-4" />
            Custom Fields
          </CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            Agent-related custom fields: text, number, date, checkbox, dropdown
          </p>
        </div>
        <Button 
          size="sm" 
          onClick={onAddField} 
          className="gap-1 bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <Plus className="h-4 w-4" />
          Add field
        </Button>
      </CardHeader>
      <CardContent>
        {customFields.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
              <Tags className="h-8 w-8 text-slate-600" />
            </div>
            <p className="text-sm text-slate-400 mb-2">No custom fields configured</p>
            <p className="text-xs text-slate-500 mb-4">
              Add custom fields to track additional device information
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onAddField} 
              className="gap-1 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            >
              <Plus className="h-4 w-4" />
              Add first field
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-cyan-500/20 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-cyan-500/20 hover:bg-transparent">
                  <TableHead className="text-slate-400 w-[100px]">Type</TableHead>
                  <TableHead className="text-slate-400">Field Name</TableHead>
                  <TableHead className="text-slate-400">Value</TableHead>
                  <TableHead className="text-slate-400 w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customFields.map((field) => (
                  <TableRow key={field.id} className="border-cyan-500/10 hover:bg-cyan-500/5">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getFieldIcon(field.type)}
                        <Badge className={getTypeBadge(field.type)} variant="outline">
                          {field.type}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-slate-200">{field.name}</TableCell>
                    <TableCell className="text-slate-300">{formatValue(field)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 hover:bg-cyan-500/20 hover:text-cyan-400"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 hover:bg-red-500/20 hover:text-red-400"
                          onClick={async () => {
                            if (onDeleteField) {
                              await onDeleteField(field.id);
                            } else {
                              toast.success("Field deleted");
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
