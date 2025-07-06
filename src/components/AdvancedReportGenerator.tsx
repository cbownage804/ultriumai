import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useComplianceManager } from "@/hooks/useComplianceManager";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Calendar, Filter, Settings, Loader2 } from "lucide-react";

interface ReportConfig {
  framework: string;
  sections: string[];
  includeEvidence: boolean;
  includeAlerts: boolean;
  includeRecommendations: boolean;
  format: 'pdf' | 'excel' | 'json';
  dateRange: '30d' | '90d' | '1y' | 'all';
}

export const AdvancedReportGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    framework: 'soc2',
    sections: ['summary', 'controls', 'evidence'],
    includeEvidence: true,
    includeAlerts: true,
    includeRecommendations: true,
    format: 'pdf',
    dateRange: '90d'
  });
  
  const { generateComplianceReport } = useComplianceManager();
  const { toast } = useToast();

  const frameworks = [
    { value: 'soc2', label: 'SOC 2 Type II', description: 'Security, Availability, Processing Integrity, Confidentiality, Privacy' },
    { value: 'hipaa', label: 'HIPAA', description: 'Health Insurance Portability and Accountability Act' },
    { value: 'pci_dss', label: 'PCI DSS', description: 'Payment Card Industry Data Security Standard' },
    { value: 'gdpr', label: 'GDPR', description: 'General Data Protection Regulation' },
    { value: 'iso27001', label: 'ISO 27001', description: 'Information Security Management Systems' }
  ];

  const reportSections = [
    { id: 'summary', label: 'Executive Summary', description: 'High-level compliance overview' },
    { id: 'controls', label: 'Control Status', description: 'Detailed control implementation status' },
    { id: 'evidence', label: 'Evidence Inventory', description: 'List of collected evidence' },
    { id: 'gaps', label: 'Gap Analysis', description: 'Identified compliance gaps' },
    { id: 'recommendations', label: 'Recommendations', description: 'Remediation guidance' },
    { id: 'timeline', label: 'Implementation Timeline', description: 'Suggested remediation timeline' }
  ];

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    try {
      const result = await generateComplianceReport(reportConfig.framework);
      
      if (result.success) {
        // In a real implementation, this would generate and download the actual report
        const reportData = {
          ...result.report,
          config: reportConfig,
          generatedAt: new Date().toISOString()
        };
        
        // Simulate file download
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportConfig.framework}_compliance_report_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Report Generated",
          description: "Your compliance report has been downloaded successfully"
        });
      } else {
        toast({
          title: "Report Generation Failed",
          description: result.error || "Failed to generate report",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const updateSections = (sectionId: string, checked: boolean) => {
    if (checked) {
      setReportConfig(prev => ({
        ...prev,
        sections: [...prev.sections, sectionId]
      }));
    } else {
      setReportConfig(prev => ({
        ...prev,
        sections: prev.sections.filter(s => s !== sectionId)
      }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Advanced Report Generator
        </CardTitle>
        <CardDescription>
          Generate comprehensive compliance reports with custom configurations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Framework Selection */}
        <div className="space-y-2">
          <Label>Compliance Framework</Label>
          <Select 
            value={reportConfig.framework} 
            onValueChange={(value) => setReportConfig(prev => ({ ...prev, framework: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {frameworks.map(framework => (
                <SelectItem key={framework.value} value={framework.value}>
                  <div>
                    <div className="font-medium">{framework.label}</div>
                    <div className="text-xs text-muted-foreground">{framework.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Report Sections */}
        <div className="space-y-3">
          <Label>Report Sections</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reportSections.map(section => (
              <div key={section.id} className="flex items-start space-x-2">
                <Checkbox
                  id={section.id}
                  checked={reportConfig.sections.includes(section.id)}
                  onCheckedChange={(checked) => updateSections(section.id, checked as boolean)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor={section.id} className="text-sm font-medium">
                    {section.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {section.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Additional Options */}
        <div className="space-y-4">
          <Label>Additional Options</Label>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-evidence"
                checked={reportConfig.includeEvidence}
                onCheckedChange={(checked) => 
                  setReportConfig(prev => ({ ...prev, includeEvidence: checked as boolean }))
                }
              />
              <Label htmlFor="include-evidence" className="text-sm">
                Include Evidence Files
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-alerts"
                checked={reportConfig.includeAlerts}
                onCheckedChange={(checked) => 
                  setReportConfig(prev => ({ ...prev, includeAlerts: checked as boolean }))
                }
              />
              <Label htmlFor="include-alerts" className="text-sm">
                Include Active Alerts
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-recommendations"
                checked={reportConfig.includeRecommendations}
                onCheckedChange={(checked) => 
                  setReportConfig(prev => ({ ...prev, includeRecommendations: checked as boolean }))
                }
              />
              <Label htmlFor="include-recommendations" className="text-sm">
                Include Recommendations
              </Label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Format and Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Report Format</Label>
            <Select 
              value={reportConfig.format} 
              onValueChange={(value: 'pdf' | 'excel' | 'json') => 
                setReportConfig(prev => ({ ...prev, format: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Document</SelectItem>
                <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                <SelectItem value="json">JSON Data</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Select 
              value={reportConfig.dateRange} 
              onValueChange={(value: '30d' | '90d' | '1y' | 'all') => 
                setReportConfig(prev => ({ ...prev, dateRange: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Generate Button */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Report will include {reportConfig.sections.length} sections for {frameworks.find(f => f.value === reportConfig.framework)?.label}
          </div>
          <Button 
            onClick={handleGenerateReport} 
            disabled={isGenerating || reportConfig.sections.length === 0}
            className="min-w-32"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};