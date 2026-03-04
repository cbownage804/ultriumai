

## Plan: Safe Output Contract + Pre-Validation Sanitizer

**Scope**: `useAIAppBuilder.ts`, `AIAppBuilderWorkspace.tsx`, `useOutputValidation.ts`. No App.tsx/main.tsx/routing.

---

### Edit 1 — `src/hooks/useAIAppBuilder.ts`: Inject Safe Output Contract into system prompt

At ~line 1003, after `systemParts` consolidation but before `apiMessages.push`, append a new system part:

```typescript
// ── Safe Output Contract ──
systemParts.push(`[SAFE OUTPUT CONTRACT — MANDATORY]
- NEVER generate inline <svg> markup in JSX/TSX files. Use lucide-react icons instead: import { IconName } from 'lucide-react';
- If the user asks for icons, use lucide-react by default.
- NEVER output extremely long single-line JSX. Format JSX with line breaks.
- Always wrap JSX returns in parentheses: return ( <div>...</div> );
- Ensure all JSX tags are properly closed and self-closing where required (<img />, <br />, <input />).
- Do not introduce new npm dependencies unless the user explicitly asks for them.
- All imports must precede variable declarations — no import statements after code.`);
```

Insert this at line 1002, right before the `if (systemParts.length > 0)` block at line 1004.

---

### Edit 2 — `src/components/ai-builder/useOutputValidation.ts`: Add `sanitizeStagedFiles` export

Add a new exported function at the bottom of the file (before final `}`-less module end):

```typescript
/**
 * Deterministic pre-validation sanitizer for staged builder files.
 * Strips inline SVG and normalizes obvious JSX breakage BEFORE validation runs.
 * Only operates on .tsx/.jsx files. Does not modify index.html or routing.
 */
export function sanitizeStagedFiles(files: ProjectFile[]): { files: ProjectFile[]; fixes: string[] } {
  const fixes: string[] = [];
  
  // Common SVG icon name → lucide-react mapping
  const SVG_TO_LUCIDE: Record<string, string> = {
    check: 'Check', checkmark: 'Check', tick: 'Check',
    arrow: 'ArrowRight', 'arrow-right': 'ArrowRight', 'arrow-left': 'ArrowLeft',
    'arrow-up': 'ArrowUp', 'arrow-down': 'ArrowDown',
    star: 'Star', stars: 'Star',
    shield: 'Shield', 'shield-check': 'ShieldCheck',
    zap: 'Zap', lightning: 'Zap', bolt: 'Zap',
    layers: 'Layers', stack: 'Layers',
    close: 'X', x: 'X', times: 'X',
    menu: 'Menu', hamburger: 'Menu',
    search: 'Search', magnify: 'Search',
    home: 'Home', house: 'Home',
    settings: 'Settings', gear: 'Settings', cog: 'Settings',
    user: 'User', person: 'User', profile: 'User',
    heart: 'Heart', like: 'Heart',
    mail: 'Mail', email: 'Mail', envelope: 'Mail',
    phone: 'Phone', call: 'Phone',
    plus: 'Plus', add: 'Plus',
    minus: 'Minus',
    edit: 'Edit', pencil: 'Pencil',
    trash: 'Trash2', delete: 'Trash2',
    eye: 'Eye', view: 'Eye',
    'eye-off': 'EyeOff', hide: 'EyeOff',
    lock: 'Lock', unlock: 'Unlock',
    calendar: 'Calendar', date: 'Calendar',
    clock: 'Clock', time: 'Clock',
    download: 'Download', upload: 'Upload',
    link: 'Link', chain: 'Link',
    globe: 'Globe', world: 'Globe', earth: 'Globe',
    sun: 'Sun', moon: 'Moon',
    bell: 'Bell', notification: 'Bell',
    info: 'Info', warning: 'AlertTriangle', alert: 'AlertTriangle',
    error: 'AlertCircle', danger: 'AlertCircle',
  };

  const sanitized = files.map(f => {
    const ext = f.path.split('.').pop()?.toLowerCase() || '';
    if (!['tsx', 'jsx'].includes(ext)) return f;
    
    let content = f.content;
    let changed = false;
    
    // 1. Replace inline <svg>...</svg> blocks
    const svgRegex = /<svg[\s\S]*?<\/svg>/gi;
    const svgMatches = content.match(svgRegex);
    if (svgMatches) {
      const neededIcons = new Set<string>();
      
      for (const svgBlock of svgMatches) {
        // Try to identify what icon this SVG represents
        let iconName: string | null = null;
        
        // Check className, aria-label, or nearby context for icon hints
        const hintMatch = svgBlock.match(/(?:className|aria-label|name|title)=["']([^"']*?)["']/i);
        const hint = hintMatch?.[1]?.toLowerCase().replace(/[^a-z-]/g, '') || '';
        
        // Also check for common SVG path patterns
        const hasCheckPath = /d=["'][^"']*[Ll]\s*[\d.-]+\s+[\d.-]+/.test(svgBlock) && svgBlock.length < 500;
        
        if (hint && SVG_TO_LUCIDE[hint]) {
          iconName = SVG_TO_LUCIDE[hint];
        } else {
          // Try matching by SVG content keywords
          const svgLower = svgBlock.toLowerCase();
          for (const [keyword, lucideName] of Object.entries(SVG_TO_LUCIDE)) {
            if (svgLower.includes(keyword)) {
              iconName = lucideName;
              break;
            }
          }
        }
        
        if (iconName) {
          neededIcons.add(iconName);
          content = content.replace(svgBlock, `<${iconName} />`);
          fixes.push(`${f.path}: replaced inline SVG with <${iconName} />`);
        } else {
          // No mapping found — replace with placeholder
          content = content.replace(svgBlock, '<span aria-hidden="true" />');
          fixes.push(`${f.path}: replaced unmapped inline SVG with placeholder`);
        }
        changed = true;
      }
      
      // Add lucide-react import if needed
      if (neededIcons.size > 0) {
        const iconList = Array.from(neededIcons).join(', ');
        const existingImport = content.match(/import\s*{([^}]*)}\s*from\s*['"]lucide-react['"]/);
        if (existingImport) {
          // Merge into existing import
          const existing = existingImport[1].split(',').map(s => s.trim()).filter(Boolean);
          const merged = Array.from(new Set([...existing, ...neededIcons]));
          content = content.replace(existingImport[0], `import { ${merged.join(', ')} } from 'lucide-react'`);
        } else {
          // Add new import at top (after any existing imports)
          const lastImportIdx = content.lastIndexOf('\nimport ');
          if (lastImportIdx >= 0) {
            const insertAt = content.indexOf('\n', lastImportIdx + 1);
            content = content.slice(0, insertAt) + `\nimport { ${iconList} } from 'lucide-react';` + content.slice(insertAt);
          } else {
            content = `import { ${iconList} } from 'lucide-react';\n` + content;
          }
        }
      }
    }
    
    // 2. Remove orphaned <path>, <circle>, <rect>, <line>, <polyline>, <polygon> tags outside SVG
    // These are usually leftover fragments that break JSX parsing
    if (!content.match(/<svg/i)) {
      const orphanSvgTags = /<(?:path|circle|rect|line|polyline|polygon|ellipse|g)\s[^>]*\/?>/gi;
      if (orphanSvgTags.test(content)) {
        content = content.replace(orphanSvgTags, '');
        fixes.push(`${f.path}: removed orphaned SVG child tags`);
        changed = true;
      }
    }
    
    // 3. Normalize "return <JSX>" to "return (<JSX>)" when missing parens
    // Match: return <Tag  (no opening paren before <)
    content = content.replace(/(\breturn)\s+(<[A-Z][a-zA-Z]*[\s/>])/g, (match, ret, jsx) => {
      // Only fix if there's no opening paren already
      fixes.push(`${f.path}: wrapped JSX return in parentheses`);
      changed = true;
      return `${ret} (\n    ${jsx}`;
    });
    
    if (!changed) return f;
    return { ...f, content };
  });
  
  return { files: sanitized, fixes };
}
```

---

### Edit 3 — `src/components/ai-builder/AIAppBuilderWorkspace.tsx`: Wire sanitizer before validation

**A.** Import `sanitizeStagedFiles` from `useOutputValidation`:

At line 70, change the import to:
```typescript
import { useOutputValidation, sanitizeStagedFiles } from './useOutputValidation';
```

**B.** In `handleBgComplete` — call sanitizer BEFORE validation, in both the normal staging path (line 495) and the repair completion path (line 452):

Normal staging path (~line 495, before `outputValidationRef.current.validate(mergedFiles)`):
```typescript
// ── Pre-validation sanitizer: deterministic SVG/JSX fixes ──
const { files: sanitizedFiles, fixes: sanitizerFixes } = sanitizeStagedFiles(mergedFiles);
if (sanitizerFixes.length > 0) {
  console.info('[handleBgComplete] Sanitizer applied', sanitizerFixes.length, 'fixes:', sanitizerFixes.slice(0, 5));
  mergedFiles = sanitizedFiles;
  pendingFilesRef.current = mergedFiles;
}

const validationResult = outputValidationRef.current.validate(mergedFiles);
```

Repair completion path (~line 452, before `outputValidationRef.current.validate(mergedFiles)`):
```typescript
// ── Pre-validation sanitizer for repair output ──
const { files: sanitizedRepairFiles, fixes: repairSanitizerFixes } = sanitizeStagedFiles(mergedFiles);
if (repairSanitizerFixes.length > 0) {
  console.info('[handleBgComplete] Repair sanitizer applied', repairSanitizerFixes.length, 'fixes');
  mergedFiles = sanitizedRepairFiles;
}
pendingFilesRef.current = mergedFiles;

const revalidation = outputValidationRef.current.validate(mergedFiles);
```

**C.** Update Repair Attempt #2 prompt (line 2058-2059) — replace the STRICTER RULES block:

```typescript
const stricterPrompt = attempt === 2
  ? '\n\nSTRICTER REPAIR RULES (attempt 2/2 — FINAL):\n- Remove ALL inline <svg>...</svg> markup and replace with lucide-react icon components (import { IconName } from "lucide-react")\n- Do NOT refactor or change code unrelated to the validation errors\n- Only modify the files listed in the error list above\n- Output must compile: no dangling JSX expressions, no unterminated strings, no malformed imports\n- Wrap all JSX returns in parentheses: return ( <div>...</div> )\n- Ensure all tags are self-closing where appropriate (<img />, <br />, <input />)'
  : '';
```

**D.** In the repair-exhausted terminal block (line 2038-2051), add observability logging:

After `console.warn('[Workspace] Repair exhausted...')` at line 2050, add:
```typescript
console.error('[Workspace] RepairFailed diagnostics', {
  stagedFileCount: pendingFilesRef.current?.length ?? 0,
  topErrors: errorSummary.split('\n').slice(0, 3),
});
```

---

### Edit 4 — No changes to `CompilationBridge.tsx`

Existing observability logs are sufficient.

---

### Summary

| Layer | What it does |
|---|---|
| Safe Output Contract (system prompt) | Prevents AI from generating inline SVG in the first place |
| Pre-validation sanitizer | Deterministically strips SVG + fixes JSX before validation runs |
| Stricter repair #2 prompt | More surgical repair instructions — only fix listed files |
| Observability | Log sanitizer fixes + repair failure diagnostics |

