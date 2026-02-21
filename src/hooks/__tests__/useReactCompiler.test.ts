import { describe, it, expect } from 'vitest';

/**
 * Phase 83: Tests for useReactCompiler transpileFile and stripTypeAnnotations.
 * 
 * We test the pure logic extracted from the hook.
 */

// ── stripTypeAnnotations (bracket-depth counter, Phase 73) ──

function stripTypeAnnotations(code: string): string {
  let result = code;

  const lines = result.split('\n');
  const outputLines: string[] = [];
  let stripping = false;
  let braceDepth = 0;

  for (const line of lines) {
    if (!stripping) {
      if (/^(?:export\s+)?(?:interface|enum)\s+\w+/.test(line.trim()) ||
          /^(?:export\s+)?type\s+\w+\s*=\s*\{/.test(line.trim())) {
        stripping = true;
        braceDepth = 0;
        for (const ch of line) {
          if (ch === '{') braceDepth++;
          if (ch === '}') braceDepth--;
        }
        if (braceDepth <= 0) stripping = false;
        continue;
      }
      outputLines.push(line);
    } else {
      for (const ch of line) {
        if (ch === '{') braceDepth++;
        if (ch === '}') braceDepth--;
      }
      if (braceDepth <= 0) stripping = false;
    }
  }
  result = outputLines.join('\n');


  result = result.replace(/^(?:export\s+)?type\s+\w+\s*=\s*[^;{]+;/gm, '');

  // Strip return type annotations: ): Type => or ): Type {
  result = result.replace(
    /\)\s*:\s*[A-Za-z_][\w.]*(?:<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?(?:\[\])?(?:\s*[|&]\s*[A-Za-z_][\w.]*(?:<(?:[^<>]|<[^<>]*>)*>)?(?:\[\])?)*(?=\s*(?:=>|\{))/g,
    ')'
  );

  // Pass 1: Strip `: React.XXX<...>` annotations
  result = result.replace(
    /:\s*React\.(?:FC|ReactNode|MouseEvent|ChangeEvent|FormEvent|CSSProperties|RefObject|Dispatch|SetStateAction|MutableRefObject|HTMLAttributes|ComponentProps|ComponentType|ElementType|ReactElement|JSX\.Element)(?:<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?/g,
    ''
  );

  // Pass 2: Strip `: primitiveType` annotations with unions/intersections
  result = result.replace(
    /:\s*(?:string|number|boolean|void|any|null|undefined|never|unknown|object)(?:\s*[|&]\s*(?:string|number|boolean|void|any|null|undefined|never|unknown|object))*(?=\s*[=,;)\]}])/g,
    ''
  );

  // Pass 3: Strip `: UppercaseType` annotations (including dotted paths like JSX.Element)
  // Uses callback to protect object literal properties like { icon: Star }
  result = result.replace(
    /:\s*[A-Z][\w.]*(?:<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?(?:\[\])?(?:\s*[|&]\s*(?:string|number|boolean|null|undefined|void|never|unknown|[A-Z][\w.]*)(?:\[\])?)*(?=\s*[=,;)\]}])/g,
    (match, offset) => {
      // Check if this looks like an object property (preceded by identifier at start of key)
      const before = result.slice(Math.max(0, offset - 30), offset);
      if (/[{,]\s*\w+\s*$/.test(before)) return match; // protect object property
      return '';
    }
  );

  // Safety pass: strip generics after known React hooks and built-in constructors (handles nesting)
  result = result.replace(
    /\b(useState|useRef|useCallback|useMemo|useReducer|useContext|createContext|forwardRef|memo|lazy|useImperativeHandle|useLayoutEffect|Set|Map|Array|Promise|Record)\s*<((?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*)>/g,
    '$1'
  );
  // Broad generic strip (only after identifiers, not JSX)
  result = result.replace(/(?<=\w)<(?:[A-Za-z][\w.]*(?:\[\])?(?:\s*\|\s*[\w.]+(?:\[\])?)*(?:\s*,\s*[\w.]+(?:\[\])?(?:\s*\|\s*[\w.]+)?)*)>/g, '');
  result = result.replace(/\s+as\s+\w+(?:<[^>]+>)?/g, '');
  result = result.replace(/\s+satisfies\s+\w+/g, '');
  return result;
}

describe('stripTypeAnnotations', () => {
  it('removes a multi-line interface without affecting following function', () => {
    const code = `interface Props {
  children: React.ReactNode;
  title: string;
}
function App() {
  return <div />;
}`;
    const result = stripTypeAnnotations(code);
    expect(result).toContain('function App()');
    expect(result).not.toContain('interface Props');
    expect(result).toContain('return <div />');
  });

  it('removes single-line interface', () => {
    const code = `interface Foo { x: string }
const a = 1;`;
    const result = stripTypeAnnotations(code);
    expect(result).not.toContain('interface Foo');
    expect(result).toContain('const a = 1;');
  });

  it('removes exported interface', () => {
    const code = `export interface Config {
  url: string;
  key: string;
}
export function init() {}`;
    const result = stripTypeAnnotations(code);
    expect(result).not.toContain('interface Config');
    expect(result).toContain('export function init()');
  });

  it('removes enum declarations', () => {
    const code = `enum Status { Active, Inactive }
const x = 1;`;
    const result = stripTypeAnnotations(code);
    expect(result).not.toContain('enum Status');
    expect(result).toContain('const x = 1;');
  });

  it('removes single-line type alias', () => {
    const code = `type ID = string | number;
const y = 2;`;
    const result = stripTypeAnnotations(code);
    expect(result).not.toContain('type ID');
    expect(result).toContain('const y = 2;');
  });

  it('removes "as Type" assertions', () => {
    const code = `const el = document.getElementById('root') as HTMLElement;`;
    const result = stripTypeAnnotations(code);
    expect(result).not.toContain('as HTMLElement');
    expect(result).toContain(`document.getElementById('root')`);
  });

  it('preserves function body with braces after interface (Phase 73 regression)', () => {
    const code = `interface Props { x: string }
function App() { return <div /> }`;
    const result = stripTypeAnnotations(code);
    expect(result).toContain('function App()');
    expect(result).toContain('return <div />');
  });

  it('handles nested braces in interfaces', () => {
    const code = `interface Config {
  nested: {
    deep: {
      value: string;
    };
  };
}
const cfg = {};`;
    const result = stripTypeAnnotations(code);
    expect(result).not.toContain('interface Config');
    expect(result).toContain('const cfg = {};');
  });

  it('strips concrete generics like <boolean>, <HTMLDivElement>', () => {
    const code = `const [open, setOpen] = useState<boolean>(false);
const ref = useRef<HTMLDivElement>(null);`;
    const result = stripTypeAnnotations(code);
    expect(result).toContain('useState(false)');
    expect(result).toContain('useRef(null)');
    expect(result).not.toContain('<boolean>');
    expect(result).not.toContain('<HTMLDivElement>');
  });

  it('strips multi-param generics like <string, number>', () => {
    const code = `const m = new Map<string, number>();`;
    const result = stripTypeAnnotations(code);
    expect(result).toContain('new Map()');
    expect(result).not.toContain('<string, number>');
  });

  it('does NOT strip JSX tags', () => {
    const code = `return <div><span>hello</span></div>;`;
    const result = stripTypeAnnotations(code);
    expect(result).toContain('<div>');
    expect(result).toContain('<span>');
  });

  // ── New test cases for comprehensive type stripping ──

  it('strips dotted type paths like JSX.Element fully', () => {
    const code = `const el: JSX.Element = <div />;`;
    const result = stripTypeAnnotations(code);
    expect(result).not.toContain('JSX');
    expect(result).not.toContain('.Element');
    expect(result).toContain('const el = <div />;');
  });

  it('strips nested generics like SetStateAction<boolean>', () => {
    const code = `const [val, setVal] = useState<SetStateAction<boolean>>(false);`;
    const result = stripTypeAnnotations(code);
    expect(result).toContain('useState(false)');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });

  it('strips function return type annotations', () => {
    const code = `function App(): React.ReactElement {
  return <div />;
}`;
    const result = stripTypeAnnotations(code);
    expect(result).toContain('function App() {');
    expect(result).not.toContain('ReactElement');
  });

  it('strips arrow function return type annotations', () => {
    const code = `const App = (): JSX.Element => {
  return <div />;
}`;
    const result = stripTypeAnnotations(code);
    expect(result).toContain('const App = () => {');
    expect(result).not.toContain('JSX');
  });

  it('strips union types like string | number | null', () => {
    const code = `const x: string | number | null = getValue();`;
    const result = stripTypeAnnotations(code);
    expect(result).not.toContain('string');
    expect(result).not.toContain('number');
    expect(result).not.toContain('null');
    expect(result).toContain('const x = getValue();');
  });

  it('does NOT strip object literal property values like { icon: Star }', () => {
    const code = `const config = { icon: Star, label: "Hello" };`;
    const result = stripTypeAnnotations(code);
    expect(result).toContain('icon: Star');
    expect(result).toContain('label: "Hello"');
  });

  it('strips React.FC with generic parameter', () => {
    const code = `const App: React.FC<Props> = ({ children }) => {
  return <div>{children}</div>;
}`;
    const result = stripTypeAnnotations(code);
    expect(result).not.toContain('React.FC');
    expect(result).toContain('const App = ({ children }) => {');
  });
});

// ── Anonymous default export detection (Phase 71) ──

function transformDefaultExports(code: string): string {
  let result = code;
  result = result.replace(
    /^export\s+default\s+((?:\([^)]*\)|[a-zA-Z_$]\w*)\s*=>)/gm,
    'const __DefaultExport = $1'
  );
  result = result.replace(
    /^export\s+default\s+function\s*\(/gm,
    'const __DefaultExport = function('
  );
  return result;
}

function detectAnonymousDefault(content: string): boolean {
  return /export\s+default\s+(?:\([^)]*\)|[a-zA-Z_$]\w*)\s*=>/.test(content) ||
         /export\s+default\s+function\s*\(/.test(content);
}

describe('Anonymous default export handling (Phase 71)', () => {
  it('transforms arrow function default export', () => {
    const code = `export default () => <div>Hello</div>`;
    const result = transformDefaultExports(code);
    expect(result).toBe('const __DefaultExport = () => <div>Hello</div>');
  });

  it('transforms arrow with params', () => {
    const code = `export default (props) => <div>{props.name}</div>`;
    const result = transformDefaultExports(code);
    expect(result).toContain('const __DefaultExport = (props) =>');
  });

  it('transforms anonymous function default', () => {
    const code = `export default function() { return <div />; }`;
    const result = transformDefaultExports(code);
    expect(result).toContain('const __DefaultExport = function()');
  });

  it('does NOT transform named function default', () => {
    const code = `export default function App() { return <div />; }`;
    const result = transformDefaultExports(code);
    expect(result).not.toContain('__DefaultExport');
  });

  it('detects anonymous arrow export', () => {
    expect(detectAnonymousDefault('export default () => <div />')).toBe(true);
    expect(detectAnonymousDefault('export default (props) => null')).toBe(true);
  });

  it('detects anonymous function export', () => {
    expect(detectAnonymousDefault('export default function() {}')).toBe(true);
  });

  it('does not detect named export as anonymous', () => {
    expect(detectAnonymousDefault('export default function App() {}')).toBe(false);
  });
});
