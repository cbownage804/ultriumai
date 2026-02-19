import { useState } from 'react';
import { X, Search, Play, Loader2, Table2, Trash2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNLDatabaseQuery, type NLQueryResult } from '@/hooks/useNLDatabaseQuery';

interface NLQueryPanelProps {
  open: boolean;
  onClose: () => void;
  onSendQuery: (prompt: string) => void;
  schemaContext?: string;
  isGenerating: boolean;
}

export function NLQueryPanel({ open, onClose, onSendQuery, schemaContext, isGenerating }: NLQueryPanelProps) {
  const { queryHistory, suggestions, buildNLToSQLPrompt, addQueryResult, clearHistory } = useNLDatabaseQuery();
  const [input, setInput] = useState('');

  if (!open) return null;

  const handleQuery = () => {
    if (!input.trim()) return;
    const prompt = buildNLToSQLPrompt(input, schemaContext);
    addQueryResult(input, '');
    onSendQuery(`Convert this natural language to SQL and show me the results:\n\n"${input}"\n\n${schemaContext ? `Schema context:\n${schemaContext}` : ''}\n\nPlease:\n1. Show the generated SQL query\n2. Explain what it does\n3. If connected to Supabase, suggest how to run it using the Supabase client`);
    setInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[520px] max-h-[75vh] bg-[#111113] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-sm font-semibold text-white">Natural Language Queries</h2>
            <p className="text-[11px] text-white/40 mt-0.5">Ask questions about your data in plain English</p>
          </div>
          <button onClick={onClose} className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>

        {/* Input */}
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] focus-within:border-cyan-500/30">
              <Search className="h-3.5 w-3.5 text-white/20 shrink-0" />
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleQuery()}
                placeholder="e.g., Show me all users who signed up this week..."
                className="flex-1 bg-transparent text-xs text-white/80 placeholder:text-white/20 outline-none"
              />
            </div>
            <button onClick={handleQuery} disabled={!input.trim() || isGenerating} className="h-8 px-3 rounded-lg bg-cyan-500/20 text-cyan-300 text-[11px] font-medium hover:bg-cyan-500/30 disabled:opacity-30 flex items-center gap-1.5 shrink-0">
              {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
              Query
            </button>
          </div>
        </div>

        {/* Suggestions */}
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="h-3 w-3 text-violet-400/50" />
            <span className="text-[10px] text-white/30">Try asking</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.slice(0, 6).map((s, i) => (
              <button
                key={i}
                onClick={() => setInput(s)}
                className="px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-[10px] text-white/30 hover:text-white/50 hover:border-white/[0.1] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* History */}
        <div className="px-4 py-3 max-h-[35vh] overflow-y-auto">
          {queryHistory.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-white/30">Recent Queries</span>
                <button onClick={clearHistory} className="text-[10px] text-white/20 hover:text-white/40 flex items-center gap-1">
                  <Trash2 className="h-2.5 w-2.5" /> Clear
                </button>
              </div>
              {queryHistory.map(q => (
                <button
                  key={q.id}
                  onClick={() => setInput(q.naturalLanguage)}
                  className="w-full text-left p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors"
                >
                  <p className="text-[11px] text-white/50">{q.naturalLanguage}</p>
                  <p className="text-[10px] text-white/20 mt-0.5 font-mono">{q.generatedSQL || 'Pending...'}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/15">
              <Table2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Query your database in plain English</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
