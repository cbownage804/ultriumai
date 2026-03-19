/**
 * Premium loading screen shown during AI generation and compilation.
 * Features: animated code rain, real build progress, and morphing skeleton wireframe.
 * All heavy animations are CSS-only to keep the main thread free.
 *
 * Step 4: Now accepts compilePhase for granular progress messages.
 */
import { useState, useEffect, useMemo } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import type { CompilePhase } from './CompilationBridge';

interface SkeletonPreviewProps {
  /** Files being generated (partial list during streaming) */
  projectFiles?: ProjectFile[];
  /** How many files are fully written */
  completedFileCount?: number;
  /** True during generation phase */
  isGenerating?: boolean;
  /** True during compilation phase */
  isCompiling?: boolean;
  /** Step 4: Granular compile sub-phase */
  compilePhase?: CompilePhase;
}

// Fake code lines for the rain effect
const CODE_LINES = [
  'import React from "react";',
  'const App = () => {',
  '  return <div className="app">',
  '    <Header title="Hello" />',
  '    <main>{children}</main>',
  '  </div>;',
  '};',
  'export default App;',
  'function useData(id: string) {',
  '  const [data, setData] = useState(null);',
  '  useEffect(() => {',
  '    fetch(`/api/${id}`).then(r =>',
  '      r.json()).then(setData);',
  '  }, [id]);',
  '  return data;',
  '}',
  '<Button variant="primary">',
  '  Click me',
  '</Button>',
  'const theme = { primary: "#06b6d4" };',
];

const TIPS = [
  'You can click any element in the preview to edit it.',
  'Use the Code tab to browse and edit files manually.',
  'Your project auto-saves after every generation.',
  'Try "Build" mode for multi-step implementation plans.',
  'Publish your app with one click when it\'s ready.',
];

const PHASE_LABELS: Record<string, { text: string; detail: string }> = {
  preparing: { text: 'Preparing files…', detail: 'Auto-repairing & validating syntax' },
  bundling: { text: 'Bundling with Vite…', detail: 'Compiling TypeScript & JSX' },
  rendering: { text: 'Validating output…', detail: 'Checking preview integrity' },
  injecting: { text: 'Injecting runtime…', detail: 'Adding HMR, overlays & assets' },
};

export function SkeletonPreview({
  projectFiles,
  completedFileCount = 0,
  isGenerating = true,
  isCompiling = false,
  compilePhase,
}: SkeletonPreviewProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const [tipFading, setTipFading] = useState(false);

  // Rotate tips
  useEffect(() => {
    const iv = setInterval(() => {
      setTipFading(true);
      setTimeout(() => {
        setTipIndex(p => (p + 1) % TIPS.length);
        setTipFading(false);
      }, 300);
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  const totalFiles = projectFiles?.length ?? 0;
  const progress = totalFiles > 0 ? Math.round((completedFileCount / totalFiles) * 100) : 0;

  // Generate code rain columns (memoized so they don't shift)
  const codeColumns = useMemo(() => {
    const cols: { left: number; delay: number; duration: number; lines: string[] }[] = [];
    for (let i = 0; i < 6; i++) {
      const startIdx = (i * 3) % CODE_LINES.length;
      cols.push({
        left: 8 + i * 15 + Math.random() * 5,
        delay: i * 0.8,
        duration: 12 + Math.random() * 6,
        lines: CODE_LINES.slice(startIdx, startIdx + 4),
      });
    }
    return cols;
  }, []);

  // Step 4: Phase-aware status text
  const phaseInfo = compilePhase ? PHASE_LABELS[compilePhase] : null;
  const statusText = isCompiling && !isGenerating
    ? (phaseInfo?.text ?? 'Compiling preview…')
    : totalFiles > 0
      ? `Writing code… (${completedFileCount}/${totalFiles} files)`
      : 'Building your app…';
  const detailText = isCompiling && !isGenerating
    ? (phaseInfo?.detail ?? 'Almost there…')
    : 'This usually takes a few seconds';

  // Step 4: Phase progress indicator (determinate during compile)
  const phaseProgress = compilePhase
    ? { preparing: 15, bundling: 50, injecting: 80, rendering: 95 }[compilePhase] ?? 0
    : 0;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-[#09090b] relative overflow-hidden select-none">

      {/* ── Ambient background glows ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] rounded-full bg-violet-500/[0.04] blur-[150px]" />
        <div className="absolute bottom-[10%] right-[15%] w-[400px] h-[400px] rounded-full bg-cyan-500/[0.03] blur-[120px]" />
      </div>

      {/* ── Code rain columns ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {codeColumns.map((col, ci) => (
          <div
            key={ci}
            className="absolute code-rain-col"
            style={{
              left: `${col.left}%`,
              animationDelay: `${col.delay}s`,
              animationDuration: `${col.duration}s`,
            }}
          >
            {col.lines.map((line, li) => (
              <div
                key={li}
                className="text-[9px] font-mono text-cyan-400/[0.07] whitespace-nowrap leading-5"
              >
                {line}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── Skeleton wireframe (faintly suggests app structure) ── */}
      <div className="absolute inset-0 pointer-events-none skeleton-wireframe">
        {/* Nav bar */}
        <div className="mx-auto mt-5 w-[85%] max-w-[640px] flex items-center gap-3">
          <div className="h-5 w-5 rounded bg-white/[0.04] skeleton-pulse" />
          <div className="h-2.5 w-20 rounded-full bg-white/[0.03] skeleton-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="flex-1" />
          <div className="h-2.5 w-12 rounded-full bg-white/[0.03] skeleton-pulse" style={{ animationDelay: '0.4s' }} />
          <div className="h-2.5 w-12 rounded-full bg-white/[0.03] skeleton-pulse" style={{ animationDelay: '0.6s' }} />
        </div>
        {/* Hero */}
        <div className="mx-auto mt-10 w-[75%] max-w-[520px] space-y-3">
          <div className="h-7 rounded-lg bg-white/[0.03] w-[55%] skeleton-pulse" style={{ animationDelay: '0.3s' }} />
          <div className="h-2.5 rounded bg-white/[0.025] w-full skeleton-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="h-2.5 rounded bg-white/[0.025] w-[80%] skeleton-pulse" style={{ animationDelay: '0.7s' }} />
          <div className="h-8 w-28 rounded-lg bg-white/[0.03] mt-4 skeleton-pulse" style={{ animationDelay: '0.9s' }} />
        </div>
        {/* Cards */}
        <div className="mx-auto mt-10 w-[75%] max-w-[520px] grid grid-cols-3 gap-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 space-y-2 skeleton-pulse" style={{ animationDelay: `${1.1 + i * 0.2}s` }}>
              <div className="h-3 w-8 rounded bg-white/[0.04]" />
              <div className="h-2 w-full rounded bg-white/[0.03]" />
              <div className="h-2 w-[60%] rounded bg-white/[0.03]" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Center content ── */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 max-w-[400px]">
        {/* Spinner */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-cyan-400/15 blur-xl animate-pulse scale-[2]" />
          <svg className="h-11 w-11 skeleton-spin" viewBox="0 0 44 44" fill="none">
            <circle cx="22" cy="22" r="19" stroke="white" strokeOpacity="0.06" strokeWidth="2.5" />
            <path
              d="M41 22a19 19 0 01-19 19"
              stroke="url(#sg)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="sg" x1="41" y1="22" x2="22" y2="41">
                <stop stopColor="#22d3ee" />
                <stop offset="1" stopColor="#8b5cf6" stopOpacity="0.5" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Status */}
        <div className="text-center space-y-1.5">
          <p className="text-[14px] font-medium text-white/70 tracking-tight">
            {statusText}
          </p>
          <p className="text-[11px] text-white/20">
            {detailText}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-[260px]">
          <div className="h-[3px] rounded-full bg-white/[0.06] overflow-hidden relative">
            {totalFiles > 0 ? (
              /* Determinate progress during generation */
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-violet-500 to-cyan-400 transition-all duration-700 ease-out"
                style={{ width: `${Math.max(progress, 4)}%` }}
              />
            ) : isCompiling && compilePhase ? (
              /* Step 4: Determinate progress during compilation phases */
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-violet-500 to-cyan-400 transition-all duration-500 ease-out"
                style={{ width: `${phaseProgress}%` }}
              />
            ) : (
              /* Indeterminate shimmer */
              <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-cyan-500/50 via-violet-500/60 to-cyan-400/30 skeleton-shimmer" />
            )}
          </div>
          {totalFiles > 0 && (
            <p className="text-[9px] text-white/15 mt-1.5 text-right font-mono tabular-nums">
              {completedFileCount}/{totalFiles} files
            </p>
          )}
          {isCompiling && compilePhase && (
            <p className="text-[9px] text-white/15 mt-1.5 text-right font-mono tabular-nums">
              {phaseProgress}%
            </p>
          )}
        </div>

        {/* File list (last 4 files being worked on) */}
        {totalFiles > 0 && (
          <div className="w-full max-w-[260px] space-y-1">
            {(projectFiles ?? []).slice(-4).map((file, i) => {
              const fileName = file.path.split('/').pop() ?? file.path;
              const idx = (projectFiles?.length ?? 0) - 4 + i;
              const isDone = idx < completedFileCount;
              return (
                <div key={file.path} className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-1 duration-200" style={{ animationDelay: `${i * 50}ms` }}>
                  {isDone ? (
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/70 shrink-0" />
                  ) : (
                    <div className="h-1.5 w-1.5 rounded-full bg-cyan-400/50 animate-pulse shrink-0" />
                  )}
                  <span className={`text-[10px] font-mono truncate ${isDone ? 'text-white/20' : 'text-cyan-300/50'}`}>
                    {fileName}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Step 4: Compile phase steps indicator */}
        {isCompiling && !isGenerating && compilePhase && (
          <div className="w-full max-w-[260px] flex items-center gap-1.5 mt-1">
            {(['preparing', 'bundling', 'injecting', 'rendering'] as const).map((phase) => {
              const phases = ['preparing', 'bundling', 'injecting', 'rendering'];
              const currentIdx = phases.indexOf(compilePhase);
              const thisIdx = phases.indexOf(phase);
              const isDone = thisIdx < currentIdx;
              const isCurrent = phase === compilePhase;
              return (
                <div key={phase} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`h-[2px] w-full rounded-full transition-colors duration-300 ${
                    isDone ? 'bg-emerald-400/60' : isCurrent ? 'bg-cyan-400/60' : 'bg-white/[0.06]'
                  }`} />
                  <span className={`text-[7px] uppercase tracking-wider ${
                    isDone ? 'text-emerald-400/40' : isCurrent ? 'text-cyan-400/50' : 'text-white/10'
                  }`}>
                    {phase.slice(0, 4)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Tip */}
        <div className="h-8 flex items-center justify-center mt-2">
          <p className={`text-[10px] text-white/15 text-center leading-relaxed max-w-[260px] transition-opacity duration-300 ${tipFading ? 'opacity-0' : 'opacity-100'}`}>
            💡 {TIPS[tipIndex]}
          </p>
        </div>
      </div>

      {/* ── Top shimmer accent ── */}
      <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden z-20">
        <div
          className="h-full w-[200%] bg-gradient-to-r from-transparent via-cyan-400/40 to-violet-500/30 opacity-60 skeleton-top-shimmer"
        />
      </div>

      <style>{`
        .skeleton-spin {
          animation: sk-rotate 1.2s cubic-bezier(0.5,0,0.5,1) infinite;
        }
        @keyframes sk-rotate {
          100% { transform: rotate(360deg); }
        }
        .skeleton-shimmer {
          animation: sk-shimmer 2s ease-in-out infinite;
        }
        @keyframes sk-shimmer {
          0% { transform: translateX(-200%); }
          100% { transform: translateX(400%); }
        }
        .skeleton-top-shimmer {
          animation: sk-top-slide 3s linear infinite;
        }
        @keyframes sk-top-slide {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .skeleton-pulse {
          animation: sk-pulse 2s cubic-bezier(0.4,0,0.6,1) infinite;
        }
        @keyframes sk-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .code-rain-col {
          position: absolute;
          top: -80px;
          animation: code-fall linear infinite;
        }
        @keyframes code-fall {
          0% { transform: translateY(-100px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(calc(100vh + 100px)); opacity: 0; }
        }
        .skeleton-wireframe {
          animation: sk-wireframe-fade 3s ease-in-out infinite alternate;
        }
        @keyframes sk-wireframe-fade {
          0% { opacity: 0.6; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
