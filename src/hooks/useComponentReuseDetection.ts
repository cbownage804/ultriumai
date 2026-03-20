import { useCallback } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

/**
 * Wave 18: Component Reuse Detection
 * Scans existing project files to detect available components, hooks, and utilities.
 * Injects this inventory into the generation prompt so the AI reuses existing code
 * instead of creating duplicates.
 */

interface DetectedComponent {
  name: string;
  path: string;
  type: 'component' | 'hook' | 'utility' | 'context' | 'ui';
  props?: string[];
  description?: string;
}

interface DetectedDesignTokens {
  colors: { name: string; value: string }[];
  fonts: string[];
  borderRadius: string[];
  shadows: string[];
  spacing: string[];
}

/** Extract all reusable components from project files */
function detectComponents(files: ProjectFile[]): DetectedComponent[] {
  const components: DetectedComponent[] = [];

  for (const file of files) {
    if (!/\.(tsx?|jsx?)$/.test(file.path)) continue;
    if (file.path.includes('.test.') || file.path.includes('.spec.')) continue;

    const isUI = file.path.includes('/components/ui/');
    const isHook = file.path.includes('/hooks/') || /^use[A-Z]/.test(file.path.split('/').pop() || '');
    const isContext = file.content.includes('createContext');
    const isUtil = file.path.includes('/utils/') || file.path.includes('/lib/');

    // Find exported components/functions
    const exportRegex = /export\s+(?:default\s+)?(?:function|const|class)\s+(\w+)/g;
    let match;
    while ((match = exportRegex.exec(file.content)) !== null) {
      const name = match[1];
      if (name.length < 2) continue;

      // Extract props interface if component
      let props: string[] | undefined;
      const propsMatch = file.content.match(new RegExp(`interface\\s+${name}Props\\s*\\{([^}]+)\\}`));
      if (propsMatch) {
        props = propsMatch[1]
          .split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('//'))
          .map(l => l.replace(/;$/, '').trim())
          .filter(l => l.length > 0)
          .slice(0, 8);
      }

      const type: DetectedComponent['type'] = isUI ? 'ui'
        : isHook ? 'hook'
        : isContext ? 'context'
        : isUtil ? 'utility'
        : 'component';

      // Generate brief description from first JSDoc comment or first line
      let description: string | undefined;
      const jsdocMatch = file.content.match(/\/\*\*\s*\n?\s*\*?\s*(.+?)(?:\n|\*\/)/);
      if (jsdocMatch) description = jsdocMatch[1].trim().slice(0, 80);

      components.push({ name, path: file.path, type, props, description });
    }
  }

  return components;
}

/** Extract design tokens from CSS and Tailwind config */
function extractDesignTokens(files: ProjectFile[]): DetectedDesignTokens {
  const tokens: DetectedDesignTokens = {
    colors: [],
    fonts: [],
    borderRadius: [],
    shadows: [],
    spacing: [],
  };

  // Parse CSS custom properties from index.css
  const cssFile = files.find(f => f.path.endsWith('index.css') || f.path.endsWith('globals.css'));
  if (cssFile) {
    const varRegex = /--([a-z][\w-]*)\s*:\s*([^;]+)/g;
    let match;
    while ((match = varRegex.exec(cssFile.content)) !== null) {
      const [, name, value] = match;
      const v = value.trim();
      if (/color|foreground|background|primary|secondary|accent|muted|destructive|border|ring|card|popover/.test(name)) {
        tokens.colors.push({ name: `--${name}`, value: v });
      } else if (/radius/.test(name)) {
        tokens.borderRadius.push(`--${name}: ${v}`);
      } else if (/shadow/.test(name)) {
        tokens.shadows.push(`--${name}: ${v}`);
      } else if (/font/.test(name)) {
        tokens.fonts.push(v);
      }
    }

    // Extract @import font declarations
    const fontImports = cssFile.content.match(/@import\s+url\(['"]([^'"]+)['"]\)/g);
    if (fontImports) {
      for (const imp of fontImports) {
        const familyMatch = imp.match(/family=([^:&'"]+)/);
        if (familyMatch) tokens.fonts.push(decodeURIComponent(familyMatch[1].replace(/\+/g, ' ')));
      }
    }
  }

  // Parse Tailwind config for extended colors
  const twConfig = files.find(f => f.path.includes('tailwind.config'));
  if (twConfig) {
    const colorBlockMatch = twConfig.content.match(/colors\s*:\s*\{([\s\S]*?)\}/);
    if (colorBlockMatch) {
      const colorDefs = colorBlockMatch[1].match(/'?(\w[\w-]*)'?\s*:\s*['"]([^'"]+)['"]/g);
      if (colorDefs) {
        for (const def of colorDefs.slice(0, 20)) {
          const parts = def.match(/'?(\w[\w-]*)'?\s*:\s*['"]([^'"]+)['"]/);
          if (parts) tokens.colors.push({ name: parts[1], value: parts[2] });
        }
      }
    }
  }

  return tokens;
}

/** Build a prompt directive listing available components for reuse */
function buildReuseDirective(components: DetectedComponent[], tokens: DetectedDesignTokens): string {
  if (components.length === 0 && tokens.colors.length === 0) return '';

  const parts: string[] = ['[EXISTING COMPONENTS — REUSE THESE instead of creating new ones]'];

  // Group by type
  const uiComponents = components.filter(c => c.type === 'ui');
  const appComponents = components.filter(c => c.type === 'component');
  const hooks = components.filter(c => c.type === 'hook');
  const contexts = components.filter(c => c.type === 'context');

  if (uiComponents.length > 0) {
    parts.push(`\nUI Library (shadcn/ui):`);
    for (const c of uiComponents.slice(0, 25)) {
      parts.push(`  • ${c.name} — import from "${c.path.replace(/\.tsx?$/, '')}"`);
    }
  }

  if (appComponents.length > 0) {
    parts.push(`\nApp Components:`);
    for (const c of appComponents.slice(0, 15)) {
      const propsStr = c.props?.length ? ` (props: ${c.props.join(', ')})` : '';
      parts.push(`  • ${c.name}${propsStr} — ${c.path}`);
    }
  }

  if (hooks.length > 0) {
    parts.push(`\nCustom Hooks:`);
    for (const c of hooks.slice(0, 10)) {
      const desc = c.description ? ` — ${c.description}` : '';
      parts.push(`  • ${c.name}${desc}`);
    }
  }

  if (contexts.length > 0) {
    parts.push(`\nContext Providers:`);
    for (const c of contexts.slice(0, 5)) {
      parts.push(`  • ${c.name} — ${c.path}`);
    }
  }

  // Design tokens
  if (tokens.colors.length > 0) {
    parts.push(`\n[DESIGN TOKENS — USE THESE for consistent styling]`);
    parts.push(`Colors: ${tokens.colors.slice(0, 15).map(c => `${c.name}: ${c.value}`).join(', ')}`);
    if (tokens.fonts.length > 0) parts.push(`Fonts: ${tokens.fonts.join(', ')}`);
    if (tokens.borderRadius.length > 0) parts.push(`Border Radius: ${tokens.borderRadius.join(', ')}`);
    parts.push(`\nALWAYS use these CSS variables (e.g., bg-primary, text-foreground) — NEVER hardcode hex/rgb values.`);
  }

  parts.push(`[/EXISTING COMPONENTS]`);
  return parts.join('\n');
}

export function useComponentReuseDetection() {
  const buildReuseContext = useCallback((files: ProjectFile[]): string => {
    if (files.length === 0) return '';
    const components = detectComponents(files);
    const tokens = extractDesignTokens(files);
    return buildReuseDirective(components, tokens);
  }, []);

  return { buildReuseContext };
}
