

## Problem

The screenshots show a consistent failure pattern: AI generates a landing page, the **bracket-counting validator** in `useOutputValidation.ts` flags `App.tsx` with "Unbalanced curly braces" and "Unbalanced parentheses" errors, the repair pipeline runs twice and fails, and the preview never renders — stuck on "Building your app..." then showing "Repair Failed".

The root cause is the **heuristic bracket counter** (lines 106-129 of `useOutputValidation.ts`). Its regex-based string/comment stripping is imperfect — it miscounts brackets in complex JSX containing nested template literals, regex patterns, or escaped characters. This produces **false positive errors** that block valid (or nearly-valid) code from ever reaching the Vite compiler.

The Vite sandbox is the real source of truth for syntax correctness. The pre-commit validator should catch obvious issues but not block compilation on heuristic guesses.

## Plan

### 1. Downgrade bracket imbalance from `error` to `warning`

**File: `src/components/ai-builder/useOutputValidation.ts`**

Change severity of bracket/parenthesis/bracket checks (lines 121-129) from `'error'` to `'warning'`. This lets the code proceed to Vite compilation, which will catch genuine syntax errors with proper error messages. The warnings still appear in logs for diagnostics.

### 2. Increase truncation tolerance

The "file appears truncated" check (line 224) can also false-positive on valid JSX that ends with certain characters in edge cases. Add a minimum file-length threshold (e.g., only flag files under 200 chars or with multiple truncation signals).

### 3. Result

- AI-generated code with minor bracket mismatches will proceed to Vite compilation instead of being blocked
- Vite catches real syntax errors and provides accurate error messages
- The repair pipeline still activates for genuine Vite compile failures
- "Repair Failed" will only appear for truly broken code, not false positives

