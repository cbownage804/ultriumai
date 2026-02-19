import { useState, useCallback } from 'react';

export interface ExtractedColor {
  hex: string;
  name: string;
  hsl: string;
  usage: 'primary' | 'secondary' | 'accent' | 'background' | 'text';
}

export interface ColorPalette {
  colors: ExtractedColor[];
  tailwindConfig: string;
  cssVariables: string;
}

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function getColorName(hex: string): string {
  const { h, s, l } = hexToHSL(hex);
  if (s < 10) return l > 70 ? 'Light Gray' : l > 30 ? 'Gray' : 'Dark Gray';
  if (h < 15 || h > 345) return 'Red';
  if (h < 45) return 'Orange';
  if (h < 70) return 'Yellow';
  if (h < 160) return 'Green';
  if (h < 200) return 'Cyan';
  if (h < 260) return 'Blue';
  if (h < 300) return 'Purple';
  return 'Pink';
}

export function useColorPaletteExtractor() {
  const [palette, setPalette] = useState<ColorPalette | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const extractFromImage = useCallback((imageUrl: string) => {
    setIsExtracting(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 50;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, size, size);
      const imageData = ctx.getImageData(0, 0, size, size);
      const colorMap: Record<string, number> = {};

      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = Math.round(imageData.data[i] / 32) * 32;
        const g = Math.round(imageData.data[i + 1] / 32) * 32;
        const b = Math.round(imageData.data[i + 2] / 32) * 32;
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        colorMap[hex] = (colorMap[hex] || 0) + 1;
      }

      const sorted = Object.entries(colorMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
      const usages: ExtractedColor['usage'][] = ['primary', 'secondary', 'accent', 'background', 'text', 'accent'];
      const colors: ExtractedColor[] = sorted.map(([hex], i) => {
        const hsl = hexToHSL(hex);
        return {
          hex,
          name: getColorName(hex),
          hsl: `${hsl.h} ${hsl.s}% ${hsl.l}%`,
          usage: usages[i] || 'accent',
        };
      });

      const tailwindConfig = `// Extracted palette\ncolors: {\n${colors.map(c => `  '${c.usage}': '${c.hex}',`).join('\n')}\n}`;
      const cssVariables = `:root {\n${colors.map(c => `  --color-${c.usage}: ${c.hsl};`).join('\n')}\n}`;

      setPalette({ colors, tailwindConfig, cssVariables });
      setIsExtracting(false);
    };
    img.onerror = () => setIsExtracting(false);
    img.src = imageUrl;
  }, []);

  const extractFromHex = useCallback((hexColors: string[]) => {
    const usages: ExtractedColor['usage'][] = ['primary', 'secondary', 'accent', 'background', 'text'];
    const colors: ExtractedColor[] = hexColors.slice(0, 6).map((hex, i) => {
      const hsl = hexToHSL(hex);
      return { hex, name: getColorName(hex), hsl: `${hsl.h} ${hsl.s}% ${hsl.l}%`, usage: usages[i] || 'accent' };
    });
    const tailwindConfig = `colors: {\n${colors.map(c => `  '${c.usage}': '${c.hex}',`).join('\n')}\n}`;
    const cssVariables = `:root {\n${colors.map(c => `  --color-${c.usage}: ${c.hsl};`).join('\n')}\n}`;
    setPalette({ colors, tailwindConfig, cssVariables });
  }, []);

  const clearPalette = useCallback(() => setPalette(null), []);

  return { palette, isExtracting, extractFromImage, extractFromHex, clearPalette };
}
