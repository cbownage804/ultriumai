
## Add Chat/Build Mode Toggle (Like Lovable)

### What This Does
Adds a visible "Chat" / "Build" mode toggle below the input area in the AI App Builder, matching Lovable's pattern. Users can switch between:
- **Chat** (1 credit) -- Discussion only, no code generated
- **Build** (3 credits) -- Full code generation with file output

### Current State
The mode system already exists (`BuilderMode = 'build' | 'discuss'`) with:
- Auto-detection on first message
- Credit cost differentiation (3cr build, 1cr discuss)
- Code output blocking in discuss mode

But there is **no visible toggle** for users to manually switch modes.

### Changes

**`src/components/ai-builder/BuilderChatPanel.tsx`**

Add a segmented pill toggle below the input box (inside the bottom `div`, after the input container closes). The toggle will have two options:

- **Chat** (teal accent, "1cr" badge) -- maps to `mode === 'discuss'`
- **Build** (violet accent, "3cr" badge) -- maps to `mode === 'build'`

The toggle will be a compact pill bar styled like Lovable's:

```text
+--------------------------------------------------+
|  [+]  [Edit]  Ask UltriumAI...           [Send]  |
+--------------------------------------------------+
  [ Chat 1cr ]  [ Build 3cr ]
```

### Technical Details

| File | Change |
|------|--------|
| `src/components/ai-builder/BuilderChatPanel.tsx` (after line ~1363) | Add a `div` with two toggle buttons below the input container. Each button calls `onModeChange('discuss')` or `onModeChange('build')`. Active button gets a highlighted background (teal for Chat, violet for Build) with a small credit badge. |

- The "Chat" label maps to the existing `'discuss'` mode internally
- The "Build" label maps to the existing `'build'` mode
- Active state uses the same accent colors already defined (violet for build, teal for discuss)
- Credit badges show "1cr" and "3cr" matching the existing `creditCost` logic in `useAIAppBuilder.ts`
- No backend changes needed -- all mode logic already exists
