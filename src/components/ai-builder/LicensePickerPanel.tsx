import { useLicensePicker } from '@/hooks/useLicensePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Scale, Copy } from 'lucide-react';
import { toast } from 'sonner';

type Props = ReturnType<typeof useLicensePicker> & { onInsertCode: (code: string) => void; onClose: () => void };

export function LicensePickerPanel({ selectedLicense, setSelectedLicense, holderName, setHolderName, year, setYear, licenseTypes, generateCode, onInsertCode, onClose }: Props) {
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0a0a0b] border-l border-white/10 z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2"><Scale className="w-4 h-4 text-amber-400" /><span className="text-sm font-medium text-white">License Picker</span></div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7"><X className="w-4 h-4" /></Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div><Label className="text-white/70 text-xs">License Type</Label>
          <Select value={selectedLicense} onValueChange={v => setSelectedLicense(v as any)}><SelectTrigger className="h-8 bg-white/5 border-white/10 text-white text-xs mt-1"><SelectValue /></SelectTrigger><SelectContent>{licenseTypes.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select>
        </div>
        <div><Label className="text-white/70 text-xs">Copyright Holder</Label><Input value={holderName} onChange={e => setHolderName(e.target.value)} placeholder="Your Name / Company" className="bg-white/5 border-white/10 text-white text-xs mt-1" /></div>
        <div><Label className="text-white/70 text-xs">Year</Label><Input value={year} onChange={e => setYear(e.target.value)} className="bg-white/5 border-white/10 text-white text-xs mt-1 w-24" /></div>
        <div className="p-2 bg-white/5 rounded">
          <Label className="text-white/40 text-[10px] uppercase">Preview</Label>
          <pre className="text-white/60 text-[10px] whitespace-pre-wrap mt-1 max-h-80 overflow-y-auto">{generateCode()}</pre>
        </div>
      </div>
      <div className="p-3 border-t border-white/10 flex gap-2">
        <Button size="sm" className="flex-1 text-xs" onClick={() => { onInsertCode(generateCode()); toast.success('LICENSE file inserted'); }}>Insert LICENSE</Button>
        <Button size="sm" variant="outline" className="text-xs" onClick={() => { navigator.clipboard.writeText(generateCode()); toast.success('Copied'); }}><Copy className="w-3 h-3" /></Button>
      </div>
    </div>
  );
}
