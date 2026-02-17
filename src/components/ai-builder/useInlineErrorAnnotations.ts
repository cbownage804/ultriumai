import { useCallback, useState } from 'react';
import type { SmokeWarning } from './usePostBuildSmokeTest';

export interface EditorAnnotation {
  file: string;
  line: number;
  column?: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Inline Error Annotations: Converts smoke test warnings
 * into Monaco editor marker decorations.
 */
export function useInlineErrorAnnotations() {
  const [annotations, setAnnotations] = useState<EditorAnnotation[]>([]);

  /** Convert smoke warnings into editor-compatible annotations. */
  const updateAnnotations = useCallback((warnings: SmokeWarning[], errors: SmokeWarning[]) => {
    const all: EditorAnnotation[] = [];

    for (const w of [...errors, ...warnings]) {
      all.push({
        file: w.file,
        line: w.line || 1,
        message: w.message,
        severity: w.severity === 'error' ? 'error' : 'warning',
      });
    }

    setAnnotations(all);
  }, []);

  /** Get annotations for a specific file (for CodeEditor integration). */
  const getFileAnnotations = useCallback((filePath: string): EditorAnnotation[] => {
    return annotations.filter(a => a.file === filePath || filePath.endsWith(a.file));
  }, [annotations]);

  /** Get Monaco-compatible markers for a file. */
  const getMonacoMarkers = useCallback((filePath: string) => {
    return getFileAnnotations(filePath).map(a => ({
      startLineNumber: a.line,
      startColumn: a.column || 1,
      endLineNumber: a.line,
      endColumn: 1000, // Highlight full line
      message: a.message,
      severity: a.severity === 'error' ? 8 : a.severity === 'warning' ? 4 : 2, // Monaco MarkerSeverity
    }));
  }, [getFileAnnotations]);

  const clearAnnotations = useCallback(() => setAnnotations([]), []);

  return {
    annotations,
    updateAnnotations,
    getFileAnnotations,
    getMonacoMarkers,
    clearAnnotations,
    totalErrors: annotations.filter(a => a.severity === 'error').length,
    totalWarnings: annotations.filter(a => a.severity === 'warning').length,
  };
}
