import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Send, Square, Trash2, Sparkles, Loader2, Bot, User, Lightbulb, FileCode, CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BuilderMessage } from '@/hooks/useAIAppBuilder';

interface BuilderChatPanelProps {
  messages: BuilderMessage[];
  isGenerating: boolean;
  fileCount: number;
  onSend: (message: string) => void;
  onStop: () => void;
  onClear: () => void;
}

const STARTER_PROMPTS = [
  'A modern landing page with hero, features grid, testimonials, and footer',
  'A dashboard with analytics cards, a chart section, and recent activity feed',
  'A task management app with columns for To Do, In Progress, and Done',
  'A settings page with profile, notifications, and theme sections',
  'An e-commerce product grid with search, filters, and shopping cart',
  'A blog with article cards, categories sidebar, and newsletter signup',
];

/** Strip ===FILE: ...=== blocks from assistant message to show only conversational text */
function getDisplayContent(msg: BuilderMessage): { text: string; fileNames: string[] } {
  if (msg.role === 'user') return { text: msg.content, fileNames: [] };
  
  const lines = msg.content.split('\n');
  const textLines: string[] = [];
  const fileNames: string[] = [];
  let insideFile = false;

  for (const line of lines) {
    const fileMatch = line.match(/^===FILE:\s*(.+?)===$/);
    if (fileMatch) {
      insideFile = true;
      fileNames.push(fileMatch[1].trim());
    } else if (insideFile) {
      // Skip file content lines
      // If we hit another non-code looking line after a blank section, 
      // check if it could be conversational text after the files
      continue;
    } else {
      textLines.push(line);
    }
  }

  // Also try to extract text before any ===FILE: blocks
  const text = textLines.join('\n').trim();
  // Strip markdown code fences that might wrap the whole thing
  const cleaned = text.replace(/```html\n?[\s\S]*?```/g, '').trim();
  
  return { text: cleaned, fileNames };
}

export function BuilderChatPanel({
  messages,
  isGenerating,
  fileCount,
  onSend,
  onStop,
  onClear,
}: BuilderChatPanelProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;
    onSend(input.trim());
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderAssistantMessage = (msg: BuilderMessage) => {
    const { text, fileNames } = getDisplayContent(msg);
    const isStreaming = isGenerating && msg === messages[messages.length - 1];
    const hasFiles = msg.filesGenerated && msg.filesGenerated > 0;

    return (
      <div className="space-y-2">
        {/* Show file generation summary */}
        {hasFiles && (
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
            <span>
              Generated {msg.filesGenerated} file{msg.filesGenerated! > 1 ? 's' : ''}
            </span>
            <Badge variant="secondary" className="text-[10px]">
              See preview →
            </Badge>
          </div>
        )}

        {/* Show file names if available */}
        {fileNames.length > 0 && !hasFiles && (
          <div className="flex flex-wrap gap-1">
            {fileNames.slice(0, 6).map((name, i) => (
              <Badge key={i} variant="outline" className="text-[10px] font-mono">
                <FileCode className="h-2.5 w-2.5 mr-1" />
                {name}
              </Badge>
            ))}
            {fileNames.length > 6 && (
              <Badge variant="outline" className="text-[10px]">
                +{fileNames.length - 6} more
              </Badge>
            )}
          </div>
        )}

        {/* Show conversational text if any */}
        {text && <p className="whitespace-pre-wrap text-sm">{text}</p>}

        {/* Show building indicator during streaming with no content yet */}
        {isStreaming && !hasFiles && fileNames.length === 0 && !text && (
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 shrink-0 animate-pulse" />
            <span>Building your app...</span>
          </div>
        )}
        
        {/* Show streaming indicator when actively generating files */}
        {isStreaming && fileNames.length > 0 && !hasFiles && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Writing {fileNames.length} file{fileNames.length > 1 ? 's' : ''}...</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">AI App Builder</h2>
            <p className="text-xs text-muted-foreground">
              {fileCount > 0 ? `${fileCount} files in project` : 'Describe what to build'}
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClear}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="space-y-4 pt-8">
              <div className="text-center space-y-2">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">What do you want to build?</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Describe any web app and I'll generate a multi-file project with live preview. Iterate as much as you want.
                </p>
              </div>
              <div className="space-y-2 pt-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-1">
                  <Lightbulb className="h-3 w-3" />
                  Try one of these
                </div>
                {STARTER_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => onSend(prompt)}
                    className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 text-sm transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    'rounded-xl px-4 py-2.5 max-w-[85%]',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground text-sm'
                      : 'bg-muted'
                  )}
                >
                  {msg.role === 'assistant' ? (
                    renderAssistantMessage(msg)
                  ) : (
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="h-7 w-7 rounded-lg bg-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))
          )}
          {isGenerating && !messages.some(m => m.role === 'assistant') && (
            <div className="flex gap-3">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
              </div>
              <div className="bg-muted rounded-xl px-4 py-2.5 text-sm animate-pulse">
                Building...
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              messages.length === 0
                ? 'Describe the app you want to build...'
                : 'Describe changes to your project...'
            }
            rows={1}
            className="min-h-[44px] max-h-[160px] resize-none"
          />
          {isGenerating ? (
            <Button size="icon" variant="destructive" onClick={onStop} className="h-[44px] w-[44px] shrink-0">
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="icon" onClick={handleSend} disabled={!input.trim()} className="h-[44px] w-[44px] shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
