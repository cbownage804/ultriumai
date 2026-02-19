import { useState } from 'react';
import { AlertTriangle, X, ChevronDown, ChevronUp, Zap, Bug, RotateCcw, Copy, Check, Lightbulb, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

export interface PreviewError {
  id: string;
  message: string;
  source?: string;
  line?: number;
  timestamp: Date;
  type: 'error' | 'warning';
  fixAttempts?: number;
}

interface ErrorConsoleProps {
  errors: PreviewError[];
  onClear: () => void;
  onFixRequest: (error: PreviewError) => void;
  /** Enhanced: auto-fix with full context */
  onSmartFixRequest?: (error: PreviewError, context: string) => void;
  projectFiles?: ProjectFile[];
  maxRetries?: number;
  /** Called when user wants to start fresh */
  onStartOver?: () => void;
}

const MAX_FIX_RETRIES = 3;

/** Map common error patterns to user-friendly explanations */
function getFriendlyMessage(message: string): { friendly: string; suggestion: string } | null {
  const patterns: [RegExp, string, string][] = [
    [/is not defined/i, 'A variable or function is missing', 'The AI will add the missing definition. Click Smart Fix.'],
    [/cannot read propert/i, 'Trying to access data that doesn\'t exist yet', 'This usually means data is loading. Smart Fix will add a loading check.'],
    [/unexpected token/i, 'There\'s a syntax error in the code', 'Smart Fix will correct the syntax automatically.'],
    [/module not found|cannot find module/i, 'A required file or package is missing', 'Smart Fix will add the missing import or create the file.'],
    [/failed to fetch|network/i, 'A network request failed', 'Check your internet connection or API configuration.'],
    [/cors|cross-origin/i, 'Cross-origin request blocked', 'The API server needs to allow requests from this domain.'],
    [/hydration|text content does not match/i, 'Server/client rendering mismatch', 'Smart Fix will align the rendering logic.'],
    [/maximum update depth|infinite loop/i, 'Component is stuck in an infinite loop', 'Smart Fix will break the re-render cycle.'],
    [/hooks? can only be called/i, 'React Hook used incorrectly', 'Smart Fix will move the hook to the correct location.'],
  ];

  for (const [pattern, friendly, suggestion] of patterns) {
    if (pattern.test(message)) {
      return { friendly, suggestion };
    }
  }
  return null;
}

export function ErrorConsole({ errors, onClear, onFixRequest, onSmartFixRequest, projectFiles, maxRetries = MAX_FIX_RETRIES, onStartOver }: ErrorConsoleProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (errors.length === 0) return null;

  const errorCount = errors.filter(e => e.type === 'error').length;
  const warnCount = errors.filter(e => e.type === 'warning').length;
  const allExhausted = errors.every(e => (e.fixAttempts ?? 0) >= maxRetries);

  const handleSmartFix = (err: PreviewError) => {
    if ((err.fixAttempts ?? 0) >= maxRetries) return;
    const updatedErr = { ...err, fixAttempts: (err.fixAttempts ?? 0) + 1 };

    if (onSmartFixRequest && projectFiles) {
      const errorFile = err.source
        ? projectFiles.find(f => err.source?.includes(f.path))
        : null;
      const contextParts: string[] = [
        `Error: "${err.message}"`,
        err.source ? `Source: ${err.source}${err.line ? `:${err.line}` : ''}` : '',
        updatedErr.fixAttempts > 1 ? `Previous fix attempts: ${updatedErr.fixAttempts - 1} (this is retry #${updatedErr.fixAttempts})` : '',
        errorFile ? `\nFile content (${errorFile.path}):\n\`\`\`\n${errorFile.content}\n\`\`\`` : '',
      ].filter(Boolean);
      onSmartFixRequest(updatedErr, contextParts.join('\n'));
    } else {
      onFixRequest(updatedErr);
    }
  };

  const handleCopyError = (err: PreviewError) => {
    const text = `${err.message}${err.source ? `\nSource: ${err.source}${err.line ? `:${err.line}` : ''}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(err.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="border-t border-red-500/20 bg-red-500/[0.03]">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 h-8 hover:bg-red-500/[0.05] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bug className="h-3.5 w-3.5 text-red-400" />
          <span className="text-[11px] font-medium text-red-400">
            {errorCount > 0 && `${errorCount} error${errorCount > 1 ? 's' : ''}`}
            {errorCount > 0 && warnCount > 0 && ' · '}
            {warnCount > 0 && `${warnCount} warning${warnCount > 1 ? 's' : ''}`}
          </span>
          {allExhausted && errorCount > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400/70 font-medium">
              Auto-fix limit reached
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5"
          >
            <X className="h-3 w-3" />
          </button>
          {isExpanded ? <ChevronDown className="h-3 w-3 text-white/30" /> : <ChevronUp className="h-3 w-3 text-white/30" />}
        </div>
      </button>

      {/* Error list */}
      {isExpanded && (
        <div className="max-h-40 overflow-auto">
          {errors.map((err) => {
            const attemptsExhausted = (err.fixAttempts ?? 0) >= maxRetries;
            const hint = getFriendlyMessage(err.message);
            return (
              <div
                key={err.id}
                className={cn(
                  "flex items-start gap-2 px-3 py-2 border-t",
                  err.type === 'error' ? 'border-red-500/10' : 'border-amber-500/10'
                )}
              >
                <AlertTriangle className={cn(
                  "h-3 w-3 shrink-0 mt-0.5",
                  err.type === 'error' ? 'text-red-400' : 'text-amber-400'
                )} />
                <div className="flex-1 min-w-0">
                  {/* Friendly message if available */}
                  {hint && (
                    <p className="text-[11px] text-white/60 mb-0.5 flex items-center gap-1">
                      <Lightbulb className="h-2.5 w-2.5 text-amber-400/60 shrink-0" />
                      {hint.friendly}
                    </p>
                  )}
                  <p className="text-[11px] text-white/40 font-mono truncate">{err.message}</p>
                  {err.source && (
                    <p className="text-[9px] text-white/25 font-mono">
                      {err.source}{err.line ? `:${err.line}` : ''}
                    </p>
                  )}
                  {/* Suggestion */}
                  {hint && !attemptsExhausted && (
                    <p className="text-[9px] text-cyan-400/50 mt-0.5">{hint.suggestion}</p>
                  )}
                  {err.fixAttempts != null && err.fixAttempts > 0 && (
                    <p className="text-[9px] text-amber-400/50 mt-0.5">
                      {attemptsExhausted ? `Auto-fix tried ${maxRetries} times — try describing the issue in chat for a manual fix` : `Fix attempt ${err.fixAttempts}/${maxRetries}`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleCopyError(err)}
                    className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5"
                    title="Copy error"
                  >
                    {copiedId === err.id ? <Check className="h-2.5 w-2.5 text-emerald-400" /> : <Copy className="h-2.5 w-2.5" />}
                  </button>
                  <button
                    onClick={() => handleSmartFix(err)}
                    disabled={attemptsExhausted}
                    className={cn(
                      "flex items-center gap-1 text-[10px] rounded px-1.5 py-0.5 transition-colors",
                      attemptsExhausted
                        ? "text-white/20 bg-white/5 cursor-not-allowed"
                        : "text-cyan-400/70 hover:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/15"
                    )}
                  >
                    {err.fixAttempts ? <RotateCcw className="h-2.5 w-2.5" /> : <Zap className="h-2.5 w-2.5" />}
                    {attemptsExhausted ? 'Exhausted' : err.fixAttempts ? `Retry (${err.fixAttempts}/${maxRetries})` : 'Smart Fix'}
                  </button>
                </div>
              </div>
            );
          })}

          {/* Exhausted — offer alternatives */}
          {allExhausted && errorCount > 0 && (
            <div className="px-3 py-3 border-t border-white/[0.06] bg-white/[0.02]">
              <p className="text-[11px] text-white/50 mb-2">Auto-fix couldn't resolve this. Try one of these:</p>
              <div className="flex gap-2">
                {onStartOver && (
                  <button
                    onClick={onStartOver}
                    className="flex-1 h-7 rounded-lg border border-white/[0.08] text-white/40 text-[10px] hover:bg-white/[0.04] hover:text-white/60 transition-colors flex items-center justify-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Regenerate
                  </button>
                )}
                <button
                  onClick={() => {
                    const allErrors = errors.map(e => e.message).join('\n');
                    navigator.clipboard.writeText(allErrors);
                  }}
                  className="flex-1 h-7 rounded-lg border border-white/[0.08] text-white/40 text-[10px] hover:bg-white/[0.04] hover:text-white/60 transition-colors flex items-center justify-center gap-1"
                >
                  <Copy className="h-3 w-3" />
                  Copy All & Ask in Chat
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}