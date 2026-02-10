import { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Gauge, FileCode, Package, Zap, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface PerformanceProfilerProps {
  open: boolean;
  onClose: () => void;
  files: { path: string; content: string }[];
  cdnPackages?: { name: string; version: string; url?: string }[];
}

export function PerformanceProfiler({ open, onClose, files, cdnPackages = [] }: PerformanceProfilerProps) {
  const [expanded, setExpanded] = useState(true);

  const stats = useMemo(() => {
    const totalSize = files.reduce((sum, f) => sum + (f.content?.length || 0), 0);
    const jsFiles = files.filter(f => /\.(js|ts|jsx|tsx)$/.test(f.path));
    const cssFiles = files.filter(f => /\.css$/.test(f.path));
    const htmlFiles = files.filter(f => /\.html$/.test(f.path));
    const imageRefs = files.reduce((sum, f) => sum + (f.content?.match(/\.(png|jpg|jpeg|gif|svg|webp)/g)?.length || 0), 0);

    const jsSize = jsFiles.reduce((sum, f) => sum + (f.content?.length || 0), 0);
    const cssSize = cssFiles.reduce((sum, f) => sum + (f.content?.length || 0), 0);

    // Estimate gzipped size (rough ~30% of raw)
    const estimatedGzip = Math.round(totalSize * 0.3);

    // Simple complexity score
    const avgFileSize = files.length > 0 ? totalSize / files.length : 0;
    const largeFiles = files.filter(f => (f.content?.length || 0) > 5000);

    // Performance score (0-100)
    let score = 100;
    if (totalSize > 100000) score -= 20;
    else if (totalSize > 50000) score -= 10;
    if (largeFiles.length > 5) score -= 15;
    else if (largeFiles.length > 2) score -= 5;
    if (cdnPackages.length > 10) score -= 10;
    if (imageRefs > 20) score -= 10;
    score = Math.max(0, Math.min(100, score));

    return {
      totalFiles: files.length,
      jsFiles: jsFiles.length,
      cssFiles: cssFiles.length,
      htmlFiles: htmlFiles.length,
      totalSize,
      jsSize,
      cssSize,
      estimatedGzip,
      imageRefs,
      largeFiles,
      avgFileSize: Math.round(avgFileSize),
      dependencies: cdnPackages.length,
      score,
    };
  }, [files, cdnPackages]);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score >= 60) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  if (!open) return null;

  return (
    <div className="w-64 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col h-full">
      <div className="px-3 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-semibold text-white/70">Performance</span>
        </div>
        <button onClick={onClose} className="text-white/20 hover:text-white/50 text-xs">✕</button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Score */}
          <div className={cn("rounded-xl border p-4 text-center", getScoreBg(stats.score))}>
            <div className={cn("text-3xl font-bold", getScoreColor(stats.score))}>{stats.score}</div>
            <div className="text-[10px] text-white/40 mt-1">Performance Score</div>
          </div>

          {/* Bundle Size */}
          <div className="space-y-2">
            <div className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-1">Bundle Size</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.04]">
                <div className="text-xs font-bold text-white/80">{formatBytes(stats.totalSize)}</div>
                <div className="text-[9px] text-white/25">Raw Total</div>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.04]">
                <div className="text-xs font-bold text-white/80">{formatBytes(stats.estimatedGzip)}</div>
                <div className="text-[9px] text-white/25">~Gzip Est.</div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-white/40">JavaScript</span>
                <span className="text-white/60 font-mono">{formatBytes(stats.jsSize)}</span>
              </div>
              <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                <div className="h-full bg-amber-400/60 rounded-full" style={{ width: `${stats.totalSize > 0 ? (stats.jsSize / stats.totalSize) * 100 : 0}%` }} />
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-white/40">CSS</span>
                <span className="text-white/60 font-mono">{formatBytes(stats.cssSize)}</span>
              </div>
              <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400/60 rounded-full" style={{ width: `${stats.totalSize > 0 ? (stats.cssSize / stats.totalSize) * 100 : 0}%` }} />
              </div>
            </div>
          </div>

          {/* File Breakdown */}
          <div className="space-y-2">
            <div className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-1">Files</div>
            <div className="space-y-1">
              {[
                { label: 'Total Files', value: stats.totalFiles, icon: FileCode },
                { label: 'JS/TS Files', value: stats.jsFiles, icon: FileCode },
                { label: 'CSS Files', value: stats.cssFiles, icon: FileCode },
                { label: 'HTML Files', value: stats.htmlFiles, icon: FileCode },
                { label: 'Image Refs', value: stats.imageRefs, icon: FileCode },
                { label: 'Dependencies', value: stats.dependencies, icon: Package },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between text-[10px] px-2 py-1 rounded-md hover:bg-white/[0.02]">
                  <span className="text-white/40">{item.label}</span>
                  <span className="text-white/60 font-mono">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Warnings */}
          {stats.largeFiles.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-400/70 uppercase tracking-widest px-1 w-full"
              >
                <AlertTriangle className="h-2.5 w-2.5" />
                Warnings ({stats.largeFiles.length})
                {expanded ? <ChevronUp className="h-2.5 w-2.5 ml-auto" /> : <ChevronDown className="h-2.5 w-2.5 ml-auto" />}
              </button>
              {expanded && (
                <div className="space-y-1">
                  {stats.largeFiles.map(f => (
                    <div key={f.path} className="text-[9px] text-amber-400/50 bg-amber-500/5 rounded-md px-2 py-1.5 border border-amber-500/10">
                      <div className="font-medium text-amber-400/70 truncate">{f.path}</div>
                      <div>{formatBytes(f.content?.length || 0)} — consider splitting</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tips */}
          <div className="space-y-2">
            <div className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-1">Optimization Tips</div>
            <div className="space-y-1">
              {stats.totalSize > 50000 && (
                <div className="text-[9px] text-white/40 bg-white/[0.02] rounded-md px-2 py-1.5 border border-white/[0.04]">
                  <Zap className="h-2.5 w-2.5 text-cyan-400/50 inline mr-1" />
                  Split large files into smaller modules
                </div>
              )}
              {stats.imageRefs > 5 && (
                <div className="text-[9px] text-white/40 bg-white/[0.02] rounded-md px-2 py-1.5 border border-white/[0.04]">
                  <Zap className="h-2.5 w-2.5 text-cyan-400/50 inline mr-1" />
                  Use lazy loading for images
                </div>
              )}
              {stats.dependencies > 5 && (
                <div className="text-[9px] text-white/40 bg-white/[0.02] rounded-md px-2 py-1.5 border border-white/[0.04]">
                  <Zap className="h-2.5 w-2.5 text-cyan-400/50 inline mr-1" />
                  Review dependencies — {stats.dependencies} packages loaded
                </div>
              )}
              {stats.score >= 80 && (
                <div className="text-[9px] text-emerald-400/50 bg-emerald-500/5 rounded-md px-2 py-1.5 border border-emerald-500/10">
                  ✓ Project is well optimized!
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
