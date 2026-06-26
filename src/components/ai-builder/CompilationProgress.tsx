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
    <div className="flex flex-col items-center justify-center h-full w-full bg-[#111119] select-none">
      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden bg-[radial-gradient(circle_at_35%_35%,rgba(6,182,212,0.08),transparent_32%),radial-gradient(circle_at_70%_65%,rgba(139,92,246,0.06),transparent_28%)]" />

      <div className="relative z-10 flex flex-col items-center gap-6 px-6">
        {/* Spinner */}
        <div className="relative">
          <div className="h-10 w-10 rounded-full border-2 border-cyan-400/35 bg-cyan-400/10" />
        </div>

        {/* Label */}
        <div className="space-y-1.5 text-center">
          <p className="text-sm font-medium text-white/70">
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
          <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-cyan-500/60 to-violet-500/60" />
        </div>

        <div className="h-4 overflow-hidden">
          <div className="flex flex-col">
            <span className="text-[11px] text-white/20 h-4 leading-4 text-center">Building bundle…</span>
          </div>
        </div>
      </div>
    </div>
  );
}
