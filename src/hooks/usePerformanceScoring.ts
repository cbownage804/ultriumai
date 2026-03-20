import { useState, useCallback } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

/**
 * Wave 17: Performance Scoring Engine
 * Lighthouse-style static analysis of generated code to surface
 * performance issues, bundle size estimates, and optimization suggestions.
 */

export interface PerformanceScore {
  overall: number; // 0-100
  categories: PerformanceCategory[];
  suggestions: PerformanceSuggestion[];
  bundleSizeEstimate: BundleSizeEstimate;
  timestamp: number;
}

interface PerformanceCategory {
  name: string;
  score: number; // 0-100
  weight: number;
  issues: string[];
}

export interface PerformanceSuggestion {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  file?: string;
  line?: number;
  autoFixable: boolean;
}

interface BundleSizeEstimate {
  totalKB: number;
  jsKB: number;
  cssKB: number;
  imageKB: number;
  largestFiles: { path: string; sizeKB: number }[];
}

// ── Static analysis checkers ──

function checkLazyLoading(files: ProjectFile[]): PerformanceSuggestion[] {
  const suggestions: PerformanceSuggestion[] = [];
  const routeFile = files.find(f => /\/(App|routes|router)\.(tsx?|jsx?)$/.test(f.path));
  if (!routeFile) return suggestions;

  const hasLazy = /React\.lazy|lazy\(/.test(routeFile.content);
  const routeCount = (routeFile.content.match(/<Route\s/g) || []).length;

  if (routeCount > 3 && !hasLazy) {
    suggestions.push({
      id: 'lazy-routes',
      severity: 'warning',
      title: 'Add code splitting with React.lazy()',
      description: `Found ${routeCount} routes without lazy loading. Code-split pages to reduce initial bundle size by up to 60%.`,
      file: routeFile.path,
      autoFixable: true,
    });
  }
  return suggestions;
}

function checkImageOptimization(files: ProjectFile[]): PerformanceSuggestion[] {
  const suggestions: PerformanceSuggestion[] = [];

  for (const f of files) {
    if (!/\.(tsx?|jsx?|html)$/.test(f.path)) continue;

    // Check for images without loading="lazy"
    const imgTags = f.content.match(/<img\s[^>]*>/g) || [];
    const nonLazyImgs = imgTags.filter(tag => !tag.includes('loading=') && !tag.includes('loading="eager"'));
    if (nonLazyImgs.length > 2) {
      suggestions.push({
        id: `lazy-img-${f.path}`,
        severity: 'info',
        title: 'Add lazy loading to images',
        description: `${nonLazyImgs.length} <img> tags without loading="lazy" in ${f.path}. Below-the-fold images should lazy-load.`,
        file: f.path,
        autoFixable: true,
      });
    }

    // Check for large inline data URLs
    const dataUrls = f.content.match(/data:image\/[^"'\s]{1000,}/g) || [];
    if (dataUrls.length > 0) {
      suggestions.push({
        id: `inline-img-${f.path}`,
        severity: 'warning',
        title: 'Move large inline images to assets',
        description: `${dataUrls.length} large base64 image(s) embedded inline (~${Math.round(dataUrls.reduce((s, d) => s + d.length, 0) / 1024)}KB). Move to separate files for caching.`,
        file: f.path,
        autoFixable: false,
      });
    }
  }
  return suggestions;
}

function checkRenderPerformance(files: ProjectFile[]): PerformanceSuggestion[] {
  const suggestions: PerformanceSuggestion[] = [];

  for (const f of files) {
    if (!/\.(tsx?|jsx?)$/.test(f.path)) continue;

    // Inline object/array creation in JSX (causes re-renders)
    const inlineObjCount = (f.content.match(/(?:style|className)=\{\{/g) || []).length;
    if (inlineObjCount > 5) {
      suggestions.push({
        id: `inline-obj-${f.path}`,
        severity: 'info',
        title: 'Memoize inline style objects',
        description: `${inlineObjCount} inline style objects in JSX cause unnecessary re-renders. Extract to constants or useMemo.`,
        file: f.path,
        autoFixable: true,
      });
    }

    // Missing useCallback on event handlers passed as props
    const handlerDefs = (f.content.match(/const\s+handle\w+\s*=\s*\(/g) || []).length;
    const useCallbackCount = (f.content.match(/useCallback/g) || []).length;
    if (handlerDefs > 3 && useCallbackCount === 0) {
      suggestions.push({
        id: `memo-handlers-${f.path}`,
        severity: 'info',
        title: 'Wrap handlers in useCallback',
        description: `${handlerDefs} event handlers without useCallback may cause child component re-renders.`,
        file: f.path,
        autoFixable: true,
      });
    }

    // Large component (>250 lines) — should be split
    const lineCount = f.content.split('\n').length;
    if (lineCount > 250 && f.path.includes('/components/')) {
      suggestions.push({
        id: `large-component-${f.path}`,
        severity: 'warning',
        title: 'Split large component',
        description: `${f.path} is ${lineCount} lines. Extract sub-components to improve maintainability and render performance.`,
        file: f.path,
        autoFixable: false,
      });
    }
  }
  return suggestions;
}

function checkBundleImpact(files: ProjectFile[]): PerformanceSuggestion[] {
  const suggestions: PerformanceSuggestion[] = [];

  // Heavy library detection
  const heavyLibs: Record<string, { sizeKB: number; alternative: string }> = {
    'moment': { sizeKB: 290, alternative: 'date-fns (18KB) or dayjs (2KB)' },
    'lodash': { sizeKB: 72, alternative: 'lodash-es with tree-shaking or native methods' },
    'jquery': { sizeKB: 87, alternative: 'native DOM APIs' },
    'axios': { sizeKB: 14, alternative: 'native fetch()' },
  };

  for (const f of files) {
    for (const [lib, info] of Object.entries(heavyLibs)) {
      if (f.content.includes(`from '${lib}'`) || f.content.includes(`from "${lib}"`)) {
        suggestions.push({
          id: `heavy-lib-${lib}`,
          severity: lib === 'moment' || lib === 'jquery' ? 'warning' : 'info',
          title: `Consider replacing ${lib} (~${info.sizeKB}KB)`,
          description: `Use ${info.alternative} to reduce bundle size.`,
          file: f.path,
          autoFixable: false,
        });
      }
    }
  }
  return suggestions;
}

function checkAccessibility(files: ProjectFile[]): PerformanceSuggestion[] {
  const suggestions: PerformanceSuggestion[] = [];

  for (const f of files) {
    if (!/\.(tsx?|jsx?)$/.test(f.path)) continue;

    // Images without alt text
    const imgNoAlt = (f.content.match(/<img\s+(?![^>]*alt=)[^>]*>/g) || []).length;
    if (imgNoAlt > 0) {
      suggestions.push({
        id: `img-alt-${f.path}`,
        severity: 'warning',
        title: 'Add alt text to images',
        description: `${imgNoAlt} <img> tag(s) missing alt attribute in ${f.path}. Required for accessibility and SEO.`,
        file: f.path,
        autoFixable: true,
      });
    }

    // Buttons without type
    const btnNoType = (f.content.match(/<button\s+(?![^>]*type=)[^>]*>/g) || []).length;
    if (btnNoType > 2) {
      suggestions.push({
        id: `btn-type-${f.path}`,
        severity: 'info',
        title: 'Add type to buttons',
        description: `${btnNoType} <button> tags without explicit type attribute. Add type="button" to prevent accidental form submissions.`,
        file: f.path,
        autoFixable: true,
      });
    }
  }
  return suggestions;
}

// ── Bundle size estimation ──
function estimateBundleSize(files: ProjectFile[]): BundleSizeEstimate {
  let jsKB = 0;
  let cssKB = 0;
  let imageKB = 0;
  const fileSizes: { path: string; sizeKB: number }[] = [];

  for (const f of files) {
    const sizeKB = Math.round(f.content.length / 1024 * 10) / 10;
    fileSizes.push({ path: f.path, sizeKB });

    if (/\.(tsx?|jsx?|mjs)$/.test(f.path)) {
      jsKB += sizeKB * 0.4; // Estimate minified size as ~40% of source
    } else if (/\.css$/.test(f.path)) {
      cssKB += sizeKB * 0.6;
    }

    // Count inline images
    const dataUrlSize = (f.content.match(/data:image\/[^"'\s]+/g) || [])
      .reduce((s, d) => s + d.length, 0);
    imageKB += dataUrlSize / 1024;
  }

  // Add framework overhead estimates
  jsKB += 45; // React ~45KB minified+gzipped
  jsKB += 12; // React-DOM ~12KB
  jsKB += 8;  // React Router ~8KB

  return {
    totalKB: Math.round(jsKB + cssKB + imageKB),
    jsKB: Math.round(jsKB),
    cssKB: Math.round(cssKB),
    imageKB: Math.round(imageKB),
    largestFiles: fileSizes.sort((a, b) => b.sizeKB - a.sizeKB).slice(0, 5),
  };
}

export function usePerformanceScoring() {
  const [score, setScore] = useState<PerformanceScore | null>(null);
  const [isScoring, setIsScoring] = useState(false);

  const analyzePerformance = useCallback((files: ProjectFile[]): PerformanceScore => {
    setIsScoring(true);

    const allSuggestions = [
      ...checkLazyLoading(files),
      ...checkImageOptimization(files),
      ...checkRenderPerformance(files),
      ...checkBundleImpact(files),
      ...checkAccessibility(files),
    ];

    const bundleSize = estimateBundleSize(files);

    // Calculate category scores
    const categories: PerformanceCategory[] = [
      {
        name: 'Performance',
        weight: 0.35,
        issues: allSuggestions.filter(s => ['lazy-routes', 'inline-obj', 'memo-handlers'].some(p => s.id.startsWith(p))).map(s => s.title),
        score: 100 - allSuggestions.filter(s => s.id.startsWith('lazy') || s.id.startsWith('inline-obj') || s.id.startsWith('memo')).length * 12,
      },
      {
        name: 'Bundle Size',
        weight: 0.25,
        issues: allSuggestions.filter(s => s.id.startsWith('heavy-lib') || s.id.startsWith('inline-img')).map(s => s.title),
        score: bundleSize.totalKB < 200 ? 95 : bundleSize.totalKB < 500 ? 75 : bundleSize.totalKB < 1000 ? 50 : 30,
      },
      {
        name: 'Best Practices',
        weight: 0.2,
        issues: allSuggestions.filter(s => s.id.startsWith('large-component') || s.id.startsWith('btn-type')).map(s => s.title),
        score: 100 - allSuggestions.filter(s => s.id.startsWith('large') || s.id.startsWith('btn')).length * 8,
      },
      {
        name: 'Accessibility',
        weight: 0.2,
        issues: allSuggestions.filter(s => s.id.startsWith('img-alt')).map(s => s.title),
        score: 100 - allSuggestions.filter(s => s.id.startsWith('img-alt')).length * 15,
      },
    ];

    // Clamp scores
    categories.forEach(c => c.score = Math.max(0, Math.min(100, c.score)));

    const overall = Math.round(categories.reduce((sum, c) => sum + c.score * c.weight, 0));

    const result: PerformanceScore = {
      overall,
      categories,
      suggestions: allSuggestions.sort((a, b) => {
        const sev = { critical: 0, warning: 1, info: 2 };
        return sev[a.severity] - sev[b.severity];
      }),
      bundleSizeEstimate: bundleSize,
      timestamp: Date.now(),
    };

    setScore(result);
    setIsScoring(false);
    return result;
  }, []);

  /**
   * Build a performance summary for AI prompt injection.
   */
  const buildPerfDirective = useCallback((): string | null => {
    if (!score) return null;
    const critical = score.suggestions.filter(s => s.severity === 'critical');
    const warnings = score.suggestions.filter(s => s.severity === 'warning');
    if (critical.length === 0 && warnings.length === 0) return null;

    return `[PERFORMANCE ISSUES — address these in your output]
Score: ${score.overall}/100 | Bundle: ~${score.bundleSizeEstimate.totalKB}KB
${critical.map(s => `🔴 ${s.title}: ${s.description}`).join('\n')}
${warnings.map(s => `🟡 ${s.title}: ${s.description}`).join('\n')}`;
  }, [score]);

  const clearScore = useCallback(() => setScore(null), []);

  return { score, isScoring, analyzePerformance, buildPerfDirective, clearScore };
}
