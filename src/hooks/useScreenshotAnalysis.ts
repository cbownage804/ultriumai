import { useState, useCallback } from 'react';

/**
 * Wave 16: Screenshot-to-Code Analysis
 * Analyzes uploaded UI screenshots to extract layout structure,
 * component hierarchy, colors, and spacing for AI prompt injection.
 */

export interface UIAnalysis {
  layout: LayoutInfo;
  colorPalette: string[];
  componentHints: string[];
  promptDirective: string;
}

interface LayoutInfo {
  type: 'single-column' | 'two-column' | 'three-column' | 'grid' | 'dashboard' | 'hero-section' | 'card-layout' | 'unknown';
  hasHeader: boolean;
  hasFooter: boolean;
  hasSidebar: boolean;
  hasHero: boolean;
  hasCards: boolean;
  hasForm: boolean;
  hasList: boolean;
  hasNavbar: boolean;
  dominantColors: string[];
  estimatedSections: number;
}

/**
 * Detect if an uploaded image is a UI screenshot vs a logo/photo.
 * Uses canvas-based heuristics: straight edges, uniform color blocks, text-like patterns.
 */
function isUIScreenshot(imageData: ImageData): boolean {
  const { data, width, height } = imageData;

  // Heuristic 1: Aspect ratio — UI screenshots tend to be wider than tall
  const aspectRatio = width / height;
  const isScreenRatio = aspectRatio > 1.2 || (aspectRatio > 0.5 && aspectRatio < 2.0);

  // Heuristic 2: Edge density — UIs have many straight horizontal/vertical edges
  let horizontalEdges = 0;
  let verticalEdges = 0;
  const step = 4; // Sample every 4th pixel for performance

  for (let y = 1; y < height - 1; y += step) {
    for (let x = 1; x < width - 1; x += step) {
      const idx = (y * width + x) * 4;
      const idxRight = (y * width + x + 1) * 4;
      const idxDown = ((y + 1) * width + x) * 4;

      const dr = Math.abs(data[idx] - data[idxRight]) + Math.abs(data[idx + 1] - data[idxRight + 1]) + Math.abs(data[idx + 2] - data[idxRight + 2]);
      const dd = Math.abs(data[idx] - data[idxDown]) + Math.abs(data[idx + 1] - data[idxDown + 1]) + Math.abs(data[idx + 2] - data[idxDown + 2]);

      if (dr > 80) verticalEdges++;
      if (dd > 80) horizontalEdges++;
    }
  }

  const totalSampled = (width / step) * (height / step);
  const edgeDensity = (horizontalEdges + verticalEdges) / totalSampled;

  // Heuristic 3: Color uniformity — UIs have large blocks of same color
  const colorBlocks = new Map<string, number>();
  for (let i = 0; i < data.length; i += step * 4) {
    const r = Math.round(data[i] / 32) * 32;
    const g = Math.round(data[i + 1] / 32) * 32;
    const b = Math.round(data[i + 2] / 32) * 32;
    const key = `${r},${g},${b}`;
    colorBlocks.set(key, (colorBlocks.get(key) || 0) + 1);
  }

  // UIs tend to have a few dominant colors covering most of the image
  const sorted = [...colorBlocks.values()].sort((a, b) => b - a);
  const topColorsCoverage = sorted.slice(0, 5).reduce((s, v) => s + v, 0) / (data.length / (step * 4));

  // Score-based detection
  let score = 0;
  if (isScreenRatio) score += 2;
  if (edgeDensity > 0.05) score += 2;
  if (topColorsCoverage > 0.6) score += 2;
  if (sorted.length < 100) score += 1; // Few distinct colors = likely UI

  return score >= 4;
}

/**
 * Extract dominant colors from image data.
 */
function extractDominantColors(imageData: ImageData, count = 6): string[] {
  const { data } = imageData;
  const colorMap = new Map<string, number>();

  for (let i = 0; i < data.length; i += 16) {
    const r = Math.round(data[i] / 32) * 32;
    const g = Math.round(data[i + 1] / 32) * 32;
    const b = Math.round(data[i + 2] / 32) * 32;
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
  }

  return [...colorMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([hex]) => hex);
}

/**
 * Analyze layout structure from image data using zone sampling.
 */
function analyzeLayout(imageData: ImageData): LayoutInfo {
  const { data, width, height } = imageData;
  const colors = extractDominantColors(imageData);

  // Sample zones: top (header), left (sidebar), center, right, bottom (footer)
  const sampleZone = (x1: number, y1: number, x2: number, y2: number): { avgBrightness: number; uniformity: number } => {
    let totalBrightness = 0;
    let samples = 0;
    const zonColors = new Map<string, number>();

    for (let y = y1; y < y2; y += 3) {
      for (let x = x1; x < x2; x += 3) {
        const idx = (y * width + x) * 4;
        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        totalBrightness += brightness;
        samples++;
        const key = `${Math.round(data[idx] / 64)},${Math.round(data[idx + 1] / 64)},${Math.round(data[idx + 2] / 64)}`;
        zonColors.set(key, (zonColors.get(key) || 0) + 1);
      }
    }

    const topColor = Math.max(...zonColors.values());
    return {
      avgBrightness: totalBrightness / Math.max(samples, 1),
      uniformity: topColor / Math.max(samples, 1),
    };
  };

  const headerH = Math.round(height * 0.1);
  const footerY = Math.round(height * 0.9);
  const sideW = Math.round(width * 0.2);

  const headerZone = sampleZone(0, 0, width, headerH);
  const footerZone = sampleZone(0, footerY, width, height);
  const leftZone = sampleZone(0, headerH, sideW, footerY);
  const centerZone = sampleZone(sideW, headerH, width - sideW, footerY);

  const hasHeader = headerZone.uniformity > 0.5;
  const hasFooter = footerZone.uniformity > 0.5;
  const hasSidebar = leftZone.uniformity > 0.6 && Math.abs(leftZone.avgBrightness - centerZone.avgBrightness) > 30;

  // Estimate layout type
  let type: LayoutInfo['type'] = 'single-column';
  if (hasSidebar) type = 'dashboard';
  else if (headerZone.avgBrightness < 80) type = 'hero-section'; // Dark header = likely hero

  // Count horizontal color transitions in the middle section to detect columns/cards
  let transitions = 0;
  const midY = Math.round(height * 0.5);
  for (let x = 1; x < width; x += 2) {
    const idx1 = (midY * width + x - 1) * 4;
    const idx2 = (midY * width + x) * 4;
    const diff = Math.abs(data[idx1] - data[idx2]) + Math.abs(data[idx1 + 1] - data[idx2 + 1]) + Math.abs(data[idx1 + 2] - data[idx2 + 2]);
    if (diff > 100) transitions++;
  }

  if (transitions > 4 && transitions < 15) type = 'card-layout';
  if (transitions >= 15) type = 'grid';

  return {
    type,
    hasHeader,
    hasFooter,
    hasSidebar,
    hasHero: type === 'hero-section',
    hasCards: type === 'card-layout' || type === 'grid',
    hasForm: false, // Hard to detect from pixels
    hasList: false,
    hasNavbar: hasHeader,
    dominantColors: colors,
    estimatedSections: Math.max(2, Math.round(transitions / 3)),
  };
}

export function useScreenshotAnalysis() {
  const [analysis, setAnalysis] = useState<UIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  /**
   * Analyze an image URL to determine if it's a UI screenshot and extract layout info.
   */
  const analyzeScreenshot = useCallback((imageUrl: string): Promise<UIAnalysis | null> => {
    setIsAnalyzing(true);

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 200; // Downsample for performance
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        if (!isUIScreenshot(imageData)) {
          setIsAnalyzing(false);
          resolve(null);
          return;
        }

        const layout = analyzeLayout(imageData);
        const colorPalette = extractDominantColors(imageData, 6);

        const componentHints: string[] = [];
        if (layout.hasNavbar) componentHints.push('Navigation bar / header');
        if (layout.hasHero) componentHints.push('Hero section with dark background');
        if (layout.hasSidebar) componentHints.push('Sidebar navigation');
        if (layout.hasCards) componentHints.push('Card grid / card layout');
        if (layout.hasFooter) componentHints.push('Footer section');
        if (layout.type === 'dashboard') componentHints.push('Dashboard layout with sidebar');
        if (layout.type === 'two-column') componentHints.push('Two-column layout');

        const promptDirective = buildVisualDirective(layout, colorPalette, componentHints);
        const result: UIAnalysis = { layout, colorPalette, componentHints, promptDirective };
        setAnalysis(result);
        setIsAnalyzing(false);
        resolve(result);
      };

      img.onerror = () => {
        setIsAnalyzing(false);
        resolve(null);
      };

      img.src = imageUrl;
    });
  }, []);

  const clearAnalysis = useCallback(() => setAnalysis(null), []);

  return { analysis, isAnalyzing, analyzeScreenshot, clearAnalysis };
}

/**
 * Build a visual analysis directive for AI prompt injection.
 */
function buildVisualDirective(layout: LayoutInfo, colors: string[], components: string[]): string {
  return `
[VISUAL ANALYSIS — Screenshot Reference]
Layout type: ${layout.type}
Detected structure:
${layout.hasNavbar ? '  ✓ Navigation bar / header' : '  ✗ No header detected'}
${layout.hasSidebar ? '  ✓ Sidebar (left)' : '  ✗ No sidebar'}
${layout.hasHero ? '  ✓ Hero section' : '  ✗ No hero'}
${layout.hasCards ? '  ✓ Card-based content area' : '  ✗ No cards'}
${layout.hasFooter ? '  ✓ Footer' : '  ✗ No footer'}
Estimated sections: ${layout.estimatedSections}
Dominant colors: ${colors.join(', ')}
Component hints: ${components.join(', ') || 'None detected'}

IMPORTANT: Match this visual layout as closely as possible. Use the detected colors as the primary palette. Replicate the structural hierarchy: ${layout.type} with ${layout.estimatedSections} content sections.`;
}
