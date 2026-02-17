import { useState, useCallback } from 'react';
import {
  X, Plus, Play, Trash2, Copy, Download, Server, ServerOff,
  ChevronRight, Send, Clock, Shield, Tag, FileJson, Zap,
  CheckCircle2, AlertCircle, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { APIEndpoint, HttpMethod, RequestLog } from '@/hooks/useAPIBuilder';

// ─── Types ───────────────────────────────────────────────────

interface APIBuilderPanelProps {
  open: boolean;
  onClose: () => void;
  endpoints: APIEndpoint[];
  requestLogs: RequestLog[];
  isMockServerRunning: boolean;
  allTags: string[];
  onAddEndpoint: (ep: Omit<APIEndpoint, 'id' | 'createdAt'>) => void;
  onRemoveEndpoint: (id: string) => void;
  onDuplicateEndpoint: (id: string) => void;
  onLoadTemplates: (tag?: string) => void;
  onSimulateRequest: (endpointId: string) => Promise<RequestLog>;
  onToggleMockServer: () => void;
  onExportOpenAPI: () => object;
  onClearLogs: () => void;
}

type Tab = 'endpoints' | 'logs' | 'docs';

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'text-emerald-400 bg-emerald-400/10',
  POST: 'text-sky-400 bg-sky-400/10',
  PUT: 'text-amber-400 bg-amber-400/10',
  PATCH: 'text-orange-400 bg-orange-400/10',
  DELETE: 'text-red-400 bg-red-400/10',
};

// ─── Component ───────────────────────────────────────────────

export function APIBuilderPanel({
  open, onClose, endpoints, requestLogs, isMockServerRunning, allTags,
  onAddEndpoint, onRemoveEndpoint, onDuplicateEndpoint, onLoadTemplates,
  onSimulateRequest, onToggleMockServer, onExportOpenAPI, onClearLogs,
}: APIBuilderPanelProps) {
  const [tab, setTab] = useState<Tab>('endpoints');
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<RequestLog | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const filteredEndpoints = filterTag
    ? endpoints.filter(ep => ep.tags.includes(filterTag))
    : endpoints;

  const handleTest = useCallback(async (endpointId: string) => {
    setIsRequesting(endpointId);
    try {
      const log = await onSimulateRequest(endpointId);
      setLastResponse(log);
      toast.success(`${log.response.statusCode} — ${log.response.latency}ms`);
    } catch {
      toast.error('Request failed');
    } finally {
      setIsRequesting(null);
    }
  }, [onSimulateRequest]);

  const handleExport = useCallback(() => {
    const spec = onExportOpenAPI();
    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'openapi-spec.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('OpenAPI spec exported');
  }, [onExportOpenAPI]);

  const handleAddQuick = useCallback(() => {
    onAddEndpoint({
      method: 'GET',
      path: '/api/new-endpoint',
      name: 'New Endpoint',
      description: 'A new API endpoint',
      tags: ['custom'],
      responseSchema: [
        { name: 'id', type: 'uuid', required: true },
        { name: 'message', type: 'string', required: true, example: 'Hello World' },
      ],
      statusCode: 200,
      mockDelay: 200,
      authRequired: false,
    });
    toast.success('Endpoint added');
  }, [onAddEndpoint]);

  const detail = selectedEndpoint ? endpoints.find(ep => ep.id === selectedEndpoint) : null;

  if (!open) return null;

  return (
    <div className="w-80 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col shrink-0 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-9 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-1.5">
          <Server className="h-3.5 w-3.5 text-orange-400" />
          <span className="text-xs font-medium text-white/70">API Builder</span>
          <span className="text-[9px] text-white/20">{endpoints.length} endpoints</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleMockServer}
            className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] transition-colors",
              isMockServerRunning ? "bg-emerald-400/10 text-emerald-400" : "bg-white/[0.04] text-white/30"
            )}
          >
            {isMockServerRunning ? <Zap className="h-2.5 w-2.5" /> : <ServerOff className="h-2.5 w-2.5" />}
            {isMockServerRunning ? 'Live' : 'Off'}
          </button>
          <button onClick={onClose} className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white/50">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Detail view */}
      {detail ? (
        <div className="flex-1 overflow-y-auto">
          <button onClick={() => setSelectedEndpoint(null)} className="flex items-center gap-1 px-3 py-2 text-[10px] text-white/30 hover:text-white/50">
            ← Back
          </button>

          <div className="px-3 pb-4 space-y-3">
            {/* Method + Path */}
            <div className="flex items-center gap-2">
              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", METHOD_COLORS[detail.method])}>
                {detail.method}
              </span>
              <span className="text-[11px] text-white/50 font-mono">{detail.path}</span>
            </div>

            <h3 className="text-sm font-semibold text-white/70">{detail.name}</h3>
            <p className="text-[10px] text-white/30">{detail.description}</p>

            {/* Meta */}
            <div className="flex flex-wrap gap-2 text-[9px]">
              <span className="flex items-center gap-0.5 text-white/20">
                <Clock className="h-2.5 w-2.5" /> {detail.mockDelay}ms
              </span>
              <span className={cn("flex items-center gap-0.5", detail.authRequired ? "text-amber-400/50" : "text-white/15")}>
                <Shield className="h-2.5 w-2.5" /> {detail.authRequired ? 'Auth required' : 'Public'}
              </span>
              <span className="flex items-center gap-0.5 text-white/20">
                Status: {detail.statusCode}
              </span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {detail.tags.map(t => (
                <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-400/10 text-orange-400/60">
                  {t}
                </span>
              ))}
            </div>

            {/* Path Params */}
            {detail.pathParams && detail.pathParams.length > 0 && (
              <div>
                <h4 className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Path Parameters</h4>
                {detail.pathParams.map(p => (
                  <div key={p} className="text-[10px] text-white/40 font-mono">:{p}</div>
                ))}
              </div>
            )}

            {/* Query Params */}
            {detail.queryParams && detail.queryParams.length > 0 && (
              <div>
                <h4 className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Query Parameters</h4>
                {detail.queryParams.map(p => (
                  <div key={p.name} className="flex items-center gap-1.5 text-[10px] py-0.5">
                    <span className="text-white/40 font-mono">{p.name}</span>
                    <span className="text-white/15">{p.type}</span>
                    {p.required && <span className="text-red-400/40 text-[8px]">required</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Request Body */}
            {detail.requestBody && detail.requestBody.length > 0 && (
              <div>
                <h4 className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Request Body</h4>
                <div className="bg-white/[0.02] rounded p-2 border border-white/[0.04]">
                  {detail.requestBody.map(f => (
                    <div key={f.name} className="flex items-center gap-1.5 text-[10px] py-0.5">
                      <span className="text-white/50 font-mono">{f.name}</span>
                      <span className="text-white/15">{f.type}</span>
                      {f.required && <span className="text-red-400/40 text-[8px]">*</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Response Schema */}
            <div>
              <h4 className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Response Schema</h4>
              <div className="bg-white/[0.02] rounded p-2 border border-white/[0.04]">
                {detail.responseSchema.map(f => (
                  <div key={f.name} className="flex items-center gap-1.5 text-[10px] py-0.5">
                    <span className="text-emerald-400/50 font-mono">{f.name}</span>
                    <span className="text-white/15">{f.type}</span>
                    {f.required && <span className="text-red-400/40 text-[8px]">*</span>}
                    {f.example && <span className="text-white/10 ml-auto truncate max-w-[80px]">"{f.example}"</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Test button */}
            <Button
              size="sm"
              onClick={() => handleTest(detail.id)}
              disabled={isRequesting === detail.id}
              className="w-full h-7 text-[10px] bg-orange-600 hover:bg-orange-500"
            >
              {isRequesting === detail.id ? (
                <><Clock className="h-3 w-3 mr-1 animate-spin" /> Testing...</>
              ) : (
                <><Send className="h-3 w-3 mr-1" /> Send Test Request</>
              )}
            </Button>

            {/* Last response preview */}
            {lastResponse && lastResponse.request.endpointId === detail.id && (
              <div className="bg-white/[0.02] rounded p-2 border border-white/[0.04]">
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    "text-[10px] font-bold",
                    lastResponse.response.statusCode < 300 ? "text-emerald-400" : "text-red-400"
                  )}>
                    {lastResponse.response.statusCode}
                  </span>
                  <span className="text-[9px] text-white/20">{lastResponse.response.latency}ms</span>
                </div>
                <pre className="text-[9px] text-white/30 font-mono overflow-auto max-h-32 whitespace-pre-wrap">
                  {JSON.stringify(lastResponse.response.body, null, 2)}
                </pre>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" onClick={() => { onDuplicateEndpoint(detail.id); toast.success('Duplicated'); }} className="flex-1 h-6 text-[9px]">
                <Copy className="h-3 w-3 mr-1" /> Duplicate
              </Button>
              <Button size="sm" variant="outline" onClick={() => { onRemoveEndpoint(detail.id); setSelectedEndpoint(null); toast.success('Removed'); }} className="flex-1 h-6 text-[9px] text-red-400/60 border-red-400/20 hover:bg-red-400/10">
                <Trash2 className="h-3 w-3 mr-1" /> Delete
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex items-center gap-1 px-2 py-1 border-b border-white/[0.06]">
            {(['endpoints', 'logs', 'docs'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "text-[10px] px-2 py-1 rounded capitalize",
                  tab === t ? "bg-white/10 text-white/70" : "text-white/30 hover:text-white/50"
                )}
              >
                {t}
                {t === 'logs' && requestLogs.length > 0 && (
                  <span className="ml-1 text-[8px] text-orange-400/60">{requestLogs.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Endpoints tab */}
          {tab === 'endpoints' && (
            <>
              {/* Quick actions */}
              <div className="flex items-center gap-1 px-2 py-1.5 border-b border-white/[0.04]">
                <Button size="sm" variant="outline" onClick={handleAddQuick} className="h-6 text-[9px] gap-1 flex-1">
                  <Plus className="h-3 w-3" /> New
                </Button>
                {endpoints.length === 0 && (
                  <Button size="sm" variant="outline" onClick={() => onLoadTemplates()} className="h-6 text-[9px] gap-1 flex-1">
                    <FileJson className="h-3 w-3" /> Load Templates
                  </Button>
                )}
                {endpoints.length > 0 && (
                  <Button size="sm" variant="outline" onClick={handleExport} className="h-6 text-[9px] gap-1">
                    <Download className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Tag filter */}
              {allTags.length > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 overflow-x-auto border-b border-white/[0.04] scrollbar-none">
                  <button
                    onClick={() => setFilterTag(null)}
                    className={cn("text-[9px] px-1.5 py-0.5 rounded-full shrink-0", !filterTag ? "bg-orange-400/20 text-orange-400" : "text-white/20 bg-white/[0.03]")}
                  >
                    All
                  </button>
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setFilterTag(tag)}
                      className={cn("text-[9px] px-1.5 py-0.5 rounded-full shrink-0", filterTag === tag ? "bg-orange-400/20 text-orange-400" : "text-white/20 bg-white/[0.03]")}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}

              {/* Endpoint list */}
              <div className="flex-1 overflow-y-auto">
                {filteredEndpoints.length === 0 ? (
                  <div className="py-8 text-center">
                    <Server className="h-8 w-8 text-white/[0.05] mx-auto mb-2" />
                    <p className="text-[10px] text-white/20">No endpoints yet</p>
                    <p className="text-[9px] text-white/10 mt-0.5">Add one or load templates</p>
                  </div>
                ) : (
                  filteredEndpoints.map(ep => (
                    <button
                      key={ep.id}
                      onClick={() => setSelectedEndpoint(ep.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors text-left group"
                    >
                      <span className={cn("text-[9px] font-bold px-1 py-0.5 rounded shrink-0 w-10 text-center", METHOD_COLORS[ep.method])}>
                        {ep.method}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] text-white/50 font-mono truncate block">{ep.path}</span>
                        <span className="text-[9px] text-white/20">{ep.name}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleTest(ep.id); }}
                        className="h-5 w-5 rounded flex items-center justify-center text-white/10 hover:text-orange-400/60 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Test"
                      >
                        <Play className="h-3 w-3" />
                      </button>
                      <ChevronRight className="h-3 w-3 text-white/10 shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </>
          )}

          {/* Logs tab */}
          {tab === 'logs' && (
            <div className="flex-1 overflow-y-auto">
              {requestLogs.length > 0 && (
                <div className="px-2 py-1 border-b border-white/[0.04]">
                  <Button size="sm" variant="outline" onClick={onClearLogs} className="h-5 text-[9px]">
                    Clear
                  </Button>
                </div>
              )}
              {requestLogs.length === 0 ? (
                <div className="py-8 text-center text-white/15 text-[10px]">No requests yet</div>
              ) : (
                requestLogs.map(log => (
                  <div key={log.request.id} className="px-3 py-2 border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("text-[9px] font-bold px-1 rounded", METHOD_COLORS[log.request.method])}>
                        {log.request.method}
                      </span>
                      <span className="text-[10px] text-white/40 font-mono truncate flex-1">{log.request.path}</span>
                      <span className={cn(
                        "text-[9px] font-bold",
                        log.response.statusCode < 300 ? "text-emerald-400/60" : "text-red-400/60"
                      )}>
                        {log.response.statusCode}
                      </span>
                      <span className="text-[9px] text-white/15">{log.response.latency}ms</span>
                    </div>
                    <span className="text-[8px] text-white/10">
                      {new Date(log.request.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Docs tab */}
          {tab === 'docs' && (
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              <div className="text-[10px] text-white/30 space-y-2">
                <h4 className="text-white/50 font-medium">API Documentation</h4>
                <p>Your API has <strong className="text-white/50">{endpoints.length}</strong> endpoints across <strong className="text-white/50">{allTags.length}</strong> tags.</p>

                {allTags.map(tag => {
                  const tagEndpoints = endpoints.filter(ep => ep.tags.includes(tag));
                  return (
                    <div key={tag} className="bg-white/[0.02] rounded p-2 border border-white/[0.04]">
                      <div className="flex items-center gap-1 mb-1">
                        <Tag className="h-3 w-3 text-orange-400/40" />
                        <span className="text-[10px] text-white/40 font-medium capitalize">{tag}</span>
                        <span className="text-[9px] text-white/15 ml-auto">{tagEndpoints.length}</span>
                      </div>
                      {tagEndpoints.map(ep => (
                        <div key={ep.id} className="flex items-center gap-1.5 text-[9px] py-0.5">
                          <span className={cn("font-bold px-1 rounded", METHOD_COLORS[ep.method])}>{ep.method}</span>
                          <span className="text-white/30 font-mono">{ep.path}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}

                <Button size="sm" variant="outline" onClick={handleExport} className="w-full h-7 text-[10px] gap-1 mt-2">
                  <Download className="h-3 w-3" /> Export OpenAPI 3.0 Spec
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
