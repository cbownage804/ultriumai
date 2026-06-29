/**
 * PDF Export Utilities for Wrayth Reports
 */

import jsPDF from 'jspdf';

interface ThreatData {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  date: string;
  status: string;
  confidence: number;
}

interface AssetData {
  id: string;
  type: string;
  value: string;
  threatsFound: number;
  lastScan: string;
}

interface ReportConfig {
  title: string;
  subtitle?: string;
  generatedBy?: string;
  dateRange?: { start: string; end: string };
}

const COLORS = {
  primary: '#7c3aed', // violet-600
  danger: '#ef4444',
  warning: '#f59e0b',
  success: '#22c55e',
  muted: '#6b7280',
  background: '#f9fafb'
};

export const generateExecutiveSummaryPDF = (
  threats: ThreatData[],
  assets: AssetData[],
  config: ReportConfig
): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFillColor(124, 58, 237); // violet-600
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(config.title, 20, 25);
  
  if (config.subtitle) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(config.subtitle, 20, 35);
  }

  yPos = 55;

  // Report metadata
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, yPos);
  if (config.generatedBy) {
    doc.text(`By: ${config.generatedBy}`, 20, yPos + 6);
    yPos += 6;
  }
  yPos += 15;

  // Executive Summary Section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', 20, yPos);
  yPos += 10;

  // Metrics cards
  const criticalThreats = threats.filter(t => t.severity === 'critical').length;
  const highThreats = threats.filter(t => t.severity === 'high').length;
  const totalAssets = assets.length;
  const assetsWithThreats = assets.filter(a => a.threatsFound > 0).length;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  const summaryItems = [
    `• Total Threats Detected: ${threats.length}`,
    `• Critical Severity: ${criticalThreats}`,
    `• High Severity: ${highThreats}`,
    `• Monitored Assets: ${totalAssets}`,
    `• Assets with Exposures: ${assetsWithThreats}`,
    `• Overall Risk Level: ${criticalThreats > 0 ? 'Critical' : highThreats > 0 ? 'High' : 'Moderate'}`
  ];

  summaryItems.forEach(item => {
    doc.text(item, 25, yPos);
    yPos += 7;
  });
  yPos += 10;

  // Threats Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Threat Intelligence', 20, yPos);
  yPos += 10;

  if (threats.length === 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(107, 114, 128);
    doc.text('No threats detected in the reporting period.', 25, yPos);
    yPos += 15;
  } else {
    // Show top threats
    const topThreats = threats.slice(0, 5);
    topThreats.forEach((threat, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // Severity indicator
      const severityColors: Record<string, string> = {
        critical: '#ef4444',
        high: '#f59e0b',
        medium: '#eab308',
        low: '#22c55e'
      };
      
      doc.setFillColor(severityColors[threat.severity] || '#6b7280');
      doc.circle(25, yPos - 2, 3, 'F');

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(threat.title, 32, yPos);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      
      const threatDetails = `${threat.severity.toUpperCase()} | ${threat.source} | ${new Date(threat.date).toLocaleDateString()} | Confidence: ${threat.confidence}%`;
      doc.text(threatDetails, 32, yPos + 5);
      
      // Description (truncated)
      const desc = threat.description.length > 100 
        ? threat.description.substring(0, 100) + '...' 
        : threat.description;
      doc.text(desc, 32, yPos + 10);
      
      yPos += 20;
    });
  }
  yPos += 10;

  // Assets Section
  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Monitored Assets', 20, yPos);
  yPos += 10;

  if (assets.length === 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(107, 114, 128);
    doc.text('No assets currently being monitored.', 25, yPos);
  } else {
    assets.slice(0, 10).forEach(asset => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`${asset.type.toUpperCase()}: ${asset.value}`, 25, yPos);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(asset.threatsFound > 0 ? '#ef4444' : '#22c55e');
      doc.text(`${asset.threatsFound} threat(s) found`, 140, yPos);
      
      yPos += 8;
    });
  }

  // Footer
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(
      `Wrayth Dark Web Intelligence Report | Page ${i} of ${totalPages} | Confidential`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  return doc;
};

export const generateTechnicalReportPDF = (
  threats: ThreatData[],
  assets: AssetData[],
  config: ReportConfig
): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Technical Threat Analysis', 20, 22);
  
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toISOString()}`, 20, 30);

  yPos = 50;

  // Technical details for each threat
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Threat Analysis', 20, yPos);
  yPos += 15;

  threats.forEach((threat, index) => {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    // Threat header
    doc.setFillColor(249, 250, 251);
    doc.rect(15, yPos - 5, pageWidth - 30, 35, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`${index + 1}. ${threat.title}`, 20, yPos);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    yPos += 7;
    
    doc.text(`ID: ${threat.id}`, 20, yPos);
    doc.text(`Severity: ${threat.severity.toUpperCase()}`, 80, yPos);
    doc.text(`Status: ${threat.status}`, 130, yPos);
    yPos += 6;
    
    doc.text(`Source: ${threat.source}`, 20, yPos);
    doc.text(`Confidence: ${threat.confidence}%`, 100, yPos);
    yPos += 6;
    
    doc.text(`First Detected: ${new Date(threat.date).toISOString()}`, 20, yPos);
    yPos += 8;
    
    // Description
    doc.setTextColor(75, 85, 99);
    const descLines = doc.splitTextToSize(threat.description, pageWidth - 45);
    doc.text(descLines, 20, yPos);
    yPos += descLines.length * 5 + 15;
  });

  // Footer on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(
      `Technical Report | Page ${i} of ${totalPages} | CONFIDENTIAL - FOR SECURITY TEAMS ONLY`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  return doc;
};

export const downloadPDF = (doc: jsPDF, filename: string) => {
  doc.save(filename);
};
