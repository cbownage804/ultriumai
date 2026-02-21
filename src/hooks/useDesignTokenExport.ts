/**
 * Design Token Export — Parses Tailwind classes from project files
 * and generates a JSON design token file.
 */
import { useCallback } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

interface DesignTokens {
  colors: Record<string, string>;
  spacing: string[];
  typography: { fonts: string[]; sizes: string[] };
  borderRadius: string[];
}

export function useDesignTokenExport() {
  const extractTokens = useCallback((files: ProjectFile[]): DesignTokens => {
    const colors = new Map<string, string>();
    const spacing = new Set<string>();
    const fonts = new Set<string>();
    const sizes = new Set<string>();
    const radii = new Set<string>();

    const allContent = files.map(f => f.content).join('\n');

    // Extract Tailwind color classes
    for (const match of allContent.matchAll(/(?:bg|text|border|ring|shadow)-([a-z]+-\d{2,3}(?:\/[\d.]+)?)/g)) {
      colors.set(match[1], match[1]);
    }

    // Extract CSS custom properties
    for (const match of allContent.matchAll(/--([a-z-]+):\s*([^;]+)/g)) {
      colors.set(`--${match[1]}`, match[2].trim());
    }

    // Extract spacing classes
    for (const match of allContent.matchAll(/(?:p|m|gap|space)-(?:x-|y-)?(\d+(?:\.\d+)?)/g)) {
      spacing.add(match[1]);
    }

    // Extract font families
    for (const match of allContent.matchAll(/font-(?:family:\s*['"]?([^;'"]+)|(\w+))/g)) {
      const font = match[1] || match[2];
      if (font && !['bold', 'medium', 'light', 'normal', 'semibold', 'mono', 'sans', 'serif'].includes(font)) {
        fonts.add(font);
      }
    }

    // Extract text sizes
    for (const match of allContent.matchAll(/text-(\[[\d.]+(?:px|rem)\]|xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)/g)) {
      sizes.add(match[1]);
    }

    // Extract border radii
    for (const match of allContent.matchAll(/rounded-?(none|sm|md|lg|xl|2xl|3xl|full|\[[\d.]+(?:px|rem)\])?/g)) {
      radii.add(match[1] || 'default');
    }

    return {
      colors: Object.fromEntries(colors),
      spacing: [...spacing].sort((a, b) => parseFloat(a) - parseFloat(b)),
      typography: { fonts: [...fonts], sizes: [...sizes] },
      borderRadius: [...radii],
    };
  }, []);

  const exportAsJSON = useCallback((files: ProjectFile[]): string => {
    const tokens = extractTokens(files);
    return JSON.stringify(tokens, null, 2);
  }, [extractTokens]);

  const downloadTokens = useCallback((files: ProjectFile[]) => {
    const json = exportAsJSON(files);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'design-tokens.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [exportAsJSON]);

  return { extractTokens, exportAsJSON, downloadTokens };
}
