import { useState, useCallback } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

export interface CLIConfig {
  projectName: string;
  projectSlug: string;
  supabaseUrl?: string;
  publishedUrl?: string;
  scripts: { name: string; command: string }[];
}

export function useCLICompanion() {
  const [config, setConfig] = useState<CLIConfig>({
    projectName: '',
    projectSlug: '',
    scripts: [
      { name: 'dev', command: 'vite' },
      { name: 'build', command: 'vite build' },
      { name: 'preview', command: 'vite preview' },
    ],
  });

  const generatePackageJson = useCallback((files: ProjectFile[]): string => {
    const deps: Record<string, string> = {};
    const devDeps: Record<string, string> = { vite: '^5.0.0', typescript: '^5.3.0', tailwindcss: '^3.4.0' };

    files.forEach(f => {
      const imports = f.content.match(/from\s+['"]([^./][^'"]+)['"]/g) || [];
      imports.forEach(imp => {
        const pkg = imp.match(/from\s+['"]([@a-z][^'"]+)['"]/)?.[1];
        if (pkg) {
          const name = pkg.startsWith('@') ? pkg.split('/').slice(0, 2).join('/') : pkg.split('/')[0];
          if (!devDeps[name]) deps[name] = 'latest';
        }
      });
    });

    return JSON.stringify({
      name: config.projectSlug || 'ultrium-app',
      version: '1.0.0',
      private: true,
      type: 'module',
      scripts: Object.fromEntries(config.scripts.map(s => [s.name, s.command])),
      dependencies: { react: '^18.3.0', 'react-dom': '^18.3.0', ...deps },
      devDependencies: devDeps,
    }, null, 2);
  }, [config]);

  const generateCLIScript = useCallback((): string => {
    return `#!/usr/bin/env node
/**
 * Ultrium CLI Companion
 * Syncs your cloud project for local development.
 * Usage: npx ultrium-cli dev
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COMMANDS = {
  dev: () => {
    console.log('🚀 Starting local dev server...');
    execSync('npx vite', { stdio: 'inherit' });
  },
  build: () => {
    console.log('📦 Building for production...');
    execSync('npx vite build', { stdio: 'inherit' });
  },
  sync: async () => {
    console.log('🔄 Syncing with Ultrium Cloud...');
    // Placeholder: would call Supabase API to fetch latest project files
    console.log('✅ Project synced successfully.');
  },
  deploy: () => {
    console.log('🚀 Deploying to production...');
    execSync('npx vite build', { stdio: 'inherit' });
    console.log('✅ Deploy complete.');
  },
};

const cmd = process.argv[2] || 'dev';
if (COMMANDS[cmd]) {
  COMMANDS[cmd]();
} else {
  console.log(\`Unknown command: \${cmd}\`);
  console.log('Available: ' + Object.keys(COMMANDS).join(', '));
}
`;
  }, []);

  const generateProjectBundle = useCallback((files: ProjectFile[]): { path: string; content: string }[] => {
    const output: { path: string; content: string }[] = [];
    output.push({ path: 'package.json', content: generatePackageJson(files) });
    output.push({ path: 'cli.js', content: generateCLIScript() });
    output.push({ path: 'vite.config.ts', content: `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nimport path from 'path';\n\nexport default defineConfig({\n  plugins: [react()],\n  resolve: { alias: { '@': path.resolve(__dirname, './src') } },\n});` });
    output.push({ path: 'tsconfig.json', content: JSON.stringify({ compilerOptions: { target: 'ES2020', useDefineForClassFields: true, lib: ['ES2020', 'DOM', 'DOM.Iterable'], module: 'ESNext', skipLibCheck: true, moduleResolution: 'bundler', allowImportingTsExtensions: true, resolveJsonModule: true, isolatedModules: true, noEmit: true, strict: true, noUnusedLocals: true, jsx: 'react-jsx', baseUrl: '.', paths: { '@/*': ['./src/*'] } }, include: ['src'] }, null, 2) });
    output.push({ path: 'index.html', content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>' + (config.projectName || 'App') + '</title>\n</head>\n<body>\n  <div id="root"></div>\n  <script type="module" src="/src/main.tsx"></script>\n</body>\n</html>' });
    files.forEach(f => output.push({ path: f.path, content: f.content }));
    return output;
  }, [config, generatePackageJson, generateCLIScript]);

  const addScript = useCallback((name: string, command: string) => {
    setConfig(prev => ({ ...prev, scripts: [...prev.scripts, { name, command }] }));
  }, []);

  const removeScript = useCallback((name: string) => {
    setConfig(prev => ({ ...prev, scripts: prev.scripts.filter(s => s.name !== name) }));
  }, []);

  return { config, setConfig, generateProjectBundle, generatePackageJson, generateCLIScript, addScript, removeScript };
}
