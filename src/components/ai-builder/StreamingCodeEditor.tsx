import { useState, useEffect, useMemo, type MutableRefObject } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import type { RemoteCursor } from './CodeEditor';

// Lazy import to avoid circular deps
import { CodeEditor } from './CodeEditor';

interface StreamingCodeEditorProps {
  isStreamingPreview: boolean;
  partialFilesRef: MutableRefObject<ProjectFile[]>;
  activeFile: ProjectFile | null;
  activeFilePath: string | null;
  onContentChange: (path: string, content: string) => void;
  remoteCursors: RemoteCursor[];
  onCursorChange: (line: number, column: number) => void;
  onInlineAIAction?: (action: string, selectedCode: string, filePath: string) => void;
  /** Callback to notify parent of the current streaming file path */
  onStreamingFileChange?: (path: string | null) => void;
}

/**
 * Thin wrapper that owns the 400ms polling of partialFilesRef,
 * keeping the workspace component free from streaming-related re-renders.
 */
export function StreamingCodeEditor({
  isStreamingPreview,
  partialFilesRef,
  activeFile,
  activeFilePath,
  onContentChange,
  remoteCursors,
  onCursorChange,
  onInlineAIAction,
  onStreamingFileChange,
}: StreamingCodeEditorProps) {
  const [editorStreamFiles, setEditorStreamFiles] = useState<ProjectFile[]>([]);

  // Poll partialFilesRef locally — only this component re-renders
  useEffect(() => {
    if (!isStreamingPreview) {
      setEditorStreamFiles([]);
      onStreamingFileChange?.(null);
      return;
    }
     // Phase 7: Deep equality check — only setState if file count or last path changed
     const interval = setInterval(() => {
       const files = partialFilesRef.current;
       setEditorStreamFiles(prev => {
         if (prev === files) return prev;
         if (prev.length === files.length && prev.length > 0 && prev[prev.length - 1]?.path === files[files.length - 1]?.path) return prev;
         return files;
       });
     }, 3000);
    return () => clearInterval(interval);
  }, [isStreamingPreview, partialFilesRef, onStreamingFileChange]);

  const streamingFilePath = isStreamingPreview && editorStreamFiles.length > 0
    ? editorStreamFiles[editorStreamFiles.length - 1]?.path || null
    : null;

  // Notify parent of streaming file path changes (for tab bar)
  useEffect(() => {
    onStreamingFileChange?.(streamingFilePath);
  }, [streamingFilePath, onStreamingFileChange]);

  const editorFile = useMemo(() => {
    if (isStreamingPreview && streamingFilePath) {
      const streamFile = editorStreamFiles.find(f => f.path === streamingFilePath);
      if (streamFile) return streamFile;
    }
    return activeFile;
  }, [isStreamingPreview, streamingFilePath, editorStreamFiles, activeFile]);

  return (
    <CodeEditor
      file={editorFile}
      onContentChange={onContentChange}
      remoteCursors={remoteCursors}
      onCursorChange={onCursorChange}
      onInlineAIAction={onInlineAIAction}
    />
  );
}
