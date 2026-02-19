import { useBudgetCostMonitor } from '@/hooks/useBudgetCostMonitor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, DollarSign, Plus, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';

type Props = ReturnType<typeof useBudgetCostMonitor> & { onInsertCode: (code: string) => void; onClose: () => void };

export function BudgetMonitorPanel({ items, currency, setCurrency, addItem, updateItem, removeItem, getTotalBudget, getTotalSpend, generateCode, onInsertCode, onClose }: Props) {
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0a0a0b] border-l border-white/10 z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-400" /><span className="text-sm font-medium text-white">Budget Monitor</span></div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7"><X className="w-4 h-4" /></Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-2 gap-2 p-2 bg-white/5 rounded">
          <div><span className="text-white/50 text-xs">Budget</span><p className="text-white text-sm font-medium">${getTotalBudget()}</p></div>
          <div><span className="text-white/50 text-xs">Spend</span><p className="text-white text-sm font-medium">${getTotalSpend()}</p></div>
        </div>
        <Select value={currency} onValueChange={setCurrency}><SelectTrigger className="h-7 bg-white/5 border-white/10 text-white text-xs"><SelectValue /></SelectTrigger><SelectContent>{['USD','EUR','GBP'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
        <div className="flex items-center justify-between"><Label className="text-white/70 text-xs uppercase tracking-wider">Items ({items.length})</Label><Button size="sm" variant="ghost" className="h-6 text-xs text-green-400" onClick={addItem}><Plus className="w-3 h-3 mr-1" />Add</Button></div>
        {items.map(item => {
          const pct = item.monthlyBudget > 0 ? Math.min((item.currentSpend / item.monthlyBudget) * 100, 100) : 0;
          return (
            <div key={item.id} className="p-2 bg-white/5 rounded space-y-1">
              <div className="flex items-center gap-2">
                <Input value={item.name} onChange={e => updateItem(item.id, { name: e.target.value })} className="bg-white/5 border-white/10 text-white text-xs flex-1" />
                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400" onClick={() => removeItem(item.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <Input type="number" value={item.monthlyBudget} onChange={e => updateItem(item.id, { monthlyBudget: Number(e.target.value) })} placeholder="Budget" className="bg-white/5 border-white/10 text-white text-xs" />
                <Input type="number" value={item.currentSpend} onChange={e => updateItem(item.id, { currentSpend: Number(e.target.value) })} placeholder="Spend" className="bg-white/5 border-white/10 text-white text-xs" />
              </div>
              <div className="flex items-center gap-2">
                <Progress value={pct} className="flex-1 h-1.5" />
                <span className={`text-[10px] ${pct >= item.alertThreshold ? 'text-yellow-400' : 'text-white/40'}`}>{pct.toFixed(0)}%</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="p-3 border-t border-white/10 flex gap-2">
        <Button size="sm" className="flex-1 text-xs" onClick={() => { onInsertCode(generateCode()); toast.success('Budget Dashboard inserted'); }}>Insert Component</Button>
        <Button size="sm" variant="outline" className="text-xs" onClick={() => { navigator.clipboard.writeText(generateCode()); toast.success('Copied'); }}><Copy className="w-3 h-3" /></Button>
      </div>
    </div>
  );
}
