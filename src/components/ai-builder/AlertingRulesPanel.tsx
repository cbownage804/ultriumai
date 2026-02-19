import { useAlertingRulesEngine } from '@/hooks/useAlertingRulesEngine';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Bell, Plus, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';

type Props = ReturnType<typeof useAlertingRulesEngine> & { onInsertCode: (code: string) => void; onClose: () => void };

export function AlertingRulesPanel({ rules, addRule, updateRule, removeRule, toggleRule, generateCode, onInsertCode, onClose }: Props) {
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0a0a0b] border-l border-white/10 z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2"><Bell className="w-4 h-4 text-orange-400" /><span className="text-sm font-medium text-white">Alerting Rules</span></div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7"><X className="w-4 h-4" /></Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-between"><Label className="text-white/70 text-xs uppercase tracking-wider">Rules ({rules.length})</Label><Button size="sm" variant="ghost" className="h-6 text-xs text-orange-400" onClick={addRule}><Plus className="w-3 h-3 mr-1" />Add</Button></div>
        {rules.map(r => (
          <div key={r.id} className="p-2 bg-white/5 rounded space-y-1">
            <div className="flex items-center gap-2">
              <Input value={r.name} onChange={e => updateRule(r.id, { name: e.target.value })} className="bg-white/5 border-white/10 text-white text-xs flex-1" />
              <Switch checked={r.isEnabled} onCheckedChange={() => toggleRule(r.id)} />
              <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400" onClick={() => removeRule(r.id)}><Trash2 className="w-3 h-3" /></Button>
            </div>
            <div className="flex gap-1">
              <Input value={r.metric} onChange={e => updateRule(r.id, { metric: e.target.value })} placeholder="metric" className="bg-white/5 border-white/10 text-white text-xs flex-1" />
              <Select value={r.operator} onValueChange={v => updateRule(r.id, { operator: v as any })}><SelectTrigger className="h-7 w-16 bg-white/5 border-white/10 text-white text-xs"><SelectValue /></SelectTrigger><SelectContent>{['>','<','>=','<=','=='].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
              <Input type="number" value={r.threshold} onChange={e => updateRule(r.id, { threshold: Number(e.target.value) })} className="bg-white/5 border-white/10 text-white text-xs w-20" />
            </div>
            <div className="flex gap-1">
              <Select value={r.severity} onValueChange={v => updateRule(r.id, { severity: v as any })}><SelectTrigger className="h-7 bg-white/5 border-white/10 text-white text-xs"><SelectValue /></SelectTrigger><SelectContent>{['info','warning','critical'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
              <Input type="number" value={r.durationMinutes} onChange={e => updateRule(r.id, { durationMinutes: Number(e.target.value) })} className="bg-white/5 border-white/10 text-white text-xs w-16" placeholder="min" />
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-white/10 flex gap-2">
        <Button size="sm" className="flex-1 text-xs" onClick={() => { onInsertCode(generateCode()); toast.success('Alert edge function inserted'); }}>Insert Edge Function</Button>
        <Button size="sm" variant="outline" className="text-xs" onClick={() => { navigator.clipboard.writeText(generateCode()); toast.success('Copied'); }}><Copy className="w-3 h-3" /></Button>
      </div>
    </div>
  );
}
