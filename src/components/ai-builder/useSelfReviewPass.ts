import { useCallback } from 'react';

/**
 * AI Self-Review Pass: Generates a review prompt that the AI
 * can use to re-read its own output and catch logical errors.
 * This is injected as a post-generation instruction.
 */
export function useSelfReviewPass() {
  /** Build a self-review instruction to append to the system prompt. */
  const buildSelfReviewInstruction = useCallback((): string => {
    return `
[POST-GENERATION SELF-REVIEW]
Before finalizing your response, mentally review your generated code for these issues:

1. **Undefined Variables**: Every variable/function used must be declared or imported.
2. **Missing Imports**: Check React hooks (useState, useEffect, useCallback), utility imports, and component imports.
3. **Broken Event Handlers**: Ensure all onClick/onChange/onSubmit handlers reference defined functions.
4. **State Update Bugs**: Never mutate state directly. Always use setState or immutable patterns.
5. **Async/Await Errors**: Every async function must have try/catch. Every .then() must have .catch().
6. **Key Props**: All .map() JSX outputs must have unique key props.
7. **Closed Tags**: Every JSX element must be properly closed.
8. **Type Mismatches**: If TypeScript, ensure prop types match component expectations.
9. **CSS Class Conflicts**: No duplicate or contradictory Tailwind classes on the same element.
10. **Dead Code**: Remove any unused variables, imports, or functions.

If you find ANY issue above, fix it BEFORE outputting code. Do NOT mention this review to the user.
`.trim();
  }, []);

  /** Generate a review summary for existing code (for post-build analysis). */
  const generateReviewChecklist = useCallback((code: string): string[] => {
    const issues: string[] = [];

    // Check for common React issues
    if (code.includes('useState') && !code.includes("from 'react'") && !code.includes('from "react"')) {
      issues.push('Missing React import for useState');
    }
    if (code.includes('useEffect') && !code.includes("from 'react'") && !code.includes('from "react"')) {
      issues.push('Missing React import for useEffect');
    }
    // Detect .map() without key
    const mapWithoutKey = /\.map\([^)]*\)\s*=>\s*(?:\(?\s*<(?!Fragment)[A-Z]\w*(?!\s+key))/g;
    if (mapWithoutKey.test(code)) {
      issues.push('Possible .map() without key prop');
    }
    // Detect direct state mutation
    if (/this\.state\.\w+\s*=/.test(code)) {
      issues.push('Direct state mutation detected');
    }
    // Detect async without try-catch
    const asyncFns = code.match(/async\s+(?:function\s+)?\w*\s*\([^)]*\)\s*\{/g);
    if (asyncFns && asyncFns.length > 0) {
      const tryCatchCount = (code.match(/try\s*\{/g) || []).length;
      if (tryCatchCount < asyncFns.length) {
        issues.push(`${asyncFns.length - tryCatchCount} async function(s) without try/catch`);
      }
    }

    return issues;
  }, []);

  return { buildSelfReviewInstruction, generateReviewChecklist };
}
