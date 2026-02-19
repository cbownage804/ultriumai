import { useREADMEGenerator } from '@/hooks/useREADMEGenerator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { X, FileText, Copy } from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

type Props = ReturnType<typeof useREADMEGenerator> & { files?: ProjectFile[]; onInsertCode: (code: string) => void; onClose: () => void };

export function READMEGeneratorPanel({ title, setTitle, description, setDescription, showBadges, setShowBadges, showFileTree, setShowFileTree, showSetup, setShowSetup, showAPI, setShowAPI, license, setLicense, generateCode, files, onInsertCode, onClose }: Props) {
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0a0a0b] border-l border-white/10 z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-blue-400" /><span className="text-sm font-medium text-white">README Generator</span></div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7"><X className="w-4 h-4" /></Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div><Label className="text-white/70 text-xs">Project Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} className="bg-white/5 border-white/10 text-white text-xs mt-1" /></div>
        <div><Label className="text-white/70 text-xs">Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} className="bg-white/5 border-white/10 text-white text-xs mt-1 min-h-[60px]" /></div>
        <div><Label className="text-white/70 text-xs">License</Label><Input value={license} onChange={e => setLicense(e.target.value)} className="bg-white/5 border-white/10 text-white text-xs mt-1" /></div>
        <div className="space-y-2">
          <div className="flex items-center justify-between"><Label className="text-white/70 text-xs">Tech Stack Badges</Label><Switch checked={showBadges} onCheckedChange={setShowBadges} /></div>
          <div className="flex items-center justify-between"><Label className="text-white/70 text-xs">File Structure</Label><Switch checked={showFileTree} onCheckedChange={setShowFileTree} /></div>
          <div className="flex items-center justify-between"><Label className="text-white/70 text-xs">Setup Instructions</Label><Switch checked={showSetup} onCheckedChange={setShowSetup} /></div>
          <div className="flex items-center justify-between"><Label className="text-white/70 text-xs">API Reference</Label><Switch checked={showAPI} onCheckedChange={setShowAPI} /></div>
        </div>
        <div className="p-2 bg-white/5 rounded">
          <Label className="text-white/40 text-[10px] uppercase">Preview</Label>
          <pre className="text-white/60 text-[10px] whitespace-pre-wrap mt-1 max-h-60 overflow-y-auto">{generateCode(files)}</pre>
        </div>
      </div>
      <div className="p-3 border-t border-white/10 flex gap-2">
        <Button size="sm" className="flex-1 text-xs" onClick={() => { onInsertCode(generateCode(files)); toast.success('README inserted'); }}>Insert README</Button>
        <Button size="sm" variant="outline" className="text-xs" onClick={() => { navigator.clipboard.writeText(generateCode(files)); toast.success('Copied'); }}><Copy className="w-3 h-3" /></Button>
      </div>
    </div>
  );
}
