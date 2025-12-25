import { jsPDF } from 'jspdf';

// CSV Export utility
export const exportToCSV = (data: any[], filename: string, columns?: { key: string; label: string }[]) => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const cols = columns || Object.keys(data[0]).map(key => ({ key, label: key }));
  
  // Create header row
  const headers = cols.map(c => `"${c.label}"`).join(',');
  
  // Create data rows
  const rows = data.map(item => 
    cols.map(col => {
      const value = item[col.key];
      if (value === null || value === undefined) return '""';
      if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',')
  );

  const csv = [headers, ...rows].join('\n');
  
  // Download file
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

// PDF Report Generator
export const generateSecurityReport = async (reportData: {
  title: string;
  dateRange: { start: string; end: string };
  summary: {
    totalEvents: number;
    criticalEvents: number;
    highEvents: number;
    mediumEvents: number;
    lowEvents: number;
  };
  topThreats: { name: string; count: number; severity: string }[];
  recommendations: string[];
  complianceScore?: number;
  incidents?: { title: string; severity: string; status: string; date: string }[];
}) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Helper functions
  const addText = (text: string, x: number, y: number, options?: { fontSize?: number; fontStyle?: 'normal' | 'bold'; color?: [number, number, number] }) => {
    const { fontSize = 12, fontStyle = 'normal', color = [0, 0, 0] } = options || {};
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    doc.setTextColor(...color);
    doc.text(text, x, y);
    return y + fontSize * 0.5;
  };

  const addLine = (y: number) => {
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, pageWidth - 20, y);
    return y + 5;
  };

  // Header
  doc.setFillColor(30, 58, 138); // Blue header
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('VANGUARD SECURITY REPORT', pageWidth / 2, 25, { align: 'center' });
  
  yPos = 50;
  
  // Report info
  yPos = addText(reportData.title, 20, yPos, { fontSize: 16, fontStyle: 'bold' });
  yPos += 5;
  yPos = addText(`Report Period: ${reportData.dateRange.start} to ${reportData.dateRange.end}`, 20, yPos, { fontSize: 10, color: [100, 100, 100] });
  yPos = addText(`Generated: ${new Date().toLocaleString()}`, 20, yPos + 5, { fontSize: 10, color: [100, 100, 100] });
  yPos += 10;
  yPos = addLine(yPos);
  yPos += 5;

  // Executive Summary
  yPos = addText('EXECUTIVE SUMMARY', 20, yPos, { fontSize: 14, fontStyle: 'bold' });
  yPos += 10;

  // Summary boxes
  const boxWidth = 35;
  const summaryItems = [
    { label: 'Total Events', value: reportData.summary.totalEvents, color: [59, 130, 246] },
    { label: 'Critical', value: reportData.summary.criticalEvents, color: [239, 68, 68] },
    { label: 'High', value: reportData.summary.highEvents, color: [249, 115, 22] },
    { label: 'Medium', value: reportData.summary.mediumEvents, color: [234, 179, 8] },
    { label: 'Low', value: reportData.summary.lowEvents, color: [34, 197, 94] },
  ];

  summaryItems.forEach((item, i) => {
    const x = 20 + (i * (boxWidth + 5));
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    doc.roundedRect(x, yPos, boxWidth, 25, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(String(item.value), x + boxWidth / 2, yPos + 12, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, x + boxWidth / 2, yPos + 20, { align: 'center' });
  });

  yPos += 35;

  // Compliance Score if available
  if (reportData.complianceScore !== undefined) {
    yPos = addText('COMPLIANCE SCORE', 20, yPos, { fontSize: 14, fontStyle: 'bold' });
    yPos += 10;
    
    const scoreColor: [number, number, number] = reportData.complianceScore >= 80 ? [34, 197, 94] : 
                      reportData.complianceScore >= 60 ? [234, 179, 8] : [239, 68, 68];
    
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(20, yPos, 100, 20, 5, 5, 'F');
    doc.setFillColor(...scoreColor);
    doc.roundedRect(20, yPos, reportData.complianceScore, 20, 5, 5, 'F');
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${reportData.complianceScore}%`, 130, yPos + 14);
    
    yPos += 30;
  }

  // Top Threats
  if (reportData.topThreats.length > 0) {
    yPos = addText('TOP THREATS DETECTED', 20, yPos, { fontSize: 14, fontStyle: 'bold' });
    yPos += 10;

    reportData.topThreats.slice(0, 5).forEach((threat, i) => {
      const severityColors: Record<string, [number, number, number]> = {
        critical: [239, 68, 68],
        high: [249, 115, 22],
        medium: [234, 179, 8],
        low: [34, 197, 94],
      };
      
      doc.setFillColor(...(severityColors[threat.severity] || [100, 100, 100]));
      doc.circle(25, yPos, 3, 'F');
      yPos = addText(`${threat.name} (${threat.count} occurrences)`, 32, yPos + 1, { fontSize: 10 });
      yPos += 3;
    });
    
    yPos += 5;
  }

  // Recommendations
  if (reportData.recommendations.length > 0) {
    yPos = addLine(yPos);
    yPos += 5;
    yPos = addText('RECOMMENDATIONS', 20, yPos, { fontSize: 14, fontStyle: 'bold' });
    yPos += 10;

    reportData.recommendations.forEach((rec, i) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      yPos = addText(`${i + 1}. ${rec}`, 25, yPos, { fontSize: 10 });
      yPos += 5;
    });
  }

  // Recent Incidents
  if (reportData.incidents && reportData.incidents.length > 0) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }
    
    yPos = addLine(yPos);
    yPos += 5;
    yPos = addText('RECENT INCIDENTS', 20, yPos, { fontSize: 14, fontStyle: 'bold' });
    yPos += 10;

    // Table header
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPos, pageWidth - 40, 10, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Incident', 25, yPos + 7);
    doc.text('Severity', 100, yPos + 7);
    doc.text('Status', 130, yPos + 7);
    doc.text('Date', 160, yPos + 7);
    yPos += 12;

    doc.setFont('helvetica', 'normal');
    reportData.incidents.slice(0, 10).forEach((incident) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(incident.title.substring(0, 40), 25, yPos + 5);
      doc.text(incident.severity, 100, yPos + 5);
      doc.text(incident.status, 130, yPos + 5);
      doc.text(incident.date, 160, yPos + 5);
      yPos += 8;
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Vanguard Security Report - Page ${i} of ${pageCount}`, pageWidth / 2, 290, { align: 'center' });
    doc.text('CONFIDENTIAL', pageWidth - 20, 290, { align: 'right' });
  }

  // Save PDF
  doc.save(`vanguard_security_report_${new Date().toISOString().split('T')[0]}.pdf`);
};

// JSON Export
export const exportToJSON = (data: any, filename: string) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
};
