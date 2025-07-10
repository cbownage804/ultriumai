import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Shield, 
  BarChart3, 
  CheckCircle,
  Plus,
  Settings,
  Copy,
  Trash2,
  Users,
  Search,
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const ReportTemplates = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - replace with actual data from Supabase
  const [templates] = useState([
    {
      id: '1',
      name: 'Security Summary Report',
      description: 'Weekly security overview with threat analysis and incident summary',
      type: 'security',
      is_system_template: true,
      usage_count: 45,
      last_used: '2024-01-15',
      icon: Shield
    },
    {
      id: '2',
      name: 'Compliance Assessment Report',
      description: 'Compliance status across all frameworks with gap analysis',
      type: 'compliance',
      is_system_template: true,
      usage_count: 32,
      last_used: '2024-01-14',
      icon: CheckCircle
    },
    {
      id: '3',
      name: 'Performance Analytics Report',
      description: 'System performance metrics and operational insights',
      type: 'performance',
      is_system_template: true,
      usage_count: 28,
      last_used: '2024-01-13',
      icon: BarChart3
    },
    {
      id: '4',
      name: 'Executive Dashboard Report',
      description: 'High-level security posture for executive stakeholders',
      type: 'security',
      is_system_template: true,
      usage_count: 19,
      last_used: '2024-01-12',
      icon: Users
    },
    {
      id: '5',
      name: 'Custom Security Analysis',
      description: 'Custom template for detailed security analysis',
      type: 'custom',
      is_system_template: false,
      usage_count: 8,
      last_used: '2024-01-10',
      icon: FileText
    }
  ]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'security': return 'bg-red-100 text-red-800';
      case 'compliance': return 'bg-blue-100 text-blue-800';
      case 'performance': return 'bg-green-100 text-green-800';
      case 'custom': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const duplicateTemplate = (templateId: string) => {
    toast({
      title: "Template Duplicated",
      description: "Template has been copied to your custom templates",
    });
  };

  const deleteTemplate = (templateId: string) => {
    toast({
      title: "Template Deleted",
      description: "Template has been removed from your collection",
    });
  };

  const useTemplate = (templateId: string) => {
    toast({
      title: "Template Selected",
      description: "Redirecting to report generator...",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Report Templates</h2>
          <p className="text-muted-foreground">Manage and customize your report templates</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const IconComponent = template.icon;
          return (
            <Card key={template.id} className="hover-scale">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5 text-primary" />
                    <div className="flex items-center gap-2">
                      <Badge className={getTypeColor(template.type)}>
                        {template.type}
                      </Badge>
                      {template.is_system_template && (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      )}
                    </div>
                  </div>
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription className="text-sm">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Usage Stats */}
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Used {template.usage_count} times</span>
                    <span>Last: {new Date(template.last_used).toLocaleDateString()}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => useTemplate(template.id)}
                    >
                      Use Template
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => duplicateTemplate(template.id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {!template.is_system_template && (
                      <>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => deleteTemplate(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try adjusting your search terms' : 'Create your first custom template to get started'}
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};