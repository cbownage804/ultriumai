import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, FileText, Sheet, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';

interface ScanResult {
  type: 'email' | 'document' | 'url';
  content: string;
  safe: boolean;
  risk_level: string;
  threats_detected: string[];
  reputation_score: number;
  scan_details: any;
  scan_date: string;
  recommendations: string[];
}

interface ScanReportExportProps {
  results: ScanResult[];
  scanType?: string;
}

export function ScanReportExport({ results, scanType }: ScanReportExportProps) {
  const { toast } = useToast();
  const [exporting, setExporting] = useState<string | null>(null);

  const exportToCSV = () => {
    setExporting('csv');
    try {
      const headers = ['Type', 'Content', 'Safe', 'Risk Level', 'Threats', 'Reputation Score', 'Scan Date', 'Recommendations'];
      
      const rows = results.map(result => [
        result.type,
        `"${result.content.replace(/"/g, '""')}"`,
        result.safe ? 'Yes' : 'No',
        result.risk_level,
        `"${result.threats_detected.join('; ').replace(/"/g, '""')}"`,
        result.reputation_score.toString(),
        new Date(result.scan_date).toLocaleString(),
        `"${result.recommendations.join('; ').replace(/"/g, '""')}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `safescan-report-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast({
        title: "Export complete",
        description: "CSV report downloaded successfully"
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to generate CSV",
        variant: "destructive"
      });
    } finally {
      setExporting(null);
    }
  };

  const exportToPDF = () => {
    setExporting('pdf');
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFillColor(220, 38, 38); // Red
      doc.rect(0, 0, pageWidth, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text('SafeScan Security Report', 14, 20);
      
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);

      // Summary
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text('Summary', 14, 45);
      
      const totalScans = results.length;
      const safeCount = results.filter(r => r.safe).length;
      const threatCount = results.filter(r => !r.safe).length;
      const criticalCount = results.filter(r => r.risk_level === 'critical').length;
      
      doc.setFontSize(10);
      doc.text(`Total Scans: ${totalScans}`, 14, 55);
      doc.text(`Safe: ${safeCount}`, 14, 62);
      doc.setTextColor(220, 38, 38);
      doc.text(`Threats Detected: ${threatCount}`, 14, 69);
      doc.text(`Critical: ${criticalCount}`, 14, 76);

      // Results table
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text('Scan Results', 14, 95);

      let yPos = 105;
      doc.setFontSize(9);

      // Table header
      doc.setFillColor(240, 240, 240);
      doc.rect(14, yPos - 5, pageWidth - 28, 10, 'F');
      doc.text('Type', 16, yPos);
      doc.text('Content', 35, yPos);
      doc.text('Risk', 120, yPos);
      doc.text('Threats', 145, yPos);
      yPos += 10;

      // Table rows
      for (const result of results) {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        const riskColor = 
          result.risk_level === 'critical' ? [220, 38, 38] :
          result.risk_level === 'high' ? [249, 115, 22] :
          result.risk_level === 'medium' ? [234, 179, 8] :
          result.safe ? [34, 197, 94] : [107, 114, 128];

        doc.setTextColor(0, 0, 0);
        doc.text(result.type.toUpperCase(), 16, yPos);
        doc.text(result.content.substring(0, 40) + (result.content.length > 40 ? '...' : ''), 35, yPos);
        
        doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
        doc.text(result.risk_level.toUpperCase(), 120, yPos);
        
        doc.setTextColor(0, 0, 0);
        doc.text(result.threats_detected.length.toString(), 145, yPos);
        
        yPos += 8;
      }

      // Recommendations
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      yPos += 10;
      doc.setFontSize(14);
      doc.text('Recommendations', 14, yPos);
      yPos += 10;

      doc.setFontSize(9);
      const allRecommendations = [...new Set(results.flatMap(r => r.recommendations))].slice(0, 10);
      for (const rec of allRecommendations) {
        if (yPos > 280) break;
        doc.text(`• ${rec.substring(0, 80)}`, 16, yPos);
        yPos += 6;
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('Generated by SafeScan™ - Powered by UltriumAI', 14, 290);

      doc.save(`safescan-report-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "Export complete",
        description: "PDF report downloaded successfully"
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Export failed",
        description: "Failed to generate PDF",
        variant: "destructive"
      });
    } finally {
      setExporting(null);
    }
  };

  const exportToJSON = () => {
    setExporting('json');
    try {
      const report = {
        generated_at: new Date().toISOString(),
        scan_type: scanType || 'mixed',
        summary: {
          total: results.length,
          safe: results.filter(r => r.safe).length,
          threats: results.filter(r => !r.safe).length,
          by_risk_level: {
            critical: results.filter(r => r.risk_level === 'critical').length,
            high: results.filter(r => r.risk_level === 'high').length,
            medium: results.filter(r => r.risk_level === 'medium').length,
            low: results.filter(r => r.risk_level === 'low').length,
            safe: results.filter(r => r.risk_level === 'safe').length
          }
        },
        results: results
      };

      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `safescan-report-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      toast({
        title: "Export complete",
        description: "JSON report downloaded successfully"
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to generate JSON",
        variant: "destructive"
      });
    } finally {
      setExporting(null);
    }
  };

  if (results.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="border-gray-700 text-gray-400 hover:text-white hover:bg-red-500/10"
          disabled={!!exporting}
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#141414] border-gray-800">
        <DropdownMenuItem onClick={exportToPDF} className="text-gray-300 hover:text-white cursor-pointer">
          <FileText className="h-4 w-4 mr-2 text-red-400" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV} className="text-gray-300 hover:text-white cursor-pointer">
          <Sheet className="h-4 w-4 mr-2 text-green-400" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON} className="text-gray-300 hover:text-white cursor-pointer">
          <FileText className="h-4 w-4 mr-2 text-blue-400" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
