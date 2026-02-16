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
    { trigger: /<nav class="/, suggestion: 'flex items-center justify-between px-6 py-4 bg-white border-b">\n\t<a href="/" class="font-bold text-lg">Logo</a>\n\t<div class="flex items-center gap-6">\n\t\t<a href="#" class="text-sm text-slate-600 hover:text-slate-900">Link</a>\n\t</div>\n</nav>' },
    { trigger: /<form /, suggestion: 'class="space-y-4 max-w-md mx-auto" onsubmit="return false">\n\t<input type="email" class="w-full px-4 py-2.5 rounded-xl border" placeholder="Email">\n\t<button type="submit" class="w-full px-6 py-2.5 bg-primary text-white rounded-xl">Submit</button>\n</form>' },
    { trigger: /<table class="/, suggestion: 'w-full border-collapse">\n\t<thead>\n\t\t<tr class="border-b">\n\t\t\t<th class="text-left py-3 px-4 text-sm font-medium text-slate-500">Column</th>\n\t\t</tr>\n\t</thead>\n\t<tbody>\n\t\t<tr class="border-b hover:bg-slate-50">\n\t\t\t<td class="py-3 px-4 text-sm">Data</td>\n\t\t</tr>\n\t</tbody>\n</table>' },
  ],
  css: [
    { trigger: /\.container\s*\{/, suggestion: '\n\tmax-width: 1200px;\n\tmargin: 0 auto;\n\tpadding: 0 1.5rem;\n}' },
    { trigger: /@media\s*\(/, suggestion: 'min-width: 768px) {\n\t\n}' },
    { trigger: /display:\s*flex/, suggestion: ';\n\talign-items: center;\n\tgap: 1rem;' },
    { trigger: /display:\s*grid/, suggestion: ';\n\tgrid-template-columns: repeat(3, 1fr);\n\tgap: 1.5rem;' },
    { trigger: /\.card\s*\{/, suggestion: '\n\tbackground: white;\n\tborder-radius: 1rem;\n\tpadding: 1.5rem;\n\tbox-shadow: 0 1px 3px rgba(0,0,0,0.1);\n\ttransition: box-shadow 0.2s;\n}\n.card:hover {\n\tbox-shadow: 0 4px 12px rgba(0,0,0,0.15);\n}' },
    { trigger: /animation:\s*/, suggestion: 'fadeIn 0.3s ease-out forwards;\n}\n@keyframes fadeIn {\n\tfrom { opacity: 0; transform: translateY(8px); }\n\tto { opacity: 1; transform: translateY(0); }\n}' },
  ],
  javascript: [
    { trigger: /document\.querySelector/, suggestion: "('selector');" },
    { trigger: /addEventListener\('/, suggestion: "click', (e) => {\n\t\n});" },
    { trigger: /fetch\('/, suggestion: "')\n\t.then(res => res.json())\n\t.then(data => {\n\t\tconsole.log(data);\n\t})\n\t.catch(err => console.error(err));" },
    { trigger: /async function/, suggestion: ' handleSubmit(e) {\n\te.preventDefault();\n\ttry {\n\t\t\n\t} catch (error) {\n\t\tconsole.error(error);\n\t}\n}' },
    { trigger: /supabase\.from\('/, suggestion: "table_name').select('*').order('created_at', { ascending: false });" },
    { trigger: /supabase\.auth\./, suggestion: "signInWithPassword({ email, password });" },
    { trigger: /supabase\.storage\.from\('/, suggestion: "bucket').upload(filePath, file, { cacheControl: '3600', upsert: false });" },
    { trigger: /supabase\.functions\.invoke\('/, suggestion: "function-name', { body: { key: 'value' } });" },
    { trigger: /const \[.*,\s*set/, suggestion: "State] = useState(null);" },
    { trigger: /useEffect\(\(\)\s*=>/, suggestion: " {\n\t// Side effect\n\treturn () => {\n\t\t// Cleanup\n\t};\n}, []);" },
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
