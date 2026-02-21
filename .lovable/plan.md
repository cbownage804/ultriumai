

# Fix: Eliminate Remaining Browser Freeze During Streaming

## Problem

Despite removing mid-generation compilation, the browser still freezes during streaming (~30-40s in). The remaining freeze sources are scattered across multiple components that perform unnecessary work during active generation.

## Root Causes (3 sources)

### Source 1: Chat message filter runs `getDisplayContent()` on every re-render
In `BuilderChatPanel.tsx` (line 1280-1288), the `displayMessages.filter()` calls `getDisplayContent(msg)` for **every** assistant message. This function splits content by newlines and runs 7+ regex patterns per message. When `localStreamContent` updates every 2.5s, the entire filter re-runs, creating a burst of regex work.

### Source 2: Framer Motion spring animations on every chat message
Each message is wrapped in `<motion.div>` with spring physics (stiffness: 300, damping: 30). When `displayMessages` changes during streaming, Framer Motion recalculates layout for all animated messages, even ones that haven't moved. This is pure overhead.

### Source 3: `SkeletonPreview` uses Framer Motion
The skeleton shown during generation uses `motion.div` with `initial/animate` transitions and staggered delays on 3 card elements, continuously running JS animation frames.

## Solution

### Change 1: Memoize the message filter result (`BuilderChatPanel.tsx`)
Wrap the `displayMessages.filter()` in its own `useMemo` so `getDisplayContent()` only re-runs when `displayMessages` actually changes identity, not on every render triggered by unrelated state.

### Change 2: Replace `motion.div` with plain `div` for existing messages (`BuilderChatPanel.tsx`)
Only animate the **last** message (new arrivals). All previous messages should use plain `<div>` with no animation overhead. This eliminates Framer Motion from recalculating spring physics for the entire message history.

### Change 3: Replace `SkeletonPreview` Framer Motion with CSS (`SkeletonPreview.tsx`)
Remove the `motion` import and replace `motion.div` with plain `div` using CSS transitions (`animate-in fade-in`). The shimmer effect is already CSS-based; only the container and card entrance animations use JS.

### Change 4: Skip streaming content polling when content exceeds threshold (`BuilderChatPanel.tsx`)
The existing 20KB guard (line 354) silently skips updates, but `localStreamContent` retains the last sub-20KB snapshot, still triggering re-renders. Change to clear `localStreamContent` when content exceeds the threshold, preventing stale-snapshot-driven renders.

## Technical Details

### BuilderChatPanel.tsx
- Add `useMemo` for `filteredMessages` that wraps the `.filter()` call, dependent on `displayMessages`
- Change `motion.div` in the message `.map()` (line 1291) to conditionally use `div` for all but the last message
- Update the 20KB guard to set `localStreamContent` to empty string

### SkeletonPreview.tsx
- Remove `import { motion } from 'framer-motion'`
- Replace `motion.div` elements with `div` using Tailwind `animate-in fade-in` utilities
- Keep the CSS shimmer effect unchanged

## Expected Result
- No more "This page is slowing down Firefox" warnings during generation
- Chat panel re-renders are lightweight (no spring physics, no regex re-evaluation)
- Skeleton preview uses zero JS animation budget
- Generation completes smoothly without any browser freeze
