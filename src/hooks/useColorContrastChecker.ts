import { useState, useCallback, useMemo } from 'react';

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) {
    const s = hex.replace('#', '').match(/^([0-9a-f])([0-9a-f])([0-9a-f])$/i);
    if (!s) return null;
    return [parseInt(s[1]+s[1],16), parseInt(s[2]+s[2],16), parseInt(s[3]+s[3],16)];
  }
  return [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r,g,b].map(c => Math.max(0,Math.min(255,Math.round(c))).toString(16).padStart(2,'0')).join('');
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface ContrastResult {
  ratio: number;
  aa: boolean;      // >= 4.5
  aaLarge: boolean;  // >= 3
  aaa: boolean;      // >= 7
  aaaLarge: boolean;  // >= 4.5
}

export interface SuggestedFix {
  fg: string;
  bg: string;
  ratio: number;
}

export function useColorContrastChecker() {
  const [fg, setFg] = useState('#ffffff');
  const [bg, setBg] = useState('#1a1a2e');

  const result = useMemo((): ContrastResult | null => {
    const fgRgb = hexToRgb(fg);
    const bgRgb = hexToRgb(bg);
    if (!fgRgb || !bgRgb) return null;
    const l1 = relativeLuminance(...fgRgb);
    const l2 = relativeLuminance(...bgRgb);
    const ratio = contrastRatio(l1, l2);
    return {
      ratio: Math.round(ratio * 100) / 100,
      aa: ratio >= 4.5,
      aaLarge: ratio >= 3,
      aaa: ratio >= 7,
      aaaLarge: ratio >= 4.5,
    };
  }, [fg, bg]);

  const suggestions = useMemo((): SuggestedFix[] => {
    if (!result || result.aa) return [];
    const bgRgb = hexToRgb(bg);
    if (!bgRgb) return [];
    const bgLum = relativeLuminance(...bgRgb);
    const fixes: SuggestedFix[] = [];

    // Try lightening/darkening foreground
    for (let step = 10; step <= 255; step += 10) {
      // Lighter fg
      const lightFg: [number, number, number] = [Math.min(255, step + 200), Math.min(255, step + 200), Math.min(255, step + 200)];
      const lightLum = relativeLuminance(...lightFg);
      const lightRatio = contrastRatio(lightLum, bgLum);
      if (lightRatio >= 4.5) {
        fixes.push({ fg: rgbToHex(...lightFg), bg, ratio: Math.round(lightRatio * 100) / 100 });
        break;
      }
    }
    for (let step = 0; step <= 100; step += 10) {
      const darkFg: [number, number, number] = [step, step, step];
      const darkLum = relativeLuminance(...darkFg);
      const darkRatio = contrastRatio(darkLum, bgLum);
      if (darkRatio >= 4.5) {
        fixes.push({ fg: rgbToHex(...darkFg), bg, ratio: Math.round(darkRatio * 100) / 100 });
        break;
      }
    }
    return fixes;
  }, [result, bg]);

  const swap = useCallback(() => {
    setFg(bg);
    setBg(fg);
  }, [fg, bg]);

  const generateCode = useCallback((): string => {
    if (!result) return '// Invalid colors';
    return `/* Color Contrast Analysis
 * Foreground: ${fg}
 * Background: ${bg}
 * Contrast Ratio: ${result.ratio}:1
 * WCAG AA (normal text): ${result.aa ? 'PASS ✓' : 'FAIL ✗'}
 * WCAG AA (large text):  ${result.aaLarge ? 'PASS ✓' : 'FAIL ✗'}
 * WCAG AAA (normal text): ${result.aaa ? 'PASS ✓' : 'FAIL ✗'}
 * WCAG AAA (large text):  ${result.aaaLarge ? 'PASS ✓' : 'FAIL ✗'}
 */

:root {
  --text-color: ${fg};
  --bg-color: ${bg};
}
`;
  }, [fg, bg, result]);

  return { fg, setFg, bg, setBg, result, suggestions, swap, generateCode };
}
