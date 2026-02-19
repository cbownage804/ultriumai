import { X, Plus, Trash2, Code, Database as DbIcon, Copy } from 'lucide-react';
import type { GraphQLSchema, GraphQLType } from '@/hooks/useGraphQLBuilder';
import { cn } from '@/lib/utils';

interface GraphQLBuilderPanelProps {
  open: boolean;
  onClose: () => void;
  schemas: GraphQLSchema[];
  activeSchema: GraphQLSchema | null;
  scalarTypes: string[];
  onCreateSchema: (name: string) => void;
  onSetActiveSchema: (id: string) => void;
  onAddType: (schemaId: string, name: string) => void;
  onAddField: (schemaId: string, typeId: string) => void;
  onUpdateField: (schemaId: string, typeId: string, fieldIndex: number, update: Partial<GraphQLType['fields'][0]>) => void;
  onRemoveField: (schemaId: string, typeId: string, fieldIndex: number) => void;
  onRemoveType: (schemaId: string, typeId: string) => void;
  onAddQuery: (schemaId: string, type: 'query' | 'mutation' | 'subscription') => void;
  onRemoveQuery: (schemaId: string, queryId: string) => void;
  onGenerateSDL: (schemaId: string) => string;
  onGenerateResolvers: (schemaId: string) => string;
  onInsertCode: (code: string) => void;
}

export function GraphQLBuilderPanel({ open, onClose, schemas, activeSchema, scalarTypes, onCreateSchema, onSetActiveSchema, onAddType, onAddField, onUpdateField, onRemoveField, onRemoveType, onAddQuery, onRemoveQuery, onGenerateSDL, onGenerateResolvers, onInsertCode }: GraphQLBuilderPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[850px] max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <DbIcon className="h-4 w-4 text-pink-400" />
            <span className="text-sm font-medium text-white">GraphQL Schema Builder</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-44 border-r border-white/[0.06] p-2 overflow-y-auto space-y-1">
            <button onClick={() => onCreateSchema('New Schema')} className="w-full flex items-center gap-1 px-2 py-1.5 text-[11px] text-pink-400 hover:bg-pink-500/10 rounded">
              <Plus className="h-3 w-3" /> New Schema
            </button>
            {schemas.map(s => (
              <button key={s.id} onClick={() => onSetActiveSchema(s.id)} className={cn("w-full text-left px-3 py-1.5 text-[11px] rounded truncate", activeSchema?.id === s.id ? 'bg-pink-500/10 text-pink-300' : 'text-white/40 hover:bg-white/5')}>
                {s.name}
              </button>
            ))}
          </div>

          {/* Main */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeSchema ? (
              <>
                {/* Types */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-medium text-white/60">Types</h3>
                    <button onClick={() => onAddType(activeSchema.id, `Type${activeSchema.types.length + 1}`)} className="text-[10px] text-pink-400 hover:text-pink-300 flex items-center gap-1"><Plus className="h-3 w-3" />Add Type</button>
                  </div>
                  {activeSchema.types.map(type => (
                    <div key={type.id} className="bg-black/30 rounded-lg border border-white/[0.06] p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-violet-300">{type.name}</span>
                        <div className="flex gap-1">
                          <button onClick={() => onAddField(activeSchema.id, type.id)} className="text-white/20 hover:text-white/50"><Plus className="h-3 w-3" /></button>
                          <button onClick={() => onRemoveType(activeSchema.id, type.id)} className="text-white/20 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                        </div>
                      </div>
                      {type.fields.map((field, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input value={field.name} onChange={e => onUpdateField(activeSchema.id, type.id, idx, { name: e.target.value })} className="flex-1 h-6 px-1.5 bg-black/30 border border-white/[0.06] rounded text-[10px] text-white/70 font-mono" />
                          <select value={field.type} onChange={e => onUpdateField(activeSchema.id, type.id, idx, { type: e.target.value })} className="h-6 px-1 bg-black/30 border border-white/[0.06] rounded text-[10px] text-white/60">
                            {scalarTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            {activeSchema.types.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                          </select>
                          <label className="flex items-center gap-1 text-[9px] text-white/30">
                            <input type="checkbox" checked={!field.nullable} onChange={e => onUpdateField(activeSchema.id, type.id, idx, { nullable: !e.target.checked })} className="h-3 w-3" />!
                          </label>
                          <label className="flex items-center gap-1 text-[9px] text-white/30">
                            <input type="checkbox" checked={field.isList} onChange={e => onUpdateField(activeSchema.id, type.id, idx, { isList: e.target.checked })} className="h-3 w-3" />[]
                          </label>
                          <button onClick={() => onRemoveField(activeSchema.id, type.id, idx)} className="text-white/15 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Queries */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-medium text-white/60">Operations</h3>
                    <div className="flex gap-1">
                      {(['query', 'mutation', 'subscription'] as const).map(t => (
                        <button key={t} onClick={() => onAddQuery(activeSchema.id, t)} className="text-[9px] px-2 py-0.5 bg-white/5 rounded text-white/40 hover:text-white/60">{t}</button>
                      ))}
                    </div>
                  </div>
                  {activeSchema.queries.map(q => (
                    <div key={q.id} className="flex items-center gap-2 bg-black/20 rounded px-2 py-1">
                      <span className={cn("text-[9px] font-mono font-bold", q.type === 'query' ? 'text-emerald-400' : q.type === 'mutation' ? 'text-amber-400' : 'text-purple-400')}>{q.type.slice(0, 3).toUpperCase()}</span>
                      <span className="text-[11px] font-mono text-white/50 flex-1">{q.name}</span>
                      <button onClick={() => onRemoveQuery(activeSchema.id, q.id)} className="text-white/15 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>

                {/* Generate */}
                <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
                  <button onClick={() => onInsertCode(onGenerateSDL(activeSchema.id))} className="flex items-center gap-1 px-3 py-1.5 bg-pink-500/20 text-pink-300 rounded text-[11px] hover:bg-pink-500/30">
                    <Code className="h-3 w-3" /> Export SDL
                  </button>
                  <button onClick={() => onInsertCode(onGenerateResolvers(activeSchema.id))} className="flex items-center gap-1 px-3 py-1.5 bg-violet-500/20 text-violet-300 rounded text-[11px] hover:bg-violet-500/30">
                    <Copy className="h-3 w-3" /> Export Resolvers
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs text-white/20 text-center py-8">Create a schema to get started</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
