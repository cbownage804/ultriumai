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
  performanceScore: number;
  imageSizeWarnings: string[];
  domComplexityWarnings: string[];
}

const FILE_THRESHOLD_KB = 50;
const TOTAL_THRESHOLD_KB = 500;
const TOTAL_ERROR_KB = 1024;
const IMAGE_WARN_KB = 200;
const IMAGE_ERROR_KB = 1024;
const DOM_NODE_WARN = 1500;
const DOM_NODE_ERROR = 3000;

/** Estimate DOM node count from HTML content */
function estimateDomNodes(html: string): number {
  const tags = html.match(/<[a-zA-Z][^>]*>/g);
  return tags ? tags.length : 0;
}

/** Check for base64-embedded images and estimate sizes */
function findEmbeddedImages(files: ProjectFile[]): { path: string; sizeKB: number }[] {
  const results: { path: string; sizeKB: number }[] = [];
  const base64Pattern = /data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/g;
  for (const file of files) {
    let match;
    while ((match = base64Pattern.exec(file.content)) !== null) {
      const sizeKB = Math.round((match[1].length * 0.75) / 1024);
      results.push({ path: file.path, sizeKB });
    }
  }
  return results;
}

/** Check for missing SEO essentials */
function checkSEO(files: ProjectFile[]): string[] {
  const warnings: string[] = [];
  const htmlFiles = files.filter(f => f.path.endsWith('.html'));
  for (const f of htmlFiles) {
    if (!/<title[^>]*>/.test(f.content)) warnings.push(`${f.path}: Missing <title> tag`);
    if (!/<meta\s+name=["']description["']/.test(f.content)) warnings.push(`${f.path}: Missing meta description`);
    if (!/<meta\s+property=["']og:/.test(f.content)) warnings.push(`${f.path}: No OpenGraph meta tags`);
    if (!/<meta\s+name=["']viewport["']/.test(f.content)) warnings.push(`${f.path}: Missing viewport meta`);
  }
  // Check for images without alt
  for (const f of files) {
    const imgsWithoutAlt = f.content.match(/<img(?![^>]*\balt\s*=)[^>]*>/gi);
    if (imgsWithoutAlt && imgsWithoutAlt.length > 0) {
      warnings.push(`${f.path}: ${imgsWithoutAlt.length} image(s) missing alt attribute`);
    }
  }
  // Check for missing loading="lazy"
  for (const f of files) {
    const imgsWithoutLazy = f.content.match(/<img(?![^>]*\bloading\s*=)[^>]*>/gi);
    if (imgsWithoutLazy && imgsWithoutLazy.length > 3) {
      warnings.push(`${f.path}: ${imgsWithoutLazy.length} images without loading="lazy"`);
    }
  }
  return warnings;
}

/**
 * Bundle Size Tracking with Performance Scoring.
 * Analyzes file sizes, embedded images, DOM complexity, and SEO.
 * Returns a 0-100 performance score.
 */
export function useBundleSizeTracking(
  addBuildLogEntry: (type: BuildLogEntry['type'], message: string) => void,
) {
  const [report, setReport] = useState<BundleSizeReport | null>(null);

  const analyzeBundle = useCallback((files: ProjectFile[]): BundleSizeReport => {
    // Early exit for large projects to prevent browser freeze
    if (files.length > 200) {
      const skippedReport: BundleSizeReport = {
        totalSizeKB: 0, files: [], largestFiles: [], warnings: [],
        performanceScore: 100, imageSizeWarnings: [], domComplexityWarnings: [],
      };
      addBuildLogEntry('info', '⏭️ Bundle analysis skipped (too many files)');
      setReport(skippedReport);
      return skippedReport;
    }
    const codeFiles = files.filter(f => f.path.match(/\.(tsx?|jsx?|css|html|json)$/));

    const entries: FileSizeEntry[] = codeFiles.map(f => {
      const sizeBytes = new TextEncoder().encode(f.content).length;
      const sizeKB = Math.round((sizeBytes / 1024) * 10) / 10;
      const ext = f.path.split('.').pop() || '';
      return { path: f.path, sizeBytes, sizeKB, isOverThreshold: sizeKB > FILE_THRESHOLD_KB, language: ext };
    });

    const totalSizeKB = Math.round(entries.reduce((sum, e) => sum + e.sizeKB, 0) * 10) / 10;
    const largestFiles = [...entries].sort((a, b) => b.sizeBytes - a.sizeBytes).slice(0, 5);
    const warnings: string[] = [];
    const imageSizeWarnings: string[] = [];
    const domComplexityWarnings: string[] = [];

    // Bundle size warnings
    if (totalSizeKB > TOTAL_ERROR_KB) {
      warnings.push(`Total bundle ~${totalSizeKB}KB exceeds 1MB — consider code splitting`);
    } else if (totalSizeKB > TOTAL_THRESHOLD_KB) {
      warnings.push(`Total bundle ~${totalSizeKB}KB exceeds ${TOTAL_THRESHOLD_KB}KB threshold`);
    }

    const oversized = entries.filter(e => e.isOverThreshold);
    for (const f of oversized) {
      warnings.push(`${f.path} is ${f.sizeKB}KB — consider splitting`);
    }

    // Embedded image checks
    const embeddedImages = findEmbeddedImages(files);
    for (const img of embeddedImages) {
      if (img.sizeKB > IMAGE_ERROR_KB) {
        imageSizeWarnings.push(`${img.path}: embedded image ~${img.sizeKB}KB (over 1MB!) — use external hosting`);
      } else if (img.sizeKB > IMAGE_WARN_KB) {
        imageSizeWarnings.push(`${img.path}: embedded image ~${img.sizeKB}KB — consider compressing`);
      }
    }

    // DOM complexity
    const htmlFiles = files.filter(f => f.path.endsWith('.html'));
    for (const f of htmlFiles) {
      const nodeCount = estimateDomNodes(f.content);
      if (nodeCount > DOM_NODE_ERROR) {
        domComplexityWarnings.push(`${f.path}: ~${nodeCount} DOM nodes (exceeds ${DOM_NODE_ERROR}) — split into components`);
      } else if (nodeCount > DOM_NODE_WARN) {
        domComplexityWarnings.push(`${f.path}: ~${nodeCount} DOM nodes — consider simplifying`);
      }
    }

    // SEO checks
    const seoWarnings = checkSEO(files);

    // ── Performance Score (0-100) ──
    let score = 100;
    // Bundle size deductions
    if (totalSizeKB > TOTAL_ERROR_KB) score -= 25;
    else if (totalSizeKB > TOTAL_THRESHOLD_KB) score -= 10;
    // Large file deductions
    score -= Math.min(15, oversized.length * 5);
    // Image deductions
    score -= Math.min(20, embeddedImages.filter(i => i.sizeKB > IMAGE_WARN_KB).length * 10);
    // DOM deductions
    score -= Math.min(10, domComplexityWarnings.length * 5);
    // SEO deductions
    score -= Math.min(10, seoWarnings.length * 2);
    // Missing lazy loading
    const lazyWarnings = seoWarnings.filter(w => w.includes('loading="lazy"'));
    score -= Math.min(5, lazyWarnings.length * 2);

    const performanceScore = Math.max(0, Math.min(100, score));

    const allWarnings = [...warnings, ...imageSizeWarnings, ...domComplexityWarnings, ...seoWarnings];
    const bundleReport: BundleSizeReport = {
      totalSizeKB, files: entries, largestFiles,
      warnings: allWarnings, performanceScore,
      imageSizeWarnings, domComplexityWarnings,
    };
    setReport(bundleReport);

    // Log to build log
    const scoreEmoji = performanceScore >= 90 ? '🟢' : performanceScore >= 70 ? '🟡' : '🔴';
    addBuildLogEntry(
      performanceScore >= 70 ? 'success' : 'warning' as any,
      `${scoreEmoji} Performance: ${performanceScore}/100 | Bundle: ${totalSizeKB}KB (${entries.length} files)`
    );
    if (oversized.length > 0) {
      oversized.slice(0, 3).forEach(f =>
        addBuildLogEntry('info', `  📄 ${f.path}: ${f.sizeKB}KB`)
      );
    }
    if (imageSizeWarnings.length > 0) {
      imageSizeWarnings.slice(0, 2).forEach(w =>
        addBuildLogEntry('info', `  🖼️ ${w}`)
      );
    }
    if (seoWarnings.length > 0) {
      addBuildLogEntry('info', `  🔍 SEO: ${seoWarnings.length} issue(s) found`);
    }

    return bundleReport;
  }, [addBuildLogEntry]);

  return { analyzeBundle, report };
}
