import { useState } from 'react';
import { Bug, FileCode, Lightbulb, ChevronDown, ChevronRight, Zap, AlertTriangle, Check, Copy, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface DebugReport {
  rootCause: string;
  affectedFile: string;
  affectedLine?: number;
  explanation: string;
  suggestedFix: string;
  confidence: 'high' | 'medium' | 'low';
  alternativeFixes?: string[];
  editHistory?: string[];
}

interface DebugReportCardProps {
  report: DebugReport;
  onApplyFix: (fix: string) => void;
  onRequestAlternative?: () => void;
}

const CONFIDENCE_STYLES = {
  high: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'High Confidence' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', label: 'Medium Confidence' },
  low: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: 'Low Confidence' },
};

/** Parse error messages and code context to produce a structured debug report */
export function buildDebugReport(
  errorMessage: string,
  sourceFile: string | undefined,
  sourceLine: number | undefined,
  fileContent: string | undefined,
  recentEdits: string[] = [],
): DebugReport {
  const report: DebugReport = {
    rootCause: errorMessage,
    affectedFile: sourceFile || 'unknown',
    affectedLine: sourceLine,
    explanation: '',
    suggestedFix: '',
    confidence: 'medium',
    alternativeFixes: [],
    editHistory: recentEdits.slice(-3),
  };

  // Pattern-based diagnosis
  if (/is not defined/i.test(errorMessage)) {
    const varName = errorMessage.match(/(\w+)\s+is\s+not\s+defined/i)?.[1];
    report.explanation = `The variable or function "${varName || 'unknown'}" is used but never declared or imported.`;
    report.suggestedFix = varName ? `Add \`import { ${varName} } from '...';\` or declare \`const ${varName} = ...;\` before using it.` : 'Add the missing import or declaration.';
    report.confidence = 'high';
  } else if (/cannot read propert/i.test(errorMessage)) {
    const prop = errorMessage.match(/property '(\w+)'/)?.[1];
    report.explanation = `Attempting to access \`.${prop || '?'}\` on \`undefined\` or \`null\`. This usually means the data hasn't loaded yet or the variable isn't initialized.`;
    report.suggestedFix = 'Add optional chaining (?.) or a null check/default value.';
    report.confidence = 'high';
  } else if (/unexpected token/i.test(errorMessage)) {
    report.explanation = 'There is a syntax error — likely a missing bracket, parenthesis, or semicolon.';
    report.suggestedFix = 'Check for mismatched brackets {} or () near the reported line.';
    report.confidence = 'medium';
  } else if (/maximum update depth|infinite loop/i.test(errorMessage)) {
    report.explanation = 'A component is re-rendering infinitely, usually caused by setting state inside useEffect without proper dependencies.';
    report.suggestedFix = 'Review useEffect dependencies — ensure state setters aren\'t triggering the effect that calls them.';
    report.confidence = 'high';
  } else if (/hooks? can only be called/i.test(errorMessage)) {
    report.explanation = 'A React Hook is being called conditionally, inside a loop, or in a non-component function.';
    report.suggestedFix = 'Move the Hook call to the top level of the component function body.';
    report.confidence = 'high';
  } else if (/module not found|cannot find module/i.test(errorMessage)) {
    const mod = errorMessage.match(/['"]([^'"]+)['"]/)?.[1];
    report.explanation = `The module "${mod || 'unknown'}" cannot be found. It may be misspelled, not installed, or the file doesn't exist.`;
    report.suggestedFix = mod ? `Check if "${mod}" is imported correctly and exists in the project.` : 'Verify the import path.';
    report.confidence = 'high';
  } else if (/type\s*error/i.test(errorMessage)) {
    report.explanation = 'A value has an unexpected type — for example, calling a function on a non-function value.';
    report.suggestedFix = 'Add type checking or ensure the value is the expected type before using it.';
    report.confidence = 'medium';
  } else {
    report.explanation = 'An error occurred during execution. Review the stack trace for the exact cause.';
    report.suggestedFix = 'Examine the affected file near the reported line for logical errors.';
    report.confidence = 'low';
  }

  // If we have file content, try to add line context
  if (fileContent && sourceLine) {
    const lines = fileContent.split('\n');
    const start = Math.max(0, sourceLine - 3);
    const end = Math.min(lines.length, sourceLine + 2);
    const context = lines.slice(start, end).map((l, i) => {
      const lineNum = start + i + 1;
      return `${lineNum === sourceLine ? '→' : ' '} ${lineNum}: ${l}`;
    }).join('\n');
    report.suggestedFix += `\n\nCode context:\n\`\`\`\n${context}\n\`\`\``;
  }

  return report;
}

export function DebugReportCard({ report, onApplyFix, onRequestAlternative }: DebugReportCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [applied, setApplied] = useState(false);
  const conf = CONFIDENCE_STYLES[report.confidence];

  const handleApply = () => {
    onApplyFix(report.suggestedFix);
    setApplied(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Error: ${report.rootCause}\nFile: ${report.affectedFile}${report.affectedLine ? `:${report.affectedLine}` : ''}\nDiagnosis: ${report.explanation}\nFix: ${report.suggestedFix}`);
    toast.success('Debug report copied');
  };

  return (
    <div className="rounded-xl border border-red-500/15 bg-red-500/[0.03] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-red-500/[0.03] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bug className="h-3.5 w-3.5 text-red-400" />
          <span className="text-xs font-semibold text-red-300">Debug Report</span>
          <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium", conf.bg, conf.text, `border ${conf.border}`)}>
            {conf.label}
          </span>
        </div>
        {expanded ? <ChevronDown className="h-3 w-3 text-white/20" /> : <ChevronRight className="h-3 w-3 text-white/20" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2.5">
          {/* Root Cause */}
          <div>
            <div className="flex items-center gap-1 text-[10px] text-white/30 font-medium uppercase tracking-wider mb-1">
              <AlertTriangle className="h-2.5 w-2.5" />
              Error
            </div>
            <p className="text-[11px] text-red-400/80 font-mono bg-red-500/[0.06] px-2 py-1.5 rounded-md break-all">
              {report.rootCause}
            </p>
          </div>

          {/* Affected File */}
          <div className="flex items-center gap-1.5 text-[11px] text-white/50">
            <FileCode className="h-3 w-3 text-white/25" />
            <span className="font-mono">{report.affectedFile}</span>
            {report.affectedLine && <span className="text-white/25">:{report.affectedLine}</span>}
          </div>

          {/* Diagnosis */}
          <div>
            <div className="flex items-center gap-1 text-[10px] text-white/30 font-medium uppercase tracking-wider mb-1">
              <Lightbulb className="h-2.5 w-2.5 text-amber-400/60" />
              Diagnosis
            </div>
            <p className="text-[11px] text-white/60 leading-relaxed">{report.explanation}</p>
          </div>

          {/* Suggested Fix */}
          <div>
            <div className="flex items-center gap-1 text-[10px] text-white/30 font-medium uppercase tracking-wider mb-1">
              <Zap className="h-2.5 w-2.5 text-emerald-400/60" />
              Suggested Fix
            </div>
            <p className="text-[11px] text-white/60 leading-relaxed whitespace-pre-wrap">{report.suggestedFix.split('\n\nCode context:')[0]}</p>
          </div>

          {/* Edit History */}
          {report.editHistory && report.editHistory.length > 0 && (
            <div>
              <div className="text-[10px] text-white/20 font-medium mb-1">Recent edits:</div>
              {report.editHistory.map((edit, i) => (
                <p key={i} className="text-[9px] text-white/25 pl-2 border-l border-white/[0.06] truncate">{edit}</p>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleApply}
              disabled={applied}
              className={cn(
                "flex-1 h-7 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1.5",
                applied
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 border border-cyan-500/20"
              )}
            >
              {applied ? <><Check className="h-3 w-3" /> Applied</> : <><Zap className="h-3 w-3" /> Apply Fix</>}
            </button>
            {onRequestAlternative && (
              <button
                onClick={onRequestAlternative}
                className="h-7 px-3 rounded-lg text-[11px] text-white/30 hover:text-white/50 hover:bg-white/5 transition-colors flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Alt Fix
              </button>
            )}
            <button
              onClick={handleCopy}
              className="h-7 w-7 rounded-lg text-white/20 hover:text-white/40 hover:bg-white/5 transition-colors flex items-center justify-center"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
