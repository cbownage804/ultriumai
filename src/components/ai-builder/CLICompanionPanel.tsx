import { useState } from 'react';
import { X, Terminal, Plus, Trash2, Download, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface CLICompanionPanelProps {
  config: any;
  setConfig: (c: any) => void;
  files: ProjectFile[];
  onGenerateBundle: (files: ProjectFile[]) => { path: string; content: string }[];
  onAddScript: (name: string, command: string) => void;
  onRemoveScript: (name: string) => void;
  onClose: () => void;
}

export function CLICompanionPanel({ config, setConfig, files, onGenerateBundle, onAddScript, onRemoveScript, onClose }: CLICompanionPanelProps) {
  const [newScriptName, setNewScriptName] = useState('');
  const [newScriptCmd, setNewScriptCmd] = useState('');

  const handleExport = () => {
    const bundle = onGenerateBundle(files);
    const content = bundle.map(f => `// === ${f.path} ===\n${f.content}`).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.projectSlug || 'project'}-cli-bundle.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0a0a0f] border-l border-white/[0.06] z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-medium text-white">CLI Companion</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 text-white/40 hover:text-white">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="space-y-2">
          <Label className="text-white/60 text-xs">Project Name</Label>
          <Input value={config.projectName} onChange={e => setConfig({ ...config, projectName: e.target.value })} placeholder="My App" className="bg-white/[0.04] border-white/[0.08] text-white text-xs h-8" />
        </div>
        <div className="space-y-2">
          <Label className="text-white/60 text-xs">Project Slug</Label>
          <Input value={config.projectSlug} onChange={e => setConfig({ ...config, projectSlug: e.target.value })} placeholder="my-app" className="bg-white/[0.04] border-white/[0.08] text-white text-xs h-8" />
        </div>
        <div className="space-y-2">
          <Label className="text-white/60 text-xs">NPM Scripts</Label>
          {config.scripts?.map((s: any) => (
            <div key={s.name} className="flex items-center gap-2 bg-white/[0.03] rounded px-2 py-1.5">
              <code className="text-cyan-400 text-xs flex-shrink-0">{s.name}</code>
              <span className="text-white/40 text-xs truncate flex-1">{s.command}</span>
              <button onClick={() => onRemoveScript(s.name)} className="text-white/20 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
            </div>
          ))}
          <div className="flex gap-1">
            <Input value={newScriptName} onChange={e => setNewScriptName(e.target.value)} placeholder="name" className="bg-white/[0.04] border-white/[0.08] text-white text-xs h-7 w-20" />
            <Input value={newScriptCmd} onChange={e => setNewScriptCmd(e.target.value)} placeholder="command" className="bg-white/[0.04] border-white/[0.08] text-white text-xs h-7 flex-1" />
            <Button size="sm" variant="ghost" onClick={() => { if (newScriptName && newScriptCmd) { onAddScript(newScriptName, newScriptCmd); setNewScriptName(''); setNewScriptCmd(''); } }} className="h-7 px-2 text-emerald-400">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="bg-white/[0.03] rounded-lg p-3 space-y-2">
          <h4 className="text-xs font-medium text-white/70">Quick Start</h4>
          <div className="space-y-1 text-[11px] text-white/40 font-mono">
            <p>$ npx ultrium-cli sync</p>
            <p>$ npm install</p>
            <p>$ npm run dev</p>
          </div>
        </div>
        <Button onClick={handleExport} className="w-full bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/20 text-xs h-8">
          <Download className="h-3 w-3 mr-1.5" /> Export CLI Bundle
        </Button>
      </div>
    </div>
  );
}
