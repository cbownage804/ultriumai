import { X, TestTube2, Play, FileCode, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import { useTestGenerator } from '@/hooks/useTestGenerator';

interface TestGeneratorPanelProps {
  open: boolean;
  onClose: () => void;
  files: ProjectFile[];
  onGenerateTest: (prompt: string) => void;
  onGoToFile: (path: string) => void;
  isGenerating: boolean;
}

export function TestGeneratorPanel({ open, onClose, files, onGenerateTest, onGoToFile, isGenerating }: TestGeneratorPanelProps) {
  const { buildTestPrompt, getTestableFiles, getCoverageEstimate, getTestPath } = useTestGenerator();

  if (!open) return null;

  const testableFiles = getTestableFiles(files);
  const coverage = getCoverageEstimate(files);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[500px] max-h-[75vh] bg-[#111113] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-sm font-semibold text-white">Test Generator</h2>
            <p className="text-[11px] text-white/40 mt-0.5">One-click unit test generation</p>
          </div>
          <button onClick={onClose} className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>

        {/* Coverage bar */}
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-white/40">Test Coverage</span>
            <span className={cn("text-[11px] font-medium", coverage.percentage >= 80 ? "text-emerald-400" : coverage.percentage >= 50 ? "text-amber-400" : "text-red-400")}>
              {coverage.percentage}% ({coverage.covered}/{coverage.total})
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", coverage.percentage >= 80 ? "bg-emerald-500" : coverage.percentage >= 50 ? "bg-amber-500" : "bg-red-500")}
              style={{ width: `${coverage.percentage}%` }}
            />
          </div>
        </div>

        {/* Generate all button */}
        <div className="px-4 py-2 border-b border-white/[0.06]">
          <button
            onClick={() => {
              const uncovered = testableFiles.filter(f => !files.some(tf => tf.path === getTestPath(f.path)));
              if (uncovered.length > 0) {
                const prompt = buildTestPrompt(uncovered[0], files);
                onGenerateTest(prompt);
              }
            }}
            disabled={isGenerating || coverage.percentage === 100}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-violet-500/15 text-violet-300 text-[11px] font-medium hover:bg-violet-500/25 disabled:opacity-30 transition-colors"
          >
            <TestTube2 className="h-3.5 w-3.5" />
            Generate Tests for Next Uncovered File
          </button>
        </div>

        {/* File list */}
        <div className="px-4 py-3 max-h-[45vh] overflow-y-auto space-y-1">
          {testableFiles.map(file => {
            const testPath = getTestPath(file.path);
            const hasTest = files.some(f => f.path === testPath);
            const isComponent = /\.(tsx|jsx)$/.test(file.path);
            const isHook = file.path.includes('/use');

            return (
              <div key={file.path} className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
                <div className={cn("h-5 w-5 rounded flex items-center justify-center shrink-0", hasTest ? "text-emerald-400" : "text-white/15")}>
                  {hasTest ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-white/60 font-mono truncate">{file.path}</p>
                  <p className="text-[9px] text-white/25">
                    {isHook ? 'Hook' : isComponent ? 'Component' : 'Utility'} · {file.content.split('\n').length} lines
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {hasTest ? (
                    <button onClick={() => onGoToFile(testPath)} className="h-6 px-2 rounded bg-white/5 text-white/30 text-[10px] hover:bg-white/10">
                      View Test
                    </button>
                  ) : (
                    <button
                      onClick={() => onGenerateTest(buildTestPrompt(file, files))}
                      disabled={isGenerating}
                      className="h-6 px-2 rounded bg-cyan-500/20 text-cyan-300 text-[10px] hover:bg-cyan-500/30 disabled:opacity-30 flex items-center gap-1"
                    >
                      <Play className="h-2.5 w-2.5" /> Generate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
