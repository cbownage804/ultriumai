import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus, Trash2, Copy, FileCheck, ChevronDown } from 'lucide-react';
import type { ValidationSchema, ValidationField } from '@/hooks/useDataValidationStudio';

interface Props {
  schemas: ValidationSchema[];
  activeSchemaId: string;
  onSetActiveSchemaId: (id: string) => void;
  onCreateSchema: (name: string) => void;
  onDeleteSchema: (id: string) => void;
  onAddField: (schemaId: string, field: Omit<ValidationField, 'id'>) => void;
  onRemoveField: (schemaId: string, fieldId: string) => void;
  onUpdateField: (schemaId: string, fieldId: string, updates: Partial<ValidationField>) => void;
  onGenerateCode: () => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

const FIELD_TYPES: ValidationField['type'][] = ['string', 'number', 'boolean', 'date', 'email', 'url', 'uuid', 'enum', 'array', 'object'];

export function DataValidationPanel({ schemas, activeSchemaId, onSetActiveSchemaId, onCreateSchema, onDeleteSchema, onAddField, onRemoveField, onUpdateField, onGenerateCode, onInsertCode, onClose }: Props) {
  const [newSchemaName, setNewSchemaName] = useState('');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<ValidationField['type']>('string');
  const [preview, setPreview] = useState('');

  const activeSchema = schemas.find(s => s.id === activeSchemaId);

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-[#0d0d14] border-l border-white/[0.06] z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-medium text-white">Data Validation Studio</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-white/40 hover:text-white"><X className="h-4 w-4" /></Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          {/* Schema selector */}
          <div>
            <label className="text-xs text-white/50 mb-1 block">Schemas</label>
            <div className="flex gap-1 flex-wrap mb-2">
              {schemas.map(s => (
                <button key={s.id} onClick={() => onSetActiveSchemaId(s.id)} className={`text-xs px-2 py-1 rounded ${s.id === activeSchemaId ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-white/5 text-white/50 border border-white/10 hover:text-white/70'}`}>
                  {s.name} <span className="text-white/30">({s.fields.length})</span>
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              <Input value={newSchemaName} onChange={e => setNewSchemaName(e.target.value)} placeholder="New schema name" className="h-7 text-xs bg-white/5 border-white/10 text-white flex-1" onKeyDown={e => { if (e.key === 'Enter' && newSchemaName.trim()) { onCreateSchema(newSchemaName.trim()); setNewSchemaName(''); } }} />
              <Button size="sm" variant="outline" className="h-7 text-xs border-white/10" onClick={() => { if (newSchemaName.trim()) { onCreateSchema(newSchemaName.trim()); setNewSchemaName(''); } }}><Plus className="h-3 w-3" /></Button>
            </div>
          </div>

          {/* Fields */}
          {activeSchema && (
            <div>
              <label className="text-xs text-white/50 mb-1 block">Fields — {activeSchema.name}</label>
              <div className="space-y-1.5 mb-2">
                {activeSchema.fields.map(f => (
                  <div key={f.id} className="p-2 rounded bg-white/[0.03] group">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-white font-mono flex-1">{f.name}</span>
                      <Badge variant="outline" className="text-[9px] h-4 border-cyan-500/30 text-cyan-400">{f.type}</Badge>
                      <button onClick={() => onUpdateField(activeSchemaId, f.id, { required: !f.required })} className={`text-[9px] px-1 rounded ${f.required ? 'text-red-400 bg-red-500/10' : 'text-white/30'}`}>
                        {f.required ? 'req' : 'opt'}
                      </button>
                      <button onClick={() => onRemoveField(activeSchemaId, f.id)} className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                    </div>
                    {/* Inline constraints editor */}
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {(f.type === 'string' || f.type === 'email' || f.type === 'url') && (
                        <>
                          <Input value={f.constraints.minLength ?? ''} onChange={e => onUpdateField(activeSchemaId, f.id, { constraints: { ...f.constraints, minLength: e.target.value ? Number(e.target.value) : undefined } })} placeholder="min" className="h-5 w-12 text-[9px] bg-white/5 border-white/10 text-white px-1" />
                          <Input value={f.constraints.maxLength ?? ''} onChange={e => onUpdateField(activeSchemaId, f.id, { constraints: { ...f.constraints, maxLength: e.target.value ? Number(e.target.value) : undefined } })} placeholder="max" className="h-5 w-12 text-[9px] bg-white/5 border-white/10 text-white px-1" />
                        </>
                      )}
                      {f.type === 'number' && (
                        <>
                          <Input value={f.constraints.min ?? ''} onChange={e => onUpdateField(activeSchemaId, f.id, { constraints: { ...f.constraints, min: e.target.value ? Number(e.target.value) : undefined } })} placeholder="min" className="h-5 w-12 text-[9px] bg-white/5 border-white/10 text-white px-1" />
                          <Input value={f.constraints.max ?? ''} onChange={e => onUpdateField(activeSchemaId, f.id, { constraints: { ...f.constraints, max: e.target.value ? Number(e.target.value) : undefined } })} placeholder="max" className="h-5 w-12 text-[9px] bg-white/5 border-white/10 text-white px-1" />
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-1">
                <Input value={newFieldName} onChange={e => setNewFieldName(e.target.value)} placeholder="field name" className="h-7 text-xs bg-white/5 border-white/10 text-white flex-1" />
                <select value={newFieldType} onChange={e => setNewFieldType(e.target.value as any)} className="h-7 text-xs bg-white/5 border border-white/10 text-white rounded px-1">
                  {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <Button size="sm" variant="outline" className="h-7 text-xs border-white/10" onClick={() => {
                  if (newFieldName.trim()) {
                    onAddField(activeSchemaId, { name: newFieldName.trim(), type: newFieldType, required: true, constraints: {} });
                    setNewFieldName('');
                  }
                }}><Plus className="h-3 w-3" /></Button>
              </div>
            </div>
          )}

          {preview && (
            <div>
              <label className="text-xs text-white/50 mb-1 block">Generated Zod Schema</label>
              <pre className="text-[10px] text-white/60 bg-black/30 rounded p-2 overflow-auto max-h-60 font-mono whitespace-pre-wrap">{preview}</pre>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-white/[0.06] flex gap-2">
        <Button size="sm" variant="outline" className="flex-1 text-xs border-white/10" onClick={() => setPreview(onGenerateCode())}>Preview</Button>
        <Button size="sm" className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-500" onClick={() => onInsertCode(onGenerateCode())}><Copy className="h-3 w-3 mr-1" />Insert</Button>
      </div>
    </div>
  );
}
