import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus, Trash2, Code, BarChart3 } from 'lucide-react';
import type { ChartWidget, DashboardLayout } from '@/hooks/useChartDashboardBuilder';

interface Props {
  dashboards: DashboardLayout[];
  activeDashboard: DashboardLayout | null;
  chartTypes: { type: ChartWidget['type']; label: string; icon: string }[];
  onCreateDashboard: (name: string) => void;
  onSetActiveDashboard: (id: string) => void;
  onAddWidget: (dashId: string, type: ChartWidget['type']) => void;
  onUpdateWidget: (dashId: string, widgetId: string, updates: Partial<ChartWidget>) => void;
  onRemoveWidget: (dashId: string, widgetId: string) => void;
  onGenerateCode: (dashId: string) => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function ChartDashboardPanel({ dashboards, activeDashboard, chartTypes, onCreateDashboard, onSetActiveDashboard, onAddWidget, onUpdateWidget, onRemoveWidget, onGenerateCode, onInsertCode, onClose }: Props) {
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0d0d14] border-l border-white/[0.06] z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-semibold text-white">Chart Dashboard Builder</span>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50 uppercase tracking-wider">Dashboards</span>
              <button onClick={() => onCreateDashboard(`Dashboard ${dashboards.length + 1}`)} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"><Plus className="h-3 w-3" /> New</button>
            </div>
            <div className="flex gap-1 flex-wrap">
              {dashboards.map(d => (
                <button key={d.id} onClick={() => onSetActiveDashboard(d.id)} className={`text-xs px-2 py-1 rounded ${activeDashboard?.id === d.id ? 'bg-blue-500/20 text-blue-300' : 'bg-white/5 text-white/50 hover:text-white/80'}`}>{d.name}</button>
              ))}
            </div>
          </div>

          {activeDashboard && (
            <>
              <div className="space-y-2">
                <span className="text-xs text-white/50 uppercase tracking-wider">Add Widget</span>
                <div className="grid grid-cols-4 gap-1">
                  {chartTypes.map(ct => (
                    <button key={ct.type} onClick={() => onAddWidget(activeDashboard.id, ct.type)} className="flex flex-col items-center gap-0.5 text-[10px] px-1 py-1.5 bg-white/5 rounded hover:bg-white/10 text-white/60">
                      <span className="text-sm">{ct.icon}</span>
                      <span className="truncate w-full text-center">{ct.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs text-white/50 uppercase tracking-wider">Widgets ({activeDashboard.widgets.length})</span>
                {activeDashboard.widgets.map(widget => (
                  <div key={widget.id} className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white/80">{widget.title}</span>
                      <button onClick={() => onRemoveWidget(activeDashboard.id, widget.id)} className="text-red-400/50 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                    </div>
                    <input value={widget.title} onChange={e => onUpdateWidget(activeDashboard.id, widget.id, { title: e.target.value })} className="w-full text-[11px] bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80" />
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <span className="text-[10px] text-white/40">Width</span>
                        <select value={widget.width} onChange={e => onUpdateWidget(activeDashboard.id, widget.id, { width: Number(e.target.value) as 1|2|3|4 })} className="w-full text-[11px] bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80">
                          <option value={1}>1 col</option><option value={2}>2 col</option><option value={3}>3 col</option><option value={4}>4 col</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] text-white/40">Color</span>
                        <input type="color" value={widget.color} onChange={e => onUpdateWidget(activeDashboard.id, widget.id, { color: e.target.value })} className="w-full h-7 rounded bg-transparent" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => onInsertCode(onGenerateCode(activeDashboard.id))} className="w-full flex items-center justify-center gap-2 py-2 bg-blue-500/20 text-blue-300 rounded-lg text-xs font-medium hover:bg-blue-500/30">
                <Code className="h-3.5 w-3.5" /> Generate Dashboard
              </button>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
