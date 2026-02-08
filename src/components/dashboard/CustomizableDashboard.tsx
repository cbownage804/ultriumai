import { useState, useCallback } from 'react';
import { 
  GripVertical, X, Plus, BarChart3, Activity, Shield, 
  Headphones, Bot, Monitor, TrendingUp, Users, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

// Widget type definitions
interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  size: 'sm' | 'md' | 'lg';
}

interface WidgetTemplate {
  type: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  defaultSize: 'sm' | 'md' | 'lg';
}

const WIDGET_TEMPLATES: WidgetTemplate[] = [
  { type: 'kpi-tickets', title: 'Open Tickets', icon: Headphones, description: 'Current open ticket count', defaultSize: 'sm' },
  { type: 'kpi-devices', title: 'Active Devices', icon: Monitor, description: 'Online endpoints count', defaultSize: 'sm' },
  { type: 'kpi-threats', title: 'Active Threats', icon: Shield, description: 'Unresolved security alerts', defaultSize: 'sm' },
  { type: 'kpi-users', title: 'Active Users', icon: Users, description: 'Users online now', defaultSize: 'sm' },
  { type: 'chart-tickets', title: 'Ticket Trend', icon: TrendingUp, description: '7-day ticket volume chart', defaultSize: 'md' },
  { type: 'chart-security', title: 'Security Score', icon: Shield, description: 'Overall security posture', defaultSize: 'md' },
  { type: 'kpi-ai-usage', title: 'AI Credits Used', icon: Bot, description: 'Monthly AI credit consumption', defaultSize: 'sm' },
  { type: 'kpi-uptime', title: 'System Uptime', icon: Activity, description: 'Platform availability', defaultSize: 'sm' },
  { type: 'chart-revenue', title: 'MRR Overview', icon: BarChart3, description: 'Monthly recurring revenue', defaultSize: 'md' },
  { type: 'kpi-response-time', title: 'Avg Response', icon: Clock, description: 'Average ticket response time', defaultSize: 'sm' },
];

// Demo KPI data
const KPI_DATA: Record<string, { value: string; change: string; positive: boolean }> = {
  'kpi-tickets': { value: '24', change: '-12%', positive: true },
  'kpi-devices': { value: '847', change: '+3%', positive: true },
  'kpi-threats': { value: '3', change: '-67%', positive: true },
  'kpi-users': { value: '156', change: '+8%', positive: true },
  'kpi-ai-usage': { value: '2,841', change: '+15%', positive: false },
  'kpi-uptime': { value: '99.97%', change: '+0.02%', positive: true },
  'kpi-response-time': { value: '14m', change: '-22%', positive: true },
};

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'w1', type: 'kpi-tickets', title: 'Open Tickets', size: 'sm' },
  { id: 'w2', type: 'kpi-devices', title: 'Active Devices', size: 'sm' },
  { id: 'w3', type: 'kpi-threats', title: 'Active Threats', size: 'sm' },
  { id: 'w4', type: 'kpi-uptime', title: 'System Uptime', size: 'sm' },
  { id: 'w5', type: 'chart-tickets', title: 'Ticket Trend', size: 'md' },
  { id: 'w6', type: 'chart-security', title: 'Security Score', size: 'md' },
];

function KPIWidget({ widget }: { widget: DashboardWidget }) {
  const data = KPI_DATA[widget.type];
  const template = WIDGET_TEMPLATES.find(t => t.type === widget.type);
  const Icon = template?.icon || Activity;

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-2xl font-bold text-foreground">{data?.value ?? '—'}</p>
        {data && (
          <p className={`text-xs font-medium ${data.positive ? 'text-emerald-500' : 'text-amber-500'}`}>
            {data.change} vs last period
          </p>
        )}
      </div>
      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
    </div>
  );
}

function ChartWidget({ widget }: { widget: DashboardWidget }) {
  // Simple sparkline-style bars
  const bars = [40, 65, 45, 80, 55, 70, 90];
  const template = WIDGET_TEMPLATES.find(t => t.type === widget.type);
  const Icon = template?.icon || BarChart3;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span>Last 7 days</span>
      </div>
      <div className="flex items-end gap-1.5 h-16">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-gradient-to-t from-primary/60 to-primary/20 transition-all hover:from-primary hover:to-primary/40"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
      </div>
    </div>
  );
}

export function CustomizableDashboard() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(() => {
    const saved = localStorage.getItem('hub_dashboard_widgets');
    return saved ? JSON.parse(saved) : DEFAULT_WIDGETS;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const saveWidgets = useCallback((updated: DashboardWidget[]) => {
    setWidgets(updated);
    localStorage.setItem('hub_dashboard_widgets', JSON.stringify(updated));
  }, []);

  const removeWidget = (id: string) => {
    saveWidgets(widgets.filter(w => w.id !== id));
  };

  const addWidget = (template: WidgetTemplate) => {
    const newWidget: DashboardWidget = {
      id: `w${Date.now()}`,
      type: template.type,
      title: template.title,
      size: template.defaultSize,
    };
    saveWidgets([...widgets, newWidget]);
    setAddDialogOpen(false);
  };

  const resetToDefault = () => {
    saveWidgets(DEFAULT_WIDGETS);
    setIsEditing(false);
  };

  const sizeClass = (size: string) => {
    switch (size) {
      case 'sm': return 'col-span-1';
      case 'md': return 'col-span-1 md:col-span-2';
      case 'lg': return 'col-span-1 md:col-span-3';
      default: return 'col-span-1';
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
        <div className="flex items-center gap-2">
          {isEditing && (
            <>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Add Widget
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Widget</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {WIDGET_TEMPLATES.filter(t => !widgets.some(w => w.type === t.type)).map(template => (
                      <button
                        key={template.type}
                        onClick={() => addWidget(template)}
                        className="flex items-start gap-2.5 p-3 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-primary/5 text-left transition-all"
                      >
                        <template.icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{template.title}</p>
                          <p className="text-[10px] text-muted-foreground">{template.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="ghost" size="sm" onClick={resetToDefault} className="text-muted-foreground text-xs">
                Reset
              </Button>
            </>
          )}
          <Button 
            variant={isEditing ? "default" : "outline"} 
            size="sm" 
            onClick={() => setIsEditing(!isEditing)}
            className="gap-1.5"
          >
            <GripVertical className="h-3.5 w-3.5" />
            {isEditing ? 'Done' : 'Customize'}
          </Button>
        </div>
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {widgets.map(widget => (
          <Card 
            key={widget.id} 
            className={`${sizeClass(widget.size)} relative group border-border/30 bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-all ${
              isEditing ? 'ring-1 ring-dashed ring-border/50' : ''
            }`}
          >
            {isEditing && (
              <button
                onClick={() => removeWidget(widget.id)}
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {widget.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              {widget.type.startsWith('chart-') ? (
                <ChartWidget widget={widget} />
              ) : (
                <KPIWidget widget={widget} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
