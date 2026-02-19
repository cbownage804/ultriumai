import { X, Plus, Trash2, Mail, Eye, Code } from 'lucide-react';
import type { EmailTemplate } from '@/hooks/useEmailTemplateBuilder';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface EmailTemplatePanelProps {
  open: boolean;
  onClose: () => void;
  templates: EmailTemplate[];
  activeTemplate: EmailTemplate | null;
  presetKeys: string[];
  onSetActiveTemplate: (id: string) => void;
  onCreateTemplate: (presetKey?: string) => void;
  onUpdateTemplate: (id: string, update: Partial<EmailTemplate>) => void;
  onRemoveTemplate: (id: string) => void;
  onAddVariable: (templateId: string, name: string) => void;
  onRemoveVariable: (templateId: string, name: string) => void;
  onPreview: (templateId: string, data: Record<string, string>) => string;
  onGenerateSend: (templateId: string) => string;
  onInsertCode: (code: string) => void;
}

export function EmailTemplatePanel({ open, onClose, templates, activeTemplate, presetKeys, onSetActiveTemplate, onCreateTemplate, onUpdateTemplate, onRemoveTemplate, onAddVariable, onRemoveVariable, onPreview, onGenerateSend, onInsertCode }: EmailTemplatePanelProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, string>>({});

  if (!open) return null;

  const previewHtml = activeTemplate && showPreview ? onPreview(activeTemplate.id, previewData) : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[850px] max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-rose-400" />
            <span className="text-sm font-medium text-white">Email Template Builder</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-44 border-r border-white/[0.06] p-2 overflow-y-auto space-y-1">
            <button onClick={() => onCreateTemplate()} className="w-full flex items-center gap-1 px-2 py-1.5 text-[11px] text-rose-400 hover:bg-rose-500/10 rounded">
              <Plus className="h-3 w-3" /> Blank Template
            </button>
            <div className="py-1">
              <span className="px-2 text-[9px] text-white/20 uppercase">Presets</span>
            </div>
            {presetKeys.map(key => (
              <button key={key} onClick={() => onCreateTemplate(key)} className="w-full text-left px-3 py-1 text-[11px] text-white/30 hover:bg-white/5 rounded capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </button>
            ))}
            <div className="border-t border-white/[0.06] my-2" />
            {templates.map(t => (
              <button key={t.id} onClick={() => onSetActiveTemplate(t.id)} className={cn("w-full text-left px-3 py-1.5 text-[11px] rounded truncate", activeTemplate?.id === t.id ? 'bg-rose-500/10 text-rose-300' : 'text-white/40 hover:bg-white/5')}>
                {t.name}
              </button>
            ))}
          </div>

          {/* Main */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeTemplate ? (
              <>
                <div className="p-3 space-y-3 overflow-y-auto flex-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-white/30 block mb-1">Name</label>
                      <input value={activeTemplate.name} onChange={e => onUpdateTemplate(activeTemplate.id, { name: e.target.value })} className="w-full h-7 px-2 bg-black/30 border border-white/[0.06] rounded text-xs text-white/70" />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/30 block mb-1">Subject</label>
                      <input value={activeTemplate.subject} onChange={e => onUpdateTemplate(activeTemplate.id, { subject: e.target.value })} className="w-full h-7 px-2 bg-black/30 border border-white/[0.06] rounded text-xs text-white/70 font-mono" />
                    </div>
                  </div>

                  {/* Variables */}
                  <div>
                    <label className="text-[10px] text-white/30 block mb-1">Variables</label>
                    <div className="flex flex-wrap gap-1">
                      {activeTemplate.variables.map(v => (
                        <span key={v} className="flex items-center gap-1 px-2 py-0.5 bg-rose-500/10 text-rose-300 rounded text-[10px] font-mono">
                          {`{{${v}}}`}
                          <button onClick={() => onRemoveVariable(activeTemplate.id, v)} className="text-white/20 hover:text-red-400">×</button>
                        </span>
                      ))}
                      <button onClick={() => { const n = prompt('Variable name'); if (n) onAddVariable(activeTemplate.id, n); }} className="px-2 py-0.5 text-[10px] text-white/20 border border-dashed border-white/10 rounded hover:text-white/40">+ var</button>
                    </div>
                  </div>

                  {/* HTML Content */}
                  <div>
                    <label className="text-[10px] text-white/30 block mb-1">HTML Content</label>
                    <textarea value={activeTemplate.htmlContent} onChange={e => onUpdateTemplate(activeTemplate.id, { htmlContent: e.target.value })} className="w-full h-40 bg-black/30 border border-white/[0.06] rounded p-2 text-[10px] font-mono text-white/60 resize-none" />
                  </div>

                  {/* Preview toggle */}
                  {showPreview && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {activeTemplate.variables.map(v => (
                          <div key={v} className="flex items-center gap-1">
                            <span className="text-[9px] text-white/20 font-mono">{v}:</span>
                            <input value={previewData[v] || ''} onChange={e => setPreviewData(prev => ({ ...prev, [v]: e.target.value }))} className="h-6 w-28 px-1.5 bg-black/30 border border-white/[0.06] rounded text-[10px] text-white/60" placeholder={v} />
                          </div>
                        ))}
                      </div>
                      <div className="bg-white rounded-lg p-0 overflow-hidden">
                        <iframe srcDoc={previewHtml} className="w-full h-48 border-0" title="Email Preview" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 p-3 border-t border-white/[0.06]">
                  <button onClick={() => setShowPreview(!showPreview)} className={cn("flex items-center gap-1 px-3 py-1.5 rounded text-[11px]", showPreview ? 'bg-rose-500/20 text-rose-300' : 'bg-white/5 text-white/40 hover:bg-white/10')}>
                    <Eye className="h-3 w-3" /> Preview
                  </button>
                  <button onClick={() => onInsertCode(onGenerateSend(activeTemplate.id))} className="flex items-center gap-1 px-3 py-1.5 bg-violet-500/20 text-violet-300 rounded text-[11px] hover:bg-violet-500/30">
                    <Code className="h-3 w-3" /> Generate Send Function
                  </button>
                  <button onClick={() => onRemoveTemplate(activeTemplate.id)} className="ml-auto text-[10px] text-white/20 hover:text-red-400 flex items-center gap-1"><Trash2 className="h-3 w-3" />Delete</button>
                </div>
              </>
            ) : (
              <p className="text-xs text-white/20 text-center py-8 flex-1 flex items-center justify-center">Select or create a template</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
