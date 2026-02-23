

## Full Chat (Plan) Mode Parity

### Overview
The Chat/Build toggle and backend logic already exist, but the Chat mode experience lacks the key interactive elements that make Lovable's Plan mode powerful. This plan adds the missing pieces to reach full parity.

### What Already Works
- Chat/Build toggle pill (just added)
- DISCUSS_SYSTEM_PROMPT on the backend (opinionated architect persona, no code output)
- Client-side code blocking in discuss mode
- Credit differentiation (1cr chat, 3cr build)
- Auto-detection on first message
- Contextual suggestions in discuss mode

### What's Missing (4 changes)

---

**1. "Approve & Build" action button on chat-mode responses**

When the AI presents a plan in Chat mode and the response contains plan signals (e.g., "here's the plan", "I'd recommend", "ready to build"), render an "Approve & Build" button at the bottom of the assistant message. Clicking it:
- Switches mode to `'build'`
- Sends an automatic message: "Build everything we just discussed" with the plan context

This is the core Lovable parity feature -- the plan-to-build handoff.

**2. Chat mode badge on messages**

Add a small teal "Chat" or violet "Build" badge next to the timestamp on each message, so users can see which mode each message was sent in. This requires adding a `mode` field to the `BuilderMessage` interface and setting it when messages are created.

**3. Smarter discuss-mode suggestions with "Start Building" CTA**

Improve the follow-up suggestion chips after chat-mode responses. When the AI's response contains plan signals, the first suggestion should be a prominent "Start Building" chip that switches to build mode and sends the plan. Other suggestions should be contextual refinement options.

**4. Chat mode visual differentiation in message rendering**

When in discuss mode, assistant messages should show a subtle teal accent (left border or icon tint) to visually distinguish them from build-mode responses. This helps users understand which mode produced each response.

---

### Technical Details

| File | Change |
|------|--------|
| `src/hooks/useAIAppBuilder.ts` (BuilderMessage interface, ~line 313) | Add `mode?: BuilderMode` field to track which mode each message was sent in |
| `src/hooks/useAIAppBuilder.ts` (sendMessage, ~line 818-828) | Set `mode: effectiveMode` on both user and assistant messages when created |
| `src/components/ai-builder/BuilderChatPanel.tsx` (renderAssistantMessage, ~line 567) | Add "Approve & Build" button when message is in discuss mode and contains plan signals. Add teal left-border accent for discuss-mode messages |
| `src/components/ai-builder/BuilderChatPanel.tsx` (message timestamp area, ~line 1158) | Show mode badge (Chat/Build pill) next to timestamp |
| `src/components/ai-builder/BuilderChatPanel.tsx` (after assistant message rendering, ~line 984) | Add discuss-mode follow-up suggestion chips with prominent "Start Building" CTA |
| `src/hooks/useAIAppBuilder.ts` (generateSuggestions, ~line 644) | Enhance discuss-mode suggestions to be more contextual and include a build transition option |

### No backend changes needed
The existing `DISCUSS_SYSTEM_PROMPT` and `TRANSITION CUE` behavior in the edge function already guides the AI to suggest switching to Build mode. The frontend just needs to make that transition interactive.

