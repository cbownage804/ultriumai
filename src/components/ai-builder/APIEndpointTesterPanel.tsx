import { X, Send, Plus, Trash2, Clock, Folder } from 'lucide-react';
import type { APIRequest, APIResponse, RequestCollection } from '@/hooks/useAPIEndpointTester';
import { cn } from '@/lib/utils';

interface APIEndpointTesterPanelProps {
  open: boolean;
  onClose: () => void;
  collections: RequestCollection[];
  activeRequest: APIRequest | null;
  response: APIResponse | null;
  isLoading: boolean;
  history: { request: APIRequest; response: APIResponse }[];
  onCreateRequest: (collectionId: string, name?: string) => void;
  onUpdateRequest: (updates: Partial<APIRequest>) => void;
  onDeleteRequest: (id: string) => void;
  onSendRequest: () => void;
  onSetActiveRequest: (req: APIRequest) => void;
}

const METHOD_COLORS: Record<string, string> = { GET: 'text-emerald-400', POST: 'text-amber-400', PUT: 'text-blue-400', PATCH: 'text-purple-400', DELETE: 'text-red-400' };

export function APIEndpointTesterPanel({ open, onClose, collections, activeRequest, response, isLoading, history, onCreateRequest, onUpdateRequest, onDeleteRequest, onSendRequest, onSetActiveRequest }: APIEndpointTesterPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[800px] max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-orange-400" />
            <span className="text-sm font-medium text-white">API Endpoint Tester</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Collections sidebar */}
          <div className="w-48 border-r border-white/[0.06] p-2 overflow-y-auto space-y-1">
            {collections.map(col => (
              <div key={col.id}>
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-[10px] text-white/30 flex items-center gap-1"><Folder className="h-3 w-3" />{col.name}</span>
                  <button onClick={() => onCreateRequest(col.id)} className="text-white/20 hover:text-white/50"><Plus className="h-3 w-3" /></button>
                </div>
                {col.requests.map(req => (
                  <button
                    key={req.id}
                    onClick={() => onSetActiveRequest(req)}
                    className={cn("w-full text-left px-3 py-1 text-[11px] rounded flex items-center gap-1.5", activeRequest?.id === req.id ? 'bg-orange-500/10 text-orange-300' : 'text-white/40 hover:bg-white/5')}
                  >
                    <span className={cn("text-[9px] font-mono font-bold", METHOD_COLORS[req.method])}>{req.method.slice(0, 3)}</span>
                    <span className="truncate">{req.name}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Request editor */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeRequest ? (
              <>
                <div className="p-3 border-b border-white/[0.06] space-y-2">
                  <div className="flex gap-2">
                    <select value={activeRequest.method} onChange={e => onUpdateRequest({ method: e.target.value as any })} className="h-8 px-2 bg-black/30 border border-white/[0.08] rounded text-xs text-white/80 font-mono">
                      {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <input value={activeRequest.url} onChange={e => onUpdateRequest({ url: e.target.value })} placeholder="https://..." className="flex-1 h-8 px-2 bg-black/30 border border-white/[0.08] rounded text-xs text-white/80 font-mono" />
                    <button onClick={onSendRequest} disabled={isLoading || !activeRequest.url} className="px-4 h-8 bg-orange-500/20 text-orange-300 rounded text-xs font-medium hover:bg-orange-500/30 disabled:opacity-30">
                      {isLoading ? '...' : 'Send'}
                    </button>
                  </div>
                  {['POST', 'PUT', 'PATCH'].includes(activeRequest.method) && (
                    <textarea
                      value={activeRequest.body || ''}
                      onChange={e => onUpdateRequest({ body: e.target.value })}
                      placeholder='{"key": "value"}'
                      className="w-full h-20 bg-black/30 border border-white/[0.08] rounded p-2 text-[10px] font-mono text-white/70 resize-none"
                    />
                  )}
                </div>

                {/* Response */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {response ? (
                    <>
                      <div className="flex items-center gap-3 text-xs">
                        <span className={cn("font-mono font-bold", response.status >= 200 && response.status < 300 ? 'text-emerald-400' : response.status >= 400 ? 'text-red-400' : 'text-amber-400')}>
                          {response.status} {response.statusText}
                        </span>
                        <span className="text-white/20">{response.duration}ms</span>
                        <span className="text-white/15 flex items-center gap-1"><Clock className="h-3 w-3" />{response.timestamp.toLocaleTimeString()}</span>
                      </div>
                      <pre className="bg-black/40 rounded-lg p-3 text-[10px] font-mono text-white/60 overflow-auto max-h-60">{(() => { try { return JSON.stringify(JSON.parse(response.body), null, 2); } catch { return response.body; } })()}</pre>
                    </>
                  ) : (
                    <p className="text-xs text-white/20 text-center py-8">Send a request to see the response</p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-white/20">Select or create a request</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
