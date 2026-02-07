import { useCallback } from 'react';
import Editor from '@monaco-editor/react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface CodeEditorProps {
  file: ProjectFile | null;
  onContentChange?: (path: string, content: string) => void;
}

const LANGUAGE_MAP: Record<string, string> = {
  html: 'html',
  css: 'css',
  scss: 'scss',
  javascript: 'javascript',
  typescript: 'typescript',
  json: 'json',
  markdown: 'markdown',
  xml: 'xml',
  plaintext: 'plaintext',
};

export function CodeEditor({ file, onContentChange }: CodeEditorProps) {
  const handleChange = useCallback((value: string | undefined) => {
    if (file && value !== undefined && onContentChange) {
      onContentChange(file.path, value);
    }
  }, [file, onContentChange]);

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Select a file to edit
      </div>
    );
  }

  return (
    <Editor
      height="100%"
      language={LANGUAGE_MAP[file.language] || 'plaintext'}
      value={file.content}
      onChange={handleChange}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        lineHeight: 20,
        padding: { top: 12 },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        automaticLayout: true,
        tabSize: 2,
        renderLineHighlight: 'line',
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        bracketPairColorization: { enabled: true },
        formatOnPaste: true,
        suggest: {
          showWords: true,
          showSnippets: true,
        },
      }}
      loading={
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Loading editor...
        </div>
      }
    />
  );
}
