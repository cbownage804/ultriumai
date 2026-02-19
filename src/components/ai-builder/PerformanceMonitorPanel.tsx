/**
 * Performance Monitor Panel — Phase 39
 * Shows Core Web Vitals, bundle size, DOM complexity, and optimization suggestions.
 */

import { useState } from 'react';
import { Gauge, Clock, Layers, Package, Zap, AlertTriangle, TrendingUp, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PerformanceMetrics {
  loadTimeMs: number;
  domNodes: number;
  bundleSizeKB: number;
  lcp: number | null;
  cls: number | null;
  inp: number | null;
  jsHeapMB: number | null;
  scriptCount: number;
  styleCount: number;
  imageCount: number;
}

interface PerformanceMonitorPanelProps {
  metrics: PerformanceMetrics | null;
  isAuditing: boolean;
  onRunAudit: () => void;
  onOptimize: (suggestion: string) => void;
}

function getScore(metrics: PerformanceMetrics): number {
  let score = 100;
  if (metrics.loadTimeMs > 3000) score -= 20;
  else if (metrics.loadTimeMs > 1500) score -= 10;
  if (metrics.domNodes > 1500) score -= 15;
  else if (metrics.domNodes > 800) score -= 5;
  if (metrics.bundleSizeKB > 500) score -= 15;
  else if (metrics.bundleSizeKB > 200) score -= 5;
  if (metrics.lcp && metrics.lcp > 2500) score -= 15;
  if (metrics.cls && metrics.cls > 0.1) score -= 10;
  return Math.max(0, score);
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-400';
  if (score >= 70) return 'text-yellow-400';
  return 'text-red-400';
}

function getSuggestions(metrics: PerformanceMetrics): { text: string; prompt: string }[] {
  const suggestions: { text: string; prompt: string }[] = [];
  if (metrics.domNodes > 1000) suggestions.push({ text: 'Reduce DOM complexity — virtualize long lists', prompt: 'Optimize this app: reduce DOM node count by virtualizing long lists using windowing.' });
  if (metrics.bundleSizeKB > 300) suggestions.push({ text: 'Reduce bundle size — code split or lazy load', prompt: 'Optimize this app: reduce bundle size by lazy loading heavy components.' });
  if (metrics.imageCount > 5) suggestions.push({ text: 'Lazy load images below the fold', prompt: 'Add loading="lazy" to all images that are not above the fold.' });
  if (metrics.lcp && metrics.lcp > 2500) suggestions.push({ text: 'Improve LCP — optimize critical rendering path', prompt: 'Improve Largest Contentful Paint by preloading critical resources and deferring non-critical scripts.' });
  if (metrics.cls && metrics.cls > 0.1) suggestions.push({ text: 'Fix CLS — add explicit dimensions to images/embeds', prompt: 'Fix Cumulative Layout Shift by adding explicit width/height to all images and embedded content.' });
  return suggestions;
}

export function PerformanceMonitorPanel({ metrics, isAuditing, onRunAudit, onOptimize }: PerformanceMonitorPanelProps) {
  const score = metrics ? getScore(metrics) : null;
  const suggestions = metrics ? getSuggestions(metrics) : [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 h-9 border-b border-white/[0.06] shrink-0">
        <Gauge className="h-3.5 w-3.5 text-white/30" />
        <span className="text-[11px] font-medium text-white/50">Performance</span>
        {score !== null && (
          <span className={cn("ml-auto text-[11px] font-mono", getScoreColor(score))}>
            {score}/100
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        {!metrics ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Gauge className="h-8 w-8 text-white/5 mb-2" />
            <p className="text-[10px] text-white/20">Run a performance audit</p>
            <button
              onClick={onRunAudit}
              disabled={isAuditing}
              className="mt-2 text-[11px] px-3 py-1.5 rounded-md bg-white/[0.04] text-white/40 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
            >
              {isAuditing ? 'Auditing...' : 'Run Audit'}
            </button>
          </div>
        ) : (
          <>
            {/* Score ring */}
            <div className="flex items-center justify-center py-2">
              <div className={cn("text-3xl font-bold", getScoreColor(score!))}>
                {score}
              </div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 gap-2">
              <MetricCard icon={Clock} label="Load Time" value={`${metrics.loadTimeMs}ms`} warn={metrics.loadTimeMs > 1500} />
              <MetricCard icon={Layers} label="DOM Nodes" value={String(metrics.domNodes)} warn={metrics.domNodes > 1000} />
              <MetricCard icon={Package} label="Bundle" value={`${metrics.bundleSizeKB}KB`} warn={metrics.bundleSizeKB > 300} />
              <MetricCard icon={BarChart3} label="Scripts" value={String(metrics.scriptCount)} />
              {metrics.lcp !== null && <MetricCard icon={TrendingUp} label="LCP" value={`${metrics.lcp}ms`} warn={metrics.lcp > 2500} />}
              {metrics.cls !== null && <MetricCard icon={Zap} label="CLS" value={metrics.cls.toFixed(3)} warn={metrics.cls > 0.1} />}
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-white/25 font-medium">Optimization suggestions</p>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => onOptimize(s.prompt)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left"
                  >
                    <AlertTriangle className="h-3 w-3 text-yellow-400/50 shrink-0" />
                    <span className="text-[10px] text-white/40">{s.text}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, warn }: { icon: typeof Clock; label: string; value: string; warn?: boolean }) {
  return (
    <div className={cn(
      "px-2.5 py-2 rounded-lg border",
      warn ? "border-yellow-500/20 bg-yellow-500/[0.03]" : "border-white/[0.06] bg-white/[0.02]"
    )}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={cn("h-3 w-3", warn ? "text-yellow-400/50" : "text-white/20")} />
        <span className="text-[9px] text-white/25">{label}</span>
      </div>
      <p className={cn("text-[13px] font-mono", warn ? "text-yellow-400/70" : "text-white/60")}>{value}</p>
    </div>
  );
}
