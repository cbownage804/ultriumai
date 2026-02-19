import { useState, useCallback, useMemo } from 'react';

export interface RegexMatch {
  index: number;
  length: number;
  text: string;
  groups: Record<string, string>;
}

const COMMON_PATTERNS: Record<string, { label: string; pattern: string; flags: string }> = {
  email: { label: 'Email', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', flags: 'gi' },
  url: { label: 'URL', pattern: 'https?:\\/\\/[^\\s/$.?#].[^\\s]*', flags: 'gi' },
  ipv4: { label: 'IPv4', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', flags: 'g' },
  ipv6: { label: 'IPv6', pattern: '([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}', flags: 'gi' },
  phone: { label: 'Phone (US)', pattern: '\\+?1?[-.\\s]?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}', flags: 'g' },
  date_iso: { label: 'Date (ISO)', pattern: '\\d{4}-\\d{2}-\\d{2}', flags: 'g' },
  date_us: { label: 'Date (US)', pattern: '\\d{2}/\\d{2}/\\d{4}', flags: 'g' },
  time_24h: { label: 'Time (24h)', pattern: '([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?', flags: 'g' },
  hex_color: { label: 'Hex Color', pattern: '#([0-9a-fA-F]{3}){1,2}\\b', flags: 'gi' },
  uuid: { label: 'UUID', pattern: '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', flags: 'gi' },
  html_tag: { label: 'HTML Tag', pattern: '<\\/?[a-z][\\s\\S]*?>', flags: 'gi' },
  css_class: { label: 'CSS Class', pattern: '\\.[a-zA-Z_][a-zA-Z0-9_-]*', flags: 'g' },
  json_key: { label: 'JSON Key', pattern: '"([^"]+)"\\s*:', flags: 'g' },
  number: { label: 'Number', pattern: '-?\\d+(\\.\\d+)?', flags: 'g' },
  word: { label: 'Word', pattern: '\\b[a-zA-Z]+\\b', flags: 'g' },
  sentence: { label: 'Sentence', pattern: '[A-Z][^.!?]*[.!?]', flags: 'g' },
  username: { label: 'Username', pattern: '[a-zA-Z0-9_]{3,16}', flags: 'g' },
  password_strong: { label: 'Strong Password', pattern: '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}', flags: '' },
  slug: { label: 'URL Slug', pattern: '[a-z0-9]+(?:-[a-z0-9]+)*', flags: 'g' },
  mac_address: { label: 'MAC Address', pattern: '([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}', flags: 'g' },
  credit_card: { label: 'Credit Card', pattern: '\\b\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}\\b', flags: 'g' },
  zip_us: { label: 'ZIP (US)', pattern: '\\b\\d{5}(-\\d{4})?\\b', flags: 'g' },
  ssn: { label: 'SSN', pattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b', flags: 'g' },
  base64: { label: 'Base64', pattern: '[A-Za-z0-9+/]{4,}={0,2}', flags: 'g' },
  jwt: { label: 'JWT', pattern: 'eyJ[A-Za-z0-9_-]+\\.eyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+', flags: 'g' },
  semver: { label: 'SemVer', pattern: '\\bv?\\d+\\.\\d+\\.\\d+(?:-[\\w.]+)?\\b', flags: 'g' },
  domain: { label: 'Domain', pattern: '(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z]{2,}', flags: 'gi' },
  import_stmt: { label: 'JS Import', pattern: "import\\s+.*\\s+from\\s+['\"].*['\"]", flags: 'gm' },
  env_var: { label: 'Env Variable', pattern: '[A-Z][A-Z0-9_]{2,}', flags: 'g' },
  markdown_link: { label: 'Markdown Link', pattern: '\\[([^\\]]+)\\]\\(([^)]+)\\)', flags: 'g' },
};

export function useRegexPlayground() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [testText, setTestText] = useState('Hello world! test@example.com visited https://example.com on 2024-01-15.');
  const [error, setError] = useState<string | null>(null);

  const matches = useMemo((): RegexMatch[] => {
    if (!pattern) { setError(null); return []; }
    try {
      const regex = new RegExp(pattern, flags);
      setError(null);
      const results: RegexMatch[] = [];
      let m: RegExpExecArray | null;
      const limit = 500;
      if (flags.includes('g')) {
        while ((m = regex.exec(testText)) !== null && results.length < limit) {
          results.push({ index: m.index, length: m[0].length, text: m[0], groups: m.groups || {} });
          if (m[0].length === 0) regex.lastIndex++;
        }
      } else {
        m = regex.exec(testText);
        if (m) results.push({ index: m.index, length: m[0].length, text: m[0], groups: m.groups || {} });
      }
      return results;
    } catch (e) {
      setError((e as Error).message);
      return [];
    }
  }, [pattern, flags, testText]);

  const applyPreset = useCallback((key: string) => {
    const p = COMMON_PATTERNS[key];
    if (p) { setPattern(p.pattern); setFlags(p.flags); }
  }, []);

  const toggleFlag = useCallback((flag: string) => {
    setFlags(prev => prev.includes(flag) ? prev.replace(flag, '') : prev + flag);
  }, []);

  const generateCode = useCallback((): string => {
    if (!pattern) return '// Enter a regex pattern first';
    return `// Regex: /${pattern}/${flags}
const regex = new RegExp(${JSON.stringify(pattern)}, '${flags}');

export function matchAll(text: string) {
  const matches: { index: number; text: string; groups: Record<string, string> }[] = [];
  ${flags.includes('g') ? `let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    matches.push({ index: m.index, text: m[0], groups: m.groups || {} });
  }` : `const m = regex.exec(text);
  if (m) matches.push({ index: m.index, text: m[0], groups: m.groups || {} });`}
  return matches;
}

export function test(text: string): boolean {
  return regex.test(text);
}

export function replace(text: string, replacement: string): string {
  return text.replace(regex, replacement);
}
`;
  }, [pattern, flags]);

  return {
    pattern, setPattern, flags, setFlags, toggleFlag,
    testText, setTestText, error, matches,
    presets: COMMON_PATTERNS, applyPreset,
    generateCode,
  };
}
