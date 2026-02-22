
## Fix: Ensure Generated Apps Have Readable Text Colors

### Problem
When the AI generates a landing page (e.g., "Landing Page: Hero, features, testimonials, footer"), the heading text ends up the same color as the dark background, making it invisible. The system prompt mentions "4.5:1+ contrast" but doesn't explicitly tell the AI to use light text on dark backgrounds.

### Root Cause
The `BASE_SYSTEM_PROMPT` in `supabase/functions/ai-app-builder/index.ts` (line 20) says "Dark theme default" and mentions contrast ratios, but doesn't give explicit guidance like "use white/light text on dark backgrounds." The AI model interprets "dark theme" as dark backgrounds but sometimes defaults to dark text colors too.

### Fix (1 file)

**`supabase/functions/ai-app-builder/index.ts`** -- Strengthen the DESIGN section of the system prompt to explicitly mandate light text on dark backgrounds:

Update line 20 from:
```
DESIGN: Bold typography (Google Fonts @import, display+body pair). 5-7 color palette via CSS custom properties, 4.5:1+ contrast. Micro-interactions on all interactive elements. Layered shadows, backdrop-filter. Spacing: 4/8/12/16/24/32/48/64/96px. Dark theme default.
```

To:
```
DESIGN: Bold typography (Google Fonts @import, display+body pair). 5-7 color palette via CSS custom properties. CONTRAST CRITICAL: Dark theme default means dark backgrounds (#0a0a0a to #1a1a2e range) with WHITE or LIGHT text (#ffffff, #f0f0f0, #e0e0e0). NEVER use dark text on dark backgrounds. Headings must be white or near-white. Body text at minimum #d1d5db. Muted/secondary text at minimum #9ca3af. All text must have 4.5:1+ contrast ratio against its background. Micro-interactions on all interactive elements. Layered shadows, backdrop-filter. Spacing: 4/8/12/16/24/32/48/64/96px.
```

This makes the contrast requirement unambiguous: dark backgrounds get light text, with specific minimum brightness values for headings, body, and secondary text.

### Technical Details

| File | Change |
|------|--------|
| `supabase/functions/ai-app-builder/index.ts` (line 20) | Expand DESIGN section with explicit dark-on-light text color guidance |

After editing, the edge function will be redeployed.

### Result
- All newly generated apps will have clearly readable text
- Headings will be white/near-white on dark backgrounds
- Body and secondary text will have minimum brightness thresholds
- Existing projects are unaffected (only new generations use the updated prompt)
