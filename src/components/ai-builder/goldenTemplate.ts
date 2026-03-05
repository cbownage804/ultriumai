/**
 * Golden Template — canonical base files for every new App Builder project.
 * These files guarantee the app can mount and render a preview.
 */
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

// ── Golden File Contents ──

const GOLDEN_INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

const GOLDEN_MAIN_TSX = `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;

const GOLDEN_APP_TSX = `export default function App() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a14", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 420, padding: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem", color: "#67e8f9" }}>Welcome to your app</h1>
        <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>Describe what you want to build in the chat panel and the AI will generate your project files.</p>
      </div>
    </div>
  );
}
`;

const GOLDEN_INDEX_CSS = `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
`;

const GOLDEN_PACKAGE_JSON = `{
  "name": "app-builder-project",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0"
  }
}`;

/** Canonical golden file map — the base template for every new project */
export const GOLDEN_FILES: Record<string, string> = {
  'index.html': GOLDEN_INDEX_HTML,
  'src/main.tsx': GOLDEN_MAIN_TSX,
  'src/App.tsx': GOLDEN_APP_TSX,
  'src/index.css': GOLDEN_INDEX_CSS,
  'package.json': GOLDEN_PACKAGE_JSON,
};

/** Convert GOLDEN_FILES to ProjectFile[] */
export function getGoldenProjectFiles(): ProjectFile[] {
  const langMap: Record<string, string> = {
    html: 'html', tsx: 'typescriptreact', css: 'css', json: 'json',
  };
  return Object.entries(GOLDEN_FILES).map(([path, content]) => {
    const ext = path.split('.').pop() || '';
    return { path, content, language: langMap[ext] || 'plaintext' };
  });
}

// ── Protected Files ──

/** Files the AI is NOT allowed to delete or fully rewrite unless user explicitly asked */
export const PROTECTED_FILES = [
  'index.html',
  'src/main.tsx',
  // package.json, tailwind.config.*, postcss.config.* are intentionally NOT protected
  // — AI needs to declare dependencies and configure tooling for generated apps
  'vite.config.ts',
  'vite.config.js',
  'tsconfig.json',
  'tsconfig.app.json',
];

/**
 * Merge AI-generated files onto the golden template.
 * Ensures all required boot files exist even if AI didn't produce them.
 */
export function mergeOntoGolden(generatedFiles: ProjectFile[]): ProjectFile[] {
  const merged = [...getGoldenProjectFiles()];

  for (const genFile of generatedFiles) {
    const idx = merged.findIndex(f => f.path === genFile.path);
    if (idx >= 0) {
      merged[idx] = genFile;
    } else {
      merged.push(genFile);
    }
  }

  return merged;
}

/**
 * Pre-commit validation: ensures required boot files are present and valid.
 * Returns errors if any required file is missing or malformed.
 */
export function validateRequiredFiles(files: ProjectFile[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 1. index.html must exist with id="root"
  const indexFile = files.find(f => f.path === 'index.html');
  if (!indexFile) {
    errors.push('Missing index.html');
  } else if (!/id\s*=\s*["']root["']/i.test(indexFile.content)) {
    errors.push('index.html missing <div id="root">');
  }

  // 2. src/main.tsx must exist with createRoot
  const mainFile = files.find(f => f.path === 'src/main.tsx');
  if (!mainFile) {
    errors.push('Missing src/main.tsx');
  } else if (!/createRoot/.test(mainFile.content) || !/\.render\s*\(/.test(mainFile.content)) {
    errors.push('src/main.tsx missing createRoot(...).render(...)');
  }

  // 3. src/App.tsx must exist
  if (!files.find(f => f.path === 'src/App.tsx')) {
    errors.push('Missing src/App.tsx');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check if a project has user-generated files (beyond golden defaults).
 * Used to decide whether to show the new-project placeholder.
 */
export function hasUserGeneratedFiles(files: ProjectFile[]): boolean {
  if (files.length === 0) return false;
  // If files differ from golden defaults, user has generated content
  const goldenPaths = Object.keys(GOLDEN_FILES);
  // Has extra files beyond golden
  if (files.some(f => !goldenPaths.includes(f.path))) return true;
  // Or any golden file content differs from default
  return files.some(f => {
    const golden = GOLDEN_FILES[f.path];
    return golden !== undefined && f.content !== golden;
  });
}
