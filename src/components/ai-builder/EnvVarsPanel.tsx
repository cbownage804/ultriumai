import { useState } from 'react';
import { Variable, Plus, Trash2, Eye, EyeOff, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState, EMPTY_STATES } from './EmptyStates';

export interface EnvVariable {
  key: string;
  value: string;
  isSecret: boolean;
}

interface EnvVarsPanelProps {
  envVars: EnvVariable[];
  onChange: (vars: EnvVariable[]) => void;
  open: boolean;
  onClose: () => void;
}

export function EnvVarsPanel({ envVars, onChange, open, onClose }: EnvVarsPanelProps) {
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});

  if (!open) return null;

  const addVar = () => {
    onChange([...envVars, { key: '', value: '', isSecret: false }]);
  };

  const updateVar = (index: number, field: keyof EnvVariable, val: string | boolean) => {
    const updated = envVars.map((v, i) => i === index ? { ...v, [field]: val } : v);
    onChange(updated);
  };

  const removeVar = (index: number) => {
    onChange(envVars.filter((_, i) => i !== index));
  };

  const toggleShow = (key: string) => {
    setShowValues(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="w-72 h-full border-r border-white/[0.06] bg-[#0a0a10] flex flex-col shrink-0">
      <div className="flex items-center justify-between px-3 h-9 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5 text-xs font-medium text-white/60">
          <Variable className="h-3.5 w-3.5" />
          Environment Variables
        </div>
        <button onClick={onClose} className="text-[10px] text-white/30 hover:text-white/60">Close</button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {envVars.length === 0 ? (
            <EmptyState {...EMPTY_STATES.envVars} actionLabel="Add Variable" onAction={addVar} />
          ) : (
          <>
          <p className="text-[10px] text-white/25 leading-relaxed">
            Variables are injected as <code className="text-cyan-400/60 bg-black/30 px-1 rounded">window.ENV</code> in your app.
          </p>

          {envVars.map((v, i) => (
            <div key={i} className="space-y-1.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <Input
                value={v.key}
                onChange={(e) => updateVar(i, 'key', e.target.value)}
                placeholder="KEY_NAME"
                className="h-7 text-[11px] bg-black/30 border-white/[0.06] text-white/80 font-mono uppercase"
              />
              <div className="flex items-center gap-1">
                <Input
                  value={v.value}
                  onChange={(e) => updateVar(i, 'value', e.target.value)}
                  type={v.isSecret && !showValues[v.key] ? 'password' : 'text'}
                  placeholder="value"
                  className="h-7 text-[11px] bg-black/30 border-white/[0.06] text-white/60 font-mono flex-1"
                />
                {v.isSecret && (
                  <button
                    onClick={() => toggleShow(v.key)}
                    className="h-7 w-7 rounded flex items-center justify-center text-white/20 hover:text-white/50 transition-colors"
                  >
                    {showValues[v.key] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                )}
                <button
                  onClick={() => removeVar(i)}
                  className="h-7 w-7 rounded flex items-center justify-center text-white/20 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <button
                onClick={() => updateVar(i, 'isSecret', !v.isSecret)}
                className={cn(
                  "flex items-center gap-1 text-[9px] transition-colors",
                  v.isSecret ? "text-amber-400/60" : "text-white/20 hover:text-white/40"
                )}
              >
                <Lock className="h-2.5 w-2.5" />
                {v.isSecret ? 'Secret (hidden)' : 'Mark as secret'}
              </button>
            </div>
          ))}

          <Button
            onClick={addVar}
            variant="outline"
            size="sm"
            className="w-full h-7 text-[10px] bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.05]"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Variable
          </Button>
          </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
