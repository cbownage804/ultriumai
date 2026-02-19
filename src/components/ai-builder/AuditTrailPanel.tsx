import { useAuditTrailGenerator } from '@/hooks/useAuditTrailGenerator';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, FileText, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type Props = ReturnType<typeof useAuditTrailGenerator> & { onInsertCode: (code: string) => void; onClose: () => void };

export function AuditTrailPanel({ entries, trackCreates, setTrackCreates, trackUpdates, setTrackUpdates, trackDeletes, setTrackDeletes, maxEntries, setMaxEntries, clearEntries, generateCode, onInsertCode, onClose }: Props) {
  const actionColor = (a: string) => a === 'create' ? 'text-green-400' : a === 'delete' ? 'text-red-400' : 'text-blue-400';
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0a0a0b] border-l border-white/10 z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-purple-400" /><span className="text-sm font-medium text-white">Audit Trail</span></div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7"><X className="w-4 h-4" /></Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between"><Label className="text-white/70 text-xs">Track Creates</Label><Switch checked={trackCreates} onCheckedChange={setTrackCreates} /></div>
          <div className="flex items-center justify-between"><Label className="text-white/70 text-xs">Track Updates</Label><Switch checked={trackUpdates} onCheckedChange={setTrackUpdates} /></div>
          <div className="flex items-center justify-between"><Label className="text-white/70 text-xs">Track Deletes</Label><Switch checked={trackDeletes} onCheckedChange={setTrackDeletes} /></div>
          <div><Label className="text-white/70 text-xs">Max Entries</Label><Input type="number" value={maxEntries} onChange={e => setMaxEntries(Number(e.target.value))} className="bg-white/5 border-white/10 text-white text-xs mt-1" /></div>
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-white/70 text-xs uppercase tracking-wider">Recent ({entries.length})</Label>
          <Button size="sm" variant="ghost" className="h-6 text-xs text-red-400" onClick={clearEntries}><Trash2 className="w-3 h-3 mr-1" />Clear</Button>
        </div>
        {entries.slice(0, 20).map(e => (
          <div key={e.id} className="flex items-center gap-2 py-1">
            <Badge variant="outline" className={`text-[10px] ${actionColor(e.action)}`}>{e.action}</Badge>
            <span className="text-white/60 text-xs truncate flex-1">{e.filePath}</span>
            <span className="text-white/30 text-[10px]">{e.timestamp.toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-white/10 flex gap-2">
        <Button size="sm" className="flex-1 text-xs" onClick={() => { onInsertCode(generateCode()); toast.success('Audit Trail component inserted'); }}>Insert Component</Button>
        <Button size="sm" variant="outline" className="text-xs" onClick={() => { navigator.clipboard.writeText(generateCode()); toast.success('Copied'); }}><Copy className="w-3 h-3" /></Button>
      </div>
    </div>
  );
}
