import { useCallback, useState } from 'react';
import type { DesignTokens, ColorToken } from './useDesignTokenGenerator';

// ─── Types ───────────────────────────────────────────────────

export interface ThemeVariant {
  id: string;
  name: string;
  description: string;
  css: string;
  selector: string;      // e.g. ':root', '.dark', '.theme-ocean'
  preview: {
    bg: string;           // hex for swatch preview
    fg: string;
    primary: string;
    accent: string;
  };
}

export interface ThemeCollection {
  baseTokens: DesignTokens;
  variants: ThemeVariant[];
  activeVariantId: string;
  generatedAt: number;
}

// ─── Utilities ───────────────────────────────────────────────

function hslToHex(hslStr: string): string {
  const parts = hslStr.split(/[\s%]+/).filter(Boolean);
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;

  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function shiftHue(hsl: string, degrees: number): string {
  const parts = hsl.split(' ');
  const h = (parseFloat(parts[0]) + degrees + 360) % 360;
  return `${Math.round(h)} ${parts[1]} ${parts[2]}`;
}

function adjustLightness(hsl: string, delta: number): string {
  const parts = hsl.split(/[\s%]+/).filter(Boolean);
  const h = parts[0];
  const s = parseFloat(parts[1]);
  const l = Math.max(0, Math.min(100, parseFloat(parts[2]) + delta));
  return `${h} ${s}% ${Math.round(l)}%`;
}

function adjustSaturation(hsl: string, delta: number): string {
  const parts = hsl.split(/[\s%]+/).filter(Boolean);
  const h = parts[0];
  const s = Math.max(0, Math.min(100, parseFloat(parts[1]) + delta));
  const l = parts[2];
  return `${h} ${Math.round(s)}% ${l}%`;
}

function buildCSSBlock(selector: string, vars: Record<string, string>): string {
  const entries = Object.entries(vars).map(([k, v]) => `  --${k}: ${v};`).join('\n');
  return `${selector} {\n${entries}\n}`;
}

function colorVarsFromTokens(colors: DesignTokens['colors']): Record<string, string> {
  return {
    'background': colors.background.hsl,
    'foreground': colors.foreground.hsl,
    'primary': colors.primary.hsl,
    'primary-foreground': colors.primaryForeground.hsl,
    'secondary': colors.secondary.hsl,
    'secondary-foreground': colors.secondaryForeground.hsl,
    'accent': colors.accent.hsl,
    'accent-foreground': colors.accentForeground.hsl,
    'muted': colors.muted.hsl,
    'muted-foreground': colors.mutedForeground.hsl,
    'card': colors.card.hsl,
    'card-foreground': colors.cardForeground.hsl,
    'border': colors.border.hsl,
    'destructive': colors.destructive.hsl,
    'destructive-foreground': colors.destructiveForeground.hsl,
    'ring': colors.primary.hsl,
    'input': colors.border.hsl,
  };
}

// ─── Main Hook ───────────────────────────────────────────────

export function useThemeVariants() {
  const [collection, setCollection] = useState<ThemeCollection | null>(null);

  /**
   * Generate a complete set of theme variants from base design tokens.
   * Creates: Light (base), Dark, High Contrast, plus 3 hue-shifted alternatives.
   */
  const generateVariants = useCallback((tokens: DesignTokens): ThemeCollection => {
    const c = tokens.colors;
    const variants: ThemeVariant[] = [];

    // 1. Light (base)
    const lightVars = colorVarsFromTokens(c);
    variants.push({
      id: 'light',
      name: 'Light',
      description: 'Default light theme derived from brand colors',
      css: buildCSSBlock(':root', lightVars),
      selector: ':root',
      preview: {
        bg: hslToHex(c.background.hsl),
        fg: hslToHex(c.foreground.hsl),
        primary: hslToHex(c.primary.hsl),
        accent: hslToHex(c.accent.hsl),
      },
    });

    // 2. Dark
    const darkVars: Record<string, string> = {};
    for (const [key, val] of Object.entries(lightVars)) {
      if (key.includes('foreground')) {
        darkVars[key] = adjustLightness(val, 70);
      } else if (key === 'background') {
        darkVars[key] = adjustLightness(val, -88);
      } else if (key === 'card') {
        darkVars[key] = adjustLightness(val, -85);
      } else if (key === 'muted') {
        darkVars[key] = adjustLightness(val, -78);
      } else if (key === 'border' || key === 'input') {
        darkVars[key] = adjustLightness(val, -70);
      } else if (key === 'primary' || key === 'accent' || key === 'destructive') {
        darkVars[key] = val; // keep brand colors
      } else {
        darkVars[key] = adjustLightness(val, -60);
      }
    }
    // Fix: ensure primary/accent foregrounds contrast on dark
    darkVars['primary-foreground'] = c.primaryForeground.hsl;
    darkVars['accent-foreground'] = c.accentForeground.hsl;
    darkVars['destructive-foreground'] = '0 0% 98%';
    darkVars['ring'] = c.primary.hsl;

    variants.push({
      id: 'dark',
      name: 'Dark',
      description: 'Inverted dark theme with preserved brand colors',
      css: buildCSSBlock('.dark', darkVars),
      selector: '.dark',
      preview: {
        bg: hslToHex(darkVars['background']),
        fg: hslToHex(darkVars['foreground']),
        primary: hslToHex(darkVars['primary']),
        accent: hslToHex(darkVars['accent']),
      },
    });

    // 3. High Contrast
    const hcVars = { ...lightVars };
    hcVars['background'] = '0 0% 100%';
    hcVars['foreground'] = '0 0% 0%';
    hcVars['primary'] = adjustSaturation(c.primary.hsl, 15);
    hcVars['muted'] = '0 0% 95%';
    hcVars['muted-foreground'] = '0 0% 25%';
    hcVars['border'] = '0 0% 70%';
    hcVars['card'] = '0 0% 100%';
    hcVars['card-foreground'] = '0 0% 0%';

    variants.push({
      id: 'high-contrast',
      name: 'High Contrast',
      description: 'Maximum readability with boosted contrast ratios',
      css: buildCSSBlock('.theme-high-contrast', hcVars),
      selector: '.theme-high-contrast',
      preview: {
        bg: '#ffffff',
        fg: '#000000',
        primary: hslToHex(hcVars['primary']),
        accent: hslToHex(hcVars['accent']),
      },
    });

    // 4–6. Hue-shifted brand alternatives
    const hueShifts = [
      { id: 'warm', name: 'Warm Shift', degrees: 30, description: 'Warmer tones shifted +30° on the color wheel' },
      { id: 'cool', name: 'Cool Shift', degrees: -30, description: 'Cooler tones shifted -30° on the color wheel' },
      { id: 'complement', name: 'Complementary', degrees: 180, description: 'Complementary palette with inverted hues' },
    ];

    for (const shift of hueShifts) {
      const shiftedVars = { ...lightVars };
      for (const [key, val] of Object.entries(lightVars)) {
        if (['primary', 'secondary', 'accent', 'ring'].includes(key)) {
          shiftedVars[key] = shiftHue(val, shift.degrees);
        }
      }

      variants.push({
        id: shift.id,
        name: shift.name,
        description: shift.description,
        css: buildCSSBlock(`.theme-${shift.id}`, shiftedVars),
        selector: `.theme-${shift.id}`,
        preview: {
          bg: hslToHex(shiftedVars['background']),
          fg: hslToHex(shiftedVars['foreground']),
          primary: hslToHex(shiftedVars['primary']),
          accent: hslToHex(shiftedVars['accent']),
        },
      });
    }

    const result: ThemeCollection = {
      baseTokens: tokens,
      variants,
      activeVariantId: 'light',
      generatedAt: Date.now(),
    };

    setCollection(result);
    return result;
  }, []);

  /**
   * Export all variants as a single CSS file.
   */
  const exportAllCSS = useCallback((col: ThemeCollection): string => {
    const header = `/* Design System: ${col.baseTokens.brand.name}\n * Generated: ${new Date(col.generatedAt).toISOString()}\n * Variants: ${col.variants.length}\n */\n\n`;
    return header + col.variants.map(v => `/* ${v.name}: ${v.description} */\n${v.css}`).join('\n\n');
  }, []);

  /**
   * Set the active variant.
   */
  const setActiveVariant = useCallback((variantId: string) => {
    setCollection(prev => prev ? { ...prev, activeVariantId: variantId } : null);
  }, []);

  return {
    collection,
    generateVariants,
    exportAllCSS,
    setActiveVariant,
  };
}
