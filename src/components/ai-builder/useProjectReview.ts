import { useState, useCallback } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

export interface ReviewFinding {
  id: string;
  category: 'error' | 'best-practice' | 'ui-ux' | 'performance' | 'security' | 'accessibility';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  file?: string;
  line?: number;
  suggestion?: string;
}

export interface ReviewResult {
  score: number; // 0-100
  findings: ReviewFinding[];
  summary: string;
  reviewedAt: Date;
}

/**
 * AI-powered project review that scans the entire codebase
 * for errors, best practices, UI/UX issues, and more.
 */
export function useProjectReview() {
  const [isReviewing, setIsReviewing] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  /** Run a static analysis pass (instant, no AI cost) */
  const runStaticReview = useCallback((files: ProjectFile[]): ReviewFinding[] => {
    const findings: ReviewFinding[] = [];
    let findingId = 0;
    const mkId = () => `f-${++findingId}`;

    for (const file of files) {
      const ext = file.path.split('.').pop()?.toLowerCase() || '';
      if (!['html', 'js', 'ts', 'jsx', 'tsx', 'css'].includes(ext)) continue;

      const lines = file.content.split('\n');

      if (['js', 'ts', 'jsx', 'tsx'].includes(ext)) {
        // Missing error handling
        const asyncFns = (file.content.match(/async\s+(?:function\s+)?\w*/g) || []).length;
        const tryCatches = (file.content.match(/try\s*\{/g) || []).length;
        if (asyncFns > 0 && tryCatches < asyncFns) {
          findings.push({ id: mkId(), category: 'error', severity: 'warning', title: 'Async without error handling', description: `${asyncFns - tryCatches} async function(s) missing try/catch`, file: file.path, suggestion: 'Wrap async calls in try/catch blocks' });
        }

        // Console.log pollution
        const consoleLogs = (file.content.match(/console\.\w+\(/g) || []).length;
        if (consoleLogs > 3) {
          findings.push({ id: mkId(), category: 'best-practice', severity: 'info', title: 'Console statements', description: `${consoleLogs} console statements found`, file: file.path, suggestion: 'Remove debug logs before shipping' });
        }

        // Direct state mutation
        if (/this\.state\.\w+\s*=/.test(file.content) || /\.splice\s*\(/.test(file.content)) {
          findings.push({ id: mkId(), category: 'error', severity: 'warning', title: 'Possible state mutation', description: 'Direct state mutation detected (.splice or this.state assignment)', file: file.path, suggestion: 'Use immutable patterns like .filter() or spread operator' });
        }

        // Missing key prop in .map()
        const mapCalls = (file.content.match(/\.map\s*\(/g) || []).length;
        const keyProps = (file.content.match(/key\s*=\s*\{/g) || []).length;
        if (mapCalls > keyProps) {
          findings.push({ id: mkId(), category: 'error', severity: 'warning', title: 'Missing key props', description: `${mapCalls - keyProps} .map() call(s) may be missing key props`, file: file.path, suggestion: 'Add unique key props to all mapped JSX elements' });
        }

        // Hardcoded API keys/secrets
        if (/(?:api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"]{8,}/i.test(file.content)) {
          findings.push({ id: mkId(), category: 'security', severity: 'critical', title: 'Possible hardcoded secret', description: 'API key, token, or password appears to be hardcoded', file: file.path, suggestion: 'Move secrets to environment variables' });
        }

        // Accessibility: images without alt
        if (/<img[^>]*(?!alt\s*=)[^>]*>/i.test(file.content)) {
          findings.push({ id: mkId(), category: 'accessibility', severity: 'warning', title: 'Image missing alt text', description: 'One or more <img> tags are missing alt attributes', file: file.path, suggestion: 'Add descriptive alt text for screen readers' });
        }

        // Performance: large inline objects in render
        const inlineObjects = (file.content.match(/style\s*=\s*\{\s*\{/g) || []).length;
        if (inlineObjects > 5) {
          findings.push({ id: mkId(), category: 'performance', severity: 'info', title: 'Excessive inline styles', description: `${inlineObjects} inline style objects may cause unnecessary re-renders`, file: file.path, suggestion: 'Extract inline styles to constants or CSS classes' });
        }

        // UI/UX: buttons without accessible labels
        if (/<button[^>]*>[\s]*<(?:svg|img|icon)/i.test(file.content)) {
          findings.push({ id: mkId(), category: 'ui-ux', severity: 'warning', title: 'Icon-only button without label', description: 'Button contains only an icon with no accessible text', file: file.path, suggestion: 'Add aria-label or sr-only text for accessibility' });
        }

        // Large file warning
        if (lines.length > 300) {
          findings.push({ id: mkId(), category: 'best-practice', severity: 'info', title: 'Large file', description: `${lines.length} lines — consider splitting into smaller modules`, file: file.path, suggestion: 'Break into smaller, focused components' });
        }
      }

      // CSS checks
      if (ext === 'css') {
        if (/!important/g.test(file.content)) {
          const count = (file.content.match(/!important/g) || []).length;
          if (count > 3) {
            findings.push({ id: mkId(), category: 'best-practice', severity: 'warning', title: 'Excessive !important', description: `${count} uses of !important`, file: file.path, suggestion: 'Refactor CSS specificity instead of using !important' });
          }
        }
      }

      // HTML checks
      if (ext === 'html') {
        if (!/<html[^>]*lang\s*=/i.test(file.content)) {
          findings.push({ id: mkId(), category: 'accessibility', severity: 'warning', title: 'Missing lang attribute', description: '<html> tag is missing the lang attribute', file: file.path, suggestion: 'Add lang="en" to the <html> tag' });
        }
        if (!/<meta[^>]*viewport/i.test(file.content)) {
          findings.push({ id: mkId(), category: 'ui-ux', severity: 'warning', title: 'Missing viewport meta', description: 'No viewport meta tag for responsive design', file: file.path, suggestion: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">' });
        }
      }
    }

    return findings;
  }, []);

  /** Run the full AI-powered review */
  const startReview = useCallback(async (
    files: ProjectFile[],
    sendToAI?: (prompt: string) => void,
  ) => {
    setIsReviewing(true);
    setShowPanel(true);

    // Step 1: Run instant static analysis
    const staticFindings = runStaticReview(files);

    // Step 2: Calculate score
    const criticalCount = staticFindings.filter(f => f.severity === 'critical').length;
    const warningCount = staticFindings.filter(f => f.severity === 'warning').length;
    const infoCount = staticFindings.filter(f => f.severity === 'info').length;
    const score = Math.max(0, Math.min(100, 100 - (criticalCount * 20) - (warningCount * 5) - (infoCount * 1)));

    // Build summary
    const categoryGroups = staticFindings.reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const summaryParts = Object.entries(categoryGroups).map(([cat, count]) => `${count} ${cat.replace('-', '/')}`);
    const summary = staticFindings.length === 0
      ? '✅ No issues found! Your project looks great.'
      : `Found ${staticFindings.length} issue(s): ${summaryParts.join(', ')}. Health score: ${score}/100.`;

    const reviewResult: ReviewResult = {
      score,
      findings: staticFindings,
      summary,
      reviewedAt: new Date(),
    };

    setResult(reviewResult);
    setIsReviewing(false);

    // Step 3: If AI callback provided, also send a summary to chat
    if (sendToAI && files.length > 0) {
      const fileList = files.map(f => `- ${f.path} (${f.content.split('\n').length} lines)`).join('\n');
      const findingSummary = staticFindings.length > 0
        ? staticFindings.slice(0, 10).map(f => `- [${f.severity.toUpperCase()}] ${f.title}: ${f.description}${f.file ? ` (${f.file})` : ''}`).join('\n')
        : 'No static issues found.';

      sendToAI(
        `[PROJECT REVIEW REQUEST]\n\nPlease review my entire project for errors, bugs, best practices, performance, accessibility, and UI/UX issues. Here's a static analysis summary:\n\nHealth Score: ${score}/100\n\nStatic Findings:\n${findingSummary}\n\nProject Files:\n${fileList}\n\nPlease provide:\n1. A brief overall assessment\n2. Any additional issues you spot in the code\n3. Top 3-5 actionable recommendations to improve the project\n4. Rate the project readiness (prototype, beta, production-ready)\n\nKeep it concise and actionable.`
      );
    }

    return reviewResult;
  }, [runStaticReview]);

  const dismissFinding = useCallback((id: string) => {
    setResult(prev => prev ? { ...prev, findings: prev.findings.filter(f => f.id !== id) } : null);
  }, []);

  const clearReview = useCallback(() => {
    setResult(null);
    setShowPanel(false);
  }, []);

  return {
    isReviewing,
    result,
    showPanel,
    setShowPanel,
    startReview,
    dismissFinding,
    clearReview,
  };
}
