import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Plus, Download, Calendar, BarChart3, PieChart, LineChart, Table, Trash2, Play, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ReportWidget {
  id: string;
  type: 'bar' | 'pie' | 'line' | 'table' | 'metric';
  dataSource: string;
  title: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  widgets: ReportWidget[];
  schedule?: string;
  lastGenerated?: string;
}

export const CustomReportBuilder = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) loadReports();
  }, [user]);

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('bi_reports')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map(r => ({
        id: r.id,
        name: r.report_name,
        description: r.report_type || '',
        widgets: Array.isArray(r.report_config) ? (r.report_config as unknown as ReportWidget[]) : [],
        schedule: r.is_automated ? ((r.schedule_config as any)?.frequency || 'Manual') : undefined,
        lastGenerated: r.last_generated_at
      }));
      setReports(mapped);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };
  const [isBuilding, setIsBuilding] = useState(false);
  const [newReport, setNewReport] = useState({
    name: '',
    description: '',
    widgets: [] as ReportWidget[]
  });

  const [selectedDataSources, setSelectedDataSources] = useState<string[]>([]);

  const dataSources = [
    { id: 'security_events', name: 'Security Events', description: 'Threat detection and alerts' },
    { id: 'compliance', name: 'Compliance Data', description: 'Framework compliance scores' },
    { id: 'assets', name: 'Asset Inventory', description: 'Hardware and software assets' },
    { id: 'incidents', name: 'Incidents', description: 'Security incident records' },
    { id: 'vulnerabilities', name: 'Vulnerabilities', description: 'CVE and vulnerability data' },
    { id: 'patches', name: 'Patch Status', description: 'Patch compliance information' },
  ];

  const widgetTypes = [
    { type: 'bar', icon: BarChart3, name: 'Bar Chart' },
    { type: 'pie', icon: PieChart, name: 'Pie Chart' },
    { type: 'line', icon: LineChart, name: 'Line Chart' },
    { type: 'table', icon: Table, name: 'Data Table' },
  ];

  const addWidget = (type: string) => {
    if (selectedDataSources.length === 0) {
      toast.error('Select a data source first');
      return;
    }
    const widget: ReportWidget = {
      id: `w-${Date.now()}`,
      type: type as any,
      dataSource: selectedDataSources[0],
      title: `${type} Chart`
    };
    setNewReport(prev => ({ ...prev, widgets: [...prev.widgets, widget] }));
  };

  const removeWidget = (widgetId: string) => {
    setNewReport(prev => ({
      ...prev,
      widgets: prev.widgets.filter(w => w.id !== widgetId)
    }));
  };

  const saveReport = async () => {
    if (!newReport.name) {
      toast.error('Enter a report name');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('bi_reports')
        .insert({
          user_id: user?.id,
          report_name: newReport.name,
          report_type: newReport.description,
          report_config: newReport.widgets as unknown as any,
          data_sources: selectedDataSources,
          is_active: true,
          is_automated: false
        });

      if (error) throw error;

      setNewReport({ name: '', description: '', widgets: [] });
      setSelectedDataSources([]);
      setIsBuilding(false);
      toast.success('Report template saved');
      loadReports();
    } catch (err: any) {
      toast.error('Failed to save report', { description: err.message });
    }
  };

  const generateReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('bi_reports')
        .update({ last_generated_at: new Date().toISOString() })
        .eq('id', reportId);

      if (error) throw error;
      toast.success('Report generation started');
      loadReports();
    } catch (err) {
      toast.error('Report generation failed');
    }
  };

  const getWidgetIcon = (type: string) => {
    switch (type) {
      case 'bar': return <BarChart3 className="h-4 w-4" />;
      case 'pie': return <PieChart className="h-4 w-4" />;
      case 'line': return <LineChart className="h-4 w-4" />;
      case 'table': return <Table className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Custom Report Builder
              </CardTitle>
              <CardDescription>
                Create and schedule custom security reports
              </CardDescription>
            </div>
            <Button onClick={() => setIsBuilding(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isBuilding ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Report Name</label>
                  <Input
                    placeholder="Weekly Security Summary"
                    value={newReport.name}
                    onChange={(e) => setNewReport(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    placeholder="Brief description of the report"
                    value={newReport.description}
                    onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Data Sources</label>
                <div className="grid gap-2 md:grid-cols-3">
                  {dataSources.map(source => (
                    <div key={source.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                      <Checkbox
                        id={source.id}
                        checked={selectedDataSources.includes(source.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedDataSources(prev => [...prev, source.id]);
                          } else {
                            setSelectedDataSources(prev => prev.filter(s => s !== source.id));
                          }
                        }}
                      />
                      <label htmlFor={source.id} className="flex-1 cursor-pointer">
                        <p className="font-medium text-sm">{source.name}</p>
                        <p className="text-xs text-muted-foreground">{source.description}</p>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Add Widgets</label>
                <div className="flex flex-wrap gap-2">
                  {widgetTypes.map(widget => (
                    <Button
                      key={widget.type}
                      variant="outline"
                      size="sm"
                      onClick={() => addWidget(widget.type)}
                    >
                      <widget.icon className="h-4 w-4 mr-2" />
                      {widget.name}
                    </Button>
                  ))}
                </div>
              </div>

              {newReport.widgets.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Report Widgets</label>
                  <div className="grid gap-2 md:grid-cols-3">
                    {newReport.widgets.map(widget => (
                      <div key={widget.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          {getWidgetIcon(widget.type)}
                          <span className="text-sm capitalize">{widget.type} Chart</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeWidget(widget.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={saveReport}>Save Report Template</Button>
                <Button variant="outline" onClick={() => setIsBuilding(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map(report => (
                <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">{report.name}</h4>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {report.schedule && (
                          <Badge variant="outline">
                            <Calendar className="h-3 w-3 mr-1" />
                            {report.schedule}
                          </Badge>
                        )}
                        <Badge variant="secondary">
                          {report.widgets.length} widgets
                        </Badge>
                        {report.lastGenerated && (
                          <span className="text-xs text-muted-foreground">
                            Last: {new Date(report.lastGenerated).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => generateReport(report.id)}>
                      <Play className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
