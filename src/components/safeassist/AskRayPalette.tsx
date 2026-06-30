/**
 * Ask Ray — global command palette (⌘K / Ctrl+K).
 *
 * "You never hunt through menus. You ask."
 *
 * Lives at the layout level so Ray is reachable from any Wrayth page.
 * Submits to the safeassist-ai edge function (Ray's brain) and streams
 * Ray's answer right inside the palette — no page change, no context loss.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, ArrowRight, Loader2, KeyRound, ScanSearch, Globe, Settings } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const SUGGESTIONS = [
  'Which passwords worry you most?',
  'Scan this website for me',
  'Explain my last alert',
  'What should I fix first?',
];

export function AskRayPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [thinking, setThinking] = useState(false);
  const [anticipation, setAnticipation] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Global hotkey: ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      if (isCmdK) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Reset state when closing
  useEffect(() => {
    if (!open) {
      abortRef.current?.abort();
      setQuery('');
      setAnswer(null);
      setThinking(false);
      setAnticipation(false);
    }
  }, [open]);

  const askRay = useCallback(async (question: string) => {
    if (!question.trim()) return;
    setThinking(true);
    setAnticipation(false);
    setAnswer(null);

    try {
      const { data, error } = await supabase.functions.invoke('safeassist-ai', {
        body: {
          message: question,
          context: { source: 'ask-ray-palette' },
        },
      });
      if (error) throw error;

      // 600ms anticipation pause before Ray reveals the answer.
      setThinking(false);
      setAnticipation(true);
      const text = data?.response || data?.message || "I'm here, but I couldn't form a response. Try again?";
      await new Promise((r) => setTimeout(r, 600));
      setAnticipation(false);
      setAnswer(text);
    } catch (err) {
      setThinking(false);
      setAnticipation(false);
      setAnswer("I couldn't reach my brain just now. Give me a moment and try again.");
    }
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    askRay(query);
  };

  const goTo = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <form onSubmit={onSubmit} className="flex items-center gap-2 border-b border-border px-3">
        <Eye
          className={cn(
            'h-4 w-4 shrink-0 transition-colors',
            thinking || anticipation ? 'text-[hsl(262_60%_70%)]' : 'text-muted-foreground',
            (thinking || anticipation) && 'animate-pulse',
          )}
        />
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Ask Ray anything…"
          className="border-0 focus:ring-0"
        />
        {thinking && <Loader2 className="h-4 w-4 animate-spin text-[hsl(262_60%_70%)]" />}
      </form>

      <CommandList className="max-h-[420px]">
        {(thinking || anticipation) && (
          <div className="px-4 py-6 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-[hsl(262_60%_64%)] animate-ping" />
              <span className="relative h-2 w-2 rounded-full bg-[hsl(262_60%_70%)]" />
            </span>
            {thinking ? 'Ray is thinking…' : 'I found something.'}
          </div>
        )}

        {answer && !thinking && !anticipation && (
          <div className="px-4 py-4 space-y-3 animate-fade-in">
            <div className="flex items-start gap-3">
              <Eye className="h-4 w-4 mt-1 text-[hsl(262_60%_70%)] shrink-0" />
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{answer}</p>
            </div>
            <button
              type="button"
              onClick={() => { setAnswer(null); setQuery(''); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Ask something else
            </button>
          </div>
        )}

        {!answer && !thinking && !anticipation && (
          <>
            {query.trim() && (
              <CommandGroup heading="Ask Ray">
                <CommandItem onSelect={() => askRay(query)} className="gap-2">
                  <Eye className="h-4 w-4 text-[hsl(262_60%_70%)]" />
                  <span className="flex-1 truncate">{query}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </CommandItem>
              </CommandGroup>
            )}

            {!query.trim() && (
              <CommandGroup heading="Try asking">
                {SUGGESTIONS.map((s) => (
                  <CommandItem key={s} onSelect={() => { setQuery(s); askRay(s); }} className="gap-2 text-muted-foreground">
                    <Eye className="h-3.5 w-3.5 text-[hsl(262_60%_70%)]" />
                    {s}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandSeparator />

            <CommandGroup heading="Jump to">
              <CommandItem onSelect={() => goTo('/safesuite/dashboard')} className="gap-2">
                <Eye className="h-4 w-4" /> Home
              </CommandItem>
              <CommandItem onSelect={() => goTo('/safesuite/pass')} className="gap-2">
                <KeyRound className="h-4 w-4" /> Vault
              </CommandItem>
              <CommandItem onSelect={() => goTo('/safesuite/scan')} className="gap-2">
                <ScanSearch className="h-4 w-4" /> Scan
              </CommandItem>
              <CommandItem onSelect={() => goTo('/safesuite/web')} className="gap-2">
                <Globe className="h-4 w-4" /> Watch
              </CommandItem>
              <CommandItem onSelect={() => goTo('/safesuite/settings')} className="gap-2">
                <Settings className="h-4 w-4" /> Settings
              </CommandItem>
            </CommandGroup>

            <CommandEmpty>Ray is listening. Type a question.</CommandEmpty>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
