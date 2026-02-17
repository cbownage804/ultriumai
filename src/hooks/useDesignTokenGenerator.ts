import { useCallback, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────

export interface BrandConfig {
  name: string;
  primaryColor?: string;      // hex or HSL
  secondaryColor?: string;
  accentColor?: string;
  mood?: 'professional' | 'playful' | 'minimal' | 'bold' | 'elegant' | 'tech' | 'organic';
  industry?: string;
  fontPreference?: 'serif' | 'sans-serif' | 'monospace' | 'display';
}

export interface ColorToken {
  name: string;
  hsl: string;           // "210 40% 50%"
  hex: string;
  usage: string;         // semantic description
}

export interface TypographyToken {
  name: string;
  fontFamily: string;
  weight: number;
  size: string;          // rem
  lineHeight: string;
  letterSpacing: string;
}

export interface SpacingToken {
  name: string;
  value: string;         // rem
}

export interface DesignTokens {
  brand: BrandConfig;
  colors: {
    primary: ColorToken;
    primaryForeground: ColorToken;
    secondary: ColorToken;
    secondaryForeground: ColorToken;
    accent: ColorToken;
    accentForeground: ColorToken;
    background: ColorToken;
    foreground: ColorToken;
    muted: ColorToken;
    mutedForeground: ColorToken;
    card: ColorToken;
    cardForeground: ColorToken;
    border: ColorToken;
    destructive: ColorToken;
    destructiveForeground: ColorToken;
  };
  typography: {
    heading: TypographyToken;
    subheading: TypographyToken;
    body: TypographyToken;
    caption: TypographyToken;
    code: TypographyToken;
  };
  spacing: SpacingToken[];
  borderRadius: string;
  shadow: {
    sm: string;
    md: string;
    lg: string;
  };
  generatedAt: number;
}

// ─── Color Utilities ─────────────────────────────────────────

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

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

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hslString(h: number, s: number, l: number): string {
  return `${h} ${s}% ${l}%`;
}

function makeColorToken(name: string, h: number, s: number, l: number, usage: string): ColorToken {
  return {
    name,
    hsl: hslString(h, s, l),
    hex: hslToHex(h, s, l),
    usage,
  };
}

// ─── Mood Presets ────────────────────────────────────────────

interface MoodPreset {
  saturationMod: number;
  lightnessMod: number;
  borderRadius: string;
  fontPreference: string;
  shadowIntensity: number;
  contrastBoost: number;
}

const MOOD_PRESETS: Record<string, MoodPreset> = {
  professional: { saturationMod: -10, lightnessMod: 0, borderRadius: '0.5rem', fontPreference: 'sans-serif', shadowIntensity: 0.1, contrastBoost: 0 },
  playful:      { saturationMod: 15, lightnessMod: 5, borderRadius: '1rem', fontPreference: 'sans-serif', shadowIntensity: 0.15, contrastBoost: 0 },
  minimal:      { saturationMod: -20, lightnessMod: 0, borderRadius: '0.375rem', fontPreference: 'sans-serif', shadowIntensity: 0.05, contrastBoost: 0 },
  bold:         { saturationMod: 20, lightnessMod: -5, borderRadius: '0.75rem', fontPreference: 'display', shadowIntensity: 0.2, contrastBoost: 5 },
  elegant:      { saturationMod: -5, lightnessMod: 3, borderRadius: '0.25rem', fontPreference: 'serif', shadowIntensity: 0.08, contrastBoost: 0 },
  tech:         { saturationMod: 5, lightnessMod: -3, borderRadius: '0.5rem', fontPreference: 'monospace', shadowIntensity: 0.12, contrastBoost: 3 },
  organic:      { saturationMod: -8, lightnessMod: 5, borderRadius: '1.5rem', fontPreference: 'serif', shadowIntensity: 0.1, contrastBoost: 0 },
};

// ─── Font Stacks ─────────────────────────────────────────────

const FONT_STACKS: Record<string, { heading: string; body: string }> = {
  'sans-serif': { heading: "'Inter', 'SF Pro Display', system-ui, sans-serif", body: "'Inter', 'SF Pro Text', system-ui, sans-serif" },
  serif:        { heading: "'Playfair Display', 'Georgia', serif", body: "'Lora', 'Georgia', serif" },
  monospace:    { heading: "'JetBrains Mono', 'Fira Code', monospace", body: "'IBM Plex Mono', 'Fira Code', monospace" },
  display:      { heading: "'Space Grotesk', 'Outfit', system-ui, sans-serif", body: "'DM Sans', 'Inter', system-ui, sans-serif" },
};

// ─── Main Hook ───────────────────────────────────────────────

export function useDesignTokenGenerator() {
  const [tokens, setTokens] = useState<DesignTokens | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Generate a full design token set from a brand configuration.
   * This is a deterministic, zero-AI-cost operation — no API calls.
   */
  const generateTokens = useCallback((brand: BrandConfig): DesignTokens => {
    setIsGenerating(true);

    const mood = MOOD_PRESETS[brand.mood || 'professional'];
    const primaryHSL = brand.primaryColor
      ? hexToHSL(brand.primaryColor)
      : { h: 220, s: 70, l: 50 };

    const secondaryHSL = brand.secondaryColor
      ? hexToHSL(brand.secondaryColor)
      : { h: (primaryHSL.h + 30) % 360, s: Math.max(20, primaryHSL.s - 20), l: primaryHSL.l + 10 };

    const accentHSL = brand.accentColor
      ? hexToHSL(brand.accentColor)
      : { h: (primaryHSL.h + 180) % 360, s: Math.min(100, primaryHSL.s + 10), l: 55 };

    // Apply mood modifiers
    const ps = Math.max(0, Math.min(100, primaryHSL.s + mood.saturationMod));
    const pl = Math.max(10, Math.min(90, primaryHSL.l + mood.lightnessMod));
    const ss = Math.max(0, Math.min(100, secondaryHSL.s + mood.saturationMod));
    const sl = Math.max(10, Math.min(90, secondaryHSL.l + mood.lightnessMod));
    const as = Math.max(0, Math.min(100, accentHSL.s + mood.saturationMod));
    const al = Math.max(10, Math.min(90, accentHSL.l + mood.lightnessMod));

    // Foreground colors: ensure WCAG contrast
    const primaryFgL = pl > 55 ? 10 + mood.contrastBoost : 98 - mood.contrastBoost;
    const secondaryFgL = sl > 55 ? 15 : 95;
    const accentFgL = al > 55 ? 10 : 98;

    // Font selection
    const fontPref = brand.fontPreference || mood.fontPreference as any || 'sans-serif';
    const fonts = FONT_STACKS[fontPref] || FONT_STACKS['sans-serif'];

    const result: DesignTokens = {
      brand,
      colors: {
        primary:              makeColorToken('primary', primaryHSL.h, ps, pl, 'Main brand color for buttons, links, active states'),
        primaryForeground:    makeColorToken('primary-foreground', primaryHSL.h, 5, primaryFgL, 'Text on primary-colored backgrounds'),
        secondary:            makeColorToken('secondary', secondaryHSL.h, ss, sl, 'Supporting color for secondary actions'),
        secondaryForeground:  makeColorToken('secondary-foreground', secondaryHSL.h, 5, secondaryFgL, 'Text on secondary-colored backgrounds'),
        accent:               makeColorToken('accent', accentHSL.h, as, al, 'Highlight color for badges, notifications, CTAs'),
        accentForeground:     makeColorToken('accent-foreground', accentHSL.h, 5, accentFgL, 'Text on accent-colored backgrounds'),
        background:           makeColorToken('background', primaryHSL.h, 5, 99, 'Page background'),
        foreground:           makeColorToken('foreground', primaryHSL.h, 5, 10, 'Default text color'),
        muted:                makeColorToken('muted', primaryHSL.h, 10, 95, 'Subdued backgrounds for less emphasis'),
        mutedForeground:      makeColorToken('muted-foreground', primaryHSL.h, 5, 45, 'Text on muted backgrounds'),
        card:                 makeColorToken('card', primaryHSL.h, 5, 100, 'Card/panel backgrounds'),
        cardForeground:       makeColorToken('card-foreground', primaryHSL.h, 5, 10, 'Text inside cards'),
        border:               makeColorToken('border', primaryHSL.h, 10, 90, 'Borders and dividers'),
        destructive:          makeColorToken('destructive', 0, 72, 51, 'Error and destructive action color'),
        destructiveForeground: makeColorToken('destructive-foreground', 0, 0, 98, 'Text on destructive backgrounds'),
      },
      typography: {
        heading: {
          name: 'heading',
          fontFamily: fonts.heading,
          weight: 700,
          size: '2rem',
          lineHeight: '1.2',
          letterSpacing: '-0.02em',
        },
        subheading: {
          name: 'subheading',
          fontFamily: fonts.heading,
          weight: 600,
          size: '1.25rem',
          lineHeight: '1.4',
          letterSpacing: '-0.01em',
        },
        body: {
          name: 'body',
          fontFamily: fonts.body,
          weight: 400,
          size: '1rem',
          lineHeight: '1.6',
          letterSpacing: '0',
        },
        caption: {
          name: 'caption',
          fontFamily: fonts.body,
          weight: 400,
          size: '0.875rem',
          lineHeight: '1.5',
          letterSpacing: '0.01em',
        },
        code: {
          name: 'code',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          weight: 400,
          size: '0.875rem',
          lineHeight: '1.6',
          letterSpacing: '0',
        },
      },
      spacing: [
        { name: 'xs', value: '0.25rem' },
        { name: 'sm', value: '0.5rem' },
        { name: 'md', value: '1rem' },
        { name: 'lg', value: '1.5rem' },
        { name: 'xl', value: '2rem' },
        { name: '2xl', value: '3rem' },
        { name: '3xl', value: '4rem' },
      ],
      borderRadius: mood.borderRadius,
      shadow: {
        sm: `0 1px 2px 0 rgba(0,0,0,${mood.shadowIntensity})`,
        md: `0 4px 6px -1px rgba(0,0,0,${mood.shadowIntensity}), 0 2px 4px -2px rgba(0,0,0,${mood.shadowIntensity * 0.6})`,
        lg: `0 10px 15px -3px rgba(0,0,0,${mood.shadowIntensity}), 0 4px 6px -4px rgba(0,0,0,${mood.shadowIntensity * 0.6})`,
      },
      generatedAt: Date.now(),
    };

    setTokens(result);
    setIsGenerating(false);
    return result;
  }, []);

  /**
   * Export tokens as CSS custom properties for injection into generated apps.
   */
  const exportAsCSS = useCallback((t: DesignTokens): string => {
    const c = t.colors;
    const ty = t.typography;
    return `:root {
  /* Colors — Brand: ${t.brand.name} */
  --background: ${c.background.hsl};
  --foreground: ${c.foreground.hsl};
  --primary: ${c.primary.hsl};
  --primary-foreground: ${c.primaryForeground.hsl};
  --secondary: ${c.secondary.hsl};
  --secondary-foreground: ${c.secondaryForeground.hsl};
  --accent: ${c.accent.hsl};
  --accent-foreground: ${c.accentForeground.hsl};
  --muted: ${c.muted.hsl};
  --muted-foreground: ${c.mutedForeground.hsl};
  --card: ${c.card.hsl};
  --card-foreground: ${c.cardForeground.hsl};
  --border: ${c.border.hsl};
  --destructive: ${c.destructive.hsl};
  --destructive-foreground: ${c.destructiveForeground.hsl};
  --ring: ${c.primary.hsl};
  --input: ${c.border.hsl};

  /* Typography */
  --font-heading: ${ty.heading.fontFamily};
  --font-body: ${ty.body.fontFamily};
  --font-code: ${ty.code.fontFamily};

  /* Spacing & Shape */
  --radius: ${t.borderRadius};

  /* Shadows */
  --shadow-sm: ${t.shadow.sm};
  --shadow-md: ${t.shadow.md};
  --shadow-lg: ${t.shadow.lg};
}`;
  }, []);

  /**
   * Export tokens as a dark mode variant.
   */
  const exportDarkCSS = useCallback((t: DesignTokens): string => {
    const c = t.colors;
    // Invert lightness values for dark mode
    const invertL = (hsl: string): string => {
      const parts = hsl.split(' ');
      const h = parts[0];
      const s = parseInt(parts[1]);
      const l = parseInt(parts[2]);
      const newL = Math.max(5, Math.min(95, 100 - l));
      return `${h} ${s}% ${newL}%`;
    };

    return `.dark {
  --background: ${invertL(c.background.hsl)};
  --foreground: ${invertL(c.foreground.hsl)};
  --primary: ${c.primary.hsl};
  --primary-foreground: ${c.primaryForeground.hsl};
  --secondary: ${invertL(c.secondary.hsl)};
  --secondary-foreground: ${invertL(c.secondaryForeground.hsl)};
  --accent: ${c.accent.hsl};
  --accent-foreground: ${c.accentForeground.hsl};
  --muted: ${invertL(c.muted.hsl)};
  --muted-foreground: ${invertL(c.mutedForeground.hsl)};
  --card: ${invertL(c.card.hsl)};
  --card-foreground: ${invertL(c.cardForeground.hsl)};
  --border: ${invertL(c.border.hsl)};
  --destructive: 0 62% 55%;
  --destructive-foreground: 0 0% 98%;
  --ring: ${c.primary.hsl};
  --input: ${invertL(c.border.hsl)};
}`;
  }, []);

  /**
   * Generate a Tailwind config extension snippet.
   */
  const exportTailwindConfig = useCallback((t: DesignTokens): string => {
    return `// Design tokens for: ${t.brand.name}
// Generated at: ${new Date(t.generatedAt).toISOString()}
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        heading: [${t.typography.heading.fontFamily.split(',').map(f => `'${f.trim()}'`).join(', ')}],
        body: [${t.typography.body.fontFamily.split(',').map(f => `'${f.trim()}'`).join(', ')}],
      },
      borderRadius: {
        DEFAULT: '${t.borderRadius}',
      },
      boxShadow: {
        sm: '${t.shadow.sm}',
        md: '${t.shadow.md}',
        lg: '${t.shadow.lg}',
      },
    },
  },
};`;
  }, []);

  return {
    tokens,
    isGenerating,
    generateTokens,
    exportAsCSS,
    exportDarkCSS,
    exportTailwindConfig,
  };
}
