import type { ProjectFile } from '@/hooks/useProjectFileSystem';

/**
 * Auto-generate stub components for missing relative imports.
 * Prevents compilation failures when the AI references a component
 * it hasn't generated yet. The stub renders a visible placeholder
 * so the rest of the app can mount and render.
 */
export function generateMissingImportStubs(files: ProjectFile[]): { files: ProjectFile[]; stubs: string[] } {
  const stubs: string[] = [];
  const existingPaths = new Set(files.map(f => f.path));
  const newFiles: ProjectFile[] = [];

  for (const file of files) {
    const ext = file.path.split('.').pop()?.toLowerCase() || '';
    if (!['ts', 'tsx', 'js', 'jsx'].includes(ext)) continue;

    // Find all relative imports
    const importRegex = /import\s+(?:(\w+)|{([^}]+)})\s+from\s+['"](\.[^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(file.content)) !== null) {
      const defaultImport = match[1];
      const namedImports = match[2];
      const importPath = match[3];
      
      const resolved = resolveImportPath(file.path, importPath);
      if (!resolved) continue;

      // Check if any extension variant exists
      const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
      const exists = extensions.some(ext => existingPaths.has(resolved + ext));
      if (exists) continue;

      // Determine stub file path
      const stubPath = resolved.match(/\.(tsx?|jsx?)$/) ? resolved : resolved + '.tsx';
      if (existingPaths.has(stubPath)) continue;

      // Generate stub content
      const componentName = defaultImport || extractComponentName(stubPath);
      const stubContent = generateStubContent(componentName, namedImports, stubPath);

      newFiles.push({
        path: stubPath,
        content: stubContent,
        language: stubPath.endsWith('.tsx') || stubPath.endsWith('.jsx') ? 'typescriptreact' : 'typescript',
      });
      existingPaths.add(stubPath);
      stubs.push(`${stubPath} (stub for import from ${file.path})`);
    }
  }

  return {
    files: [...files, ...newFiles],
    stubs,
  };
}

function resolveImportPath(fromPath: string, importPath: string): string | null {
  const fromDir = fromPath.split('/').slice(0, -1);
  const parts = importPath.split('/');

  const resolved = [...fromDir];
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') {
      if (resolved.length === 0) return null;
      resolved.pop();
    } else {
      resolved.push(part);
    }
  }

  return resolved.join('/');
}

function extractComponentName(filePath: string): string {
  const fileName = filePath.split('/').pop() || 'Component';
  const name = fileName.replace(/\.(tsx?|jsx?)$/, '');
  // PascalCase
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function generateStubContent(defaultExportName: string | null, namedImports: string | undefined, filePath: string): string {
  const lines: string[] = [
    `import React from 'react';`,
    ``,
  ];

  // Generate named exports as no-op values
  if (namedImports) {
    const names = namedImports.split(',').map(s => s.trim().split(/\s+as\s+/)[0]).filter(Boolean);
    for (const name of names) {
      // If it starts with uppercase, treat as component; otherwise as a constant
      if (/^[A-Z]/.test(name)) {
        lines.push(`export function ${name}({ children, ...props }: any) {`);
        lines.push(`  return <div data-stub="${name}" {...props}>{children}</div>;`);
        lines.push(`}`);
      } else if (/^use[A-Z]/.test(name)) {
        // Hook stub
        lines.push(`export function ${name}(..._args: any[]) { return {}; }`);
      } else {
        lines.push(`export const ${name} = undefined;`);
      }
      lines.push(``);
    }
  }

  // Default export
  if (defaultExportName && /^[A-Z]/.test(defaultExportName)) {
    lines.push(`export default function ${defaultExportName}({ children, ...props }: any) {`);
    lines.push(`  return (`);
    lines.push(`    <div data-stub="${defaultExportName}" style={{ padding: '16px', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: '13px' }} {...props}>`);
    lines.push(`      {children || '${defaultExportName} (stub)'}`);
    lines.push(`    </div>`);
    lines.push(`  );`);
    lines.push(`}`);
  } else if (defaultExportName) {
    lines.push(`export default ${defaultExportName};`);
    lines.push(`const ${defaultExportName} = {};`);
  }

  return lines.join('\n') + '\n';
}
