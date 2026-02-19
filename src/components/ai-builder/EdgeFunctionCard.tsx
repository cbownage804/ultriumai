import { useState, useCallback } from 'react';
import { Cloud, CheckCircle, XCircle, Loader2, AlertTriangle, ExternalLink, Copy, Check, Terminal, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EdgeFunctionBlock {
  id: string;
  functionName: string;
  sourceCode: string;
  status: 'pending' | 'deploying' | 'deployed' | 'error' | 'skipped';
  error?: string;
  requiredSecrets?: string[];
  invocationUrl?: string;
  logsUrl?: string;
}

interface EdgeFunctionCardProps {
  edgeFunction: EdgeFunctionBlock;
  supabaseConfig: { url: string; anonKey: string } | null;
  onStatusChange: (id: string, status: EdgeFunctionBlock['status'], result?: Partial<EdgeFunctionBlock>) => void;
}

export function EdgeFunctionCard({ edgeFunction, supabaseConfig, onStatusChange }: EdgeFunctionCardProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleDeploy = useCallback(async () => {
    onStatusChange(edgeFunction.id, 'deploying');

    try {
      const { data, error } = await supabase.functions.invoke('ai-builder-deploy-fn', {
        body: {
          functionName: edgeFunction.functionName,
          sourceCode: edgeFunction.sourceCode,
          supabaseUrl: supabaseConfig?.url,
          supabaseServiceKey: supabaseConfig?.anonKey,
        },
      });

      if (error) throw error;

      if (data?.success) {
        onStatusChange(edgeFunction.id, 'deployed', {
          requiredSecrets: data.requiredSecrets,
          invocationUrl: data.invocationUrl,
          logsUrl: data.logsUrl,
        });

        if (data.requiredSecrets?.length > 0) {
          toast.info(`Function "${edgeFunction.functionName}" ready. Configure ${data.requiredSecrets.length} secret(s) before invoking.`, { duration: 6000 });
        } else {
          toast.success(`Edge function "${edgeFunction.functionName}" deployed!`);
        }
      } else {
        onStatusChange(edgeFunction.id, 'error', { error: data?.error || 'Deployment failed' });
        toast.error(`Deploy failed: ${data?.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to deploy edge function';
      onStatusChange(edgeFunction.id, 'error', { error: msg });
      toast.error(msg);
    }
  }, [edgeFunction, supabaseConfig, onStatusChange]);

  const handleSkip = useCallback(() => {
    onStatusChange(edgeFunction.id, 'skipped');
  }, [edgeFunction.id, onStatusChange]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(edgeFunction.sourceCode);
    setCopied(true);
    toast.success('Source code copied');
    setTimeout(() => setCopied(false), 2000);
  }, [edgeFunction.sourceCode]);

  const lineCount = edgeFunction.sourceCode.split('\n').length;
  const previewLines = edgeFunction.sourceCode.split('\n').slice(0, expanded ? 999 : 8);
  const hasMore = lineCount > 8;

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${
      edgeFunction.status === 'deployed' ? 'border-emerald-500/30 bg-emerald-500/[0.03]' :
      edgeFunction.status === 'error' ? 'border-red-500/30 bg-red-500/[0.03]' :
      edgeFunction.status === 'skipped' ? 'border-white/[0.05] bg-white/[0.01] opacity-60' :
      'border-violet-500/20 bg-violet-500/[0.02]'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.06]">
        <Cloud className={`h-4 w-4 flex-shrink-0 ${
          edgeFunction.status === 'deployed' ? 'text-emerald-400' :
          edgeFunction.status === 'error' ? 'text-red-400' :
          edgeFunction.status === 'deploying' ? 'text-violet-400 animate-pulse' :
          'text-violet-400'
        }`} />
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold text-white/90 truncate">
            Edge Function
          </h4>
          <p className="text-[10px] text-white/40 font-mono truncate">{edgeFunction.functionName}</p>
        </div>
        {edgeFunction.status === 'deployed' && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
            <CheckCircle className="h-3 w-3" /> Ready
          </span>
        )}
        {edgeFunction.status === 'error' && (
          <span className="flex items-center gap-1 text-[10px] text-red-400 font-medium">
            <XCircle className="h-3 w-3" /> Failed
          </span>
        )}
        {edgeFunction.status === 'skipped' && (
          <span className="text-[10px] text-white/30 font-medium">Skipped</span>
        )}
        {edgeFunction.status === 'deploying' && (
          <Loader2 className="h-3.5 w-3.5 text-violet-400 animate-spin" />
        )}
      </div>

      {/* Code Preview */}
      <div className="relative">
        <pre className="px-4 py-3 text-[10px] leading-relaxed text-white/60 font-mono overflow-x-auto max-h-64 overflow-y-auto">
          {previewLines.map((line, i) => (
            <div key={i} className="flex">
              <span className="text-white/15 w-6 text-right mr-3 select-none flex-shrink-0">{i + 1}</span>
              <span className={
                /^\s*\/\/.*/i.test(line) ? 'text-white/25 italic' :
                /\b(import|export|from|const|let|var|function|async|await|return|if|else|try|catch|throw|new|serve)\b/.test(line) ? 'text-violet-400/80' :
                /\b(string|number|boolean|null|undefined|true|false|Response|Request)\b/.test(line) ? 'text-cyan-400/70' :
                /"[^"]*"|'[^']*'|`[^`]*`/.test(line) ? 'text-amber-400/60' :
                'text-white/50'
              }>
                {line || ' '}
              </span>
            </div>
          ))}
          {hasMore && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="text-violet-400/60 hover:text-violet-400 text-[10px] mt-1 underline underline-offset-2"
            >
              Show {lineCount - 8} more lines...
            </button>
          )}
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 h-6 w-6 rounded flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/5 transition-colors"
          title="Copy source code"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>

      {/* Required secrets warning */}
      {edgeFunction.requiredSecrets && edgeFunction.requiredSecrets.length > 0 && (
        <div className="px-4 py-2 border-t border-amber-500/10 bg-amber-500/[0.02]">
          <div className="flex items-start gap-2">
            <Key className="h-3 w-3 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-amber-400/80 font-medium mb-1">Required Secrets:</p>
              <div className="flex flex-wrap gap-1">
                {edgeFunction.requiredSecrets.map((secret, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {secret}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {edgeFunction.error && edgeFunction.status === 'error' && (
        <div className="px-4 py-2 border-t border-red-500/10 bg-red-500/[0.03]">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-3 w-3 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-red-400/80 leading-relaxed">{edgeFunction.error}</p>
          </div>
        </div>
      )}

      {/* Deployed info */}
      {edgeFunction.status === 'deployed' && edgeFunction.invocationUrl && (
        <div className="px-4 py-2 border-t border-emerald-500/10 bg-emerald-500/[0.03]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Terminal className="h-3 w-3 text-emerald-400/60" />
              <code className="text-[9px] text-emerald-400/70 font-mono truncate">{edgeFunction.invocationUrl}</code>
            </div>
            {edgeFunction.logsUrl && (
              <a href={edgeFunction.logsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[9px] text-violet-400/60 hover:text-violet-400 transition-colors">
                <ExternalLink className="h-2.5 w-2.5" /> View logs
              </a>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {edgeFunction.status === 'pending' && (
        <div className="flex items-center gap-2 px-4 py-2.5 border-t border-white/[0.06]">
          <button
            onClick={handleDeploy}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 border border-violet-500/20 transition-colors"
          >
            <Cloud className="h-3 w-3" />
            Deploy Function
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white/40 hover:text-white/60 hover:bg-white/5 border border-white/[0.06] transition-colors"
          >
            <Copy className="h-3 w-3" />
            Copy
          </button>
          <button
            onClick={handleSkip}
            className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-white/30 hover:text-white/50 hover:bg-white/5 transition-colors"
          >
            Skip
          </button>
        </div>
      )}
    </div>
  );
}

/** Parse ===EDGE_FUNCTION: blocks from AI output */
export function parseEdgeFunctionBlocks(raw: string): EdgeFunctionBlock[] {
  const blocks: EdgeFunctionBlock[] = [];
  const regex = /===EDGE_FUNCTION:\s*(.+?)===\n([\s\S]*?)===END_EDGE_FUNCTION===/g;
  let match;

  while ((match = regex.exec(raw)) !== null) {
    const functionName = match[1].trim();
    const sourceCode = match[2].trim();

    // Detect required secrets
    const secretPattern = /Deno\.env\.get\(\s*['"]([^'"]+)['"]\s*\)/g;
    const requiredSecrets: string[] = [];
    let secretMatch;
    while ((secretMatch = secretPattern.exec(sourceCode)) !== null) {
      const name = secretMatch[1];
      if (!['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_DB_URL'].includes(name)) {
        requiredSecrets.push(name);
      }
    }

    blocks.push({
      id: crypto.randomUUID(),
      functionName,
      sourceCode,
      status: 'pending',
      requiredSecrets: requiredSecrets.length > 0 ? requiredSecrets : undefined,
    });
  }

  return blocks;
}

/** Strip edge function blocks from AI output */
export function stripEdgeFunctionBlocks(raw: string): string {
  return raw.replace(/===EDGE_FUNCTION:\s*.+?===\n[\s\S]*?===END_EDGE_FUNCTION===/g, '').trim();
}
