
## Fix: Prevent Light Text on Light Backgrounds

### Problem
The system prompt currently only guards against dark text on dark backgrounds. When the AI generates a light-themed page (white/light background), it can still use light gray or white text — making headings and buttons invisible, as shown in the screenshot.

### Fix (1 file)

**`supabase/functions/ai-app-builder/index.ts`** (line 20) -- Expand the DESIGN contrast rule to be bidirectional:

Update the contrast section from:
```
CONTRAST CRITICAL: Dark theme default means dark backgrounds (#0a0a0a to #1a1a2e range) with WHITE or LIGHT text (#ffffff, #f0f0f0, #e0e0e0). NEVER use dark text on dark backgrounds. Headings must be white or near-white. Body text at minimum #d1d5db. Muted/secondary text at minimum #9ca3af. All text must have 4.5:1+ contrast ratio against its background.
```

To:
```
CONTRAST CRITICAL: All text must have 4.5:1+ contrast ratio against its background. For DARK backgrounds (#0a0a0a to #1a1a2e): use WHITE or LIGHT text (#ffffff, #f0f0f0). Headings white/near-white, body min #d1d5db, muted min #9ca3af. For LIGHT/WHITE backgrounds (#f0f0f0 to #ffffff): use DARK text (#111827, #1f2937). Headings near-black, body max #374151, muted max #6b7280. NEVER use light text on light backgrounds. NEVER use dark text on dark backgrounds. Buttons must have contrasting text against their fill color.
```

This makes the rule bidirectional: dark backgrounds get light text, light backgrounds get dark text, with specific thresholds for both directions.

### Result
- Light-themed generated apps will have dark, readable text
- Dark-themed generated apps continue to have light, readable text
- Button text will contrast against button fill colors
- Covers both theme directions with explicit color ranges
