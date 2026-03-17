import type { ProjectFile } from '@/hooks/useProjectFileSystem';

/**
 * Auto-scaffold Tailwind CSS + PostCSS configuration when the AI generates
 * Tailwind utility classes but doesn't include the config files.
 * 
 * Detects Tailwind usage by scanning for common utility class patterns
 * (bg-*, text-*, flex, grid, p-*, m-*, etc.) in JSX/TSX files.
 */

const TAILWIND_CLASS_PATTERN = /(?:className|class)\s*=\s*["'`][^"'`]*\b(?:bg-|text-|flex|grid|p-\d|m-\d|w-\d|h-\d|rounded|shadow|border|gap-|space-|items-|justify-|font-|hover:|dark:|md:|lg:|sm:)\b/;

const TAILWIND_DIRECTIVE_PATTERN = /@tailwind\s+(?:base|components|utilities)/;

const TAILWIND_CONFIG_TS = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
`;

const POSTCSS_CONFIG_JS = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;

const TAILWIND_CSS_DIRECTIVES = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;

export function scaffoldTailwindConfig(files: ProjectFile[]): { files: ProjectFile[]; scaffolded: string[] } {
  const scaffolded: string[] = [];
  const pathSet = new Set(files.map(f => f.path));

  // Detect Tailwind usage
  const usesTailwind = files.some(f => {
    const ext = f.path.split('.').pop()?.toLowerCase() || '';
    if (!['tsx', 'jsx', 'ts', 'js', 'html', 'css'].includes(ext)) return false;
    return TAILWIND_CLASS_PATTERN.test(f.content) || TAILWIND_DIRECTIVE_PATTERN.test(f.content);
  });

  if (!usesTailwind) {
    return { files, scaffolded };
  }

  const newFiles: ProjectFile[] = [];

  // 1. tailwind.config.ts / tailwind.config.js
  const hasTwConfig = pathSet.has('tailwind.config.ts') || pathSet.has('tailwind.config.js');
  if (!hasTwConfig) {
    newFiles.push({
      path: 'tailwind.config.ts',
      content: TAILWIND_CONFIG_TS,
      language: 'typescript',
    });
    scaffolded.push('tailwind.config.ts');
  }

  // 2. postcss.config.js
  const hasPostCSS = pathSet.has('postcss.config.js') || pathSet.has('postcss.config.ts') || pathSet.has('postcss.config.cjs');
  if (!hasPostCSS) {
    newFiles.push({
      path: 'postcss.config.js',
      content: POSTCSS_CONFIG_JS,
      language: 'javascript',
    });
    scaffolded.push('postcss.config.js');
  }

  // 3. Ensure CSS file has @tailwind directives
  const cssFiles = files.filter(f => f.path.endsWith('.css'));
  const hasDirectives = cssFiles.some(f => TAILWIND_DIRECTIVE_PATTERN.test(f.content));
  
  if (!hasDirectives) {
    const mainCSS = files.find(f => f.path === 'src/index.css');
    if (mainCSS) {
      // Prepend directives to existing CSS
      const idx = files.indexOf(mainCSS);
      if (!TAILWIND_DIRECTIVE_PATTERN.test(mainCSS.content)) {
        files[idx] = {
          ...mainCSS,
          content: TAILWIND_CSS_DIRECTIVES + '\n' + mainCSS.content,
        };
        scaffolded.push('src/index.css (added @tailwind directives)');
      }
    } else if (!pathSet.has('src/index.css')) {
      // Create index.css with directives
      newFiles.push({
        path: 'src/index.css',
        content: TAILWIND_CSS_DIRECTIVES,
        language: 'css',
      });
      scaffolded.push('src/index.css (with @tailwind directives)');

      // Ensure main.tsx imports it
      const mainFile = files.find(f => f.path === 'src/main.tsx');
      if (mainFile && !mainFile.content.includes('index.css')) {
        const idx = files.indexOf(mainFile);
        files[idx] = {
          ...mainFile,
          content: mainFile.content.replace(
            /(import\s.*from\s+['"]\.\/App['"];?\n)/,
            `$1import './index.css';\n`
          ),
        };
      }
    }
  }

  // 4. Ensure package.json has tailwindcss dependency
  const pkgJson = files.find(f => f.path === 'package.json');
  if (pkgJson) {
    try {
      const pkg = JSON.parse(pkgJson.content);
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (!allDeps.tailwindcss) {
        pkg.devDependencies = pkg.devDependencies || {};
        pkg.devDependencies.tailwindcss = '^3.4.0';
        pkg.devDependencies.autoprefixer = pkg.devDependencies.autoprefixer || '^10.4.0';
        pkg.devDependencies.postcss = pkg.devDependencies.postcss || '^8.4.0';
        const idx = files.indexOf(pkgJson);
        files[idx] = { ...pkgJson, content: JSON.stringify(pkg, null, 2) };
        scaffolded.push('package.json (added tailwindcss, autoprefixer, postcss)');
      }
    } catch {}
  }

  return {
    files: [...files, ...newFiles],
    scaffolded,
  };
}
