

# Fix: Make "Browse URL + Use Image as Logo" Work Flawlessly

## Problem

When you tell the App Builder something like *"browse to glennsbodyshop.net and copy the data and make it better, use the attached image as the logo"*, it fails because:

1. **The AI cannot browse the internet.** The system detects the URL and tells the AI "clone glennsbodyshop.net" -- but the AI model has zero internet access. It just guesses what the site looks like and generates something wrong or crashes.
2. **No pre-scraping step exists.** The `firecrawl-scrape` edge function is deployed and works, but nothing in the App Builder actually calls it before sending the prompt to the AI. The scraping instruction is only in the system prompt for *generated app code*, not for the builder itself.

## Solution

Add a **pre-scrape step** in `useAIAppBuilder.ts` so that when a URL is detected in your message, the builder automatically fetches the website content via `firecrawl-scrape` and injects it into the AI prompt as real data.

## Changes

### 1. `src/hooks/useAIAppBuilder.ts` -- Add URL pre-scraping

Before sending the message to the AI model:

- Detect any URL in the user's input (using the existing `detectURLCloneIntent` or a broader URL regex that also catches "browse to X" patterns without requiring clone keywords)
- Call the `firecrawl-scrape` edge function to fetch the site's markdown content and metadata (title, description, etc.)
- Inject the scraped content as a system message: `[SCRAPED WEBSITE CONTENT from glennsbodyshop.net] Title: ... \n Content: ...`
- This gives the AI the real text, structure, and data from the site to work with
- If scraping fails (timeout, blocked, etc.), show a toast warning and proceed without it rather than crashing

### 2. `src/components/ai-builder/SupabaseConversational.tsx` -- Broaden URL detection

Update `detectURLCloneIntent` to also detect:
- "browse to [domain]" (no https:// prefix)
- "go to [domain]"
- "check out [domain]"
- Plain domain names like "glennsbodyshop.net" without explicit clone keywords
- Any URL mentioned alongside "copy", "data", "content", "scrape", "browse"

Currently it only triggers on `https?://` URLs with clone-specific keywords. The user's message says "browse to glennsbodyshop.net" which has no `https://` prefix and uses "copy" which does match, but the URL regex fails on bare domains.

### 3. `src/hooks/useAIAppBuilder.ts` -- Better image-as-logo handling

The visual intelligence context already detects "use as logo" intent correctly. The main issue is that when combined with URL scraping + image, the AI gets overwhelmed. The fix will:
- Separate the scrape context and asset context into clearly labeled blocks
- Add explicit priority instructions: "Use the UPLOADED IMAGE as the logo. Use the SCRAPED CONTENT for the site data/text. Do NOT generate a logo -- the user provided one."

## Technical Details

```text
User message flow (before):
  "browse to site.com, use this as logo" + image
       |
       v
  detectURLCloneIntent --> system msg: "clone site.com"  (AI has NO site data)
  buildVisualIntelligence --> system msg: "use image as logo"
       |
       v
  AI hallucinates site content --> broken/wrong output

User message flow (after):
  "browse to site.com, use this as logo" + image
       |
       v
  detectURLCloneIntent --> found URL "site.com"
       |
       v
  fetch firecrawl-scrape("https://site.com") --> real markdown content
       |
       v
  system msg: "[SCRAPED CONTENT] Title: Glenn's Body Shop..."  (REAL data)
  system msg: "[ASSET] Use uploaded image as the logo"
       |
       v
  AI builds site with real data + real logo --> correct output
```

### Files to modify:
- `src/hooks/useAIAppBuilder.ts` -- Add async pre-scrape before AI call
- `src/components/ai-builder/SupabaseConversational.tsx` -- Broaden URL detection to handle bare domains and "browse to" patterns

