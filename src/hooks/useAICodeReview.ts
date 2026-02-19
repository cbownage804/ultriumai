import { useState, useCallback } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

export interface CodeReviewFinding {
  id: string;
  file: string;
  line?: number;
  category: 'security' | 'performance' | 'accessibility' | 'best-practice' | 'maintainability';
  severity: 'info' | 'warning' | 'error';
  title: string;
  description: string;
  suggestion?: string;
}

export interface CodeReviewResult {
  score: number; // 0-100
  findings: CodeReviewFinding[];
  summary: string;
  categoryScores: Record<string, number>;
  timestamp: Date;
}

interface ReviewRule {
  id: string;
  category: CodeReviewFinding['category'];
  severity: CodeReviewFinding['severity'];
  title: string;
  pattern: RegExp;
  description: string;
  suggestion: string;
  fileFilter?: RegExp;
}

const REVIEW_RULES: ReviewRule[] = [
  // Security
  { id: 'sec-innerhtml', category: 'security', severity: 'error', title: 'Dangerous innerHTML usage', pattern: /dangerouslySetInnerHTML|\.innerHTML\s*=/g, description: 'Using innerHTML can lead to XSS attacks', suggestion: 'Use DOMPurify or React\'s built-in escaping' },
  { id: 'sec-eval', category: 'security', severity: 'error', title: 'eval() usage detected', pattern: /\beval\s*\(/g, description: 'eval() executes arbitrary code and is a security risk', suggestion: 'Use JSON.parse() or Function constructor instead' },
  { id: 'sec-hardcoded-secret', category: 'security', severity: 'error', title: 'Possible hardcoded secret', pattern: /(?:api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"]{8,}['"]/gi, description: 'Secrets should not be hardcoded in source files', suggestion: 'Use environment variables or a secrets manager' },
  { id: 'sec-http', category: 'security', severity: 'warning', title: 'HTTP URL (not HTTPS)', pattern: /['"]http:\/\/(?!localhost|127\.0\.0\.1)/g, description: 'HTTP connections are unencrypted', suggestion: 'Use HTTPS for all external requests' },

  // Performance
  { id: 'perf-no-memo', category: 'performance', severity: 'info', title: 'Large component without memo', pattern: /^export (?:default )?function \w+\([^)]*\)\s*\{[\s\S]{800,}/gm, description: 'Large components benefit from React.memo()', suggestion: 'Wrap with React.memo() or split into smaller components' },
  { id: 'perf-inline-obj', category: 'performance', severity: 'info', title: 'Inline object in JSX prop', pattern: /(?:style|options|config)=\{\{/g, description: 'Inline objects create new references every render', suggestion: 'Extract to useMemo() or a constant' },
  { id: 'perf-no-key', category: 'performance', severity: 'warning', title: 'Map without key prop', pattern: /\.map\([^)]+\)\s*=>\s*(?:<\w+(?:\s+(?!key=)[^>]*)?>)/g, description: 'List items need unique key props for efficient re-rendering', suggestion: 'Add a unique key prop to each mapped element' },
  { id: 'perf-large-bundle', category: 'performance', severity: 'info', title: 'Heavy import detected', pattern: /import .* from ['"](?:moment|lodash|@mui\/material)(?:\/|['"])/g, description: 'This library adds significant bundle weight', suggestion: 'Use lighter alternatives (date-fns, lodash-es, etc.)' },

  // Accessibility
  { id: 'a11y-no-alt', category: 'accessibility', severity: 'warning', title: 'Image missing alt attribute', pattern: /<img(?:\s+[^>]*)?(?<!\balt=)[^>]*>/g, description: 'Images need alt text for screen readers', suggestion: 'Add descriptive alt="" attribute' },
  { id: 'a11y-click-div', category: 'accessibility', severity: 'warning', title: 'Click handler on non-interactive element', pattern: /<(?:div|span|p)\s+[^>]*onClick/g, description: 'Click handlers on divs are not keyboard accessible', suggestion: 'Use <button> or add role="button" tabIndex={0} onKeyDown' },
  { id: 'a11y-no-label', category: 'accessibility', severity: 'info', title: 'Form input without label', pattern: /<input(?:\s+[^>]*)?(?<!\baria-label|\bid=)[^>]*>/g, description: 'Inputs need associated labels for accessibility', suggestion: 'Add <label htmlFor=""> or aria-label' },

  // Best Practices
  { id: 'bp-console-log', category: 'best-practice', severity: 'info', title: 'console.log left in code', pattern: /console\.log\(/g, description: 'Debug logs should be removed before production', suggestion: 'Remove or use a proper logging library' },
  { id: 'bp-any-type', category: 'best-practice', severity: 'info', title: 'TypeScript "any" type', pattern: /:\s*any\b/g, description: '"any" bypasses type safety', suggestion: 'Use a specific type or "unknown"', fileFilter: /\.tsx?$/ },
  { id: 'bp-empty-catch', category: 'best-practice', severity: 'warning', title: 'Empty catch block', pattern: /catch\s*\([^)]*\)\s*\{\s*\}/g, description: 'Swallowed errors make debugging impossible', suggestion: 'Log or handle the error' },
  { id: 'bp-todo', category: 'best-practice', severity: 'info', title: 'TODO comment found', pattern: /\/\/\s*TODO|\/\*\s*TODO/gi, description: 'Unresolved TODO items remain in the code', suggestion: 'Resolve or create a task for this TODO' },

  // Maintainability
  { id: 'maint-long-fn', category: 'maintainability', severity: 'info', title: 'Function exceeds 50 lines', pattern: /(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>)\s*\{[\s\S]{2000,}?\n\}/g, description: 'Long functions are harder to test and maintain', suggestion: 'Split into smaller focused functions' },
  { id: 'maint-magic-number', category: 'maintainability', severity: 'info', title: 'Magic number in logic', pattern: /(?:===?|!==?|[<>]=?)\s*(?:[2-9]\d{2,}|\d{4,})/g, description: 'Unexplained numbers reduce code clarity', suggestion: 'Extract to a named constant' },
  { id: 'maint-deep-nest', category: 'maintainability', severity: 'info', title: 'Deeply nested code', pattern: /(?:if|for|while)\s*\([^)]*\)\s*\{[^}]*(?:if|for|while)\s*\([^)]*\)\s*\{[^}]*(?:if|for|while)\s*\([^)]*\)\s*\{/g, description: 'Triple nesting reduces readability', suggestion: 'Use early returns, extract helper functions, or use .filter/.map' },
];

export function useAICodeReview() {
  const [lastReview, setLastReview] = useState<CodeReviewResult | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);

  const reviewFiles = useCallback((files: ProjectFile[]): CodeReviewResult => {
    setIsReviewing(true);
    const findings: CodeReviewFinding[] = [];

    for (const file of files) {
      for (const rule of REVIEW_RULES) {
        if (rule.fileFilter && !rule.fileFilter.test(file.path)) continue;
        
        const matches = file.content.matchAll(new RegExp(rule.pattern.source, rule.pattern.flags));
        for (const match of matches) {
          const line = file.content.substring(0, match.index).split('\n').length;
          findings.push({
            id: `${rule.id}-${file.path}-${line}`,
            file: file.path,
            line,
            category: rule.category,
            severity: rule.severity,
            title: rule.title,
            description: rule.description,
            suggestion: rule.suggestion,
          });
        }
      }
    }

    // Calculate scores
    const categoryScores: Record<string, number> = {};
    const categories = ['security', 'performance', 'accessibility', 'best-practice', 'maintainability'];
    
    for (const cat of categories) {
      const catFindings = findings.filter(f => f.category === cat);
      const errors = catFindings.filter(f => f.severity === 'error').length;
      const warnings = catFindings.filter(f => f.severity === 'warning').length;
      const infos = catFindings.filter(f => f.severity === 'info').length;
      categoryScores[cat] = Math.max(0, 100 - (errors * 20) - (warnings * 8) - (infos * 2));
    }

    const overallScore = Math.round(
      Object.values(categoryScores).reduce((a, b) => a + b, 0) / categories.length
    );

    const summaryParts: string[] = [];
    if (findings.filter(f => f.severity === 'error').length > 0) summaryParts.push(`${findings.filter(f => f.severity === 'error').length} critical issues`);
    if (findings.filter(f => f.severity === 'warning').length > 0) summaryParts.push(`${findings.filter(f => f.severity === 'warning').length} warnings`);
    if (findings.filter(f => f.severity === 'info').length > 0) summaryParts.push(`${findings.filter(f => f.severity === 'info').length} suggestions`);

    const result: CodeReviewResult = {
      score: overallScore,
      findings,
      summary: summaryParts.length > 0 ? `Found ${summaryParts.join(', ')} across ${files.length} files` : `Clean code! No issues found in ${files.length} files`,
      categoryScores,
      timestamp: new Date(),
    };

    setLastReview(result);
    setIsReviewing(false);
    return result;
  }, []);

  const buildReviewPrompt = useCallback((files: ProjectFile[]): string => {
    const fileList = files.map(f => `- ${f.path} (${f.content.split('\n').length} lines)`).join('\n');
    return `Review this codebase for security vulnerabilities, performance issues, accessibility problems, and best practice violations. Score each category 0-100 and provide specific actionable findings.\n\nFiles:\n${fileList}\n\n${files.map(f => `===FILE: ${f.path}===\n${f.content}`).join('\n\n')}`;
  }, []);

  return {
    lastReview,
    isReviewing,
    reviewFiles,
    buildReviewPrompt,
  };
}
