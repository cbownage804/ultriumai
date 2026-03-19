import { useCallback, useRef, useState, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import { Sparkles, Wand2, TestTube2, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { preCompileValidate } from './preCompileValidation';

export interface RemoteCursor {
  userId: string;
  email: string;
  color: string;
  line: number;
  column: number;
}

interface CodeEditorProps {
  file: ProjectFile | null;
  onContentChange?: (path: string, content: string) => void;
  remoteCursors?: RemoteCursor[];
  onCursorChange?: (line: number, column: number) => void;
  onInlineAIAction?: (action: string, selection: string, filePath: string) => void;
  /** Phase 65: Cmd+I inline edit trigger */
  onTriggerInlineEdit?: (filePath: string, selectedCode: string, startLine: number, endLine: number) => void;
  /** All project files — used for go-to-definition */
  projectFiles?: ProjectFile[];
  /** Navigate to a file by path */
  onNavigateToFile?: (path: string) => void;
}

const LANGUAGE_MAP: Record<string, string> = {
  html: 'html', css: 'css', scss: 'scss', javascript: 'javascript',
  typescript: 'typescript', json: 'json', markdown: 'markdown', xml: 'xml', plaintext: 'plaintext',
};

const AI_ACTIONS = [
  { id: 'explain', label: 'Explain', icon: FileText },
  { id: 'refactor', label: 'Refactor', icon: Wand2 },
  { id: 'test', label: 'Generate Test', icon: TestTube2 },
  { id: 'fix', label: 'Fix', icon: Sparkles },
];

export function CodeEditor({ file, onContentChange, remoteCursors = [], onCursorChange, onInlineAIAction, onTriggerInlineEdit, projectFiles = [], onNavigateToFile }: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
  const lintTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [showAIBar, setShowAIBar] = useState(false);
  const [aiBarPosition, setAIBarPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');

  const handleChange = useCallback((value: string | undefined) => {
    if (file && value !== undefined && onContentChange) {
      onContentChange(file.path, value);
    }

    // Wave 2 Step 5: Lint-on-type with 500ms debounce
    if (file && value !== undefined && monacoRef.current && editorRef.current) {
      if (lintTimerRef.current) clearTimeout(lintTimerRef.current);
      lintTimerRef.current = setTimeout(() => {
        const monaco = monacoRef.current;
        const model = editorRef.current?.getModel();
        if (!monaco || !model) return;
        const issues = preCompileValidate([{ path: file.path, content: value, language: file.language }]);
        const markers = issues.map(issue => ({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 1000,
          message: issue.message,
          severity: issue.severity === 'error' ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
        }));
        monaco.editor.setModelMarkers(model, 'precompile-lint', markers);
      }, 500);
    }
  }, [file, onContentChange]);

  // Update remote cursor decorations
  const updateRemoteCursors = useCallback(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco || remoteCursors.length === 0) {
      if (editor && decorationsRef.current.length > 0) {
        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
      }
      return;
    }

    const newDecorations = remoteCursors.map(cursor => ({
      range: new monaco.Range(cursor.line, cursor.column, cursor.line, cursor.column + 1),
      options: {
        className: `remote-cursor-${cursor.userId.slice(0, 8)}`,
        beforeContentClassName: `remote-cursor-line`,
        hoverMessage: { value: `**${cursor.email}**` },
        afterContentClassName: undefined,
        stickiness: 1,
      },
    }));

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  }, [remoteCursors]);

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Custom dark theme to match workspace
    monaco.editor.defineTheme('builder-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '4a5568', fontStyle: 'italic' },
        { token: 'keyword', foreground: '7dd3fc' },
        { token: 'string', foreground: '86efac' },
        { token: 'number', foreground: 'fbbf24' },
        { token: 'type', foreground: 'c084fc' },
        { token: 'tag', foreground: '67e8f9' },
        { token: 'attribute.name', foreground: 'a5b4fc' },
        { token: 'attribute.value', foreground: '86efac' },
      ],
      colors: {
        'editor.background': '#0d0d14',
        'editor.foreground': '#e2e8f0',
        'editor.lineHighlightBackground': '#ffffff06',
        'editor.selectionBackground': '#22d3ee20',
        'editorCursor.foreground': '#22d3ee',
        'editorLineNumber.foreground': '#334155',
        'editorLineNumber.activeForeground': '#64748b',
        'editorIndentGuide.background1': '#1e293b30',
        'editorIndentGuide.activeBackground1': '#334155',
        'editor.selectionHighlightBackground': '#22d3ee10',
        'editorBracketMatch.background': '#22d3ee15',
        'editorBracketMatch.border': '#22d3ee40',
      },
    });
    monaco.editor.setTheme('builder-dark');

    // Inject remote cursor CSS
    const style = document.createElement('style');
    style.textContent = `
      .remote-cursor-line {
        border-left: 2px solid var(--cursor-color, #8b5cf6);
        margin-left: -1px;
      }
    `;
    document.head.appendChild(style);

    // Track cursor position for collaboration
    editor.onDidChangeCursorPosition((e: any) => {
      onCursorChange?.(e.position.lineNumber, e.position.column);
    });

    // Track selection for inline AI actions
    editor.onDidChangeCursorSelection((e: any) => {
      const selection = editor.getModel()?.getValueInRange(e.selection);
      if (selection && selection.trim().length > 3) {
        setSelectedText(selection);
        // Get pixel position of selection end
        const endPos = e.selection.getEndPosition();
        const coords = editor.getScrolledVisiblePosition(endPos);
        if (coords) {
          const editorDom = editor.getDomNode();
          const rect = editorDom?.getBoundingClientRect();
          if (rect) {
            setAIBarPosition({
              top: coords.top + rect.top - 36,
              left: coords.left + rect.left,
            });
            setShowAIBar(true);
          }
        }
      } else {
        setShowAIBar(false);
      }
    });

    // Register HTML/CSS/JS completions for common patterns
    monaco.languages.registerCompletionItemProvider('html', {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber, startColumn: word.startColumn,
          endLineNumber: position.lineNumber, endColumn: word.endColumn,
        };
        return {
          suggestions: [
            { label: 'div.flex', kind: monaco.languages.CompletionItemKind.Snippet, insertText: '<div class="flex items-center gap-2">\n\t$0\n</div>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, detail: 'Flex container' },
            { label: 'div.grid', kind: monaco.languages.CompletionItemKind.Snippet, insertText: '<div class="grid grid-cols-${1:3} gap-4">\n\t$0\n</div>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, detail: 'Grid container' },
            { label: 'button', kind: monaco.languages.CompletionItemKind.Snippet, insertText: '<button class="px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition">\n\t${1:Click me}\n</button>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, detail: 'Button' },
            { label: 'section', kind: monaco.languages.CompletionItemKind.Snippet, insertText: '<section class="py-16 px-4">\n\t<div class="max-w-6xl mx-auto">\n\t\t$0\n\t</div>\n</section>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, detail: 'Page section' },
          ],
        };
      },
    });

    monaco.languages.registerCompletionItemProvider('css', {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber, startColumn: word.startColumn,
          endLineNumber: position.lineNumber, endColumn: word.endColumn,
        };
        return {
          suggestions: [
            { label: 'glass', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'background: rgba(255,255,255,0.05);\nbackdrop-filter: blur(12px);\nborder: 1px solid rgba(255,255,255,0.1);', range, detail: 'Glass effect' },
            { label: 'gradient-text', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'background: linear-gradient(135deg, #22d3ee, #a855f7);\n-webkit-background-clip: text;\n-webkit-text-fill-color: transparent;', range, detail: 'Gradient text' },
          ],
        };
      },
    });

    // Hover provider for Tailwind classes
    monaco.languages.registerHoverProvider('html', {
      provideHover: (model: any, position: any) => {
        const word = model.getWordAtPosition(position);
        if (!word) return null;
        const TAILWIND_HINTS: Record<string, string> = {
          'flex': 'display: flex', 'grid': 'display: grid', 'hidden': 'display: none',
          'relative': 'position: relative', 'absolute': 'position: absolute',
          'rounded': 'border-radius: 0.25rem', 'shadow': 'box-shadow: 0 1px 3px rgba(0,0,0,0.1)',
        };
        const hint = TAILWIND_HINTS[word.word];
        if (hint) {
          return {
            range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
            contents: [{ value: `**Tailwind CSS**\n\`${hint}\`` }],
          };
        }
        return null;
      },
    });

    // Phase 65: Register Cmd+I / Ctrl+I for inline AI edit
    editor.addAction({
      id: 'inline-ai-edit',
      label: 'Inline AI Edit',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI],
      run: (ed: any) => {
        const selection = ed.getSelection();
        const model = ed.getModel();
        if (!selection || !model || selection.isEmpty()) return;
        const selectedCode = model.getValueInRange(selection);
        if (selectedCode.trim().length < 3) return;
        const filePath = file?.path || '';
        onTriggerInlineEdit?.(filePath, selectedCode, selection.startLineNumber, selection.endLineNumber);
      },
    });

    // Initial remote cursor render
    updateRemoteCursors();
  }, [onCursorChange, updateRemoteCursors, onTriggerInlineEdit, file?.path]);

  const handleAIAction = useCallback((actionId: string) => {
    if (onInlineAIAction && file && selectedText) {
      onInlineAIAction(actionId, selectedText, file.path);
    }
    setShowAIBar(false);
  }, [onInlineAIAction, file, selectedText]);

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full text-white/20 text-sm">
        Select a file to edit
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <Editor
        height="100%"
        language={LANGUAGE_MAP[file.language] || 'plaintext'}
        value={file.content}
        onChange={handleChange}
        onMount={handleMount}
        theme="builder-dark"
        options={{
          minimap: { enabled: true, scale: 1, maxColumn: 80, renderCharacters: false, showSlider: 'mouseover' },
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
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          matchBrackets: 'always',
          formatOnPaste: true,
          find: { addExtraSpaceOnTop: false, autoFindInSelection: 'multiline', seedSearchStringFromSelection: 'selection' },
          suggest: {
            showWords: true,
            showSnippets: true,
            showClasses: true,
            showColors: true,
            showFunctions: true,
            showKeywords: true,
            preview: true,
          },
          quickSuggestions: { other: true, comments: false, strings: true },
          parameterHints: { enabled: true },
          hover: { enabled: true, delay: 300 },
        }}
        loading={
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2">
              <div className="h-5 w-5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
              <span className="text-xs text-white/20">Loading editor...</span>
            </div>
          </div>
        }
      />

      {/* Inline AI Actions Toolbar */}
      {showAIBar && onInlineAIAction && (
        <div
          className="fixed z-50 flex items-center gap-0.5 bg-[#1a1a2e] border border-white/[0.1] rounded-lg shadow-xl px-1 py-0.5 animate-in fade-in zoom-in-95 duration-150"
          style={{ top: aiBarPosition.top, left: aiBarPosition.left }}
        >
          {AI_ACTIONS.map(action => (
            <button
              key={action.id}
              onClick={() => handleAIAction(action.id)}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-white/50 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
              title={action.label}
            >
              <action.icon className="h-3 w-3" />
              {action.label}
            </button>
          ))}
          <button
            onClick={() => setShowAIBar(false)}
            className="h-5 w-5 flex items-center justify-center text-white/20 hover:text-white/50 rounded transition-colors"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      )}
    </div>
  );
}
