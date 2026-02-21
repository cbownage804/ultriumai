/**
 * Compilation progress indicator shown after generation ends but before
 * the compiler produces preview HTML. Uses pure CSS animations to avoid
 * JS overhead while the main thread is busy compiling.
 */

interface CompilationProgressProps {
  fileCount?: number;
}

export function CompilationProgress({ fileCount }: CompilationProgressProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-[#111119] animate-fade-in select-none">
      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-cyan-500/[0.05] blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-[200px] h-[200px] rounded-full bg-violet-500/[0.04] blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 px-6">
        {/* Spinner */}
        <div className="relative">
          <div className="h-10 w-10 rounded-full border-2 border-white/[0.08] border-t-cyan-400/70 animate-spin" />
          <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-xl animate-pulse" />
        </div>

        {/* Label */}
        <div className="space-y-1.5 text-center">
          <p className="text-sm font-medium text-white/70 animate-pulse">
            Compiling preview…
          </p>
          {fileCount != null && fileCount > 0 && (
            <p className="text-xs text-white/30">
              {fileCount} file{fileCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Indeterminate progress bar */}
        <div className="w-48 h-1 rounded-full bg-white/[0.06] overflow-hidden">
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-cyan-500/60 to-violet-500/60 compilation-shimmer" />
        </div>

        {/* Cycling phase text — pure CSS, no JS timers */}
        <div className="h-4 overflow-hidden">
          <div className="compilation-phases flex flex-col">
            <span className="text-[11px] text-white/20 h-4 leading-4 text-center">Transpiling files…</span>
            <span className="text-[11px] text-white/20 h-4 leading-4 text-center">Building bundle…</span>
            <span className="text-[11px] text-white/20 h-4 leading-4 text-center">Rendering preview…</span>
          </div>
        </div>
      </div>

      <style>{`
        .compilation-shimmer {
          animation: shimmer 1.5s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(450%); }
        }
        .compilation-phases {
          animation: cycle-phases 4.5s steps(1) infinite;
        }
        @keyframes cycle-phases {
          0%    { transform: translateY(0); }
          33.3% { transform: translateY(-16px); }
          66.6% { transform: translateY(-32px); }
          100%  { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
