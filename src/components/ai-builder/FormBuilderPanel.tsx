import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus, ArrowUp, ArrowDown, Trash2, Code, FileText } from 'lucide-react';
import type { FormField, FormConfig } from '@/hooks/useFormBuilder';

interface Props {
  forms: FormConfig[];
  activeForm: FormConfig | null;
  fieldTypes: FormField['type'][];
  onCreateForm: (name: string) => void;
  onSetActiveForm: (id: string) => void;
  onAddField: (formId: string, type: FormField['type']) => void;
  onUpdateField: (formId: string, fieldId: string, updates: Partial<FormField>) => void;
  onRemoveField: (formId: string, fieldId: string) => void;
  onMoveField: (formId: string, fieldId: string, dir: 'up' | 'down') => void;
  onGenerateZod: (formId: string) => string;
  onGenerateReact: (formId: string) => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function FormBuilderPanel({ forms, activeForm, fieldTypes, onCreateForm, onSetActiveForm, onAddField, onUpdateField, onRemoveField, onMoveField, onGenerateZod, onGenerateReact, onInsertCode, onClose }: Props) {
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0d0d14] border-l border-white/[0.06] z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-white">Form Builder</span>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50 uppercase tracking-wider">Forms</span>
              <button onClick={() => onCreateForm(`Form ${forms.length + 1}`)} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"><Plus className="h-3 w-3" /> New</button>
            </div>
            <div className="flex gap-1 flex-wrap">
              {forms.map(f => (
                <button key={f.id} onClick={() => onSetActiveForm(f.id)} className={`text-xs px-2 py-1 rounded ${activeForm?.id === f.id ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-white/50 hover:text-white/80'}`}>{f.name}</button>
              ))}
            </div>
          </div>

          {activeForm && (
            <>
              <div className="space-y-2">
                <span className="text-xs text-white/50 uppercase tracking-wider">Add Field</span>
                <div className="flex flex-wrap gap-1">
                  {fieldTypes.map(ft => (
                    <button key={ft} onClick={() => onAddField(activeForm.id, ft)} className="text-[10px] px-2 py-1 bg-white/5 rounded hover:bg-white/10 text-white/60">{ft}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs text-white/50 uppercase tracking-wider">Fields ({activeForm.fields.length})</span>
                {activeForm.fields.map((field, idx) => (
                  <div key={field.id} className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white/80">{field.label} <span className="text-white/30">({field.type})</span></span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => onMoveField(activeForm.id, field.id, 'up')} disabled={idx === 0} className="text-white/30 hover:text-white/60 disabled:opacity-20"><ArrowUp className="h-3 w-3" /></button>
                        <button onClick={() => onMoveField(activeForm.id, field.id, 'down')} disabled={idx === activeForm.fields.length - 1} className="text-white/30 hover:text-white/60 disabled:opacity-20"><ArrowDown className="h-3 w-3" /></button>
                        <button onClick={() => onRemoveField(activeForm.id, field.id)} className="text-red-400/50 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </div>
                    <input value={field.label} onChange={e => onUpdateField(activeForm.id, field.id, { label: e.target.value })} placeholder="Label" className="w-full text-[11px] bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80" />
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-[10px] text-white/50">
                        <input type="checkbox" checked={field.required} onChange={e => onUpdateField(activeForm.id, field.id, { required: e.target.checked })} className="rounded" /> Required
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => onInsertCode(onGenerateReact(activeForm.id))} className="flex items-center justify-center gap-1.5 py-2 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-medium hover:bg-emerald-500/30"><Code className="h-3 w-3" /> React Form</button>
                <button onClick={() => onInsertCode(onGenerateZod(activeForm.id))} className="flex items-center justify-center gap-1.5 py-2 bg-violet-500/20 text-violet-300 rounded-lg text-xs font-medium hover:bg-violet-500/30"><Code className="h-3 w-3" /> Zod Schema</button>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
