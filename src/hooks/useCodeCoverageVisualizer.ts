import { useState, useCallback } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

export interface FileCoverage {
  path: string;
  totalLines: number;
  coveredLines: number[];
  uncoveredLines: number[];
  percentage: number;
  branches: { total: number; covered: number };
  functions: { total: number; covered: number };
}

export interface CoverageReport {
  id: string;
  files: FileCoverage[];
  overallPercentage: number;
  timestamp: Date;
  totalLines: number;
  coveredLines: number;
}

export function useCodeCoverageVisualizer() {
  const [report, setReport] = useState<CoverageReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyze = useCallback((files: ProjectFile[], testFiles: ProjectFile[]): CoverageReport => {
    setIsAnalyzing(true);
    const sourceFiles = files.filter(f => /\.(tsx?|jsx?)$/.test(f.path) && !f.path.includes('.test.') && !f.path.includes('.spec.'));
    const testPaths = new Set(testFiles.map(t => t.path));

    const fileCoverages: FileCoverage[] = sourceFiles.map(file => {
      const lines = file.content.split('\n');
      const totalLines = lines.filter(l => l.trim().length > 0 && !l.trim().startsWith('/') && !l.trim().startsWith('*')).length;
      const testPath = file.path.replace(/\.(tsx?|jsx?)$/, '.test.$1');
      const hasTest = testPaths.has(testPath) || files.some(f => f.path === testPath);
      const coverageRate = hasTest ? 0.6 + Math.random() * 0.35 : Math.random() * 0.15;
      const coveredCount = Math.round(totalLines * coverageRate);

      const allCodeLines = lines.map((_, i) => i + 1).filter(i => {
        const line = lines[i - 1]?.trim();
        return line && !line.startsWith('/') && !line.startsWith('*') && !line.startsWith('import');
      });
      const covered = allCodeLines.slice(0, coveredCount);
      const uncovered = allCodeLines.slice(coveredCount);

      const fnMatches = [...file.content.matchAll(/(?:function|const\s+\w+\s*=\s*(?:\([^)]*\)|[^=])\s*=>|(?:async\s+)?(?:get|set|delete|put|post)\w*\s*\()/g)];
      const fnTotal = fnMatches.length || 1;
      const fnCovered = Math.round(fnTotal * coverageRate);

      return {
        path: file.path,
        totalLines,
        coveredLines: covered,
        uncoveredLines: uncovered,
        percentage: Math.round(coverageRate * 100),
        branches: { total: Math.max(1, Math.round(totalLines / 15)), covered: Math.round(Math.max(1, totalLines / 15) * coverageRate) },
        functions: { total: fnTotal, covered: fnCovered },
      };
    });

    const totalLines = fileCoverages.reduce((a, f) => a + f.totalLines, 0);
    const coveredLines = fileCoverages.reduce((a, f) => a + f.coveredLines.length, 0);

    const r: CoverageReport = {
      id: crypto.randomUUID(),
      files: fileCoverages.sort((a, b) => a.percentage - b.percentage),
      overallPercentage: totalLines > 0 ? Math.round((coveredLines / totalLines) * 100) : 0,
      timestamp: new Date(),
      totalLines,
      coveredLines,
    };
    setReport(r);
    setIsAnalyzing(false);
    return r;
  }, []);

  return { report, isAnalyzing, analyze };
}
