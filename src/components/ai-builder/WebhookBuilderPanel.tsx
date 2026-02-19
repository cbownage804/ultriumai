import { X, Webhook, Plus, Play, Trash2, Copy, ToggleLeft, ToggleRight } from 'lucide-react';
import type { WebhookConfig, WebhookTestResult } from '@/hooks/useWebhookBuilder';
import { useState } from 'react';

interface WebhookBuilderPanelProps {
  open: boolean;
  onClose: () => void;
  webhooks: WebhookConfig[];
  testResults: WebhookTestResult[];
  isTesting: boolean;
  onAdd: (name: string, table: string, url: string) => void;
  onUpdate: (id: string, updates: Partial<WebhookConfig>) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
  onTest: (id: string) => void;
  onExportSQL: (webhook: WebhookConfig) => string;
  onApplySQL: (sql: string) => void;
}

export function WebhookBuilderPanel({ open, onClose, webhooks, testResults, isTesting, onAdd, onUpdate, onRemove, onToggle, onTest, onExportSQL, onApplySQL }: WebhookBuilderPanelProps) {
  const [name, setName] = useState('');
  const [table, setTable] = useState('');
  const [url, setUrl] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[650px] max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Webhook className="h-4 w-4 text-teal-400" />
            <span className="text-sm font-medium text-white">Webhook Builder</span>
            <span className="text-[10px] text-white/20">{webhooks.length} configured</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex gap-2">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Webhook name" className="flex-1 h-7 px-2 bg-black/30 border border-white/[0.08] rounded text-xs text-white/80" />
            <input value={table} onChange={e => setTable(e.target.value)} placeholder="Table" className="w-28 h-7 px-2 bg-black/30 border border-white/[0.08] rounded text-xs text-white/80" />
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Target URL" className="flex-1 h-7 px-2 bg-black/30 border border-white/[0.08] rounded text-xs text-white/80" />
            <button onClick={() => { if (name && table && url) { onAdd(name, table, url); setName(''); setTable(''); setUrl(''); } }} className="h-7 w-7 flex items-center justify-center bg-teal-500/20 text-teal-300 rounded hover:bg-teal-500/30">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {webhooks.map(w => (
            <div key={w.id} className="p-3 bg-black/20 rounded-lg border border-white/[0.04] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => onToggle(w.id)} className="text-white/30 hover:text-white/60">
                    {w.isActive ? <ToggleRight className="h-4 w-4 text-emerald-400" /> : <ToggleLeft className="h-4 w-4" />}
                  </button>
                  <span className="text-xs text-white/70 font-medium">{w.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400/60">{w.triggerEvent}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => onTest(w.id)} disabled={isTesting} className="text-[10px] text-teal-400/60 hover:text-teal-300 disabled:opacity-30">
                    <Play className="h-3 w-3" />
                  </button>
                  <button onClick={() => { const sql = onExportSQL(w); navigator.clipboard.writeText(sql); }} className="text-white/20 hover:text-white/50">
                    <Copy className="h-3 w-3" />
                  </button>
                  <button onClick={() => onRemove(w.id)} className="text-white/20 hover:text-red-400">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="text-[10px] text-white/30 font-mono">{w.triggerTable} → {w.targetUrl}</div>
            </div>
          ))}

          {testResults.length > 0 && (
            <div className="space-y-1 pt-3 border-t border-white/[0.06]">
              <span className="text-[10px] text-white/30">Test Results</span>
              {testResults.slice(0, 5).map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px]">
                  <span className={r.success ? 'text-emerald-400' : 'text-red-400'}>{r.statusCode || 'ERR'}</span>
                  <span className="text-white/30">{r.duration}ms</span>
                  <span className="text-white/20 truncate">{r.responseBody.slice(0, 60)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
