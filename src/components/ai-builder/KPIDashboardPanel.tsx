import { useKPIDashboardBuilder } from '@/hooks/useKPIDashboardBuilder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, BarChart3, Plus, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';

type Props = ReturnType<typeof useKPIDashboardBuilder> & { onInsertCode: (code: string) => void; onClose: () => void };

export function KPIDashboardPanel({ cards, dashboardName, setDashboardName, columns, setColumns, addCard, updateCard, removeCard, generateCode, onInsertCode, onClose }: Props) {
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0a0a0b] border-l border-white/10 z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-cyan-400" /><span className="text-sm font-medium text-white">KPI Dashboard</span></div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7"><X className="w-4 h-4" /></Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div><Label className="text-white/70 text-xs">Dashboard Name</Label><Input value={dashboardName} onChange={e => setDashboardName(e.target.value)} className="bg-white/5 border-white/10 text-white text-xs mt-1" /></div>
        <div><Label className="text-white/70 text-xs">Columns</Label>
          <Select value={String(columns)} onValueChange={v => setColumns(Number(v))}><SelectTrigger className="h-7 bg-white/5 border-white/10 text-white text-xs mt-1"><SelectValue /></SelectTrigger><SelectContent>{[2,3,4].map(n => <SelectItem key={n} value={String(n)}>{n} cols</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="flex items-center justify-between"><Label className="text-white/70 text-xs uppercase tracking-wider">KPI Cards ({cards.length})</Label><Button size="sm" variant="ghost" className="h-6 text-xs text-cyan-400" onClick={addCard}><Plus className="w-3 h-3 mr-1" />Add</Button></div>
        {cards.map(c => (
          <div key={c.id} className="p-2 bg-white/5 rounded space-y-1">
            <div className="flex items-center gap-2">
              <Input value={c.label} onChange={e => updateCard(c.id, { label: e.target.value })} placeholder="Label" className="bg-white/5 border-white/10 text-white text-xs flex-1" />
              <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400" onClick={() => removeCard(c.id)}><Trash2 className="w-3 h-3" /></Button>
            </div>
            <Input value={c.valueSource} onChange={e => updateCard(c.id, { valueSource: e.target.value })} placeholder="data.total" className="bg-white/5 border-white/10 text-white text-xs" />
            <Select value={c.format} onValueChange={v => updateCard(c.id, { format: v as any })}><SelectTrigger className="h-7 bg-white/5 border-white/10 text-white text-xs"><SelectValue /></SelectTrigger><SelectContent>{['number','currency','percentage','duration'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select>
            <div className="flex items-center gap-2"><Label className="text-white/50 text-xs">Sparkline</Label><Switch checked={c.showSparkline} onCheckedChange={v => updateCard(c.id, { showSparkline: v })} /></div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-white/10 flex gap-2">
        <Button size="sm" className="flex-1 text-xs" onClick={() => { onInsertCode(generateCode()); toast.success('KPI Dashboard inserted'); }}>Insert Component</Button>
        <Button size="sm" variant="outline" className="text-xs" onClick={() => { navigator.clipboard.writeText(generateCode()); toast.success('Copied'); }}><Copy className="w-3 h-3" /></Button>
      </div>
    </div>
  );
}
