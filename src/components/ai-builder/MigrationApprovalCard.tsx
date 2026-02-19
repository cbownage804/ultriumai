import { useState, useCallback } from 'react';
import { Database, CheckCircle, XCircle, Loader2, AlertTriangle, ExternalLink, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MigrationBlock {
  id: string;
  description: string;
  sql: string;
  status: 'pending' | 'applying' | 'success' | 'error' | 'skipped';
  error?: string;
  affectedTables?: string[];
  operations?: string[];
}

interface MigrationApprovalCardProps {
  migration: MigrationBlock;
  supabaseConfig: { url: string; anonKey: string } | null;
  onStatusChange: (id: string, status: MigrationBlock['status'], result?: Partial<MigrationBlock>) => void;
}

export function MigrationApprovalCard({ migration, supabaseConfig, onStatusChange }: MigrationApprovalCardProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleApply = useCallback(async () => {
    if (!supabaseConfig) {
      toast.error('Connect Supabase first to run migrations.');
      return;
    }

    onStatusChange(migration.id, 'applying');

    try {
      const { data, error } = await supabase.functions.invoke('ai-builder-migrate', {
        body: {
          sql: migration.sql,
          supabaseUrl: supabaseConfig.url,
          supabaseServiceKey: supabaseConfig.anonKey,
        },
      });

      if (error) throw error;

      if (data?.fallback) {
        // Direct execution not available — show manual instructions
        toast.info('Open the SQL Editor to run this migration manually.', { duration: 6000 });
        onStatusChange(migration.id, 'pending', {
          error: 'Direct execution unavailable. Copy the SQL and run it in your Supabase SQL Editor.',
        });
        if (data.sqlEditorUrl) {
          window.open(data.sqlEditorUrl, '_blank');
        }
        return;
      }

      if (data?.success) {
        onStatusChange(migration.id, 'success', {
          affectedTables: data.affectedTables,
          operations: data.operations,
        });
        toast.success(`Migration applied: ${migration.description}`);
      } else {
        onStatusChange(migration.id, 'error', { error: data?.error || 'Unknown error' });
        toast.error(`Migration failed: ${data?.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to execute migration';
      onStatusChange(migration.id, 'error', { error: msg });
      toast.error(msg);
    }
  }, [migration, supabaseConfig, onStatusChange]);

  const handleSkip = useCallback(() => {
    onStatusChange(migration.id, 'skipped');
  }, [migration.id, onStatusChange]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(migration.sql);
    setCopied(true);
    toast.success('SQL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }, [migration.sql]);

  const lineCount = migration.sql.split('\n').length;
  const previewLines = migration.sql.split('\n').slice(0, expanded ? 999 : 8);
  const hasMore = lineCount > 8;

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${
      migration.status === 'success' ? 'border-emerald-500/30 bg-emerald-500/[0.03]' :
      migration.status === 'error' ? 'border-red-500/30 bg-red-500/[0.03]' :
      migration.status === 'skipped' ? 'border-white/[0.05] bg-white/[0.01] opacity-60' :
      'border-cyan-500/20 bg-cyan-500/[0.02]'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.06]">
        <Database className={`h-4 w-4 flex-shrink-0 ${
          migration.status === 'success' ? 'text-emerald-400' :
          migration.status === 'error' ? 'text-red-400' :
          migration.status === 'applying' ? 'text-cyan-400 animate-pulse' :
          'text-cyan-400'
        }`} />
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold text-white/90 truncate">
            Database Migration
          </h4>
          <p className="text-[10px] text-white/40 truncate">{migration.description}</p>
        </div>
        {migration.status === 'success' && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
            <CheckCircle className="h-3 w-3" /> Applied
          </span>
        )}
        {migration.status === 'error' && (
          <span className="flex items-center gap-1 text-[10px] text-red-400 font-medium">
            <XCircle className="h-3 w-3" /> Failed
          </span>
        )}
        {migration.status === 'skipped' && (
          <span className="text-[10px] text-white/30 font-medium">Skipped</span>
        )}
        {migration.status === 'applying' && (
          <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
        )}
      </div>

      {/* SQL Preview */}
      <div className="relative">
        <pre className="px-4 py-3 text-[10px] leading-relaxed text-white/60 font-mono overflow-x-auto max-h-64 overflow-y-auto">
          {previewLines.map((line, i) => (
            <div key={i} className="flex">
              <span className="text-white/15 w-6 text-right mr-3 select-none flex-shrink-0">{i + 1}</span>
              <span className={
                /^\s*--.*/i.test(line) ? 'text-white/25 italic' :
                /\b(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|ENABLE|POLICY|FUNCTION|TRIGGER|INDEX|TABLE|REFERENCES|PRIMARY|FOREIGN|KEY|NOT NULL|DEFAULT|UNIQUE|CHECK|CONSTRAINT)\b/i.test(line) ? 'text-cyan-400/80' :
                /\b(uuid|text|boolean|integer|bigint|timestamptz|timestamp|jsonb|json|serial|varchar|numeric|real|smallint)\b/i.test(line) ? 'text-violet-400/70' :
                'text-white/50'
              }>
                {line || ' '}
              </span>
            </div>
          ))}
          {hasMore && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="text-cyan-400/60 hover:text-cyan-400 text-[10px] mt-1 underline underline-offset-2"
            >
              Show {lineCount - 8} more lines...
            </button>
          )}
        </pre>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 h-6 w-6 rounded flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/5 transition-colors"
          title="Copy SQL"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>

      {/* Error message */}
      {migration.error && migration.status === 'error' && (
        <div className="px-4 py-2 border-t border-red-500/10 bg-red-500/[0.03]">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-3 w-3 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-red-400/80 leading-relaxed">{migration.error}</p>
          </div>
        </div>
      )}

      {/* Success summary */}
      {migration.status === 'success' && migration.operations && (
        <div className="px-4 py-2 border-t border-emerald-500/10 bg-emerald-500/[0.03]">
          <div className="flex flex-wrap gap-1.5">
            {migration.operations.map((op, i) => (
              <span key={i} className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {op}
              </span>
            ))}
            {migration.affectedTables?.map((t, i) => (
              <span key={`t-${i}`} className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-white/5 text-white/40 border border-white/[0.06]">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {migration.status === 'pending' && (
        <div className="flex items-center gap-2 px-4 py-2.5 border-t border-white/[0.06]">
          <button
            onClick={handleApply}
            disabled={!supabaseConfig}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 border border-cyan-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Database className="h-3 w-3" />
            Apply Migration
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white/40 hover:text-white/60 hover:bg-white/5 border border-white/[0.06] transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Copy SQL
          </button>
          <button
            onClick={handleSkip}
            className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-white/30 hover:text-white/50 hover:bg-white/5 transition-colors"
          >
            Skip
          </button>
        </div>
      )}

      {/* Fallback notice when no Supabase */}
      {migration.status === 'pending' && !supabaseConfig && (
        <div className="px-4 py-2 border-t border-amber-500/10 bg-amber-500/[0.02]">
          <p className="text-[10px] text-amber-400/60">
            ⚠ Connect Supabase in Project Settings to apply migrations directly. You can still copy the SQL and run it manually.
          </p>
        </div>
      )}
    </div>
  );
}

/** Parse ===MIGRATION: blocks from AI output */
export function parseMigrationBlocks(raw: string): MigrationBlock[] {
  const blocks: MigrationBlock[] = [];
  const regex = /===MIGRATION:\s*(.+?)===\n([\s\S]*?)===END_MIGRATION===/g;
  let match;

  while ((match = regex.exec(raw)) !== null) {
    blocks.push({
      id: crypto.randomUUID(),
      description: match[1].trim(),
      sql: match[2].trim(),
      status: 'pending',
    });
  }

  return blocks;
}

/** Strip migration blocks from AI output to get clean text/file content */
export function stripMigrationBlocks(raw: string): string {
  return raw.replace(/===MIGRATION:\s*.+?===\n[\s\S]*?===END_MIGRATION===/g, '').trim();
}
