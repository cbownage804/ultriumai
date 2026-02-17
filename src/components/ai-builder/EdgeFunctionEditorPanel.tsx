import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Zap, Plus, Play, Upload, Trash2, Loader2, CheckCircle2, XCircle,
  FileCode, RefreshCw, ExternalLink, Copy, Terminal, Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface EdgeFunctionEditorPanelProps {
  open: boolean;
  onClose: () => void;
  files: ProjectFile[];
  onUpsertFile: (path: string, content: string) => void;
  supabaseUrl?: string;
  supabaseKey?: string;
}

interface TestResult {
  status: number;
  statusText: string;
  body: string;
  timeMs: number;
}

const EDGE_FN_TEMPLATE = `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name } = await req.json();

    return new Response(
      JSON.stringify({ message: \`Hello \${name || 'World'}!\` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
`;

export function EdgeFunctionEditorPanel({ open, onClose, files, onUpsertFile, supabaseUrl, supabaseKey }: EdgeFunctionEditorPanelProps) {
  const [activeTab, setActiveTab] = useState<'functions' | 'test'>('functions');
  const [selectedFn, setSelectedFn] = useState<string | null>(null);
  const [newFnName, setNewFnName] = useState('');
  const [testBody, setTestBody] = useState('{\n  "name": "World"\n}');
  const [testMethod, setTestMethod] = useState('POST');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Get edge functions from project files
  const edgeFunctions = files
    .filter(f => f.path.startsWith('supabase/functions/') && f.path.endsWith('/index.ts'))
    .map(f => {
      const parts = f.path.split('/');
      return { name: parts[2], path: f.path, content: f.content };
    });

  const selectedFnFile = edgeFunctions.find(f => f.name === selectedFn);

  const createFunction = () => {
    if (!newFnName.trim()) return;
    const name = newFnName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const path = `supabase/functions/${name}/index.ts`;
    
    if (files.some(f => f.path === path)) {
      toast.error('Function already exists');
      return;
    }

    onUpsertFile(path, EDGE_FN_TEMPLATE);
    setSelectedFn(name);
    setNewFnName('');
    toast.success(`Created edge function: ${name}`);
  };

  const deleteFunction = (name: string) => {
    // Just remove from files by setting empty content (convention)
    const path = `supabase/functions/${name}/index.ts`;
    onUpsertFile(path, ''); // Will be handled by the file system
    if (selectedFn === name) setSelectedFn(null);
    toast.success(`Deleted: ${name}`);
  };

  const testFunction = async () => {
    if (!selectedFn) return;
    if (!supabaseUrl || !supabaseKey) {
      toast.error('Connect Supabase first to test functions');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const start = performance.now();
    try {
      const url = `${supabaseUrl}/functions/v1/${selectedFn}`;
      const resp = await fetch(url, {
        method: testMethod,
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        ...(testMethod !== 'GET' ? { body: testBody } : {}),
      });

      const body = await resp.text();
      const timeMs = Math.round(performance.now() - start);

      setTestResult({
        status: resp.status,
        statusText: resp.statusText,
        body,
        timeMs,
      });

      if (resp.ok) toast.success(`${resp.status} ${resp.statusText} (${timeMs}ms)`);
      else toast.error(`${resp.status} ${resp.statusText}`);
    } catch (e: any) {
      setTestResult({
        status: 0,
        statusText: 'Error',
        body: e.message,
        timeMs: Math.round(performance.now() - start),
      });
      toast.error(e.message);
    } finally {
      setIsTesting(false);
    }
  };

  const generateInvokeCode = (fnName: string) => {
    return `import { supabase } from './supabaseClient';

// Call the ${fnName} edge function
export async function call${fnName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}(payload: any) {
  const { data, error } = await supabase.functions.invoke('${fnName}', {
    body: payload,
  });

  if (error) throw error;
  return data;
}
`;
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 bg-[#0c0c14] border-white/10 shadow-2xl gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-4 pb-0">
          <DialogTitle className="text-base font-semibold text-white flex items-center gap-2">
            <Zap className="h-4.5 w-4.5 text-yellow-400" />
            Edge Functions
            <Badge className="bg-white/5 text-white/40 border-white/10 text-[10px] px-1.5 py-0">
              {edgeFunctions.length} function{edgeFunctions.length !== 1 ? 's' : ''}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)} className="flex flex-col flex-1 min-h-0">
          <TabsList className="mx-5 mt-3 bg-white/[0.04] border border-white/[0.06] rounded-lg p-0.5 h-9">
            <TabsTrigger value="functions" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-md gap-1.5">
              <FileCode className="h-3 w-3" /> Functions
            </TabsTrigger>
            <TabsTrigger value="test" disabled={!selectedFn} className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-md gap-1.5">
              <Terminal className="h-3 w-3" /> Test
            </TabsTrigger>
          </TabsList>

          {/* Functions list + editor */}
          <TabsContent value="functions" className="flex-1 min-h-0 flex">
            {/* Sidebar */}
            <div className="w-52 border-r border-white/[0.06] flex flex-col">
              <div className="p-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-1">
                  <Input value={newFnName} onChange={e => setNewFnName(e.target.value)} placeholder="function-name" className="bg-white/5 border-white/10 text-white text-[11px] font-mono h-7 flex-1" onKeyDown={e => e.key === 'Enter' && createFunction()} />
                  <Button onClick={createFunction} disabled={!newFnName.trim()} size="sm" className="h-7 w-7 p-0">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-1 space-y-0.5">
                  {edgeFunctions.map(fn => (
                    <button key={fn.name} onClick={() => setSelectedFn(fn.name)} className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-colors",
                      selectedFn === fn.name ? "bg-yellow-500/10 text-yellow-400" : "text-white/50 hover:bg-white/[0.03]"
                    )}>
                      <Zap className="h-3 w-3 shrink-0" />
                      <span className="font-mono truncate">{fn.name}</span>
                    </button>
                  ))}
                  {edgeFunctions.length === 0 && (
                    <div className="py-6 text-center text-white/15 text-[10px]">No functions yet</div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Editor */}
            <div className="flex-1 flex flex-col min-h-0">
              {selectedFnFile ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06]">
                    <span className="text-xs text-white/40 font-mono">supabase/functions/{selectedFn}/index.ts</span>
                    <div className="flex-1" />
                    <Button variant="ghost" size="sm" className="text-[10px] text-white/30 h-6 gap-1" onClick={() => {
                      const code = generateInvokeCode(selectedFn!);
                      onUpsertFile(`invoke-${selectedFn}.ts`, code);
                      toast.success('Generated invoke helper');
                    }}>
                      <Copy className="h-2.5 w-2.5" /> Generate Client
                    </Button>
                    <Button variant="ghost" size="sm" className="text-[10px] text-white/30 h-6 gap-1" onClick={() => setActiveTab('test')}>
                      <Play className="h-2.5 w-2.5" /> Test
                    </Button>
                    <Button variant="ghost" size="sm" className="text-[10px] text-red-400/40 hover:text-red-400 h-6 gap-1" onClick={() => deleteFunction(selectedFn!)}>
                      <Trash2 className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                  <Textarea
                    value={selectedFnFile.content}
                    onChange={e => onUpsertFile(selectedFnFile.path, e.target.value)}
                    className="flex-1 bg-transparent border-none text-white text-xs font-mono resize-none focus-visible:ring-0 rounded-none p-3"
                    spellCheck={false}
                  />
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-white/15 text-sm">
                  Select or create a function
                </div>
              )}
            </div>
          </TabsContent>

          {/* Test Tab */}
          <TabsContent value="test" className="flex-1 min-h-0 flex flex-col p-5 space-y-3">
            <div className="flex items-center gap-2">
              <select value={testMethod} onChange={e => setTestMethod(e.target.value)} className="bg-white/5 border border-white/10 rounded-md text-xs text-white px-2 py-1.5 w-24">
                {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <div className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-md px-3 py-1.5 text-xs text-white/40 font-mono truncate">
                {supabaseUrl || 'https://...'}/functions/v1/{selectedFn}
              </div>
              <Button onClick={testFunction} disabled={isTesting || !supabaseUrl} className="bg-yellow-600 hover:bg-yellow-500 text-white text-xs gap-1.5">
                {isTesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                Send
              </Button>
            </div>

            {testMethod !== 'GET' && (
              <div>
                <label className="text-[10px] text-white/30 block mb-1">Request Body</label>
                <Textarea value={testBody} onChange={e => setTestBody(e.target.value)} className="bg-white/[0.03] border-white/[0.06] text-white text-xs font-mono min-h-[80px] resize-none" spellCheck={false} />
              </div>
            )}

            {testResult && (
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-xs">
                  <Badge className={cn(
                    "text-[10px]",
                    testResult.status >= 200 && testResult.status < 300 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                  )}>
                    {testResult.status} {testResult.statusText}
                  </Badge>
                  <span className="text-white/30">{testResult.timeMs}ms</span>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                  <pre className="text-xs text-white/60 font-mono whitespace-pre-wrap max-h-[200px] overflow-auto">
                    {(() => { try { return JSON.stringify(JSON.parse(testResult.body), null, 2); } catch { return testResult.body; } })()}
                  </pre>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
