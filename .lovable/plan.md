

## Fix: Duplicate "Approve & Build" Buttons + AI Scraping Awareness

### Problem 1: Duplicate "Approve & Build" Buttons
The `showApproveButton` condition triggers on **every** assistant message that has plan signals (e.g., "i'll create", "we'll need", "here's how"). When the user clicks "Approve & Build", it sends a new message containing the original plan text, which triggers another AI response -- also containing plan signals. This creates a cascading chain of duplicate action bars across multiple messages.

### Problem 2: AI Claims It Can't Browse Websites
The scraping infrastructure (`firecrawl-scrape`, `detectURLCloneIntent`) already exists and works. However, when in "discuss" mode, the AI's system prompt doesn't mention this capability, so the AI defaults to saying "I can't browse websites". The `detectURLCloneIntent` function actually matches "grab" via the `data` signal word and `glennsbodyshop.net` via the bare domain pattern -- but only in **build** mode where the scraping is invoked.

### Fix Plan

**File 1: `src/components/ai-builder/BuilderChatPanel.tsx`**
- Change `showApproveButton` to only appear on the **last** assistant message in the conversation, not on every message with plan signals
- Add a guard: if any subsequent user message exists after this assistant message, hide the button (the plan was already acted on)

**File 2: `supabase/functions/ai-app-builder/index.ts`**  
- Add a line to the `DISCUSS_SYSTEM_PROMPT` telling the AI it has web scraping capability: when a user mentions a URL or domain, the system will automatically scrape it. The AI should NOT say it can't browse -- instead, it should acknowledge the URL and proceed with planning, knowing the content will be scraped automatically in build mode
- Add: "If the user mentions a website URL, acknowledge it and incorporate it into your plan. The system can automatically scrape website content when building."

### Technical Details

**Approve button deduplication logic:**
```
// Only show on the LAST assistant message, and only if no user message follows it
const isLastAssistant = index === displayMessages.length - 1 
  || !displayMessages.slice(index + 1).some(m => m.role === 'user');
const showApproveButton = !isStreaming && isChatMode && hasPlanSignals(msg.content) && isLastAssistant;
```

**System prompt addition (discuss mode):**
```
CAPABILITIES:
- The system can automatically scrape website content from URLs the user mentions. 
  Do NOT tell users you can't browse websites. Instead, acknowledge the URL and plan 
  to use its content. The scraping happens automatically when building.
```

