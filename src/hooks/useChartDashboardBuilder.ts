import { useState, useCallback } from 'react';

export interface ChartWidget {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'area' | 'donut' | 'scatter' | 'radial';
  title: string;
  dataSource: 'static' | 'supabase' | 'api';
  dataConfig: {
    table?: string;
    xField?: string;
    yField?: string;
    apiUrl?: string;
    staticData?: { name: string; value: number }[];
  };
  width: 1 | 2 | 3 | 4; // grid columns
  height: 'sm' | 'md' | 'lg';
  color: string;
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: ChartWidget[];
  columns: 2 | 3 | 4;
}

const SAMPLE_DATA = [
  { name: 'Jan', value: 400 }, { name: 'Feb', value: 300 }, { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 }, { name: 'May', value: 500 }, { name: 'Jun', value: 700 },
];

const CHART_PRESETS: Record<ChartWidget['type'], { label: string; icon: string }> = {
  bar: { label: 'Bar Chart', icon: '📊' },
  line: { label: 'Line Chart', icon: '📈' },
  pie: { label: 'Pie Chart', icon: '🥧' },
  area: { label: 'Area Chart', icon: '📉' },
  donut: { label: 'Donut Chart', icon: '🍩' },
  scatter: { label: 'Scatter Plot', icon: '⚬' },
  radial: { label: 'Radial Bar', icon: '🎯' },
};

export function useChartDashboardBuilder() {
  const [dashboards, setDashboards] = useState<DashboardLayout[]>([]);
  const [activeDashboard, setActiveDashboard] = useState<string | null>(null);

  const createDashboard = useCallback((name: string) => {
    const dashboard: DashboardLayout = { id: crypto.randomUUID(), name, widgets: [], columns: 3 };
    setDashboards(prev => [...prev, dashboard]);
    setActiveDashboard(dashboard.id);
    return dashboard;
  }, []);

  const addWidget = useCallback((dashboardId: string, type: ChartWidget['type']) => {
    const preset = CHART_PRESETS[type];
    const widget: ChartWidget = {
      id: crypto.randomUUID(),
      type,
      title: preset.label,
      dataSource: 'static',
      dataConfig: { staticData: [...SAMPLE_DATA] },
      width: type === 'pie' || type === 'donut' || type === 'radial' ? 1 : 2,
      height: 'md',
      color: '#3b82f6',
    };
    setDashboards(prev => prev.map(d => d.id === dashboardId ? { ...d, widgets: [...d.widgets, widget] } : d));
  }, []);

  const updateWidget = useCallback((dashboardId: string, widgetId: string, updates: Partial<ChartWidget>) => {
    setDashboards(prev => prev.map(d => d.id === dashboardId ? {
      ...d, widgets: d.widgets.map(w => w.id === widgetId ? { ...w, ...updates } : w)
    } : d));
  }, []);

  const removeWidget = useCallback((dashboardId: string, widgetId: string) => {
    setDashboards(prev => prev.map(d => d.id === dashboardId ? { ...d, widgets: d.widgets.filter(w => w.id !== widgetId) } : d));
  }, []);

  const generateCode = useCallback((dashboardId: string): string => {
    const dashboard = dashboards.find(d => d.id === dashboardId);
    if (!dashboard) return '';
    const name = dashboard.name.replace(/[^a-zA-Z0-9]/g, '') || 'Dashboard';
    const imports = new Set<string>();
    imports.add('ResponsiveContainer');

    dashboard.widgets.forEach(w => {
      switch (w.type) {
        case 'bar': imports.add('BarChart'); imports.add('Bar'); imports.add('XAxis'); imports.add('YAxis'); imports.add('Tooltip'); break;
        case 'line': imports.add('LineChart'); imports.add('Line'); imports.add('XAxis'); imports.add('YAxis'); imports.add('Tooltip'); break;
        case 'area': imports.add('AreaChart'); imports.add('Area'); imports.add('XAxis'); imports.add('YAxis'); imports.add('Tooltip'); break;
        case 'pie': case 'donut': imports.add('PieChart'); imports.add('Pie'); imports.add('Cell'); imports.add('Tooltip'); break;
        case 'scatter': imports.add('ScatterChart'); imports.add('Scatter'); imports.add('XAxis'); imports.add('YAxis'); imports.add('Tooltip'); break;
        case 'radial': imports.add('RadialBarChart'); imports.add('RadialBar'); imports.add('Tooltip'); break;
      }
    });

    const widgetJSX = dashboard.widgets.map(w => {
      const data = JSON.stringify(w.dataConfig.staticData || SAMPLE_DATA);
      const h = w.height === 'sm' ? '200' : w.height === 'lg' ? '400' : '300';
      let chart = '';
      switch (w.type) {
        case 'bar': chart = `<BarChart data={${data}}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="${w.color}" /></BarChart>`; break;
        case 'line': chart = `<LineChart data={${data}}><XAxis dataKey="name" /><YAxis /><Tooltip /><Line type="monotone" dataKey="value" stroke="${w.color}" /></LineChart>`; break;
        case 'area': chart = `<AreaChart data={${data}}><XAxis dataKey="name" /><YAxis /><Tooltip /><Area type="monotone" dataKey="value" fill="${w.color}" stroke="${w.color}" /></AreaChart>`; break;
        case 'pie': chart = `<PieChart><Pie data={${data}} dataKey="value" nameKey="name" fill="${w.color}" label /></PieChart>`; break;
        default: chart = `<BarChart data={${data}}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="${w.color}" /></BarChart>`; break;
      }
      return `        <div className="col-span-${w.width} bg-white dark:bg-gray-800 rounded-xl p-4 shadow border">\n          <h3 className="text-sm font-semibold mb-3">${w.title}</h3>\n          <ResponsiveContainer width="100%" height={${h}}>\n            ${chart}\n          </ResponsiveContainer>\n        </div>`;
    }).join('\n');

    return `import { ${[...imports].join(', ')} } from 'recharts';\n\nexport function ${name}() {\n  return (\n    <div className="grid grid-cols-${dashboard.columns} gap-4 p-6">\n${widgetJSX}\n    </div>\n  );\n}`;
  }, [dashboards]);

  const getActiveDashboard = useCallback(() => dashboards.find(d => d.id === activeDashboard) || null, [dashboards, activeDashboard]);

  return {
    dashboards, activeDashboard, setActiveDashboard, createDashboard, addWidget,
    updateWidget, removeWidget, generateCode, getActiveDashboard,
    chartTypes: Object.entries(CHART_PRESETS).map(([type, p]) => ({ type: type as ChartWidget['type'], ...p })),
  };
}
