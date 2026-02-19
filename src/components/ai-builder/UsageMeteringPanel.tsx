import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Gauge, Plus, Trash2, Code, Zap } from 'lucide-react';
import type { UsageMeter } from '@/hooks/useUsageMetering';

interface Props {
  open: boolean;
  onClose: () => void;
  meters: UsageMeter[];
  activeMeterId: string | null;
  setActiveMeterId: (id: string | null) => void;
  getActiveMeter: () => UsageMeter | null;
  UNIT_PRESETS: readonly string[];
  createMeter: (name: string, unit: string, limit: number) => UsageMeter;
  updateMeter: (id: string, updates: Partial<UsageMeter>) => void;
  removeMeter: (id: string) => void;
  recordUsage: (meterId: string, amount: number) => void;
  getMeterUsagePercent: (meter: UsageMeter) => number;
  calculateOverage: (meter: UsageMeter) => { overageUnits: number; overageCost: number };
  generateMeteringMiddleware: () => string;
  generateUsageDashboard: () => string;
  onInsertCode: (code: string) => void;
}

export function UsageMeteringPanel({ open, onClose, meters, activeMeterId, setActiveMeterId, getActiveMeter, UNIT_PRESETS, createMeter, updateMeter, removeMeter, recordUsage, getMeterUsagePercent, calculateOverage, generateMeteringMiddleware, generateUsageDashboard, onInsertCode }: Props) {
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('api_call');
  const [newLimit, setNewLimit] = useState('1000');
  const active = getActiveMeter();

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] bg-[#0d0d0f] border-white/10 text-white">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Gauge className="h-4 w-4 text-amber-400" /> Usage Metering</DialogTitle></DialogHeader>
        <div className="flex gap-2 mb-3">
          <Input placeholder="Meter name" value={newName} onChange={e => setNewName(e.target.value)} className="bg-white/5 border-white/10 text-white h-8 text-xs" />
          <select value={newUnit} onChange={e => setNewUnit(e.target.value)} className="bg-white/5 border border-white/10 rounded px-2 h-8 text-xs text-white">
            {UNIT_PRESETS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <Input placeholder="Limit" value={newLimit} onChange={e => setNewLimit(e.target.value)} className="bg-white/5 border-white/10 text-white h-8 text-xs w-20" />
          <Button size="sm" variant="outline" className="border-white/10 text-white h-8 text-xs" onClick={() => { if (newName) { createMeter(newName, newUnit, parseInt(newLimit) || 1000); setNewName(''); } }}><Plus className="h-3 w-3 mr-1" />Add</Button>
        </div>
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {meters.map(meter => {
              const pct = getMeterUsagePercent(meter);
              const overage = calculateOverage(meter);
              return (
                <div key={meter.id} className={`p-3 rounded-lg border cursor-pointer ${meter.id === activeMeterId ? 'border-amber-500/50 bg-amber-500/5' : 'border-white/10 bg-white/[0.02]'}`} onClick={() => setActiveMeterId(meter.id)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{meter.name}</span>
                      <Badge variant="outline" className="text-[9px] border-white/10 text-white/40">{meter.unit}</Badge>
                      <Badge variant="outline" className="text-[9px] border-white/10 text-white/30">{meter.resetInterval}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] text-blue-400" onClick={e => { e.stopPropagation(); recordUsage(meter.id, Math.floor(Math.random() * 50) + 1); }}><Zap className="h-3 w-3 mr-1" />Simulate</Button>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={e => { e.stopPropagation(); removeMeter(meter.id); }}><Trash2 className="h-3 w-3 text-red-400" /></Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#22c55e' }} />
                    </div>
                    <span className="text-xs text-white/50 w-32 text-right">{meter.currentUsage.toLocaleString()} / {meter.limit.toLocaleString()}</span>
                  </div>
                  {overage.overageUnits > 0 && (
                    <p className="text-[10px] text-red-400 mt-1">⚠ {overage.overageUnits} units over limit {meter.overageRate > 0 ? `(+$${(overage.overageCost / 100).toFixed(2)})` : ''}</p>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
        {active && (
          <div className="flex gap-2 border-t border-white/10 pt-2">
            <Input type="number" placeholder="Overage rate ¢" value={active.overageRate} onChange={e => updateMeter(active.id, { overageRate: parseInt(e.target.value) || 0 })} className="bg-white/5 border-white/10 text-white h-7 text-xs w-32" />
            <select value={active.resetInterval} onChange={e => updateMeter(active.id, { resetInterval: e.target.value as UsageMeter['resetInterval'] })} className="bg-white/5 border border-white/10 rounded px-2 h-7 text-xs text-white">
              <option value="hourly">Hourly</option><option value="daily">Daily</option><option value="monthly">Monthly</option>
            </select>
          </div>
        )}
        <div className="flex gap-2 border-t border-white/10 pt-3">
          <Button size="sm" variant="outline" className="border-white/10 text-white text-xs" onClick={() => onInsertCode(generateMeteringMiddleware())}><Code className="h-3 w-3 mr-1" />Middleware</Button>
          <Button size="sm" variant="outline" className="border-white/10 text-white text-xs" onClick={() => onInsertCode(generateUsageDashboard())}><Code className="h-3 w-3 mr-1" />Dashboard</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
