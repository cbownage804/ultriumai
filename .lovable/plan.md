

# Fix: AI Uses Text Placeholders Instead of Uploaded Images

## Problem

When you upload a logo image and ask the AI to use it, the generated site shows text like "Glenn's Body Shop Logo" instead of the actual image. This happens because:

1. **Image size cap is too small**: The system caps embeddable data URLs at 50,000 characters (~37KB). Most uploaded photos exceed this, so the AI is told to "use a placeholder" instead.
2. **The image needs to be compressed before sending**: The project already has an image optimization pipeline (`imageOptimization.ts`) but it's not being used for chat-uploaded images.

## Solution

### 1. Compress uploaded images before sending to the AI

Before the image data URLs reach the AI, run them through the existing `compressImage` + `convertToWebP` pipeline to shrink them below the embed cap. This way the AI always gets a usable data URL it can embed directly.

**File: `src/hooks/useAIAppBuilder.ts`**
- Import `optimizeImage` from `@/utils/imageOptimization`
- After `effectiveImageDataUrls` is computed (around line 992), add a compression step that processes each image:
  - Downscale to max 400px wide (logos don't need full resolution)
  - Convert to WebP at 0.7 quality
  - This typically reduces a 200KB+ image to under 15KB
- Replace the original data URLs with the compressed versions

### 2. Increase the embed cap as a safety net

**File: `src/hooks/useAIAppBuilder.ts`**
- Raise `MAX_DATA_URL_SIZE` from 50,000 to 150,000 characters (~112KB) to handle cases where compression still produces larger outputs

### 3. Remove the "too large" placeholder fallback for logo intents

**File: `src/hooks/useAIAppBuilder.ts`**
- When `isLogoIntent` is true, always include the data URL regardless of size (since the user explicitly asked to use this image)
- Only fall back to the placeholder message for non-logo large images

### 4. Add ASSET PRIORITY instructions outside the scraping flow

Currently, the explicit "do NOT use text placeholder" instruction only fires when a URL clone is also detected. Move a similar instruction to fire anytime images are attached with logo intent, even without scraping.

**File: `src/hooks/useAIAppBuilder.ts`**
- After the URL clone block (after line 1052), add a new block that checks if `effectiveImageDataUrls?.length && isLogoIntent` (outside the clone flow) and injects the same ASSET PRIORITY system message

---

## About the Droplet Deployment

The "Permission denied (publickey)" error means your SSH key isn't authorized on the vite-sandbox droplet (159.203.128.171). You'll need to either:
- Copy your SSH public key to that server: `ssh-copy-id root@159.203.128.171`
- Or use password auth: `scp -o PreferredAuthentications=password vite-sandbox/server.js root@159.203.128.171:/opt/vite-sandbox/server.js`

This is a server access issue separate from the code changes above.

## Technical Details

**Files to modify:**
- `src/hooks/useAIAppBuilder.ts` — Image compression + embed logic

**No new dependencies needed** — the existing `imageOptimization.ts` utility handles compression and WebP conversion.

