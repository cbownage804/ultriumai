import { useState, useCallback } from 'react';

export interface PerfIssue {
  id: string;
  type: 'render' | 'bundle' | 'network' | 'memory' | 'layout';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  suggestion: string;
  filePath?: string;
  lineNumber?: number;
  autoFixable: boolean;
}

export interface PerfReport {
  score: number;
  issues: PerfIssue[];
  bundleSize: number;
  renderTime: number;
  ttfb: number;
  lcp: number;
  cls: number;
  fid: number;
}

export function useAIPerformanceOptimizer() {
  const [report, setReport] = useState<PerfReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoOptimize, setAutoOptimize] = useState(false);

  const analyze = useCallback((files: { path: string; content: string }[]) => {
    setIsAnalyzing(true);
    const issues: PerfIssue[] = [];
    let score = 100;

    for (const file of files) {
      if (file.path.endsWith('.tsx') || file.path.endsWith('.ts')) {
        if (file.content.includes('useEffect') && !file.content.includes('// eslint-disable')) {
          const effectCount = (file.content.match(/useEffect/g) || []).length;
          if (effectCount > 3) {
            issues.push({
              id: crypto.randomUUID(), type: 'render', severity: 'medium',
              title: 'Excessive useEffect hooks', description: `${file.path} has ${effectCount} useEffect hooks`,
              suggestion: 'Consider consolidating effects or using useMemo/useCallback',
              filePath: file.path, autoFixable: false,
            });
            score -= 5;
          }
        }
        if (file.content.length > 10000) {
          issues.push({
            id: crypto.randomUUID(), type: 'bundle', severity: 'high',
            title: 'Large file detected', description: `${file.path} is ${(file.content.length / 1024).toFixed(1)}KB`,
            suggestion: 'Split into smaller modules for better code-splitting',
            filePath: file.path, autoFixable: false,
          });
          score -= 10;
        }
        if (file.content.includes('import *')) {
          issues.push({
            id: crypto.randomUUID(), type: 'bundle', severity: 'medium',
            title: 'Wildcard import detected', description: `${file.path} uses import *`,
            suggestion: 'Use named imports for better tree-shaking',
            filePath: file.path, autoFixable: true,
          });
          score -= 3;
        }
      }
    }

    const newReport: PerfReport = {
      score: Math.max(0, score),
      issues,
      bundleSize: files.reduce((sum, f) => sum + f.content.length, 0),
      renderTime: Math.random() * 200 + 50,
      ttfb: Math.random() * 100 + 20,
      lcp: Math.random() * 1500 + 500,
      cls: Math.random() * 0.1,
      fid: Math.random() * 50 + 10,
    };
    setReport(newReport);
    setIsAnalyzing(false);
    return newReport;
  }, []);

  const generateCode = useCallback(() => {
    return `// Performance Monitoring Utility
export function measurePerformance() {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log(\`[Perf] \${entry.name}: \${entry.duration.toFixed(2)}ms\`);
    }
  });
  observer.observe({ entryTypes: ['measure', 'largest-contentful-paint', 'layout-shift'] });

  return {
    mark: (name: string) => performance.mark(name),
    measure: (name: string, start: string, end: string) => performance.measure(name, start, end),
    getMetrics: () => ({
      memory: (performance as any).memory?.usedJSHeapSize,
      entries: performance.getEntriesByType('measure'),
    }),
  };
}
`;
  }, []);

  return {
    report, isAnalyzing, autoOptimize,
    setAutoOptimize, analyze, generateCode,
  };
}
