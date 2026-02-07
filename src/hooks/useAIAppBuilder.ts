import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export interface BuilderMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  html?: string;
  timestamp: Date;
}

const BUILDER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-app-builder`;

function extractHTML(text: string): string | null {
  // Try markdown code block first
  const match = text.match(/```html\n?([\s\S]*?)```/);
  if (match) return match[1].trim();

  // If it starts with <!DOCTYPE or <html, it's raw HTML
  const trimmed = text.trim();
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
    return trimmed;
  }

  return null;
}

export function useAIAppBuilder() {
  const [messages, setMessages] = useState<BuilderMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentHTML, setCurrentHTML] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (input: string) => {
    if (!input.trim() || isGenerating) return;

    const userMsg: BuilderMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsGenerating(true);

    // Build conversation context — include previous HTML for iteration
    const apiMessages = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.role === 'assistant' && m.html ? m.html : m.content,
      }));

    // If there's existing HTML context and the user is iterating, include it
    if (currentHTML && apiMessages.length > 0) {
      // The previous assistant messages already contain the HTML
    }

    apiMessages.push({ role: 'user', content: input });

    const controller = new AbortController();
    abortRef.current = controller;

    let fullContent = '';

    try {
      const resp = await fetch(BUILDER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages, stream: true }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({ error: 'Unknown error' }));
        if (resp.status === 429) {
          toast.error('Rate limited — please wait a moment and try again.');
        } else if (resp.status === 402) {
          toast.error('AI credits exhausted. Add credits to continue building.');
        } else {
          toast.error(errorData.error || 'Failed to generate');
        }
        setIsGenerating(false);
        return;
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      const upsertAssistant = (content: string) => {
        fullContent = content;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content } : m
            );
          }
          return [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: 'assistant' as const,
              content,
              timestamp: new Date(),
            },
          ];
        });
      };

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) upsertAssistant(fullContent + delta);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Flush remaining buffer
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) upsertAssistant(fullContent + delta);
          } catch { /* ignore */ }
        }
      }

      // Extract HTML from final content and update preview
      const html = extractHTML(fullContent);
      if (html) {
        setCurrentHTML(html);
        // Update the last assistant message with extracted HTML
        setMessages(prev =>
          prev.map((m, i) =>
            i === prev.length - 1 && m.role === 'assistant'
              ? { ...m, html, content: fullContent }
              : m
          )
        );
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('AI Builder error:', err);
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  }, [messages, isGenerating, currentHTML]);

  const stopGenerating = useCallback(() => {
    abortRef.current?.abort();
    setIsGenerating(false);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setCurrentHTML(null);
  }, []);

  return {
    messages,
    isGenerating,
    currentHTML,
    sendMessage,
    stopGenerating,
    clearChat,
  };
}
