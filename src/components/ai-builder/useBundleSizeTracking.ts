import { useCallback, useState } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import type { BuildLogEntry } from './BuildLogPanel';

export interface FileSizeEntry {
  path: string;
  sizeBytes: number;
  sizeKB: number;
  isOverThreshold: boolean;
  language: string;
}

export interface BundleSizeReport {
  totalSizeKB: number;
  files: FileSizeEntry[];
  largestFiles: FileSizeEntry[];
  warnings: string[];
}

const FILE_THRESHOLD_KB = 50; // Warn for files > 50KB
const TOTAL_THRESHOLD_KB = 500; // Warn for total > 500KB

/**
 * Bundle Size Tracking: Estimates per-file and total bundle size,
 * warns when thresholds are exceeded.
 */
export function useBundleSizeTracking(
  addBuildLogEntry: (type: BuildLogEntry['type'], message: string) => void,
) {
  const [report, setReport] = useState<BundleSizeReport | null>(null);

  const analyzeBundle = useCallback((files: ProjectFile[]): BundleSizeReport => {
    const codeFiles = files.filter(f => f.path.match(/\.(tsx?|jsx?|css|html|json)$/));

    const entries: FileSizeEntry[] = codeFiles.map(f => {
      const sizeBytes = new TextEncoder().encode(f.content).length;
      const sizeKB = Math.round((sizeBytes / 1024) * 10) / 10;
      const ext = f.path.split('.').pop() || '';
      return {
        path: f.path,
        sizeBytes,
        sizeKB,
        isOverThreshold: sizeKB > FILE_THRESHOLD_KB,
        language: ext,
      };
    });

    const totalSizeKB = Math.round(entries.reduce((sum, e) => sum + e.sizeKB, 0) * 10) / 10;
    const largestFiles = [...entries].sort((a, b) => b.sizeBytes - a.sizeBytes).slice(0, 5);
    const warnings: string[] = [];

    if (totalSizeKB > TOTAL_THRESHOLD_KB) {
      warnings.push(`Total bundle ~${totalSizeKB}KB exceeds ${TOTAL_THRESHOLD_KB}KB threshold`);
    }

    const oversized = entries.filter(e => e.isOverThreshold);
    for (const f of oversized) {
      warnings.push(`${f.path} is ${f.sizeKB}KB — consider splitting`);
    }

    const bundleReport: BundleSizeReport = { totalSizeKB, files: entries, largestFiles, warnings };
    setReport(bundleReport);

    // Log to build log
    const emoji = warnings.length === 0 ? '📦' : '⚠️';
    addBuildLogEntry(warnings.length === 0 ? 'success' : 'warning' as any,
      `${emoji} Bundle: ${totalSizeKB}KB total (${entries.length} files)`
    );
    if (oversized.length > 0) {
      oversized.slice(0, 3).forEach(f =>
        addBuildLogEntry('info', `  📄 ${f.path}: ${f.sizeKB}KB`)
      );
    }

    return bundleReport;
  }, [addBuildLogEntry]);

  return { analyzeBundle, report };
}
