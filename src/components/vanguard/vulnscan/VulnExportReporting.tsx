import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, Download, FileSpreadsheet, PieChart, 
  Shield, Calendar, CheckCircle, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import jsPDF from "jspdf";

interface Vulnerability {
  id: string;
  vulnerability_id: string;
  title: string;
  description: string | null;
  severity: string;
  cve_id: string | null;
  cvss_score: number | null;
  affected_service: string | null;
  port: number | null;
  solution: string | null;
  status: string | null;
  discovered_at: string;
  patched_at: string | null;
  device_id: string | null;
}

interface VulnExportReportingProps {
  vulnerabilities: Vulnerability[];
}

type ReportFormat = 'pdf' | 'csv' | 'json';
type ReportType = 'executive' | 'technical' | 'compliance' | 'full';

export function VulnExportReporting({ vulnerabilities }: VulnExportReportingProps) {
  const [reportFormat, setReportFormat] = useState<ReportFormat>('pdf');
  const [reportType, setReportType] = useState<ReportType>('executive');
  const [isGenerating, setIsGenerating] = useState(false);
  const [includeRemediation, setIncludeRemediation] = useState(true);
  const [includeTrends, setIncludeTrends] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(false);

  const stats = {
    total: vulnerabilities.length,
    critical: vulnerabilities.filter(v => v.severity.toLowerCase() === 'critical').length,
    high: vulnerabilities.filter(v => v.severity.toLowerCase() === 'high').length,
    medium: vulnerabilities.filter(v => v.severity.toLowerCase() === 'medium').length,
    low: vulnerabilities.filter(v => v.severity.toLowerCase() === 'low').length,
    open: vulnerabilities.filter(v => v.status !== 'patched').length,
    patched: vulnerabilities.filter(v => v.status === 'patched').length,
  };

  const generateCSV = () => {
    const headers = ['Title', 'Severity', 'CVE ID', 'CVSS Score', 'Service', 'Port', 'Status', 'Discovered', 'Patched', 'Solution'];
    const rows = vulnerabilities.map(v => [
      v.title,
      v.severity,
      v.cve_id || '',
      v.cvss_score?.toString() || '',
      v.affected_service || '',
      v.port?.toString() || '',
      v.status || 'open',
      format(new Date(v.discovered_at), 'yyyy-MM-dd'),
      v.patched_at ? format(new Date(v.patched_at), 'yyyy-MM-dd') : '',
      v.solution || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vulnerability-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateJSON = () => {
    const report = {
      generated_at: new Date().toISOString(),
      summary: stats,
      vulnerabilities: vulnerabilities.map(v => ({
        title: v.title,
        severity: v.severity,
        cve_id: v.cve_id,
        cvss_score: v.cvss_score,
        affected_service: v.affected_service,
        port: v.port,
        status: v.status,
        discovered_at: v.discovered_at,
        patched_at: v.patched_at,
        solution: v.solution,
        description: v.description,
      }))
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vulnerability-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;
    
    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Vulnerability Assessment Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${format(new Date(), 'PPpp')}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
    
    // Executive Summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 20, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const summaryText = [
      `Total Vulnerabilities: ${stats.total}`,
      `Critical: ${stats.critical} | High: ${stats.high} | Medium: ${stats.medium} | Low: ${stats.low}`,
      `Open: ${stats.open} | Remediated: ${stats.patched}`,
      `Remediation Rate: ${stats.total > 0 ? Math.round((stats.patched / stats.total) * 100) : 0}%`,
    ];
    
    summaryText.forEach(line => {
      doc.text(line, 20, yPos);
      yPos += 6;
    });
    yPos += 10;
    
    // Risk Overview
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Risk Overview', 20, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const riskScore = Math.round(
      (stats.critical * 10 + stats.high * 7 + stats.medium * 4 + stats.low * 1) / 
      Math.max(stats.total, 1)
    );
    
    doc.text(`Overall Risk Score: ${riskScore}/10`, 20, yPos);
    yPos += 6;
    doc.text(`Risk Level: ${riskScore >= 7 ? 'Critical' : riskScore >= 5 ? 'High' : riskScore >= 3 ? 'Medium' : 'Low'}`, 20, yPos);
    yPos += 15;
    
    // Critical/High Vulnerabilities
    if (reportType !== 'executive' || includeDetails) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Critical & High Severity Findings', 20, yPos);
      yPos += 8;
      
      const criticalHighVulns = vulnerabilities
        .filter(v => ['critical', 'high'].includes(v.severity.toLowerCase()))
        .slice(0, 15);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      criticalHighVulns.forEach(v => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFont('helvetica', 'bold');
        doc.text(`[${v.severity.toUpperCase()}] ${v.title.substring(0, 60)}`, 20, yPos);
        yPos += 5;
        
        doc.setFont('helvetica', 'normal');
        if (v.cve_id) {
          doc.text(`CVE: ${v.cve_id} | CVSS: ${v.cvss_score || 'N/A'}`, 25, yPos);
          yPos += 5;
        }
        if (v.affected_service) {
          doc.text(`Service: ${v.affected_service} ${v.port ? `(Port ${v.port})` : ''}`, 25, yPos);
          yPos += 5;
        }
        yPos += 3;
      });
    }
    
    // Recommendations
    if (includeRemediation) {
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }
      
      yPos += 5;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Recommendations', 20, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const recommendations = [
        '1. Prioritize patching critical vulnerabilities immediately',
        '2. Schedule high-severity fixes within 7 days',
        '3. Review and update security configurations',
        '4. Implement network segmentation for critical services',
        '5. Enable continuous vulnerability monitoring',
      ];
      
      recommendations.forEach(rec => {
        doc.text(rec, 20, yPos);
        yPos += 6;
      });
    }
    
    doc.save(`vulnerability-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      switch (reportFormat) {
        case 'csv':
          generateCSV();
          break;
        case 'json':
          generateJSON();
          break;
        case 'pdf':
        default:
          generatePDF();
          break;
      }
      
      toast.success(`${reportFormat.toUpperCase()} report generated successfully`);
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Export */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => { setReportFormat('pdf'); handleGenerateReport(); }}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <FileText className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-medium">PDF Report</h3>
                <p className="text-sm text-muted-foreground">Executive summary format</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => { setReportFormat('csv'); handleGenerateReport(); }}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <FileSpreadsheet className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-medium">CSV Export</h3>
                <p className="text-sm text-muted-foreground">Spreadsheet format</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => { setReportFormat('json'); handleGenerateReport(); }}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-medium">JSON Export</h3>
                <p className="text-sm text-muted-foreground">Machine-readable format</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom Report Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Custom Report Builder
          </CardTitle>
          <CardDescription>
            Generate a customized vulnerability report
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Report Format</Label>
              <Select value={reportFormat} onValueChange={(v) => setReportFormat(v as ReportFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                  <SelectItem value="json">JSON Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="executive">Executive Summary</SelectItem>
                  <SelectItem value="technical">Technical Detail</SelectItem>
                  <SelectItem value="compliance">Compliance Report</SelectItem>
                  <SelectItem value="full">Full Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label>Include Sections</Label>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remediation" 
                  checked={includeRemediation}
                  onCheckedChange={(c) => setIncludeRemediation(!!c)}
                />
                <Label htmlFor="remediation" className="cursor-pointer">
                  Remediation Recommendations
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="trends" 
                  checked={includeTrends}
                  onCheckedChange={(c) => setIncludeTrends(!!c)}
                />
                <Label htmlFor="trends" className="cursor-pointer">
                  Trend Analysis
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="details" 
                  checked={includeDetails}
                  onCheckedChange={(c) => setIncludeDetails(!!c)}
                />
                <Label htmlFor="details" className="cursor-pointer">
                  Full Vulnerability Details
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Report Preview */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h4 className="font-medium">Report Preview</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Vulnerabilities:</span>
                <span className="ml-2 font-medium">{stats.total}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Critical:</span>
                <span className="ml-2 font-medium text-red-500">{stats.critical}</span>
              </div>
              <div>
                <span className="text-muted-foreground">High:</span>
                <span className="ml-2 font-medium text-orange-500">{stats.high}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Open:</span>
                <span className="ml-2 font-medium">{stats.open}</span>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleGenerateReport} 
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate {reportFormat.toUpperCase()} Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Compliance Mapping */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Compliance Mapping
          </CardTitle>
          <CardDescription>
            Map vulnerabilities to compliance frameworks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge>PCI DSS</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {stats.critical + stats.high} findings may affect PCI compliance
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge>HIPAA</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {stats.critical} critical findings require immediate attention
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge>SOC 2</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {stats.open} open findings impact security controls
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
