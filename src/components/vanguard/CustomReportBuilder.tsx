import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { FileText, Plus, Download, Calendar, BarChart3, PieChart, LineChart, Table, Trash2, Play, RefreshCw, Settings, Clock, Mail, GripVertical, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ReportWidget {
  id: string;
  type: 'bar' | 'pie' | 'line' | 'table' | 'metric' | 'gauge';
  dataSource: string;
  title: string;
  position?: { x: number; y: number; w: number; h: number };
  options?: Record<string, any>;
}

interface DataSource {
  id: string;
  name: string;
  fields: string[];
  aggregations: string[];
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  widgets: ReportWidget[];
  schedule?: string;
  lastGenerated?: string;
  isAutomated?: boolean;
}

export const CustomReportBuilder = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [previewData, setPreviewData] = useState<Record<string, any[]>>({});
  const [activeTab, setActiveTab] = useState('reports');

  useEffect(() => {
    if (user) {
      loadReports();
      loadDataSources();
    }
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
        lastGenerated: r.last_generated_at,
        isAutomated: r.is_automated
      }));
      setReports(mapped);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDataSources = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('report-builder', {
        body: { action: 'get_available_sources' }
      });

      if (!error && data?.sources) {
        setDataSources(data.sources);
      }
    } catch (err) {
      console.error('Failed to load data sources:', err);
      // Fallback to default sources
      setDataSources([
        { id: 'security_events', name: 'Security Events', fields: [], aggregations: [] },
        { id: 'tickets', name: 'Helpdesk Tickets', fields: [], aggregations: [] },
        { id: 'devices', name: 'Managed Devices', fields: [], aggregations: [] },
        { id: 'patches', name: 'Patch Compliance', fields: [], aggregations: [] },
        { id: 'vulnerabilities', name: 'Vulnerabilities', fields: [], aggregations: [] },
        { id: 'billing', name: 'Billing & Revenue', fields: [], aggregations: [] }
      ]);
    }
  };

  const [isBuilding, setIsBuilding] = useState(false);
  const [newReport, setNewReport] = useState({
    name: '',
    description: '',
    widgets: [] as ReportWidget[]
  });

  const [selectedDataSources, setSelectedDataSources] = useState<string[]>([]);
  const [isScheduling, setIsScheduling] = useState<string | null>(null);
  const [scheduleConfig, setScheduleConfig] = useState({
    frequency: 'weekly',
    dayOfWeek: '1',
    time: '09:00',
    recipients: ''
  });

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
      title: `${dataSources.find(d => d.id === selectedDataSources[0])?.name || 'Data'} ${type} Chart`,
      position: { x: 0, y: newReport.widgets.length, w: 6, h: 4 }
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
    setIsGenerating(reportId);
    try {
      const { data, error } = await supabase.functions.invoke('report-builder', {
        body: {
          action: 'generate_report',
          report_id: reportId,
          user_id: user?.id,
          date_range: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString()
          }
        }
      });

      if (error) throw error;
      
      setPreviewData(data?.report?.data || {});
      toast.success('Report generated successfully');
      loadReports();
    } catch (err: any) {
      toast.error('Report generation failed', { description: err.message });
    } finally {
      setIsGenerating(null);
    }
  };

  const scheduleReport = async (reportId: string) => {
    try {
      const { error } = await supabase.functions.invoke('report-builder', {
        body: {
          action: 'schedule_report',
          report_id: reportId,
          user_id: user?.id,
          schedule: {
            frequency: scheduleConfig.frequency,
            day_of_week: parseInt(scheduleConfig.dayOfWeek),
            time: scheduleConfig.time
          },
          recipients: scheduleConfig.recipients.split(',').map(e => e.trim()).filter(Boolean)
        }
      });

      if (error) throw error;
      toast.success('Report scheduled');
      setIsScheduling(null);
      loadReports();
    } catch (err: any) {
      toast.error('Failed to schedule report', { description: err.message });
    }
  };

  const deleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('bi_reports')
        .delete()
        .eq('id', reportId)
        .eq('user_id', user?.id);

      if (error) throw error;
      toast.success('Report deleted');
      loadReports();
    } catch (err: any) {
      toast.error('Failed to delete report', { description: err.message });
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
      <Card className="bg-black/80 border-cyan-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="h-5 w-5 text-cyan-400" />
                Advanced Report Builder
              </CardTitle>
              <CardDescription className="text-white/60">
                Create, schedule, and automate custom reports
              </CardDescription>
            </div>
            <Button onClick={() => setIsBuilding(true)} className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              New Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-black/40 border border-cyan-500/20 mb-6">
              <TabsTrigger value="reports" className="data-[state=active]:bg-cyan-500/20">
                <FileText className="h-4 w-4 mr-2" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="sources" className="data-[state=active]:bg-cyan-500/20">
                <Table className="h-4 w-4 mr-2" />
                Data Sources
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reports">
              {isBuilding ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-white/80">Report Name</Label>
                      <Input
                        placeholder="Weekly Security Summary"
                        value={newReport.name}
                        onChange={(e) => setNewReport(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1 bg-black/40 border-cyan-500/20 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white/80">Description</Label>
                      <Input
                        placeholder="Brief description of the report"
                        value={newReport.description}
                        onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))}
                        className="mt-1 bg-black/40 border-cyan-500/20 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-white/80 mb-2 block">Data Sources</Label>
                    <div className="grid gap-2 md:grid-cols-3">
                      {dataSources.map(source => (
                        <div key={source.id} className="flex items-center space-x-2 p-3 border border-cyan-500/20 rounded-lg bg-black/40">
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
                            <p className="font-medium text-sm text-white">{source.name}</p>
                            {source.aggregations?.length > 0 && (
                              <p className="text-xs text-white/50">{source.aggregations.length} aggregations</p>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-white/80 mb-2 block">Add Widgets</Label>
                    <div className="flex flex-wrap gap-2">
                      {widgetTypes.map(widget => (
                        <Button
                          key={widget.type}
                          variant="outline"
                          size="sm"
                          onClick={() => addWidget(widget.type)}
                          className="border-cyan-500/30 text-white/80 hover:bg-cyan-500/10"
                        >
                          <widget.icon className="h-4 w-4 mr-2" />
                          {widget.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {newReport.widgets.length > 0 && (
                    <div>
                      <Label className="text-white/80 mb-2 block">Report Layout</Label>
                      <div className="grid gap-2 md:grid-cols-3">
                        {newReport.widgets.map((widget, index) => (
                          <div key={widget.id} className="flex items-center justify-between p-3 border border-cyan-500/20 rounded-lg bg-black/40">
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-4 w-4 text-white/30 cursor-move" />
                              {getWidgetIcon(widget.type)}
                              <div>
                                <span className="text-sm text-white capitalize">{widget.type}</span>
                                <p className="text-xs text-white/50">{widget.dataSource}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeWidget(widget.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={saveReport} className="bg-cyan-600 hover:bg-cyan-700">Save Report Template</Button>
                    <Button variant="outline" onClick={() => setIsBuilding(false)} className="border-cyan-500/30 text-white/80">Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-12">
                      <Loader2 className="h-8 w-8 mx-auto animate-spin text-cyan-400" />
                      <p className="text-white/60 mt-2">Loading reports...</p>
                    </div>
                  ) : reports.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto text-cyan-400/50 mb-4" />
                      <p className="text-white/60">No reports yet</p>
                      <Button onClick={() => setIsBuilding(true)} className="mt-4 bg-cyan-600 hover:bg-cyan-700">
                        Create Your First Report
                      </Button>
                    </div>
                  ) : (
                    reports.map(report => (
                      <div key={report.id} className="flex items-center justify-between p-4 border border-cyan-500/20 rounded-lg bg-black/40">
                        <div className="flex items-center gap-4">
                          <FileText className="h-8 w-8 text-cyan-400/60" />
                          <div>
                            <h4 className="font-medium text-white">{report.name}</h4>
                            <p className="text-sm text-white/50">{report.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {report.isAutomated && (
                                <Badge variant="outline" className="border-green-500/30 text-green-400">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {report.schedule}
                                </Badge>
                              )}
                              <Badge variant="secondary" className="bg-white/10 text-white/60">
                                {report.widgets.length} widgets
                              </Badge>
                              {report.lastGenerated && (
                                <span className="text-xs text-white/40">
                                  Last: {new Date(report.lastGenerated).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => generateReport(report.id)}
                            disabled={isGenerating === report.id}
                            className="border-cyan-500/30 text-white/80 hover:bg-cyan-500/10"
                          >
                            {isGenerating === report.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4 mr-2" />
                            )}
                            Generate
                          </Button>
                          <Dialog open={isScheduling === report.id} onOpenChange={(open) => setIsScheduling(open ? report.id : null)}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="border-cyan-500/30 text-white/80 hover:bg-cyan-500/10">
                                <Calendar className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-black/95 border-cyan-500/30">
                              <DialogHeader>
                                <DialogTitle className="text-white">Schedule Report</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                  <Label className="text-white/80">Frequency</Label>
                                  <Select 
                                    value={scheduleConfig.frequency} 
                                    onValueChange={(v) => setScheduleConfig(prev => ({ ...prev, frequency: v }))}
                                  >
                                    <SelectTrigger className="bg-black/40 border-cyan-500/20 text-white">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-black/95 border-cyan-500/30">
                                      <SelectItem value="daily" className="text-white/80">Daily</SelectItem>
                                      <SelectItem value="weekly" className="text-white/80">Weekly</SelectItem>
                                      <SelectItem value="monthly" className="text-white/80">Monthly</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                {scheduleConfig.frequency === 'weekly' && (
                                  <div className="space-y-2">
                                    <Label className="text-white/80">Day of Week</Label>
                                    <Select 
                                      value={scheduleConfig.dayOfWeek} 
                                      onValueChange={(v) => setScheduleConfig(prev => ({ ...prev, dayOfWeek: v }))}
                                    >
                                      <SelectTrigger className="bg-black/40 border-cyan-500/20 text-white">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="bg-black/95 border-cyan-500/30">
                                        <SelectItem value="1" className="text-white/80">Monday</SelectItem>
                                        <SelectItem value="2" className="text-white/80">Tuesday</SelectItem>
                                        <SelectItem value="3" className="text-white/80">Wednesday</SelectItem>
                                        <SelectItem value="4" className="text-white/80">Thursday</SelectItem>
                                        <SelectItem value="5" className="text-white/80">Friday</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                                <div className="space-y-2">
                                  <Label className="text-white/80">Time</Label>
                                  <Input
                                    type="time"
                                    value={scheduleConfig.time}
                                    onChange={(e) => setScheduleConfig(prev => ({ ...prev, time: e.target.value }))}
                                    className="bg-black/40 border-cyan-500/20 text-white"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-white/80">Recipients (comma-separated emails)</Label>
                                  <Input
                                    placeholder="admin@example.com, team@example.com"
                                    value={scheduleConfig.recipients}
                                    onChange={(e) => setScheduleConfig(prev => ({ ...prev, recipients: e.target.value }))}
                                    className="bg-black/40 border-cyan-500/20 text-white"
                                  />
                                </div>
                                <Button onClick={() => scheduleReport(report.id)} className="w-full bg-cyan-600 hover:bg-cyan-700">
                                  <Mail className="h-4 w-4 mr-2" />
                                  Schedule Report
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => deleteReport(report.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="sources">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {dataSources.map(source => (
                  <Card key={source.id} className="bg-black/40 border-cyan-500/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-white">{source.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {source.fields?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-white/50 mb-1">Fields:</p>
                          <div className="flex flex-wrap gap-1">
                            {source.fields.slice(0, 5).map(field => (
                              <Badge key={field} variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                                {field}
                              </Badge>
                            ))}
                            {source.fields.length > 5 && (
                              <Badge variant="outline" className="text-xs border-white/20 text-white/50">
                                +{source.fields.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      {source.aggregations?.length > 0 && (
                        <div>
                          <p className="text-xs text-white/50 mb-1">Aggregations:</p>
                          <div className="flex flex-wrap gap-1">
                            {source.aggregations.map(agg => (
                              <Badge key={agg} variant="secondary" className="text-xs bg-purple-500/20 text-purple-400">
                                {agg}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
