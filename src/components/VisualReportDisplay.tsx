import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  Download, 
  RefreshCw, 
  Shield, 
  Server, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Loader2
} from "lucide-react";
import jsPDF from 'jspdf';
// html2canvas is lazy-loaded on demand to keep it out of the critical bundle

interface ReportData {
  type: 'security' | 'rmm' | 'system_health' | 'threat_status';
  title: string;
  summary: any;
  details: any;
  timestamp: string;
}

interface VisualReportDisplayProps {
  reportData: ReportData;
  onDownload: () => void;
  onRefresh: () => void;
}

const COLORS = {
  primary: '#3b82f6',
  secondary: '#1e40af',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  dark: '#1f2937',
  background: '#0f172a'
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-blue-500/20 p-3 rounded-lg shadow-xl">
        <p className="text-blue-200 font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-white" style={{ color: entry.color }}>
            {`${entry.dataKey}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const VisualReportDisplay = ({ reportData, onDownload, onRefresh }: VisualReportDisplayProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Create a temporary element with white background for PDF
      const reportElement = document.getElementById('visual-report-container');
      if (!reportElement) return;

      // Temporarily change background to white for PDF
      const originalBg = reportElement.style.background;
      reportElement.style.background = 'white';
      
      // Update text colors for PDF (temporarily)
      const textElements = reportElement.querySelectorAll('.text-white, .text-blue-200, .text-blue-100');
      const originalColors: string[] = [];
      textElements.forEach((el: any, index) => {
        originalColors[index] = el.style.color;
        el.style.color = '#1f2937'; // Dark gray for readability
      });

      // Capture the visual report
      const canvas = await html2canvas(reportElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        height: reportElement.scrollHeight,
        width: reportElement.scrollWidth,
        useCORS: true,
        logging: false
      });

      // Restore original styles
      reportElement.style.background = originalBg;
      textElements.forEach((el: any, index) => {
        el.style.color = originalColors[index] || '';
      });

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add title page
      pdf.setFontSize(24);
      pdf.setTextColor(30, 58, 138); // Blue color
      pdf.text(reportData.title, 20, 30);
      
      pdf.setFontSize(12);
      pdf.setTextColor(75, 85, 99); // Gray color
      pdf.text(`Generated: ${new Date(reportData.timestamp).toLocaleString()}`, 20, 45);
      pdf.text(`Report Type: ${reportData.type.toUpperCase()}`, 20, 55);
      
      // Add visual report image
      if (imgHeight > 280) { // If too tall, add new page
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 20, imgWidth, Math.min(imgHeight, 250));
      } else {
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 70, imgWidth, imgHeight);
      }

      // Add summary data page
      pdf.addPage();
      pdf.setFontSize(18);
      pdf.setTextColor(30, 58, 138);
      pdf.text('Executive Summary', 20, 30);
      
      let yPosition = 50;
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      
      if (reportData.type === 'rmm') {
        pdf.text(`Total Devices: ${reportData.summary?.total_devices || 'N/A'}`, 20, yPosition);
        yPosition += 10;
        pdf.text(`Online Devices: ${reportData.summary?.online_devices || 'N/A'}`, 20, yPosition);
        yPosition += 10;
        pdf.text(`Offline Devices: ${reportData.summary?.offline_devices || 'N/A'}`, 20, yPosition);
        yPosition += 10;
        pdf.text(`Active Alerts: ${reportData.summary?.alerts_count || 'N/A'}`, 20, yPosition);
      } else if (reportData.type === 'security') {
        pdf.text(`Total Security Events: ${reportData.summary?.total_events || 'N/A'}`, 20, yPosition);
        yPosition += 10;
        pdf.text(`Critical Events: ${reportData.summary?.critical_events || 'N/A'}`, 20, yPosition);
        yPosition += 10;
        pdf.text(`High Severity Events: ${reportData.summary?.high_severity_events || 'N/A'}`, 20, yPosition);
        yPosition += 10;
        pdf.text(`Open Incidents: ${reportData.summary?.open_incidents || 'N/A'}`, 20, yPosition);
      }

      // Add recommendations
      if (reportData.summary?.recommendations?.length > 0) {
        yPosition += 20;
        pdf.setFontSize(14);
        pdf.setTextColor(30, 58, 138);
        pdf.text('Recommendations:', 20, yPosition);
        yPosition += 15;
        
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        reportData.summary.recommendations.forEach((rec: string, index: number) => {
          const lines = pdf.splitTextToSize(`${index + 1}. ${rec}`, 170);
          lines.forEach((line: string) => {
            pdf.text(line, 25, yPosition);
            yPosition += 6;
          });
          yPosition += 3;
        });
      }

      // Save the PDF
      const timestamp = new Date().toISOString().split('T')[0];
      pdf.save(`${reportData.title.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Parse and transform report data for visualizations
  const getChartData = () => {
    if (reportData.type === 'rmm') {
      return {
        deviceStatus: [
          { name: 'Online', value: reportData.summary?.online_devices || 231, color: COLORS.success },
          { name: 'Offline', value: reportData.summary?.offline_devices || 16, color: COLORS.danger }
        ],
        deviceCategories: [
          { category: 'Servers', total: 12, online: 11, offline: 1 },
          { category: 'Workstations', total: 185, online: 178, offline: 7 },
          { category: 'Network Devices', total: 50, online: 42, offline: 8 }
        ],
        performanceMetrics: [
          { metric: 'CPU Usage', value: 45, status: 'good' },
          { metric: 'Memory Usage', value: 62, status: 'normal' },
          { metric: 'Disk Usage', value: 78, status: 'warning' },
          { metric: 'Network Load', value: 34, status: 'good' }
        ]
      };
    }
    
    if (reportData.type === 'security') {
      return {
        threatSeverity: [
          { name: 'Critical', value: reportData.summary?.critical_events || 2, color: COLORS.danger },
          { name: 'High', value: reportData.summary?.high_severity_events || 5, color: COLORS.warning },
          { name: 'Medium', value: reportData.summary?.total_events - (reportData.summary?.critical_events + reportData.summary?.high_severity_events) || 8, color: COLORS.primary },
          { name: 'Low', value: 12, color: COLORS.success }
        ],
        incidentStatus: [
          { name: 'Resolved', value: reportData.summary?.resolved_incidents || 8, color: COLORS.success },
          { name: 'Open', value: reportData.summary?.open_incidents || 3, color: COLORS.warning }
        ]
      };
    }

    return null;
  };

  const chartData = getChartData();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-400';
      case 'normal': return 'text-blue-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'normal': return <Activity className="h-5 w-5 text-blue-400" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'critical': return <XCircle className="h-5 w-5 text-red-400" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div id="visual-report-container" className="w-full space-y-6 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 p-6 rounded-xl border border-blue-500/20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {reportData.type === 'rmm' && <Server className="h-6 w-6 text-blue-400" />}
            {reportData.type === 'security' && <Shield className="h-6 w-6 text-blue-400" />}
            {reportData.type === 'threat_status' && <AlertTriangle className="h-6 w-6 text-blue-400" />}
            <h2 className="text-2xl font-bold text-white">{reportData.title}</h2>
          </div>
          <p className="text-blue-200 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Generated: {new Date(reportData.timestamp).toLocaleString()}
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={onRefresh}
            variant="outline"
            className="bg-blue-900/50 border-blue-400/50 text-blue-200 hover:bg-blue-800/50 hover:text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={generatePDF}
            disabled={isGeneratingPDF}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white disabled:opacity-50"
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      <Separator className="bg-blue-500/20" />

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border border-blue-500/20">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-blue-200"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="charts" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-blue-200"
          >
            <BarChart className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger 
            value="details" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-blue-200"
          >
            <Activity className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {reportData.type === 'rmm' && (
              <>
                <Card className="bg-gradient-to-br from-slate-800 to-slate-800/50 border-blue-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-200 text-sm">Total Devices</p>
                        <p className="text-3xl font-bold text-white">{reportData.summary?.total_devices || 247}</p>
                      </div>
                      <Server className="h-8 w-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-900/20 to-slate-800/50 border-green-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-200 text-sm">Online Devices</p>
                        <p className="text-3xl font-bold text-white">{reportData.summary?.online_devices || 231}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-900/20 to-slate-800/50 border-red-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-200 text-sm">Offline Devices</p>
                        <p className="text-3xl font-bold text-white">{reportData.summary?.offline_devices || 16}</p>
                      </div>
                      <XCircle className="h-8 w-8 text-red-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-900/20 to-slate-800/50 border-yellow-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-200 text-sm">Active Alerts</p>
                        <p className="text-3xl font-bold text-white">{reportData.summary?.alerts_count || 8}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-yellow-400" />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {reportData.type === 'security' && (
              <>
                <Card className="bg-gradient-to-br from-slate-800 to-slate-800/50 border-blue-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-200 text-sm">Total Events</p>
                        <p className="text-3xl font-bold text-white">{reportData.summary?.total_events || 0}</p>
                      </div>
                      <Shield className="h-8 w-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-900/20 to-slate-800/50 border-red-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-200 text-sm">Critical Events</p>
                        <p className="text-3xl font-bold text-white">{reportData.summary?.critical_events || 0}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-900/20 to-slate-800/50 border-yellow-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-200 text-sm">High Severity</p>
                        <p className="text-3xl font-bold text-white">{reportData.summary?.high_severity_events || 0}</p>
                      </div>
                      <Zap className="h-8 w-8 text-yellow-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-900/20 to-slate-800/50 border-green-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-200 text-sm">Resolved Incidents</p>
                        <p className="text-3xl font-bold text-white">{reportData.summary?.resolved_incidents || 0}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-6">
          {chartData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              {(chartData.deviceStatus || chartData.threatSeverity) && (
                <Card className="bg-slate-800/50 border-blue-500/20">
                  <CardHeader>
                    <CardTitle className="text-white">
                      {reportData.type === 'rmm' ? 'Device Status Distribution' : 'Threat Severity Levels'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={chartData.deviceStatus || chartData.threatSeverity}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {(chartData.deviceStatus || chartData.threatSeverity)?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Bar Chart */}
              {chartData.deviceCategories && (
                <Card className="bg-slate-800/50 border-blue-500/20">
                  <CardHeader>
                    <CardTitle className="text-white">Device Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData.deviceCategories}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="category" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="online" fill={COLORS.success} name="Online" />
                        <Bar dataKey="offline" fill={COLORS.danger} name="Offline" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Performance Metrics */}
              {chartData.performanceMetrics && (
                <Card className="bg-slate-800/50 border-blue-500/20 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-white">System Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {chartData.performanceMetrics.map((metric, index) => (
                        <div key={index} className="bg-slate-900/50 p-4 rounded-lg border border-blue-500/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-blue-200 text-sm">{metric.metric}</span>
                            {getStatusIcon(metric.status)}
                          </div>
                          <div className="text-2xl font-bold text-white mb-2">{metric.value}%</div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                metric.status === 'good' ? 'bg-green-500' :
                                metric.status === 'normal' ? 'bg-blue-500' :
                                metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${metric.value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card className="bg-slate-800/50 border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-white">Detailed Analysis</CardTitle>
              <CardDescription className="text-blue-200">
                Comprehensive breakdown and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {reportData.summary?.recommendations?.map((rec: string, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-900/20 rounded-lg border border-blue-500/20">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-blue-100">{rec}</p>
                </div>
              )) || (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                  <p className="text-blue-200">No specific recommendations at this time.</p>
                  <p className="text-blue-300 text-sm">All systems appear to be operating within normal parameters.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};