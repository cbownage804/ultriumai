import type { ProjectFile } from '@/hooks/useProjectFileSystem';

/**
 * Tailwind Class Validator — catches invalid/non-existent Tailwind classes
 * before compilation. Prevents silent UI bugs where classes are written but
 * have no CSS behind them.
 */

// Core Tailwind utilities that are always valid (prefix-based)
const VALID_PREFIXES = new Set([
  // Layout
  'flex', 'grid', 'block', 'inline', 'hidden', 'table', 'contents',
  // Spacing
  'p', 'px', 'py', 'pt', 'pb', 'pl', 'pr', 'ps', 'pe',
  'm', 'mx', 'my', 'mt', 'mb', 'ml', 'mr', 'ms', 'me',
  'space', 'gap',
  // Sizing
  'w', 'h', 'min-w', 'min-h', 'max-w', 'max-h', 'size',
  // Typography
  'text', 'font', 'leading', 'tracking', 'line-clamp',
  'truncate', 'uppercase', 'lowercase', 'capitalize', 'normal-case',
  'italic', 'not-italic', 'underline', 'overline', 'line-through', 'no-underline',
  'antialiased', 'subpixel-antialiased',
  // Background
  'bg', 'from', 'via', 'to', 'gradient',
  // Border
  'border', 'rounded', 'ring', 'outline', 'divide',
  // Effects
  'shadow', 'opacity', 'mix-blend', 'bg-blend',
  // Filters
  'blur', 'brightness', 'contrast', 'grayscale', 'hue-rotate',
  'invert', 'saturate', 'sepia', 'backdrop',
  // Transitions
  'transition', 'duration', 'ease', 'delay', 'animate',
  // Transforms
  'scale', 'rotate', 'translate', 'skew', 'origin', 'transform',
  // Interactivity
  'cursor', 'select', 'resize', 'scroll', 'snap', 'touch', 'will-change',
  'pointer-events', 'appearance',
  // Position
  'static', 'fixed', 'absolute', 'relative', 'sticky',
  'top', 'right', 'bottom', 'left', 'inset', 'start', 'end',
  'z', 'float', 'clear', 'isolate', 'isolation',
  // Overflow
  'overflow', 'overscroll',
  // Flexbox/Grid specific
  'justify', 'items', 'self', 'content', 'place',
  'col', 'row', 'auto-cols', 'auto-rows',
  'order', 'grow', 'shrink', 'basis', 'flex-1',
  // Display
  'object', 'aspect', 'container', 'columns', 'break',
  // Accessibility
  'sr-only', 'not-sr-only',
  // Misc
  'list', 'decoration', 'accent', 'caret', 'fill', 'stroke',
  'whitespace', 'break-words', 'break-all', 'hyphens',
]);

// Valid responsive/state prefixes
const VALID_MODIFIERS = new Set([
  'sm', 'md', 'lg', 'xl', '2xl',
  'hover', 'focus', 'active', 'visited', 'disabled', 'checked',
  'first', 'last', 'odd', 'even', 'empty',
  'group-hover', 'group-focus', 'peer-hover', 'peer-focus',
  'focus-within', 'focus-visible', 'placeholder',
  'before', 'after', 'file', 'marker', 'selection',
  'dark', 'print', 'portrait', 'landscape',
  'motion-safe', 'motion-reduce', 'contrast-more', 'contrast-less',
  'aria-checked', 'aria-disabled', 'aria-expanded', 'aria-hidden',
  'aria-pressed', 'aria-readonly', 'aria-required', 'aria-selected',
  'data',
]);

// Known semantic color tokens from shadcn/design system
const SEMANTIC_COLORS = new Set([
  'background', 'foreground', 'card', 'card-foreground',
  'popover', 'popover-foreground', 'primary', 'primary-foreground',
  'secondary', 'secondary-foreground', 'muted', 'muted-foreground',
  'accent', 'accent-foreground', 'destructive', 'destructive-foreground',
  'border', 'input', 'ring', 'sidebar',
  'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground',
  'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring',
  // Standard tailwind colors
  'white', 'black', 'transparent', 'current', 'inherit',
  'slate', 'gray', 'zinc', 'neutral', 'stone',
  'red', 'orange', 'amber', 'yellow', 'lime', 'green',
  'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo',
  'violet', 'purple', 'fuchsia', 'pink', 'rose',
]);

export interface TailwindIssue {
  file: string;
  line: number;
  className: string;
  message: string;
  severity: 'warning' | 'error';
  suggestion?: string;
}

/**
 * Validate a single Tailwind class name.
 * Returns null if valid, or an issue description if invalid.
 */
function validateClass(cls: string): { message: string; suggestion?: string } | null {
  // Skip arbitrary values [...]
  if (cls.includes('[')) return null;
  // Skip negative values
  const baseCls = cls.startsWith('-') ? cls.slice(1) : cls;
  // Skip empty
  if (!baseCls) return null;

  // Strip modifiers (hover:, sm:, dark:, etc.)
  const parts = baseCls.split(':');
  const utility = parts.pop()!;
  const modifiers = parts;

  // Validate modifiers
  for (const mod of modifiers) {
    // Allow group-* and peer-* variants
    if (mod.startsWith('group-') || mod.startsWith('peer-')) continue;
    // Allow aria-* and data-* variants
    if (mod.startsWith('aria-') || mod.startsWith('data-')) continue;
    if (!VALID_MODIFIERS.has(mod)) {
      return { message: `Unknown modifier "${mod}:"`, suggestion: `Check spelling of the "${mod}" variant` };
    }
  }

  // Check if the utility starts with a known prefix
  const prefix = utility.split('-')[0];
  
  // Direct match (e.g., "hidden", "flex", "block", "static", etc.)
  if (VALID_PREFIXES.has(utility)) return null;
  
  // Prefix match (e.g., "text-lg", "p-4", "bg-primary")
  if (VALID_PREFIXES.has(prefix)) {
    // Check color utilities for valid color names
    const colorPrefixes = ['text', 'bg', 'border', 'ring', 'outline', 'divide', 'from', 'via', 'to', 'accent', 'caret', 'fill', 'stroke', 'shadow', 'decoration'];
    if (colorPrefixes.includes(prefix)) {
      const colorPart = utility.slice(prefix.length + 1);
      if (colorPart) {
        const colorName = colorPart.split('-')[0].split('/')[0];
        // Validate color name
        if (colorName && !SEMANTIC_COLORS.has(colorName) && !/^\d+$/.test(colorName)) {
          // Not a known color and not a numeric value
          return {
            message: `Unknown color "${colorName}" in "${utility}"`,
            suggestion: `Use a semantic token (primary, secondary, muted, accent, destructive) or a standard Tailwind color`,
          };
        }
      }
    }
    return null;
  }

  // Multi-word prefixes
  const twoWord = utility.split('-').slice(0, 2).join('-');
  if (VALID_PREFIXES.has(twoWord)) return null;

  // Common compound classes
  const compounds = ['flex-1', 'flex-auto', 'flex-initial', 'flex-none', 'flex-row', 'flex-col', 'flex-wrap', 'flex-nowrap',
    'grid-cols', 'grid-rows', 'grid-flow', 'col-span', 'row-span',
    'not-sr-only', 'sr-only', 'will-change', 'pointer-events',
    'break-words', 'break-all', 'break-normal',
    'overflow-x', 'overflow-y', 'overscroll-x', 'overscroll-y',
    'border-t', 'border-b', 'border-l', 'border-r', 'border-x', 'border-y',
    'rounded-t', 'rounded-b', 'rounded-l', 'rounded-r', 'rounded-tl', 'rounded-tr', 'rounded-bl', 'rounded-br',
    'bg-gradient', 'bg-clip', 'bg-origin',
    'ring-offset', 'scroll-m', 'scroll-p',
    'line-clamp', 'max-w', 'max-h', 'min-w', 'min-h',
    'normal-case', 'no-underline',
    'whitespace-nowrap', 'whitespace-pre', 'whitespace-normal',
    'transition-all', 'transition-colors', 'transition-opacity', 'transition-shadow', 'transition-transform',
    'ease-in', 'ease-out', 'ease-linear',
    'animate-spin', 'animate-pulse', 'animate-ping', 'animate-bounce',
    'object-contain', 'object-cover', 'object-fill', 'object-none', 'object-scale-down',
    'object-center', 'object-top', 'object-bottom', 'object-left', 'object-right',
    'aspect-auto', 'aspect-square', 'aspect-video',
  ];
  if (compounds.some(c => utility.startsWith(c))) return null;

  // Allow prose classes (typography plugin)
  if (utility.startsWith('prose')) return null;

  // If nothing matched, it's likely invalid
  return { message: `Unknown Tailwind class "${utility}"` };
}

/**
 * Extract class names from a file's className attributes and validate them.
 */
export function validateTailwindClasses(files: ProjectFile[]): TailwindIssue[] {
  const issues: TailwindIssue[] = [];

  for (const file of files) {
    if (!/\.(tsx|jsx)$/.test(file.path)) continue;

    const lines = file.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Match className="..." or className='...' or className={`...`} or cn("...")
      const patterns = [
        /className=["']([^"']+)["']/g,
        /className=\{`([^`]+)`\}/g,
        /\bcn\(\s*["']([^"']+)["']/g,
        /\bclsx\(\s*["']([^"']+)["']/g,
        /\bcva\(\s*["']([^"']+)["']/g,
      ];

      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const classString = match[1];
          const classes = classString.split(/\s+/).filter(Boolean);

          for (const cls of classes) {
            // Skip template literal expressions
            if (cls.includes('${') || cls === '$') continue;
            // Skip conditional classes
            if (cls.includes('?') || cls.includes(':') && !cls.includes(':')) continue;

            const issue = validateClass(cls);
            if (issue) {
              issues.push({
                file: file.path,
                line: i + 1,
                className: cls,
                message: issue.message,
                severity: 'warning',
                suggestion: issue.suggestion,
              });
            }
          }
        }
      }
    }
  }

  return issues;
}
