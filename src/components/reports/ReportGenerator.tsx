import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  FileText, 
  Shield, 
  BarChart3, 
  CheckCircle,
  Play,
  Calendar,
  Users,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const ReportGenerator = () => {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [dateRange, setDateRange] = useState('7_days');
  const [selectedSections, setSelectedSections] = useState<string[]>([]);

  const reportTemplates = [
    {
      id: 'security_summary',
      name: 'Security Summary Report',
      type: 'security',
      icon: Shield,
      description: 'Comprehensive security overview with threat analysis',
      sections: ['threat_summary', 'incident_overview', 'security_events', 'recommendations']
    },
    {
      id: 'compliance_assessment',
      name: 'Compliance Assessment',
      type: 'compliance',
      icon: CheckCircle,
      description: 'Compliance status across frameworks with gap analysis',
      sections: ['compliance_overview', 'framework_status', 'gap_analysis', 'remediation_plan']
    },
    {
      id: 'performance_analytics',
      name: 'Performance Analytics',
      type: 'performance',
      icon: BarChart3,
      description: 'System performance metrics and operational insights',
      sections: ['system_health', 'response_times', 'user_activity', 'resource_utilization']
    },
    {
      id: 'executive_dashboard',
      name: 'Executive Dashboard',
      type: 'executive',
      icon: Users,
      description: 'High-level security posture for stakeholders',
      sections: ['executive_summary', 'risk_overview', 'key_metrics', 'strategic_recommendations']
    }
  ];

  const sectionLabels = {
    threat_summary: 'Threat Summary',
    incident_overview: 'Incident Overview',
    security_events: 'Security Events',
    recommendations: 'Recommendations',
    compliance_overview: 'Compliance Overview',
    framework_status: 'Framework Status',
    gap_analysis: 'Gap Analysis',
    remediation_plan: 'Remediation Plan',
    system_health: 'System Health',
    response_times: 'Response Times',
    user_activity: 'User Activity',
    resource_utilization: 'Resource Utilization',
    executive_summary: 'Executive Summary',
    risk_overview: 'Risk Overview',
    key_metrics: 'Key Metrics',
    strategic_recommendations: 'Strategic Recommendations'
  };

  const generateReport = async () => {
    if (!selectedTemplate || !reportTitle) {
      toast({
        title: "Missing Information",
        description: "Please select a template and enter a report title",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Report Generation Started",
      description: "Your report is being generated. You'll be notified when it's ready.",
    });

    // Here you would call your Supabase function to generate the report
    console.log('Generating report:', {
      template: selectedTemplate,
      title: reportTitle,
      description: reportDescription,
      dateRange,
      sections: selectedSections
    });
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = reportTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedSections(template.sections);
      setReportTitle(template.name);
      setReportDescription(template.description);
    }
  };

  const toggleSection = (section: string) => {
    setSelectedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Report Template</CardTitle>
          <CardDescription>Choose from our pre-built templates or create a custom report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTemplates.map((template) => {
              const IconComponent = template.icon;
              return (
                <Card 
                  key={template.id} 
                  className={`cursor-pointer transition-all hover-scale ${
                    selectedTemplate === template.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <IconComponent className="h-6 w-6 text-primary mt-1" />
                      <div className="flex-1">
                        <h4 className="font-semibold">{template.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                        <Badge variant="outline" className="mt-2">{template.type}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Report Configuration */}
      {selectedTemplate && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Configure Report</CardTitle>
            <CardDescription>Customize your report settings and parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Report Title</Label>
                <Input
                  id="title"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="Enter report title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateRange">Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1_day">Last 24 Hours</SelectItem>
                    <SelectItem value="7_days">Last 7 Days</SelectItem>
                    <SelectItem value="30_days">Last 30 Days</SelectItem>
                    <SelectItem value="90_days">Last 90 Days</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Add a description for this report"
                rows={3}
              />
            </div>

            {/* Section Selection */}
            <div className="space-y-3">
              <Label>Report Sections</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reportTemplates
                  .find(t => t.id === selectedTemplate)
                  ?.sections.map((section) => (
                    <div key={section} className="flex items-center space-x-2">
                      <Checkbox
                        id={section}
                        checked={selectedSections.includes(section)}
                        onCheckedChange={() => toggleSection(section)}
                      />
                      <Label 
                        htmlFor={section}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {sectionLabels[section as keyof typeof sectionLabels]}
                      </Label>
                    </div>
                  ))}
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-end">
              <Button onClick={generateReport} size="lg">
                <Play className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};