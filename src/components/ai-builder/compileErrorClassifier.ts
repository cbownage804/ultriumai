/**
 * Compile Error Classifier — categorizes build errors and provides
 * specialized fix prompts for each category instead of generic "fix this".
 */

export type CompileErrorCategory =
  | 'missing_import'
  | 'syntax_error'
  | 'type_error'
  | 'jsx_error'
  | 'runtime_crash'
  | 'missing_module'
  | 'duplicate_export'
  | 'hook_violation'
  | 'null_access'
  | 'unknown';

export interface ClassifiedCompileError {
  category: CompileErrorCategory;
  label: string;
  specializedPrompt: string;
  /** Priority: higher = more likely to succeed with targeted fix */
  confidence: number;
}

const CLASSIFIERS: Array<{
  pattern: RegExp;
  category: CompileErrorCategory;
  label: string;
  prompt: string;
  confidence: number;
}> = [
  {
    pattern: /is not defined|ReferenceError|is not a function.*not imported/i,
    category: 'missing_import',
    label: 'Missing Import',
    prompt: `This is a MISSING IMPORT error. The fix is simple:
1. Identify the undefined identifier from the error message.
2. Add the correct import statement at the top of the file.
3. Common sources: 'react' (hooks), 'react-router-dom' (Link, useNavigate), 'lucide-react' (icons), 'framer-motion' (motion).
4. Do NOT restructure or rewrite the component — just add the missing import.`,
    confidence: 0.95,
  },
  {
    pattern: /unexpected token|SyntaxError|Parse error|Unexpected.*expected/i,
    category: 'syntax_error',
    label: 'Syntax Error',
    prompt: `This is a SYNTAX ERROR. Focus on:
1. Check for unmatched brackets, parentheses, or braces around the error line.
2. Check for missing commas in object literals or function parameters.
3. Check for unclosed string literals or template literals.
4. Check for stray characters or incomplete expressions.
5. Do NOT rewrite the whole file — fix only the syntax issue at the indicated line.`,
    confidence: 0.85,
  },
  {
    pattern: /Type.*is not assignable|Property.*does not exist on type|Argument of type/i,
    category: 'type_error',
    label: 'Type Error',
    prompt: `This is a TYPESCRIPT TYPE ERROR. Fix by:
1. Check the type annotation at the error location.
2. Add proper type assertions or fix the interface/type definition.
3. Use 'as' type assertions sparingly — prefer fixing the underlying type.
4. For event handlers, use proper React event types (React.ChangeEvent<HTMLInputElement>, etc.).
5. Do NOT remove TypeScript types or switch to 'any' unless truly necessary.`,
    confidence: 0.75,
  },
  {
    pattern: /JSX|Adjacent JSX|jsx-no-|Expected.*<\/|Unterminated JSX/i,
    category: 'jsx_error',
    label: 'JSX Error',
    prompt: `This is a JSX ERROR. Common fixes:
1. Wrap adjacent JSX elements in a fragment (<>...</>) or a parent <div>.
2. Ensure all JSX tags are properly closed: <img />, <br />, <input />.
3. Use className instead of class, htmlFor instead of for.
4. Ensure expressions in JSX are wrapped in curly braces: {variable}.
5. Check for unclosed JSX tags — every <Tag> needs a matching </Tag> or self-close.`,
    confidence: 0.9,
  },
  {
    pattern: /Cannot read propert|TypeError.*null|TypeError.*undefined|is undefined/i,
    category: 'null_access',
    label: 'Null Access',
    prompt: `This is a NULL/UNDEFINED ACCESS error. Fix by:
1. Add optional chaining (?.) before the property access that's failing.
2. Add a null check or default value: const value = data?.property ?? defaultValue;
3. Ensure the variable is initialized before use.
4. If it's in a useEffect, check that the dependency is available.
5. Do NOT restructure the component — just add proper null guards.`,
    confidence: 0.8,
  },
  {
    pattern: /Module not found|Cannot find module|Could not resolve|No matching export/i,
    category: 'missing_module',
    label: 'Missing Module',
    prompt: `This is a MISSING MODULE error. Fix by:
1. Check if the import path is correct (relative vs absolute, file extension).
2. If importing from a local file, verify the file exists in the project.
3. If importing from a package, ensure it's a standard React/browser package.
4. Common mistake: importing from '@/' when the file is in a different location.
5. Check for typos in the module path.`,
    confidence: 0.9,
  },
  {
    pattern: /Duplicate|already been declared|already declared|redeclar/i,
    category: 'duplicate_export',
    label: 'Duplicate Declaration',
    prompt: `This is a DUPLICATE DECLARATION error. Fix by:
1. Remove the duplicate export, variable, or function declaration.
2. If there are two 'export default', keep only one.
3. If a variable is declared twice, remove the second declaration.
4. Check for duplicate import statements and remove extras.`,
    confidence: 0.9,
  },
  {
    pattern: /hooks? can only be called|rendered (more|fewer) hooks|hook.*conditional/i,
    category: 'hook_violation',
    label: 'Hook Violation',
    prompt: `This is a REACT HOOKS VIOLATION. Fix by:
1. Move all hook calls to the top level of the component function.
2. NEVER call hooks inside conditions, loops, or nested functions.
3. NEVER call hooks after an early return statement.
4. Ensure the number of hooks called is the same on every render.
5. If you need conditional logic, call the hook unconditionally and use the result conditionally.`,
    confidence: 0.85,
  },
  {
    pattern: /maximum update depth|too many re-renders|infinite/i,
    category: 'runtime_crash',
    label: 'Infinite Loop',
    prompt: `This is an INFINITE RENDER LOOP. Fix by:
1. Check useEffect dependencies — an effect that sets state must have a proper dependency array.
2. Do NOT call setState directly in the render body — move it into useEffect.
3. Memoize objects/arrays in dependency arrays using useMemo.
4. If using useEffect with setState, ensure the state change doesn't re-trigger the effect.`,
    confidence: 0.8,
  },
];

/**
 * Classify a compile/runtime error and return a specialized fix prompt.
 */
export function classifyCompileError(errorMessage: string, errorDetails?: string[]): ClassifiedCompileError {
  const fullText = [errorMessage, ...(errorDetails || [])].join(' ');

  for (const classifier of CLASSIFIERS) {
    if (classifier.pattern.test(fullText)) {
      return {
        category: classifier.category,
        label: classifier.label,
        specializedPrompt: classifier.prompt,
        confidence: classifier.confidence,
      };
    }
  }

  return {
    category: 'unknown',
    label: 'Unknown Error',
    specializedPrompt: `Analyze the error message carefully and fix the root cause. Do NOT restructure or rewrite the entire file — make the minimum change needed to fix this specific error.`,
    confidence: 0.5,
  };
}
