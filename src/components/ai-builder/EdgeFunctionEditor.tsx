import { useState } from 'react';
import { X, Zap, Plus, Play, Loader2, CheckCircle, FileCode, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EdgeFunction {
  name: string;
  status: 'deployed' | 'draft' | 'error';
  lastDeployed?: string;
}

interface EdgeFunctionEditorProps {
  open: boolean;
  onClose: () => void;
  onCreateFunction: (name: string) => void;
  functions: EdgeFunction[];
  onSelectFunction: (name: string) => void;
}

const STATUS_STYLES = {
  deployed: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Deployed' },
  draft: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Draft' },
  error: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Error' },
};

export function EdgeFunctionEditor({ open, onClose, onCreateFunction, functions, onSelectFunction }: EdgeFunctionEditorProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [deployingFn, setDeployingFn] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const safeName = newName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    onCreateFunction(safeName);
    setNewName('');
    setShowCreate(false);
    toast.success(`Function "${safeName}" created`);
  };

  const handleDeploy = async (name: string) => {
    setDeployingFn(name);
    await new Promise(r => setTimeout(r, 1500));
    setDeployingFn(null);
    toast.success(`"${name}" deployed successfully`);
  };

  if (!open) return null;

  return (
    <div className="w-64 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-yellow-400" />
          <span className="text-xs font-medium text-white/80">Edge Functions</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowCreate(true)} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
            <Plus className="h-3 w-3" />
          </button>
          <button onClick={onClose} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="px-3 py-2 border-b border-white/[0.06] space-y-2">
          <Input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="function-name"
            className="h-7 text-xs bg-white/[0.03] border-white/[0.08] text-white/80 font-mono"
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <div className="flex gap-1.5 justify-end">
            <button onClick={() => setShowCreate(false)} className="text-[10px] text-white/30 hover:text-white/60 px-2 py-1">Cancel</button>
            <button onClick={handleCreate} className="text-[10px] text-cyan-400 px-2 py-1 bg-cyan-500/10 rounded hover:bg-cyan-500/20">Create</button>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {functions.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="h-6 w-6 text-white/10 mx-auto mb-2" />
              <p className="text-[10px] text-white/20">No edge functions yet</p>
              <button onClick={() => setShowCreate(true)} className="text-[10px] text-cyan-400/60 hover:text-cyan-400 mt-1">
                Create your first function
              </button>
            </div>
          ) : (
            functions.map(fn => {
              const status = STATUS_STYLES[fn.status];
              return (
                <div
                  key={fn.name}
                  className="p-2 rounded-lg border border-white/[0.06] hover:border-white/[0.1] bg-white/[0.02] transition-all group cursor-pointer"
                  onClick={() => onSelectFunction(fn.name)}
                >
                  <div className="flex items-center gap-2">
                    <FileCode className="h-3.5 w-3.5 text-white/30 shrink-0" />
                    <span className="text-[11px] font-mono text-white/70 truncate flex-1">{fn.name}</span>
                    <span className={cn("text-[8px] px-1 py-0.5 rounded", status.bg, status.color)}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 ml-5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); handleDeploy(fn.name); }}
                      disabled={deployingFn === fn.name}
                      className="h-5 text-[9px] px-1.5 text-white/30 hover:text-emerald-400"
                    >
                      {deployingFn === fn.name ? (
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      ) : (
                        <><Play className="h-2.5 w-2.5 mr-0.5" />Deploy</>
                      )}
                    </Button>
                    {fn.lastDeployed && (
                      <span className="text-[8px] text-white/15">{fn.lastDeployed}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
