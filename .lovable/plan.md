

# Move Thumbnail Capture Server-Side

## Current Problem
There are **6 separate places** using `html2canvas` on the main thread:

1. **`usePreviewCapture.ts`** — Project thumbnails (auto, after every build)
2. **`useGPTPreviewCapture.ts`** — GPT widget thumbnails (no hardening at all)
3. **`usePreviewScreenshot.ts`** — User-triggered screenshot/download
4. **`useVisualDiff.ts`** — Before/after visual comparison snapshots
5. **`BugReportModal.tsx`** — Bug report screenshot of the page
6. **`BuilderChatPanel.tsx`** — Inline "Screenshot" button in chat plus menu

Items 3-6 are user-triggered and tolerable. Items 1 and 2 are **automatic** and are the freeze sources. The key insight: the compiled HTML is already uploaded to `app_builder_live_previews` and available at `https://{slug}.apps.ultriumai.com`. A server-side edge function can screenshot that URL instead of blocking the browser.

## Plan

### Step 1: Create `capture-thumbnail` Edge Function
A new Supabase edge function that:
- Accepts `{ projectId, url }` (the live preview URL)
- Uses a lightweight screenshot API (e.g., `screenshotone.com` or similar service via fetch) to capture a 320x200 screenshot
- Uploads the result to `project-thumbnails` storage bucket
- Updates `builder_projects.thumbnail_url`
- Returns the new URL

This removes html2canvas entirely from the automatic thumbnail path.

### Step 2: Rewrite `usePreviewCapture.ts` to Call the Edge Function
Replace the iframe + html2canvas logic with a simple `supabase.functions.invoke('capture-thumbnail', { body: { projectId, url } })` call. Keep the 90s throttle and content-hash dedup. The hook becomes ~30 lines.

### Step 3: Harden `useGPTPreviewCapture.ts`
Add the same protections as usePreviewCapture (abort timer, throttle, scale reduction) since this hook has zero safeguards and directly imports html2canvas at the top level (not even lazy-loaded).

### Step 4: Lazy-load html2canvas Everywhere Else
The remaining 4 user-triggered usages (screenshot, visual diff, bug report, chat screenshot) should all use `await import('html2canvas')` instead of top-level imports. Currently `BugReportModal.tsx` and `useGPTPreviewCapture.ts` use static imports, which means html2canvas is in the critical bundle path even if never used.

## Technical Details

```text
Before (automatic thumbnail):
  Browser main thread:
  ├── Create 1280×800 hidden iframe
  ├── Write full compiled HTML
  ├── Wait 3s for render
  ├── Run html2canvas (synchronous DOM walk) — 2-8s freeze
  ├── Convert to blob
  └── Upload to storage

After (server-side):
  Browser main thread:
  └── fetch('capture-thumbnail', { projectId, url })  — 0ms freeze

  Edge function (server):
  ├── Call screenshot API with live preview URL
  ├── Upload to storage
  └── Update DB
```

### Files Changed
- **New:** `supabase/functions/capture-thumbnail/index.ts`
- **Rewrite:** `src/hooks/usePreviewCapture.ts` — replace html2canvas with edge function call
- **Edit:** `src/hooks/useGPTPreviewCapture.ts` — add abort timer, throttle, lazy import
- **Edit:** `src/components/help/BugReportModal.tsx` — change to dynamic import
- **Edit:** `src/components/ai-builder/BuilderChatPanel.tsx` — already uses dynamic import, no change needed

### Secret Required
A screenshot service API key (e.g., `SCREENSHOT_API_KEY`) will need to be added to Supabase edge function secrets. Alternatively, if no external service is desired, the edge function can use a simple approach: fetch the HTML from the DB and return a placeholder/favicon-based thumbnail, avoiding the need for a headless browser entirely.

