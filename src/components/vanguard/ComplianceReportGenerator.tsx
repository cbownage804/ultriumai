import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Download, 
  Calendar, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  FileDown,
  Loader2,
  BarChart3,
  PieChart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';

interface ComplianceScan {
  id: string;
  framework_type: string;
  scan_status: string;
  compliance_score: number | null;
  passed_checks: number | null;
  failed_checks: number | null;
  total_checks: number | null;
  completed_at: string | null;
  created_at: string;
}

interface CheckResult {
  id: string;
  check_id: string;
  check_name: string;
  category: string | null;
  status: string;
  severity: string | null;
  actual_value: string | null;
  expected_value: string | null;
  remediation_steps: string | null;
}

const FRAMEWORK_NAMES: Record<string, string> = {
  cis_windows: 'CIS Windows Benchmark',
  cis_linux: 'CIS Linux Benchmark',
  nist_800_53: 'NIST 800-53',
  pci_dss: 'PCI DSS',
  hipaa: 'HIPAA',
  iso_27001: 'ISO 27001',
};

export function ComplianceReportGenerator() {
  const { user } = useAuth();
  const [scans, setScans] = useState<ComplianceScan[]>([]);
  const [selectedScanId, setSelectedScanId] = useState<string>('');
  const [checkResults, setCheckResults] = useState<CheckResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [includeEvidence, setIncludeEvidence] = useState(true);
  const [includeRemediation, setIncludeRemediation] = useState(true);
  const [reportTitle, setReportTitle] = useState('Compliance Assessment Report');

  useEffect(() => {
    if (user) {
      loadScans();
    }
  }, [user]);

  useEffect(() => {
    if (selectedScanId) {
      loadCheckResults(selectedScanId);
    }
  }, [selectedScanId]);

  const loadScans = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('compliance_scan_jobs')
        .select('*')
        .eq('user_id', user.id)
        .eq('scan_status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setScans(data || []);
      
      if (data && data.length > 0) {
        setSelectedScanId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading scans:', error);
      toast.error('Failed to load scan history');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCheckResults = async (scanId: string) => {
    try {
      const { data, error } = await supabase
        .from('compliance_check_results')
        .select('*')
        .eq('job_id', scanId)
        .order('category', { ascending: true });

      if (error) throw error;
      setCheckResults(data || []);
    } catch (error) {
      console.error('Error loading check results:', error);
    }
  };

  const selectedScan = scans.find(s => s.id === selectedScanId);

  const generatePDFReport = async () => {
    if (!selectedScan) {
      toast.error('Please select a scan');
      return;
    }

    setIsGenerating(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let y = margin;

      // Helper function to add new page if needed
      const checkPageBreak = (height: number) => {
        if (y + height > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
      };

      // Title
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(reportTitle, pageWidth / 2, y, { align: 'center' });
      y += 15;

      // Framework and date
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(
        FRAMEWORK_NAMES[selectedScan.framework_type] || selectedScan.framework_type,
        pageWidth / 2,
        y,
        { align: 'center' }
      );
      y += 10;

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(
        `Generated: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`,
        pageWidth / 2,
        y,
        { align: 'center' }
      );
      y += 20;

      // Executive Summary box
      doc.setTextColor(0);
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, pageWidth - 2 * margin, 45, 'F');
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Executive Summary', margin + 5, y + 10);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      const score = selectedScan.compliance_score || 0;
      const passed = selectedScan.passed_checks || 0;
      const failed = selectedScan.failed_checks || 0;
      const total = selectedScan.total_checks || 0;

      doc.text(`Compliance Score: ${score}%`, margin + 5, y + 22);
      doc.text(`Passed Checks: ${passed}`, margin + 5, y + 32);
      doc.text(`Failed Checks: ${failed}`, margin + 80, y + 32);
      doc.text(`Total Checks: ${total}`, margin + 150, y + 32);
      
      // Risk level
      let riskLevel = 'Low';
      let riskColor = [0, 128, 0];
      if (score < 70) {
        riskLevel = 'High';
        riskColor = [220, 53, 69];
      } else if (score < 85) {
        riskLevel = 'Medium';
        riskColor = [255, 193, 7];
      }
      
      doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
      doc.text(`Risk Level: ${riskLevel}`, margin + 5, y + 42);
      doc.setTextColor(0);
      
      y += 55;

      // Failed Checks Section
      const failedChecks = checkResults.filter(c => c.status === 'fail');
      
      if (failedChecks.length > 0) {
        checkPageBreak(20);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Failed Checks (Requires Remediation)', margin, y);
        y += 10;

        for (const check of failedChecks) {
          checkPageBreak(40);
          
          // Check header
          doc.setFillColor(254, 226, 226);
          doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(`${check.check_id}: ${check.check_name}`, margin + 2, y + 6);
          y += 10;

          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          
          if (check.category) {
            doc.text(`Category: ${check.category}`, margin + 2, y + 4);
            y += 6;
          }
          
          if (check.severity) {
            doc.text(`Severity: ${check.severity.toUpperCase()}`, margin + 2, y + 4);
            y += 6;
          }

          if (includeEvidence && check.actual_value) {
            doc.text(`Actual: ${check.actual_value.substring(0, 80)}`, margin + 2, y + 4);
            y += 6;
          }

          if (check.expected_value) {
            doc.text(`Expected: ${check.expected_value.substring(0, 80)}`, margin + 2, y + 4);
            y += 6;
          }

          if (includeRemediation && check.remediation_steps) {
            const remText = doc.splitTextToSize(
              `Remediation: ${check.remediation_steps}`,
              pageWidth - 2 * margin - 4
            );
            checkPageBreak(remText.length * 5);
            doc.text(remText, margin + 2, y + 4);
            y += remText.length * 5 + 2;
          }

          y += 5;
        }
      }

      // Passed Checks Summary
      const passedChecks = checkResults.filter(c => c.status === 'pass');
      
      if (passedChecks.length > 0) {
        checkPageBreak(30);
        y += 10;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Passed Checks (${passedChecks.length})`, margin, y);
        y += 10;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        // Group by category
        const byCategory: Record<string, CheckResult[]> = {};
        passedChecks.forEach(check => {
          const cat = check.category || 'Other';
          if (!byCategory[cat]) byCategory[cat] = [];
          byCategory[cat].push(check);
        });

        for (const [category, checks] of Object.entries(byCategory)) {
          checkPageBreak(15);
          doc.setFont('helvetica', 'bold');
          doc.text(`${category} (${checks.length} passed)`, margin + 2, y + 4);
          y += 8;
          
          doc.setFont('helvetica', 'normal');
          for (const check of checks.slice(0, 10)) {
            checkPageBreak(6);
            doc.text(`✓ ${check.check_id}: ${check.check_name.substring(0, 70)}`, margin + 5, y + 4);
            y += 5;
          }
          if (checks.length > 10) {
            doc.text(`  ... and ${checks.length - 10} more`, margin + 5, y + 4);
            y += 5;
          }
          y += 3;
        }
      }

      // Footer on last page
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Report generated by Vanguard | ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );

      // Save the PDF
      const filename = `compliance-report-${selectedScan.framework_type}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(filename);
      
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportCSV = () => {
    if (!checkResults.length) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Check ID', 'Check Name', 'Category', 'Status', 'Severity', 'Actual Value', 'Expected Value', 'Remediation'];
    const rows = checkResults.map(c => [
      c.check_id,
      c.check_name,
      c.category || '',
      c.status,
      c.severity || '',
      (c.actual_value || '').replace(/"/g, '""'),
      (c.expected_value || '').replace(/"/g, '""'),
      (c.remediation_steps || '').replace(/"/g, '""'),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(r => r.map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-results-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('CSV exported');
  };

  const passedCount = checkResults.filter(c => c.status === 'pass').length;
  const failedCount = checkResults.filter(c => c.status === 'fail').length;
  const errorCount = checkResults.filter(c => c.status === 'error').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Compliance Report Generator
        </CardTitle>
        <CardDescription>Generate detailed compliance reports from scan results</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scan Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Select Scan</Label>
            <Select value={selectedScanId} onValueChange={setSelectedScanId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a completed scan" />
              </SelectTrigger>
              <SelectContent>
                {scans.map(scan => (
                  <SelectItem key={scan.id} value={scan.id}>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span>{FRAMEWORK_NAMES[scan.framework_type] || scan.framework_type}</span>
                      <span className="text-muted-foreground text-xs">
                        {scan.completed_at && format(new Date(scan.completed_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Report Title</Label>
            <Input
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="Report title"
            />
          </div>
        </div>

        {/* Scan Summary */}
        {selectedScan && (
          <div className="p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Scan Summary</h3>
              <Badge variant={selectedScan.compliance_score && selectedScan.compliance_score >= 85 ? 'default' : 'destructive'}>
                Score: {selectedScan.compliance_score || 0}%
              </Badge>
            </div>
            
            <Progress 
              value={selectedScan.compliance_score || 0} 
              className="h-2 mb-4"
            />

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success mx-auto mb-1" />
                <p className="text-2xl font-bold text-success">{passedCount}</p>
                <p className="text-xs text-muted-foreground">Passed</p>
              </div>
              <div className="p-3 rounded-lg bg-destructive/10">
                <XCircle className="h-5 w-5 text-destructive mx-auto mb-1" />
                <p className="text-2xl font-bold text-destructive">{failedCount}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
              <div className="p-3 rounded-lg bg-warning/10">
                <AlertTriangle className="h-5 w-5 text-warning mx-auto mb-1" />
                <p className="text-2xl font-bold text-warning">{errorCount}</p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
            </div>
          </div>
        )}

        {/* Report Options */}
        <div className="space-y-3">
          <Label>Report Options</Label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={includeEvidence}
                onCheckedChange={(checked) => setIncludeEvidence(!!checked)}
              />
              <span className="text-sm">Include Evidence</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={includeRemediation}
                onCheckedChange={(checked) => setIncludeRemediation(!!checked)}
              />
              <span className="text-sm">Include Remediation Steps</span>
            </label>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={generatePDFReport}
            disabled={!selectedScan || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                Generate PDF Report
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={exportCSV}
            disabled={!checkResults.length}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Recent Failed Checks Preview */}
        {failedCount > 0 && (
          <div className="space-y-2">
            <Label>Top Failed Checks (Preview)</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {checkResults
                .filter(c => c.status === 'fail')
                .slice(0, 5)
                .map(check => (
                  <div key={check.id} className="p-3 rounded-lg border bg-destructive/5 border-destructive/20">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{check.check_name}</p>
                        <p className="text-xs text-muted-foreground">{check.check_id}</p>
                      </div>
                      {check.severity && (
                        <Badge variant="destructive" className="text-xs">
                          {check.severity}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
