import { useCallback } from 'react';

/**
 * useTypescriptSoftening — Downgrades non-critical TypeScript errors to warnings.
 *
 * Lovable's preview renders even when there are minor TS issues like unused
 * variables, implicit any, or missing return types. This hook classifies
 * Vite/TS errors and decides which should block the preview vs. which
 * are just warnings.
 */

/** Patterns that should NEVER block the preview (downgrade to warning) */
const NON_CRITICAL_PATTERNS = [
  // Unused variables / imports
  /is declared but (?:its value is )?never (?:read|used)/i,
  /is defined but never used/i,
  /'[^']+' is assigned a value but never used/i,
  // Implicit any
  /has an? implicit 'any' type/i,
  /parameter '[^']+' implicitly has an 'any' type/i,
  // Missing return type annotations
  /lacks return-type annotation/i,
  // Prefer const
  /is never reassigned\. Use 'const'/i,
  // Empty interface
  /an? empty interface is equivalent to/i,
  // Prefer optional chain
  /prefer optional chain/i,
  // Missing semicolons (stylistic)
  /missing semicolon/i,
  // No explicit any
  /unexpected any\. specify a different type/i,
  // Unused expressions (often intentional in React)
  /expected an assignment or function call/i,
  // React-specific: missing display name
  /component definition is missing display name/i,
  // Accessible props (a11y warnings)
  /img elements must have an alt prop/i,
  /anchor is valid/i,
  // TypeScript 'any' usage warnings
  /do not use (?:the )?'any' type/i,
];

/** Patterns that MUST block the preview (real errors) */
const CRITICAL_PATTERNS = [
  // Syntax errors
  /unexpected token/i,
  /expression expected/i,
  /declaration or statement expected/i,
  // Module resolution
  /cannot find module/i,
  /module not found/i,
  /failed to resolve import/i,
  // Type errors that break runtime
  /is not a function/i,
  /is not assignable to type/i,
  /property '[^']+' does not exist/i,
  /cannot read propert/i,
  // JSX errors
  /jsx element '[^']+' has no corresponding closing tag/i,
  /unterminated jsx/i,
  // Export errors
  /has no default export/i,
  /does not provide an export/i,
];

export type ErrorSeverity = 'error' | 'warning' | 'info';

export interface ClassifiedError {
  message: string;
  severity: ErrorSeverity;
  isBlocking: boolean;
}

export function useTypescriptSoftening() {
  /**
   * Classify an error message as blocking (error) or non-blocking (warning).
   */
  const classifyError = useCallback((message: string): ClassifiedError => {
    // Check if it matches a critical pattern first (takes priority)
    for (const pattern of CRITICAL_PATTERNS) {
      if (pattern.test(message)) {
        return { message, severity: 'error', isBlocking: true };
      }
    }

    // Check if it matches a non-critical pattern (downgrade to warning)
    for (const pattern of NON_CRITICAL_PATTERNS) {
      if (pattern.test(message)) {
        return { message, severity: 'warning', isBlocking: false };
      }
    }

    // Default: treat as error (safe fallback)
    return { message, severity: 'error', isBlocking: true };
  }, []);

  /**
   * Process a list of error strings and split into blocking vs non-blocking.
   * Returns { blocking, warnings, shouldBlockPreview }.
   */
  const softenErrors = useCallback((errors: string[]): {
    blocking: ClassifiedError[];
    warnings: ClassifiedError[];
    shouldBlockPreview: boolean;
    allClassified: ClassifiedError[];
  } => {
    const classified = errors.map(classifyError);
    const blocking = classified.filter(e => e.isBlocking);
    const warnings = classified.filter(e => !e.isBlocking);

    return {
      blocking,
      warnings,
      shouldBlockPreview: blocking.length > 0,
      allClassified: classified,
    };
  }, [classifyError]);

  return { classifyError, softenErrors };
}
