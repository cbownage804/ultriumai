import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Plus, 
  Download, 
  Calendar,
  Play,
  Pause,
  Settings,
  BarChart3,
  PieChart,
  TrendingUp
} from 'lucide-react';

interface CustomReportsProps {
  timeRange: string;
}

export const CustomReports = ({ timeRange }: CustomReportsProps) => {
  // Mock reports data
  const savedReports = [
    {
      id: '1',
      name: 'Monthly Executive Summary',
      type: 'executive',
      schedule: 'Monthly',
      lastGenerated: '2024-01-15',
      isAutomated: true,
      recipients: ['ceo@company.com', 'cfo@company.com'],
      status: 'active'
    },
    {
      id: '2',
      name: 'Client Profitability Analysis',
      type: 'financial',
      schedule: 'Quarterly',
      lastGenerated: '2024-01-01',
      isAutomated: true,
      recipients: ['finance@company.com'],
      status: 'active'
    },
    {
      id: '3',
      name: 'Security Posture Report',
      type: 'security',
      schedule: 'Weekly',
      lastGenerated: '2024-01-14',
      isAutomated: false,
      recipients: ['security@company.com'],
      status: 'paused'
    },
    {
      id: '4',
      name: 'Operational KPIs Dashboard',
      type: 'operational',
      schedule: 'Daily',
      lastGenerated: '2024-01-15',
      isAutomated: true,
      recipients: ['operations@company.com'],
      status: 'active'
    }
  ];

  const reportTemplates = [
    {
      name: 'Revenue Trend Analysis',
      description: 'Track revenue patterns and growth trends',
      category: 'Financial',
      components: ['Revenue Charts', 'Trend Analysis', 'Forecasting']
    },
    {
      name: 'Client Satisfaction Report',
      description: 'Monitor customer satisfaction and feedback',
      category: 'Customer',
      components: ['CSAT Scores', 'NPS Tracking', 'Feedback Analysis']
    },
    {
      name: 'Security Compliance Dashboard',
      description: 'Security metrics and compliance status',
      category: 'Security',
      components: ['Threat Detection', 'Compliance Status', 'Risk Assessment']
    },
    {
      name: 'Team Performance Analytics',
      description: 'Employee productivity and performance metrics',
      category: 'Operations',
      components: ['Productivity Metrics', 'Resolution Times', 'Quality Scores']
    }
  ];

  const getTypeBadge = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'executive': return 'destructive';
      case 'financial': return 'default';
      case 'security': return 'secondary';
      case 'operational': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusBadge = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'active': return 'default';
      case 'paused': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Custom Reports</h2>
          <p className="text-muted-foreground">
            Create, schedule, and manage custom business intelligence reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Report Builder
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Saved Reports */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Saved Reports
            </CardTitle>
            <CardDescription>Manage your scheduled and saved reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {savedReports.map((report) => (
                <div key={report.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium">{report.name}</div>
                        <Badge variant={getTypeBadge(report.type)}>
                          {report.type}
                        </Badge>
                        <Badge variant={getStatusBadge(report.status)}>
                          {report.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {report.schedule} • Last: {report.lastGenerated}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Recipients: {report.recipients.length} users
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        {report.status === 'active' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Report Templates */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Report Templates
            </CardTitle>
            <CardDescription>Pre-built templates to get started quickly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportTemplates.map((template, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium">{template.name}</div>
                        <Badge variant="outline">{template.category}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {template.description}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {template.components.map((component, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {component}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Use Template
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Builder Quick Actions */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Report Builder
          </CardTitle>
          <CardDescription>Create custom reports with drag-and-drop components</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <BarChart3 className="h-6 w-6 mb-2" />
              Revenue Report
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <PieChart className="h-6 w-6 mb-2" />
              Client Analysis
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <TrendingUp className="h-6 w-6 mb-2" />
              Growth Metrics
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Calendar className="h-6 w-6 mb-2" />
              Custom Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export & Sharing */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export & Sharing Options
          </CardTitle>
          <CardDescription>Configure how reports are delivered and shared</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium">Export Formats</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">PDF Reports</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">Excel Spreadsheets</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" />
                  <span className="text-sm">PowerPoint Presentations</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" />
                  <span className="text-sm">Interactive Dashboards</span>
                </label>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Delivery Methods</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">Email Delivery</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" />
                  <span className="text-sm">Slack Integration</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" />
                  <span className="text-sm">Teams Integration</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">Dashboard Portal</span>
                </label>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Scheduling</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="radio" name="schedule" />
                  <span className="text-sm">Daily</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="radio" name="schedule" defaultChecked />
                  <span className="text-sm">Weekly</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="radio" name="schedule" />
                  <span className="text-sm">Monthly</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="radio" name="schedule" />
                  <span className="text-sm">Custom</span>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};