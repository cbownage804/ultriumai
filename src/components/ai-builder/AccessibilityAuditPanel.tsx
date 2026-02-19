/**
 * Accessibility Audit Panel — Phase 40
 * Runs axe-core audits on the preview and shows violations with "Fix with AI" buttons.
 */

import { useState, useCallback } from 'react';
import { Accessibility, AlertTriangle, CheckCircle, Loader2, Wand2, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface A11yViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: { html: string; target: string[] }[];
}

interface AccessibilityAuditPanelProps {
  violations: A11yViolation[];
  isAuditing: boolean;
  onRunAudit: () => void;
  onFixViolation: (violation: A11yViolation) => void;
  score: number | null;
}

const IMPACT_COLORS: Record<string, string> = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  serious: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  moderate: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  minor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

export function AccessibilityAuditPanel({ violations, isAuditing, onRunAudit, onFixViolation, score }: AccessibilityAuditPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const criticalCount = violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 h-9 border-b border-white/[0.06] shrink-0">
        <Accessibility className="h-3.5 w-3.5 text-white/30" />
        <span className="text-[11px] font-medium text-white/50">Accessibility</span>
        {score !== null && (
          <div className={cn(
            "ml-auto px-1.5 py-0.5 rounded text-[9px] font-mono",
            score >= 90 ? "bg-emerald-500/10 text-emerald-400" :
            score >= 70 ? "bg-yellow-500/10 text-yellow-400" :
            "bg-red-500/10 text-red-400"
          )}>
            {score}/100
          </div>
        )}
        <button
          onClick={onRunAudit}
          disabled={isAuditing}
          className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
        >
          {isAuditing ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Audit'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {violations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            {score !== null ? (
              <>
                <CheckCircle className="h-8 w-8 text-emerald-400/20 mb-2" />
                <p className="text-[11px] text-white/30">No accessibility violations found</p>
              </>
            ) : (
              <>
                <Accessibility className="h-8 w-8 text-white/5 mb-2" />
                <p className="text-[10px] text-white/20">Run an audit to check accessibility</p>
              </>
            )}
          </div>
        ) : (
          <div className="py-1">
            {criticalCount > 0 && (
              <div className="px-3 py-1.5 text-[10px] text-red-400/60 bg-red-500/[0.03] border-b border-white/[0.04]">
                ⚠️ {criticalCount} critical/serious issue{criticalCount > 1 ? 's' : ''}
              </div>
            )}
            {violations.map(v => (
              <div key={v.id} className="border-b border-white/[0.04]">
                <button
                  onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/[0.02] transition-colors text-left"
                >
                  <AlertTriangle className={cn("h-3 w-3 shrink-0", IMPACT_COLORS[v.impact]?.split(' ')[0])} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-white/60 truncate">{v.help}</p>
                    <p className="text-[9px] text-white/25">{v.impact} · {v.nodes.length} element{v.nodes.length > 1 ? 's' : ''}</p>
                  </div>
                  {expandedId === v.id ? <ChevronUp className="h-3 w-3 text-white/15" /> : <ChevronDown className="h-3 w-3 text-white/15" />}
                </button>

                {expandedId === v.id && (
                  <div className="px-3 pb-2 space-y-1.5">
                    <p className="text-[10px] text-white/35">{v.description}</p>
                    {v.nodes.slice(0, 3).map((node, i) => (
                      <div key={i} className="text-[9px] font-mono text-white/20 bg-white/[0.02] rounded px-2 py-1 truncate">
                        {node.html.slice(0, 120)}
                      </div>
                    ))}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => onFixViolation(v)}
                        className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-cyan-500/10 text-cyan-400/70 hover:bg-cyan-500/20 transition-colors"
                      >
                        <Wand2 className="h-2.5 w-2.5" />
                        Fix with AI
                      </button>
                      <a
                        href={v.helpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] text-white/20 hover:text-white/40 transition-colors"
                      >
                        <Info className="h-2.5 w-2.5" />
                        Learn more
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
