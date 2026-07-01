/**
 * Ask Ray — global command palette (⌘K / Ctrl+K).
 *
 * "You never hunt through menus. You ask."
 *
 * Ray now does three things from one input:
 *  1. Listens — voice via the Web Speech API (hold-to-speak mic button).
 *  2. Acts — natural-language "open passwords" routes through `ray-action`
 *     and navigates instantly, no extra confirmation.
 *  3. Answers — anything else is sent to `ray-chat` for a conversational
 *     reply right inside the palette.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye, ArrowRight, Loader2, KeyRound, ScanSearch, Globe, Settings, Mic, MicOff,
} from 'lucide-react';
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
import { resolveRayAction } from '@/lib/ray/actions';
import { isVoiceSupported, startVoiceCapture, type VoiceSession } from '@/lib/ray/voice';

const SUGGESTIONS = [
  'Open my passwords',
  'Scan this website for me',
  'Show me the timeline',
  'What should I fix first?',
];

export function AskRayPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [thinking, setThinking] = useState(false);
  const [anticipation, setAnticipation] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const voiceRef = useRef<VoiceSession | null>(null);
  const voiceSupported = isVoiceSupported();

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
      voiceRef.current?.stop();
      voiceRef.current = null;
      setQuery('');
      setAnswer(null);
      setThinking(false);
      setAnticipation(false);
      setListening(false);
      setVoiceError(null);
    }
  }, [open]);

  const askRay = useCallback(async (question: string) => {
    if (!question.trim()) return;
    setThinking(true);
    setAnticipation(false);
    setAnswer(null);

    try {
      // Wave 3: ask Ray to interpret intent first.
      const action = await resolveRayAction(question);

      if (action.intent === 'navigate' && action.path) {
        // 400ms beat so Ray feels deliberate, not robotic.
        setThinking(false);
        setAnticipation(true);
        await new Promise((r) => setTimeout(r, 400));
        setAnticipation(false);
        setOpen(false);
        navigate(action.path);
        return;
      }

      // For 'ask' (and 'scan' fallback today), let Ray answer conversationally.
      const { data, error } = await supabase.functions.invoke('safeassist-ai', {
        body: {
          message: question,
          context: { source: 'ask-ray-palette', rayIntent: action.intent },
        },
      });
      if (error) throw error;

      setThinking(false);
      setAnticipation(true);
      const text =
        data?.response ||
        data?.message ||
        action.say ||
        "I'm here, but I couldn't form a response. Try again?";
      await new Promise((r) => setTimeout(r, 600));
      setAnticipation(false);
      setAnswer(text);
    } catch (err) {
      setThinking(false);
      setAnticipation(false);
      setAnswer("I couldn't reach my brain just now. Give me a moment and try again.");
    }
  }, [navigate]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    askRay(query);
  };

  const goTo = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const toggleVoice = useCallback(() => {
    if (listening) {
      voiceRef.current?.stop();
      voiceRef.current = null;
      setListening(false);
      return;
    }
    setVoiceError(null);
    const session = startVoiceCapture({
      onInterim: (text) => setQuery(text),
      onFinal: (text) => {
        setQuery(text);
        setListening(false);
        voiceRef.current = null;
        askRay(text);
      },
      onError: (msg) => {
        setVoiceError(msg);
        setListening(false);
        voiceRef.current = null;
      },
      onEnd: () => {
        setListening(false);
        voiceRef.current = null;
      },
    });
    if (session) {
      voiceRef.current = session;
      setListening(true);
    }
  }, [listening, askRay]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <form onSubmit={onSubmit} className="flex items-center gap-2 border-b border-border px-3">
        <Eye
          className={cn(
            'h-4 w-4 shrink-0 transition-colors',
            thinking || anticipation || listening ? 'text-[hsl(262_60%_70%)]' : 'text-muted-foreground',
            (thinking || anticipation || listening) && 'animate-pulse',
          )}
        />
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder={listening ? 'Listening…' : 'Ask Ray anything…'}
          className="border-0 focus:ring-0"
        />
        {voiceSupported && (
          <button
            type="button"
            onClick={toggleVoice}
            aria-label={listening ? 'Stop listening' : 'Speak to Ray'}
            className={cn(
              'shrink-0 rounded-md p-1.5 transition-colors',
              listening
                ? 'bg-[hsl(262_60%_70%/0.15)] text-[hsl(262_60%_70%)]'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        )}
        {thinking && <Loader2 className="h-4 w-4 animate-spin text-[hsl(262_60%_70%)]" />}
      </form>

      <CommandList className="max-h-[420px]">
        {(thinking || anticipation || listening) && (
          <div className="px-4 py-6 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-[hsl(262_60%_64%)] animate-ping" />
              <span className="relative h-2 w-2 rounded-full bg-[hsl(262_60%_70%)]" />
            </span>
            {listening ? 'Ray is listening…' : thinking ? 'Ray is thinking…' : 'I found something.'}
          </div>
        )}

        {voiceError && !listening && (
          <div className="px-4 py-2 text-xs text-destructive">{voiceError}</div>
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

        {!answer && !thinking && !anticipation && !listening && (
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
              <CommandItem onSelect={() => goTo('/app/dashboard')} className="gap-2">
                <Eye className="h-4 w-4" /> Home
              </CommandItem>
              <CommandItem onSelect={() => goTo('/app/pass')} className="gap-2">
                <KeyRound className="h-4 w-4" /> Passwords
              </CommandItem>
              <CommandItem onSelect={() => goTo('/app/scan')} className="gap-2">
                <ScanSearch className="h-4 w-4" /> Threats
              </CommandItem>
              <CommandItem onSelect={() => goTo('/app/web')} className="gap-2">
                <Globe className="h-4 w-4" /> Exposure
              </CommandItem>
              <CommandItem onSelect={() => goTo('/app/settings')} className="gap-2">
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
