import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus, Trash2, Code, ListOrdered } from 'lucide-react';
import type { WizardConfig, WizardStep } from '@/hooks/useStepperWizardBuilder';

interface Props {
  wizards: WizardConfig[];
  activeWizard: string | null;
  presetNames: string[];
  createWizard: (preset?: string) => WizardConfig;
  updateWizard: (id: string, updates: Partial<WizardConfig>) => void;
  deleteWizard: (id: string) => void;
  addStep: (wizId: string) => void;
  removeStep: (wizId: string, stepId: string) => void;
  updateStep: (wizId: string, stepId: string, updates: Partial<WizardStep>) => void;
  generateCode: (id: string) => string;
  getActive: () => WizardConfig | null;
  setActiveWizard: (id: string | null) => void;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function StepperWizardPanel({ wizards, presetNames, createWizard, deleteWizard, addStep, removeStep, updateStep, updateWizard, generateCode, getActive, setActiveWizard, onInsertCode, onClose }: Props) {
  const active = getActive();
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0d0d14] border-l border-white/[0.06] z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2"><ListOrdered className="h-4 w-4 text-emerald-400" /><span className="text-sm font-semibold text-white">Stepper / Wizard Builder</span></div>
        <button onClick={onClose} className="text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <span className="text-xs text-white/50 uppercase tracking-wider">Presets</span>
            <div className="flex gap-1 flex-wrap">
              {presetNames.map(n => <button key={n} onClick={() => createWizard(n)} className="text-[10px] px-2 py-1 bg-white/5 rounded hover:bg-white/10 text-white/60">{n}</button>)}
              <button onClick={() => createWizard()} className="text-[10px] px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded hover:bg-emerald-500/30 flex items-center gap-1"><Plus className="h-3 w-3" />Custom</button>
            </div>
          </div>
          {wizards.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs text-white/50 uppercase tracking-wider">Wizards</span>
              <div className="flex gap-1 flex-wrap">
                {wizards.map(w => <button key={w.id} onClick={() => setActiveWizard(w.id)} className={`text-xs px-2 py-1 rounded ${active?.id === w.id ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-white/50'}`}>{w.name}</button>)}
              </div>
            </div>
          )}
          {active && (
            <>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input value={active.name} onChange={e => updateWizard(active.id, { name: e.target.value })} className="flex-1 text-[11px] bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80" />
                  <button onClick={() => deleteWizard(active.id)} className="text-red-400/50 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                </div>
                <div className="flex gap-2">
                  <select value={active.orientation} onChange={e => updateWizard(active.id, { orientation: e.target.value as 'horizontal' | 'vertical' })} className="flex-1 text-[11px] bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80">
                    <option value="horizontal">Horizontal</option><option value="vertical">Vertical</option>
                  </select>
                  <select value={active.variant} onChange={e => updateWizard(active.id, { variant: e.target.value as WizardConfig['variant'] })} className="flex-1 text-[11px] bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80">
                    <option value="dots">Dots</option><option value="numbers">Numbers</option><option value="icons">Icons</option><option value="bars">Bars</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50 uppercase tracking-wider">Steps ({active.steps.length})</span>
                  <button onClick={() => addStep(active.id)} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"><Plus className="h-3 w-3" />Add</button>
                </div>
                {active.steps.map(s => (
                  <div key={s.id} className="bg-white/[0.03] rounded-lg p-2 border border-white/[0.06] space-y-1">
                    <div className="flex items-center gap-2">
                      <input value={s.title} onChange={e => updateStep(active.id, s.id, { title: e.target.value })} className="flex-1 text-[11px] bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80" placeholder="Title" />
                      <button onClick={() => removeStep(active.id, s.id)} className="text-red-400/50 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                    </div>
                    <input value={s.description} onChange={e => updateStep(active.id, s.id, { description: e.target.value })} className="w-full text-[11px] bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80" placeholder="Description" />
                  </div>
                ))}
              </div>
              <button onClick={() => onInsertCode(generateCode(active.id))} className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-medium hover:bg-emerald-500/30"><Code className="h-3.5 w-3.5" />Generate Wizard</button>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
