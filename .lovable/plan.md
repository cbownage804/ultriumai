
# True Lovable Parity: Real Credits + Final Polish

## Overview
Two categories of work: (1) fix the hardcoded credit bar in the project dropdown to show real data, and (2) implement remaining Lovable parity features that are still missing.

---

## 1. Real Credit Balance in Project Dropdown

**Problem**: The `ProjectDropdownMenu` currently shows a hardcoded `width: '65%'` gradient bar instead of actual credit data from `useUserCredits`.

**Fix**:
- Import `useUserCredits` into `ProjectDropdownMenu`
- Calculate segment widths for Daily (blue), Monthly (violet), and Bonus (amber) proportionally
- Show the actual total remaining number next to "Credits"
- Match the Lovable screenshot: segmented progress bar with "Credits" label and "View details" link

---

## 2. Additional Lovable Parity Features

### A. "Try to Fix" Auto-Error Detection
When the preview iframe throws a console error, show a non-intrusive banner with a "Try to fix" button that auto-sends the error context to the AI -- just like Lovable does. This is free (no credit cost) and dramatically improves UX.

**Changes**:
- Add error listener in `BuilderPreviewPanel` that captures runtime errors
- Show a collapsible error banner above the preview with the error message and a "Try to fix" button
- On click, auto-inject the error into the chat as a system-tagged message with `skipCreditDeduction: true`

### B. Thinking/Reasoning Indicator
Lovable shows a "Thinking..." phase before streaming begins. Currently, the builder jumps straight to "Generating...".

**Changes**:
- Add a `thinking` state to the generation lifecycle (before first token arrives)
- Show a subtle "Thinking..." label with a pulsing dot in the chat and overlay
- Transition to "Generating..." once the first content token streams in

### C. Smart Follow-Up Suggestions
After a build completes, Lovable suggests 2-3 contextual follow-up actions (e.g., "Add authentication", "Style the header"). 

**Changes**:
- After `handleBgComplete`, parse the AI output for suggested next steps
- If none found, generate 2-3 generic suggestions based on the files that were created/modified
- Render as clickable chips below the AI response in the chat panel

### D. Inline Edit Selection (Visual Edit Mode)
Lovable lets users click elements in the preview to edit them. Add a lightweight version: a "Select to Edit" toggle that lets users click an element in the preview iframe and auto-generates a prompt like "Change the text of the h1 on the homepage to..."

**Changes**:
- Add a crosshair/pointer toggle button in the preview toolbar
- When active, inject a small script into the preview iframe that highlights elements on hover and sends the element's tag, text, and CSS selector on click via `postMessage`
- Pre-fill the chat input with a contextual edit prompt

---

## Technical Details

### File Changes

| File | Change |
|------|--------|
| `src/components/ai-builder/ProjectDropdownMenu.tsx` | Import `useUserCredits`, replace hardcoded bar with real segmented credit data |
| `src/components/ai-builder/BuilderPreviewPanel.tsx` | Add error capture and "Try to fix" banner UI |
| `src/hooks/useAIAppBuilder.ts` | Add `skipCreditDeduction` flag support for auto-fix messages |
| `src/components/ai-builder/AIAppBuilderWorkspace.tsx` | Add thinking state, follow-up suggestions after completion, visual edit mode toggle |
| `src/components/ai-builder/WorkspaceTopBar.tsx` | Add "Select to Edit" toggle button in preview toolbar |
| `src/components/ai-builder/GeneratingOverlay.tsx` | Support "Thinking..." vs "Generating..." phases |

### Credit Bar Calculation (ProjectDropdownMenu)

```text
totalLimit = dailyLimit + monthlyLimit + bonusCredits
dailyWidth = (dailyRemaining / totalLimit) * 100
monthlyWidth = (monthlyRemaining / totalLimit) * 100
bonusWidth = (bonusRemaining / totalLimit) * 100
```

Three colored segments rendered as stacked divs inside the progress track:
- Blue segment (daily)
- Violet segment (monthly)  
- Amber segment (bonus)

### Priority Order
1. Real credit balance (quick fix, immediate value)
2. Try-to-fix error detection (highest UX impact)
3. Thinking indicator (polish)
4. Follow-up suggestions (engagement)
5. Visual edit mode (advanced parity)
