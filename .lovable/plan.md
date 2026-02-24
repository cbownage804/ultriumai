

# Fix: Make Uploaded Images Work Flawlessly in App Builder

## Problem Identified

There's a **critical data stripping bug** in the client-side message sanitization pipeline. Before messages are sent to the edge function, ALL base64 data URLs longer than 10KB are stripped and replaced with placeholders -- including the ones the AI needs to embed as logos.

**The kill chain:**
1. User uploads logo image
2. Image is compressed to 200px wide, 0.5 quality (good)
3. Data URL is injected into ASSET PRIORITY and EMBEDDABLE DATA URL messages (good)
4. **BUG**: `sanitizedApiMessages` at line 1399 strips ALL data URLs >10KB -- including the asset messages (bad)
5. AI receives `[image-data-url-stripped-for-transport]` instead of the actual data URL
6. AI can "see" the image via the vision `image_url` block, but cannot extract the raw string to put in `<img src="...">`
7. AI falls back to text like "Glenn's Body Shop Logo"

## Solution

### Change 1: Exempt asset messages from client-side stripping (`useAIAppBuilder.ts`)

Update the `sanitizedApiMessages` logic (around line 1399) to skip stripping on messages that contain `ASSET PRIORITY` or `EMBEDDABLE DATA URL`. These messages exist specifically to give the AI the raw data URL string -- stripping them defeats the purpose.

- For **string content** messages: check if the string contains `ASSET PRIORITY` before applying the regex replacement
- For **array content** messages: check each text block for `EMBEDDABLE DATA URL` or `ASSET PRIORITY` before stripping

### Change 2: Increase image compression quality (`useAIAppBuilder.ts`)

The current 200px/0.5 quality settings produce very low quality logos. Increase to:
- `maxWidth: 400` (enough for navbar/footer logos at 2x resolution)
- `quality: 0.7` (reasonable balance between size and quality)

This keeps images under the 500KB cap while looking sharp.

### Change 3: Strengthen edge function asset protection (`ai-app-builder/index.ts`)

In the `trimMessagesToFit` function, the `isAssetMessage` helper only checks string content, but ASSET PRIORITY messages with multimodal (array) content would be missed. Update to also check array content blocks.

## Technical Details

```text
File: src/hooks/useAIAppBuilder.ts
Lines ~1399-1421 (sanitizedApiMessages block)

Before:
  - Strips ALL data URLs >10KB indiscriminately
  
After:
  - String messages: skip if contains "ASSET PRIORITY"
  - Array text blocks: skip if contains "EMBEDDABLE DATA URL" or "ASSET PRIORITY"
  - image_url blocks: keep the 500KB cap (unchanged)

File: src/hooks/useAIAppBuilder.ts  
Line ~999 (image optimization)

Before: maxWidth: 200, quality: 0.5
After:  maxWidth: 400, quality: 0.7

File: supabase/functions/ai-app-builder/index.ts
Lines ~363-366 (isAssetMessage helper)

Before: Only checks string content
After:  Also checks array content blocks for asset markers
```

These three changes ensure the complete pipeline preserves image data URLs end-to-end: upload, compress, inject, transport, and deliver to the AI model.

