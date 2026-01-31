/**
 * Custom Dashboard Configurator
 * Create and configure custom dashboard views with widgets
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LayoutDashboard, 
  Plus, 
  Settings, 
  Trash2, 
  GripVertical,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Ticket,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Activity,
  DollarSign,
  Save,
  Eye,
  Share2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Widget {
  id: string;
  type: string;
  title: string;
  size: 'small' | 'medium' | 'large';
  position: number;
  config: Record<string, any>;
}

interface DashboardConfig {
  id: string;
  dashboard_name: string;
  dashboard_type: string;
  is_default: boolean;
  widgets: Widget[];
  refresh_interval_seconds: number;
  is_shared: boolean;
}

const availableWidgets = [
  { type: 'ticket_summary', title: 'Ticket Summary', icon: Ticket, category: 'Helpdesk' },
  { type: 'sla_compliance', title: 'SLA Compliance', icon: CheckCircle2, category: 'Helpdesk' },
  { type: 'open_tickets', title: 'Open Tickets', icon: AlertTriangle, category: 'Helpdesk' },
  { type: 'resolution_time', title: 'Avg Resolution Time', icon: Clock, category: 'Helpdesk' },
  { type: 'csat_score', title: 'CSAT Score', icon: TrendingUp, category: 'Helpdesk' },
  { type: 'technician_load', title: 'Technician Load', icon: Users, category: 'Team' },
  { type: 'escalation_rate', title: 'Escalation Rate', icon: Activity, category: 'Analytics' },
  { type: 'revenue_chart', title: 'Revenue Chart', icon: DollarSign, category: 'Billing' },
  { type: 'ticket_trend', title: 'Ticket Trend', icon: BarChart3, category: 'Analytics' },
  { type: 'category_breakdown', title: 'Category Breakdown', icon: PieChart, category: 'Analytics' },
];

const defaultConfig: Partial<DashboardConfig> = {
  dashboard_name: '',
  dashboard_type: 'custom',
  is_default: false,
  widgets: [],
  refresh_interval_seconds: 300,
  is_shared: false
};

export const DashboardConfigurator = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dashboards, setDashboards] = useState<DashboardConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDashboard, setEditingDashboard] = useState<Partial<DashboardConfig> | null>(null);
  const [selectedWidgets, setSelectedWidgets] = useState<Widget[]>([]);

  useEffect(() => {
    fetchDashboards();
  }, [user?.id]);

  const fetchDashboards = async () => {
    if (!user?.id) return;

    const { data, error } = await (supabase as any)
      .from('vanguard_dashboard_configs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setDashboards(data.map((d: any) => ({
        ...d,
        widgets: Array.isArray(d.widgets) ? d.widgets : []
      })));
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user?.id || !editingDashboard?.dashboard_name) return;

    const payload = {
      dashboard_name: editingDashboard.dashboard_name,
      dashboard_type: editingDashboard.dashboard_type || 'custom',
      is_default: editingDashboard.is_default ?? false,
      widgets: selectedWidgets,
      refresh_interval_seconds: editingDashboard.refresh_interval_seconds ?? 300,
      is_shared: editingDashboard.is_shared ?? false,
      user_id: user.id
    };

    let error;
    if (editingDashboard.id) {
      const { error: e } = await (supabase as any)
        .from('vanguard_dashboard_configs')
        .update(payload)
        .eq('id', editingDashboard.id);
      error = e;
    } else {
      const { error: e } = await (supabase as any)
        .from('vanguard_dashboard_configs')
        .insert([payload]);
      error = e;
    }

    if (error) {
      toast({ title: "Error", description: "Failed to save dashboard.", variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Dashboard configuration saved." });
      setDialogOpen(false);
      setEditingDashboard(null);
      setSelectedWidgets([]);
      fetchDashboards();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase as any)
      .from('vanguard_dashboard_configs')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Dashboard removed." });
      fetchDashboards();
    }
  };

  const handleAddWidget = (widgetType: typeof availableWidgets[0]) => {
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type: widgetType.type,
      title: widgetType.title,
      size: 'medium',
      position: selectedWidgets.length,
      config: {}
    };
    setSelectedWidgets([...selectedWidgets, newWidget]);
  };

  const handleRemoveWidget = (widgetId: string) => {
    setSelectedWidgets(selectedWidgets.filter(w => w.id !== widgetId));
  };

  const handleWidgetSizeChange = (widgetId: string, size: 'small' | 'medium' | 'large') => {
    setSelectedWidgets(selectedWidgets.map(w => 
      w.id === widgetId ? { ...w, size } : w
    ));
  };

  const openEditDialog = (dashboard?: DashboardConfig) => {
    if (dashboard) {
      setEditingDashboard(dashboard);
      setSelectedWidgets(dashboard.widgets || []);
    } else {
      setEditingDashboard(defaultConfig);
      setSelectedWidgets([]);
    }
    setDialogOpen(true);
  };

  const getWidgetIcon = (type: string) => {
    const widget = availableWidgets.find(w => w.type === type);
    return widget ? widget.icon : LayoutDashboard;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Dashboard Configurator</h2>
          <p className="text-white/60">Create custom dashboard views with configurable widgets</p>
        </div>
        <Button 
          onClick={() => openEditDialog()}
          className="bg-gradient-to-r from-cyan-500 to-purple-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Dashboard
        </Button>
      </div>

      {/* Existing Dashboards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <Card className="bg-white/5 border-white/10 col-span-full">
            <CardContent className="p-8 text-center text-white/60">Loading...</CardContent>
          </Card>
        ) : dashboards.length === 0 ? (
          <Card className="bg-white/5 border-white/10 col-span-full">
            <CardContent className="p-8 text-center">
              <LayoutDashboard className="h-12 w-12 mx-auto mb-4 text-white/20" />
              <h3 className="text-white font-medium mb-2">No Custom Dashboards</h3>
              <p className="text-white/60 text-sm">Create your first custom dashboard to get started.</p>
            </CardContent>
          </Card>
        ) : (
          dashboards.map((dashboard) => (
            <Card key={dashboard.id} className="bg-white/5 border-white/10">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-cyan-500/20">
                      <LayoutDashboard className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">{dashboard.dashboard_name}</CardTitle>
                      <p className="text-xs text-white/60">{dashboard.widgets.length} widgets</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {dashboard.is_default && (
                      <Badge className="bg-green-500/20 text-green-400 text-xs">Default</Badge>
                    )}
                    {dashboard.is_shared && (
                      <Share2 className="h-4 w-4 text-purple-400" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Widget Preview */}
                <div className="flex flex-wrap gap-1">
                  {dashboard.widgets.slice(0, 5).map((widget) => {
                    const Icon = getWidgetIcon(widget.type);
                    return (
                      <div key={widget.id} className="p-1.5 rounded bg-white/5" title={widget.title}>
                        <Icon className="h-4 w-4 text-white/60" />
                      </div>
                    );
                  })}
                  {dashboard.widgets.length > 5 && (
                    <Badge variant="outline" className="border-white/20 text-white/60 text-xs">
                      +{dashboard.widgets.length - 5}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-white/10"
                    onClick={() => openEditDialog(dashboard)}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Configure
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300"
                    onClick={() => handleDelete(dashboard.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingDashboard?.id ? 'Edit' : 'Create'} Dashboard
            </DialogTitle>
          </DialogHeader>
          {editingDashboard && (
            <div className="grid grid-cols-2 gap-6">
              {/* Left: Settings */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white/80">Dashboard Name</Label>
                  <Input
                    value={editingDashboard.dashboard_name || ''}
                    onChange={(e) => setEditingDashboard({ ...editingDashboard, dashboard_name: e.target.value })}
                    placeholder="My Custom Dashboard"
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/80">Dashboard Type</Label>
                  <Select 
                    value={editingDashboard.dashboard_type || 'custom'}
                    onValueChange={(v) => setEditingDashboard({ ...editingDashboard, dashboard_type: v })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">Main Dashboard</SelectItem>
                      <SelectItem value="helpdesk">Helpdesk</SelectItem>
                      <SelectItem value="comanaged">Co-Managed</SelectItem>
                      <SelectItem value="reporting">Reporting</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/80">Refresh Interval</Label>
                  <Select 
                    value={String(editingDashboard.refresh_interval_seconds || 300)}
                    onValueChange={(v) => setEditingDashboard({ ...editingDashboard, refresh_interval_seconds: parseInt(v) })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">1 minute</SelectItem>
                      <SelectItem value="300">5 minutes</SelectItem>
                      <SelectItem value="600">10 minutes</SelectItem>
                      <SelectItem value="1800">30 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <Label className="text-white/80">Set as Default</Label>
                  <Switch
                    checked={editingDashboard.is_default}
                    onCheckedChange={(v) => setEditingDashboard({ ...editingDashboard, is_default: v })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <Label className="text-white/80">Share with Team</Label>
                  <Switch
                    checked={editingDashboard.is_shared}
                    onCheckedChange={(v) => setEditingDashboard({ ...editingDashboard, is_shared: v })}
                  />
                </div>

                {/* Available Widgets */}
                <div className="space-y-2">
                  <Label className="text-white/80">Add Widgets</Label>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-1">
                      {availableWidgets.map((widget) => (
                        <div
                          key={widget.type}
                          className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer"
                          onClick={() => handleAddWidget(widget)}
                        >
                          <div className="flex items-center gap-2">
                            <widget.icon className="h-4 w-4 text-cyan-400" />
                            <span className="text-sm text-white">{widget.title}</span>
                          </div>
                          <Badge variant="outline" className="border-white/20 text-white/60 text-xs">
                            {widget.category}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {/* Right: Widget Layout */}
              <div className="space-y-4">
                <Label className="text-white/80">Widget Layout ({selectedWidgets.length} widgets)</Label>
                <ScrollArea className="h-[400px] border border-white/10 rounded-lg p-3">
                  {selectedWidgets.length === 0 ? (
                    <div className="text-center py-12 text-white/60">
                      <LayoutDashboard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No widgets added</p>
                      <p className="text-xs">Click widgets on the left to add them</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedWidgets.map((widget, index) => {
                        const Icon = getWidgetIcon(widget.type);
                        return (
                          <div
                            key={widget.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
                          >
                            <GripVertical className="h-4 w-4 text-white/40 cursor-grab" />
                            <Icon className="h-4 w-4 text-cyan-400" />
                            <span className="flex-1 text-sm text-white">{widget.title}</span>
                            <Select 
                              value={widget.size}
                              onValueChange={(v: 'small' | 'medium' | 'large') => handleWidgetSizeChange(widget.id, v)}
                            >
                              <SelectTrigger className="w-24 h-7 bg-white/5 border-white/10 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="small">Small</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="large">Large</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-white/40 hover:text-red-400"
                              onClick={() => handleRemoveWidget(widget.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1 border-white/10" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardConfigurator;
