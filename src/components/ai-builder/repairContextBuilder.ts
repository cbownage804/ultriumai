/**
 * Repair Context Builder — for auto-heal, sends only the broken file(s) +
 * their direct importers, instead of the full project. Keeps the AI focused
 * and reduces drift / token budget.
 */
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import type { ParsedViteError } from './parseViteErrors';

export interface RepairContext {
  primaryFiles: ProjectFile[];   // The files that actually broke
  importerFiles: ProjectFile[];  // Files that import the broken ones
  totalIncluded: number;
}

function normalizePath(p: string): string {
  return p.replace(/^\.\//, '').replace(/^src\//, '');
}

function findFileForError(errFile: string, all: ProjectFile[]): ProjectFile | null {
  const norm = normalizePath(errFile);
  return (
    all.find(f => f.path === errFile) ||
    all.find(f => f.path.endsWith('/' + errFile)) ||
    all.find(f => normalizePath(f.path) === norm) ||
    null
  );
}

function findImporters(targetPath: string, all: ProjectFile[]): ProjectFile[] {
  // Strip extension for matching `import X from './foo'`
  const baseName = targetPath
    .replace(/^src\//, '')
    .replace(/\.(tsx?|jsx?)$/, '');
  const pattern = new RegExp(
    `import\\s+[^'"\\n]*?from\\s+['"]([^'"]*${baseName.split('/').pop()})['"]`,
    'g',
  );
  return all.filter(f => {
    if (f.path === targetPath) return false;
    if (!/\.(tsx?|jsx?)$/.test(f.path)) return false;
    return pattern.test(f.content);
  });
}

export function buildRepairContext(
  parsedErrors: ParsedViteError[],
  allFiles: ProjectFile[],
  maxFiles = 5,
): RepairContext {
  const primary = new Map<string, ProjectFile>();
  for (const err of parsedErrors) {
    const file = findFileForError(err.file, allFiles);
    if (file) primary.set(file.path, file);
  }

  const importerSet = new Map<string, ProjectFile>();
  for (const p of primary.values()) {
    const importers = findImporters(p.path, allFiles);
    for (const imp of importers) {
      if (!primary.has(imp.path)) importerSet.set(imp.path, imp);
      if (primary.size + importerSet.size >= maxFiles) break;
    }
  }

  return {
    primaryFiles: Array.from(primary.values()),
    importerFiles: Array.from(importerSet.values()).slice(0, Math.max(0, maxFiles - primary.size)),
    totalIncluded: primary.size + importerSet.size,
  };
}
