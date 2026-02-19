import { useState, useCallback } from 'react';

// Official Tailwind CSS class sort order (simplified categories)
const ORDER: string[] = [
  // Layout
  'container','box-','block','inline','flex','grid','table','hidden','contents','flow-root',
  'float-','clear-','isolat','object-','overflow','overscroll','position','static','fixed','absolute','relative','sticky',
  'inset','top-','right-','bottom-','left-','z-',
  // Flexbox & Grid
  'basis-','flex-','grow','shrink','order-','grid-cols','col-','grid-rows','row-','grid-flow','auto-cols','auto-rows',
  'gap-','justify-','content-','items-','self-','place-',
  // Spacing
  'p-','px-','py-','pt-','pr-','pb-','pl-','ps-','pe-','m-','mx-','my-','mt-','mr-','mb-','ml-','ms-','me-','space-',
  // Sizing
  'w-','min-w-','max-w-','h-','min-h-','max-h-','size-',
  // Typography
  'font-','text-','antialiased','subpixel','italic','not-italic','tracking-','leading-','list-',
  'decoration-','underline','overline','line-through','no-underline',
  'truncate','break-','whitespace-','hyphens-','indent-','align-','uppercase','lowercase','capitalize','normal-case',
  // Backgrounds
  'bg-','from-','via-','to-','gradient-',
  // Borders
  'rounded','border','divide-','outline-','ring-',
  // Effects
  'shadow','opacity-','mix-blend-','backdrop-',
  // Filters
  'blur','brightness','contrast','drop-shadow','grayscale','hue-rotate','invert','saturate','sepia',
  // Tables
  'border-collapse','border-separate','border-spacing',
  // Transitions & Animation
  'transition','duration-','ease-','delay-','animate-',
  // Transforms
  'scale-','rotate-','translate-','skew-','origin-','transform',
  // Interactivity
  'accent-','appearance-','cursor-','caret-','pointer-events-','resize','scroll-','snap-','touch-','select-','will-change',
  // SVG
  'fill-','stroke-',
  // Accessibility
  'sr-only','not-sr-only',
  // States (always last via variants)
  'hover:','focus:','active:','disabled:','group-','peer-','first:','last:','odd:','even:','dark:','sm:','md:','lg:','xl:','2xl:',
];

function getOrderIndex(cls: string): number {
  // Strip variants for ordering
  const base = cls.includes(':') ? cls.split(':').pop()! : cls;
  for (let i = 0; i < ORDER.length; i++) {
    if (base.startsWith(ORDER[i]) || base === ORDER[i].replace('-','')) return i;
  }
  return ORDER.length; // Unknown classes go to end
}

function sortClasses(classStr: string): string {
  const classes = classStr.trim().split(/\s+/).filter(Boolean);
  return classes.sort((a, b) => getOrderIndex(a) - getOrderIndex(b)).join(' ');
}

export interface SortResult {
  file: string;
  line: number;
  original: string;
  sorted: string;
  changed: boolean;
}

export function useTailwindClassSorter() {
  const [input, setInput] = useState('text-white p-4 flex items-center bg-blue-500 rounded-lg hover:bg-blue-600 mb-2 font-bold shadow-lg');
  const [results, setResults] = useState<SortResult[]>([]);

  const sortSingle = useCallback((): string => {
    return sortClasses(input);
  }, [input]);

  const scanCode = useCallback((code: string, filename = 'input.tsx'): SortResult[] => {
    const lines = code.split('\n');
    const r: SortResult[] = [];
    const classNameRegex = /className=["'`]([^"'`]+)["'`]/g;
    const cnRegex = /cn\(["'`]([^"'`]+)["'`]/g;

    lines.forEach((line, i) => {
      for (const regex of [classNameRegex, cnRegex]) {
        regex.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = regex.exec(line)) !== null) {
          const original = m[1];
          const sorted = sortClasses(original);
          r.push({ file: filename, line: i + 1, original, sorted, changed: original !== sorted });
        }
      }
    });
    setResults(r);
    return r;
  }, []);

  const generateCode = useCallback((): string => {
    const sorted = sortSingle();
    return `// Tailwind Class Sorter
// Original: ${input}
// Sorted:   ${sorted}

// ESLint plugin equivalent config:
// .eslintrc.js
module.exports = {
  plugins: ['tailwindcss'],
  rules: {
    'tailwindcss/classnames-order': 'warn',
  },
};

// Prettier plugin (recommended):
// npm install -D prettier-plugin-tailwindcss
// .prettierrc
{
  "plugins": ["prettier-plugin-tailwindcss"]
}
`;
  }, [input, sortSingle]);

  return { input, setInput, sortSingle, scanCode, results, generateCode };
}
