

# Reliability Hardening: Make Builds Succeed 100% of the Time

The continuation loop is solid now. The remaining failure modes are in areas the loop can't fix: **truncated files from mid-stream cuts, empty round outputs, credit double-charging, and the AI ignoring the CONTINUE instruction**. Here are the 6 fixes needed.

---

## 1. Incomplete File Detection and Recovery

**Problem:** When the wall-clock timer or stall detector aborts mid-stream, the last `===FILE:` block is often truncated (missing closing tags, unclosed braces). The continuation round generates *new* files but doesn't re-output the truncated one, leaving a broken file in the project.

**Fix (src/hooks/useAIAppBuilder.ts):** After parsing in `finalizeStream`, detect truncated files by checking bracket/tag balance on the *last* parsed file only. If truncated, remove it from `filesToApply` and add its path to a `truncatedPaths` array. Include truncated paths in the continuation prompt: `"The file [path] was cut off mid-stream. Please regenerate it completely, then continue with remaining files."`

**File:** `src/hooks/useAIAppBuilder.ts`

---

## 2. Empty Continuation Round Guard

**Problem:** If the AI returns prose-only in a continuation round (no `===FILE:` blocks), `finalizeStream` produces 0 files but may still return `shouldContinue: true` if the stream was aborted. This burns rounds doing nothing.

**Fix (src/hooks/useAIAppBuilder.ts):** Add a guard: if a continuation round (`continuationCountRef.current > 0`) produces 0 new files AND 0 edits, force `shouldContinue = false` and break out of the loop. Show a toast: "AI finished generating — no more files needed."

**File:** `src/hooks/useAIAppBuilder.ts`

---

## 3. Credit Deduction Fires Every Continuation Round

**Problem:** `finalizeStream` calls `deductCredits()` at line 1432 on every invocation. Since continuation rounds call `finalizeStream` multiple times, the user gets charged 2-4x per build.

**Fix (src/hooks/useAIAppBuilder.ts):** Only deduct credits on the first round. Add a `let creditsDeducted = false` flag before `finalizeStream` is defined. Inside, wrap the `deductCredits` call: `if (!creditsDeducted) { await deductCredits(...); creditsDeducted = true; }`

**File:** `src/hooks/useAIAppBuilder.ts`

---

## 4. Version History Spam from Continuation Rounds

**Problem:** Each continuation round pushes a new entry to `versions` (line 1399), creating 2-4 version snapshots for a single user request. This clutters the version history and makes rollback confusing.

**Fix (src/hooks/useAIAppBuilder.ts):** During continuation rounds (`continuationCountRef.current > 0`), update the existing version entry instead of pushing a new one. Use `setVersions(prev => prev.map((v, i) => i === prev.length - 1 ? { ...v, files: [...mergedFiles], label: \`AI: ${input.slice(0, 40)}... (round ${continuationCountRef.current + 1})\` } : v))`.

**File:** `src/hooks/useAIAppBuilder.ts`

---

## 5. Continuation Prompt Includes Raw File Paths but No Structure Hint

**Problem:** The continuation prompt says "You previously generated: index.html, app.js, styles.css" but gives the AI no hint about what files are still *needed*. The AI often just outputs a summary/explanation instead of more files.

**Fix (src/hooks/useAIAppBuilder.ts):** Enhance the continuation prompt to be more directive:

```
[CONTINUE] You are building: "${originalPromptSnippet}"

Files completed so far: ${continuationResult.generatedPaths.join(', ')}

IMPORTANT: You MUST output more files using ===FILE: path=== format.
Do NOT write explanations or summaries — ONLY output code files.
If all files are done, output a single small file like ===FILE: README.md=== with a project description.
If more files remain, end with ===CONTINUE===
```

**File:** `src/hooks/useAIAppBuilder.ts`

---

## 6. Auto-Rollback Listener Uses Stale `currentFiles` Reference

**Problem:** The rollback listener at line 1416 reverts to `currentFiles` (the snapshot from when `sendMessage` was called). During continuation rounds, this throws away all files from rounds 1 through N-1. A preview error on round 3 would lose rounds 1 and 2's work.

**Fix (src/hooks/useAIAppBuilder.ts):** Store a `preRoundSnapshot` before each round's `finalizeStream`, and revert to that instead of the original `currentFiles`. Change the rollback to: `setLatestFiles([...preRoundSnapshot])` where `preRoundSnapshot = [...workingFiles]` is captured before each `finalizeStream` call.

**File:** `src/hooks/useAIAppBuilder.ts`

---

## Summary

| Issue | Impact | Fix |
|---|---|---|
| Truncated last file not recovered | Broken file persists across rounds | Detect and request re-generation |
| Empty continuation burns rounds | Wastes 1-3 rounds on prose | Break on 0 files in continuation |
| Credits charged per round | 2-4x overcharge | Flag to deduct once |
| Version history spam | 2-4 entries per build | Update existing entry |
| AI ignores CONTINUE instruction | Outputs prose instead of files | Stronger directive prompt |
| Auto-rollback loses prior rounds | Preview error wipes all progress | Use pre-round snapshot |

## Files Changed

| File | What |
|---|---|
| `src/hooks/useAIAppBuilder.ts` | All 6 fixes — truncated file detection, empty round guard, single credit deduction, version dedup, stronger continuation prompt, safe rollback snapshot |

