import { useCallback, useRef, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface AIAutocompleteProps {
  editorRef: React.MutableRefObject<any>;
  monacoRef: React.MutableRefObject<any>;
  enabled?: boolean;
}

// Common code patterns for ghost-text suggestions
const PATTERNS: Record<string, { trigger: RegExp; suggestion: string }[]> = {
  html: [
    { trigger: /<div class="flex/, suggestion: ' items-center justify-between gap-4">\n\t\n</div>' },
    { trigger: /<section class="py/, suggestion: '-20 px-6">\n\t<div class="max-w-6xl mx-auto">\n\t\t\n\t</div>\n</section>' },
    { trigger: /<button class="/, suggestion: 'px-6 py-2.5 bg-primary text-white rounded-xl hover:opacity-90 transition font-medium text-sm">\n\tClick me\n</button>' },
    { trigger: /<input type="/, suggestion: 'text" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="">' },
    { trigger: /<img /, suggestion: 'src="" alt="" class="w-full h-auto rounded-xl object-cover">' },
    { trigger: /<ul class="/, suggestion: 'space-y-2">\n\t<li></li>\n\t<li></li>\n\t<li></li>\n</ul>' },
  ],
  css: [
    { trigger: /\.container\s*\{/, suggestion: '\n\tmax-width: 1200px;\n\tmargin: 0 auto;\n\tpadding: 0 1.5rem;\n}' },
    { trigger: /@media\s*\(/, suggestion: 'min-width: 768px) {\n\t\n}' },
    { trigger: /display:\s*flex/, suggestion: ';\n\talign-items: center;\n\tgap: 1rem;' },
    { trigger: /display:\s*grid/, suggestion: ';\n\tgrid-template-columns: repeat(3, 1fr);\n\tgap: 1.5rem;' },
  ],
  javascript: [
    { trigger: /document\.querySelector/, suggestion: "('selector');" },
    { trigger: /addEventListener\('/, suggestion: "click', (e) => {\n\t\n});" },
    { trigger: /fetch\('/, suggestion: "')\n\t.then(res => res.json())\n\t.then(data => {\n\t\tconsole.log(data);\n\t})\n\t.catch(err => console.error(err));" },
    { trigger: /async function/, suggestion: ' handleSubmit(e) {\n\te.preventDefault();\n\ttry {\n\t\t\n\t} catch (error) {\n\t\tconsole.error(error);\n\t}\n}' },
  ],
};

/**
 * Hook that registers inline ghost-text completions in Monaco editor.
 * When the user types a recognized pattern, a faded suggestion appears inline.
 */
export function useAIAutocomplete({ editorRef, monacoRef, enabled = true }: AIAutocompleteProps) {
  const providerRef = useRef<any>(null);

  const registerProvider = useCallback(() => {
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    if (!monaco || !editor || !enabled) return;

    // Dispose previous provider
    providerRef.current?.dispose();

    // Register inline completions provider (ghost text)
    providerRef.current = monaco.languages.registerInlineCompletionsProvider('*', {
      provideInlineCompletions: (model: any, position: any) => {
        const language = model.getLanguageId();
        const patterns = PATTERNS[language] || PATTERNS.html || [];
        
        // Get the current line text up to cursor
        const lineContent = model.getLineContent(position.lineNumber);
        const textBeforeCursor = lineContent.substring(0, position.column - 1);

        for (const pattern of patterns) {
          if (pattern.trigger.test(textBeforeCursor)) {
            return {
              items: [{
                insertText: pattern.suggestion,
                range: {
                  startLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column,
                },
              }],
            };
          }
        }

        return { items: [] };
      },
      freeInlineCompletions: () => {},
    });
  }, [editorRef, monacoRef, enabled]);

  useEffect(() => {
    // Small delay to ensure editor is mounted
    const timer = setTimeout(registerProvider, 500);
    return () => {
      clearTimeout(timer);
      providerRef.current?.dispose();
    };
  }, [registerProvider]);
}

/** Visual indicator for AI autocomplete status */
export function AIAutocompleteIndicator({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium transition-colors ${
        enabled
          ? 'text-violet-400/70 bg-violet-500/10 hover:bg-violet-500/15'
          : 'text-white/20 hover:text-white/40'
      }`}
      title={enabled ? 'AI Autocomplete: On' : 'AI Autocomplete: Off'}
    >
      <Sparkles className="h-2.5 w-2.5" />
      <span>AI</span>
    </button>
  );
}
