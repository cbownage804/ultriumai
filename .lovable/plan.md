

# Fix: "App Builder failed to load" Crash

## Problem

The App Builder crashes on load with: `"can't access property 'slice', _a.message is undefined"`.

The bug is in `src/components/ai-builder/BuilderPreviewPanel.tsx` at line 546:

```typescript
{errors.find(e => e.type === 'error')?.message.slice(0, 120)}
```

The optional chaining (`?.`) only guards against `find()` returning `undefined`. When it finds an error object that **exists but has no `.message` property** (i.e., `message` is `undefined`), calling `.slice()` on `undefined` throws a TypeError that crashes the entire component tree, which the `PanelErrorBoundary` catches and displays as "App Builder failed to load".

## Fix

Add optional chaining before `.slice()` so that a missing `message` gracefully renders nothing instead of crashing:

```typescript
{errors.find(e => e.type === 'error')?.message?.slice(0, 120)}
```

## Technical Details

| File | Line | Change |
|---|---|---|
| `src/components/ai-builder/BuilderPreviewPanel.tsx` | 546 | `?.message.slice(` to `?.message?.slice(` |

This is a one-character fix (`?.` instead of `.`) that prevents the entire workspace from crashing when console errors lack a message string.

