import { useCallback } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import type { BuildLogEntry } from './BuildLogPanel';

export interface AuditScore {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  details: AuditDetail[];
}

export interface AuditDetail {
  category: 'performance' | 'accessibility' | 'best-practices' | 'seo';
  rule: string;
  message: string;
  impact: 'high' | 'medium' | 'low';
  passed: boolean;
}

/**
 * Simulated Lighthouse Audit: Analyzes generated code for
 * performance, accessibility, and SEO issues post-build.
 */
export function useLighthouseAudit(
  addBuildLogEntry: (type: BuildLogEntry['type'], message: string) => void,
) {
  const runAudit = useCallback((files: ProjectFile[]): AuditScore => {
    const details: AuditDetail[] = [];
    const allContent = files.map(f => f.content).join('\n');
    const htmlFiles = files.filter(f => f.path.endsWith('.html') || f.path.endsWith('.htm'));
    const htmlContent = htmlFiles.map(f => f.content).join('\n');
    const cssFiles = files.filter(f => f.path.endsWith('.css'));
    const jsFiles = files.filter(f => f.path.match(/\.(js|ts|jsx|tsx)$/));

    // === PERFORMANCE ===
    // Image optimization
    const imgWithoutLazy = (htmlContent.match(/<img(?![^>]*loading=)/g) || []).length;
    details.push({ category: 'performance', rule: 'lazy-loading', message: imgWithoutLazy > 0 ? `${imgWithoutLazy} image(s) without lazy loading` : 'All images have lazy loading', impact: 'medium', passed: imgWithoutLazy === 0 });

    // Large inline scripts
    const inlineScripts = [...htmlContent.matchAll(/<script(?!.*src)[^>]*>([\s\S]*?)<\/script>/g)];
    const largeInline = inlineScripts.filter(m => m[1].length > 5000).length;
    details.push({ category: 'performance', rule: 'no-large-inline-scripts', message: largeInline > 0 ? `${largeInline} large inline script(s) (>5KB) — consider externalizing` : 'No oversized inline scripts', impact: 'high', passed: largeInline === 0 });

    // Render-blocking resources
    const blockingCSS = (htmlContent.match(/<link[^>]+rel=["']stylesheet["'][^>]*>/g) || []).length;
    details.push({ category: 'performance', rule: 'render-blocking', message: blockingCSS > 3 ? `${blockingCSS} render-blocking stylesheets` : 'Minimal render-blocking resources', impact: 'medium', passed: blockingCSS <= 3 });

    // Bundle size estimate
    const totalJSSize = jsFiles.reduce((sum, f) => sum + f.content.length, 0);
    const jsKB = Math.round(totalJSSize / 1024);
    details.push({ category: 'performance', rule: 'bundle-size', message: jsKB > 500 ? `JS bundle ~${jsKB}KB — consider code splitting` : `JS bundle ~${jsKB}KB — acceptable`, impact: 'high', passed: jsKB <= 500 });

    // === ACCESSIBILITY ===
    // Alt text on images
    const imgWithoutAlt = (allContent.match(/<img(?![^>]*alt=)/g) || []).length;
    details.push({ category: 'accessibility', rule: 'img-alt', message: imgWithoutAlt > 0 ? `${imgWithoutAlt} image(s) missing alt text` : 'All images have alt text', impact: 'high', passed: imgWithoutAlt === 0 });

    // Form labels
    const inputs = (allContent.match(/<input\b/g) || []).length;
    const labels = (allContent.match(/<label\b/g) || []).length;
    const ariaLabels = (allContent.match(/aria-label=/g) || []).length;
    details.push({ category: 'accessibility', rule: 'form-labels', message: inputs > labels + ariaLabels ? `${inputs - labels - ariaLabels} input(s) without label or aria-label` : 'All inputs have labels', impact: 'high', passed: inputs <= labels + ariaLabels });

    // Color contrast (simplified check for white text on light bg)
    const lowContrast = (allContent.match(/text-white.*bg-white|text-gray-100.*bg-gray-100/g) || []).length;
    details.push({ category: 'accessibility', rule: 'color-contrast', message: lowContrast > 0 ? 'Possible low-contrast text detected' : 'No obvious contrast issues', impact: 'high', passed: lowContrast === 0 });

    // Heading hierarchy
    const h1Count = (allContent.match(/<h1[\s>]/g) || []).length;
    details.push({ category: 'accessibility', rule: 'heading-order', message: h1Count === 0 ? 'No <h1> found on page' : h1Count > 1 ? `${h1Count} <h1> elements — should have exactly one` : 'Single <h1> present', impact: 'medium', passed: h1Count === 1 });

    // === BEST PRACTICES ===
    // Console logs
    const consoleLogs = (allContent.match(/console\.log\(/g) || []).length;
    details.push({ category: 'best-practices', rule: 'no-console', message: consoleLogs > 3 ? `${consoleLogs} console.log() calls — clean up for production` : 'Minimal console logging', impact: 'low', passed: consoleLogs <= 3 });

    // HTTPS
    const httpLinks = (allContent.match(/http:\/\/(?!localhost)/g) || []).length;
    details.push({ category: 'best-practices', rule: 'uses-https', message: httpLinks > 0 ? `${httpLinks} non-HTTPS link(s) found` : 'All links use HTTPS', impact: 'high', passed: httpLinks === 0 });

    // Semantic HTML
    const hasMain = allContent.includes('<main');
    const hasNav = allContent.includes('<nav');
    const hasHeader = allContent.includes('<header');
    const semanticScore = [hasMain, hasNav, hasHeader].filter(Boolean).length;
    details.push({ category: 'best-practices', rule: 'semantic-html', message: semanticScore < 2 ? 'Limited use of semantic HTML elements' : 'Good use of semantic HTML', impact: 'medium', passed: semanticScore >= 2 });

    // === SEO ===
    // Title tag
    const hasTitle = /<title[^>]*>.+<\/title>/.test(htmlContent);
    details.push({ category: 'seo', rule: 'has-title', message: hasTitle ? 'Page has title tag' : 'Missing <title> tag', impact: 'high', passed: hasTitle });

    // Meta description
    const hasMeta = /meta\s+name=["']description["']/.test(htmlContent);
    details.push({ category: 'seo', rule: 'meta-description', message: hasMeta ? 'Has meta description' : 'Missing meta description', impact: 'high', passed: hasMeta });

    // Viewport meta
    const hasViewport = /meta\s+name=["']viewport["']/.test(htmlContent);
    details.push({ category: 'seo', rule: 'viewport', message: hasViewport ? 'Has viewport meta tag' : 'Missing viewport meta tag', impact: 'high', passed: hasViewport });

    // Calculate scores (0-100)
    const calcScore = (cat: AuditDetail['category']) => {
      const catDetails = details.filter(d => d.category === cat);
      if (catDetails.length === 0) return 100;
      const weights = { high: 3, medium: 2, low: 1 };
      const totalWeight = catDetails.reduce((sum, d) => sum + weights[d.impact], 0);
      const passedWeight = catDetails.filter(d => d.passed).reduce((sum, d) => sum + weights[d.impact], 0);
      return Math.round((passedWeight / totalWeight) * 100);
    };

    const score: AuditScore = {
      performance: calcScore('performance'),
      accessibility: calcScore('accessibility'),
      bestPractices: calcScore('best-practices'),
      seo: calcScore('seo'),
      details,
    };

    // Log summary
    const avg = Math.round((score.performance + score.accessibility + score.bestPractices + score.seo) / 4);
    const emoji = avg >= 90 ? '🟢' : avg >= 70 ? '🟡' : '🔴';
    addBuildLogEntry(avg >= 70 ? 'success' : 'warning' as any,
      `${emoji} Audit: Perf ${score.performance} | A11y ${score.accessibility} | Best ${score.bestPractices} | SEO ${score.seo}`
    );

    const failures = details.filter(d => !d.passed && d.impact === 'high');
    if (failures.length > 0) {
      failures.slice(0, 3).forEach(f => addBuildLogEntry('info', `  ⚠ ${f.message}`));
    }

    return score;
  }, [addBuildLogEntry]);

  return { runAudit };
}
