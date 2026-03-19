/**
 * Smart File Creation from Chat — Wave 8 Step 3
 * Detects file-creation intent in chat messages and scaffolds instantly.
 */
import { useCallback } from 'react';

interface ScaffoldResult {
  path: string;
  content: string;
  name: string;
}

const INTENT_PATTERNS = [
  // "create a component called UserCard"
  /\b(?:create|add|make|scaffold|generate)\s+(?:a\s+)?(?:new\s+)?(?:react\s+)?component\s+(?:called|named)\s+(\w+)/i,
  // "create a hook called useAuth"
  /\b(?:create|add|make|scaffold|generate)\s+(?:a\s+)?(?:new\s+)?(?:custom\s+)?hook\s+(?:called|named)\s+(use\w+)/i,
  // "create a page called Dashboard"
  /\b(?:create|add|make|scaffold|generate)\s+(?:a\s+)?(?:new\s+)?page\s+(?:called|named)\s+(\w+)/i,
  // "create a utility called formatDate"
  /\b(?:create|add|make|scaffold|generate)\s+(?:a\s+)?(?:new\s+)?(?:util(?:ity)?|helper)\s+(?:called|named)\s+(\w+)/i,
];

function pascal(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function scaffoldComponent(name: string): ScaffoldResult {
  const n = pascal(name);
  return {
    path: `src/components/${n}.tsx`,
    name: n,
    content: `interface ${n}Props {\n  className?: string;\n}\n\nexport function ${n}({ className }: ${n}Props) {\n  return (\n    <div className={className}>\n      <h2>${n}</h2>\n    </div>\n  );\n}\n`,
  };
}

function scaffoldHook(name: string): ScaffoldResult {
  const hookName = name.startsWith('use') ? name : `use${pascal(name)}`;
  return {
    path: `src/hooks/${hookName}.ts`,
    name: hookName,
    content: `import { useState, useCallback } from 'react';\n\nexport function ${hookName}() {\n  const [data, setData] = useState<any>(null);\n  const [loading, setLoading] = useState(false);\n\n  const fetch = useCallback(async () => {\n    setLoading(true);\n    try {\n      // TODO: implement\n    } finally {\n      setLoading(false);\n    }\n  }, []);\n\n  return { data, loading, fetch };\n}\n`,
  };
}

function scaffoldPage(name: string): ScaffoldResult {
  const n = pascal(name);
  return {
    path: `src/pages/${n}Page.tsx`,
    name: `${n}Page`,
    content: `export default function ${n}Page() {\n  return (\n    <div className="p-6">\n      <h1 className="text-2xl font-bold mb-4">${n}</h1>\n      <p>Content goes here.</p>\n    </div>\n  );\n}\n`,
  };
}

function scaffoldUtil(name: string): ScaffoldResult {
  return {
    path: `src/utils/${name}.ts`,
    name,
    content: `/**\n * ${name} utility\n */\nexport function ${name}() {\n  // TODO: implement\n}\n`,
  };
}

export function useSmartFileCreation() {
  /**
   * Attempt to detect a simple file-creation intent.
   * Returns scaffold result or null if no intent detected.
   */
  const detectIntent = useCallback((input: string): ScaffoldResult | null => {
    // Only match short, simple requests (< 120 chars)
    if (input.length > 120) return null;

    for (const pattern of INTENT_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        const name = match[1];
        const lower = input.toLowerCase();
        if (lower.includes('hook') || name.startsWith('use')) return scaffoldHook(name);
        if (lower.includes('page')) return scaffoldPage(name);
        if (lower.includes('util') || lower.includes('helper')) return scaffoldUtil(name);
        return scaffoldComponent(name);
      }
    }

    return null;
  }, []);

  return { detectIntent };
}
