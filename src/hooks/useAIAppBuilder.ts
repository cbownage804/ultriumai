import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { ProjectFile } from './useProjectFileSystem';

export interface BuilderMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  filesGenerated?: number;
  timestamp: Date;
}

const BUILDER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-app-builder`;
const FILE_DELIMITER = /^===FILE:\s*(.+?)===$/;

/** Parse the ===FILE: path=== delimited format into ProjectFile[] */
export function parseMultiFileOutput(raw: string): ProjectFile[] {
  const lines = raw.split('\n');
  const files: ProjectFile[] = [];
  let currentPath: string | null = null;
  let currentLines: string[] = [];

  const flush = () => {
    if (currentPath) {
      const content = currentLines.join('\n').trim();
      if (content) {
        const ext = currentPath.split('.').pop()?.toLowerCase() || '';
        const langMap: Record<string, string> = {
          html: 'html', htm: 'html', css: 'css', scss: 'scss',
          js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
          json: 'json', md: 'markdown', svg: 'xml',
        };
        files.push({ path: currentPath, content, language: langMap[ext] || 'plaintext' });
      }
    }
  };

  for (const line of lines) {
    const match = line.match(FILE_DELIMITER);
    if (match) {
      flush();
      currentPath = match[1].trim();
      currentLines = [];
    } else if (currentPath !== null) {
      currentLines.push(line);
    }
  }
  flush();

  // Fallback: if no files parsed, try treating the whole thing as a single HTML file
  if (files.length === 0) {
    const trimmed = raw.trim();
    // Strip markdown code fences
    const htmlMatch = trimmed.match(/```html\n?([\s\S]*?)```/);
    const html = htmlMatch ? htmlMatch[1] : trimmed;
    if (html.includes('<') && html.includes('>')) {
      files.push({ path: 'index.html', content: html, language: 'html' });
    }
  }

  return files;
}

export function useAIAppBuilder() {
  const [messages, setMessages] = useState<BuilderMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [latestFiles, setLatestFiles] = useState<ProjectFile[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (
    input: string,
    currentFiles: ProjectFile[] = [],
    supabaseConfig?: { url: string; anonKey: string } | null,
    stripeConfig?: { publishableKey: string } | null,
    openaiConfig?: { apiKey: string } | null,
  ) => {
    if (!input.trim() || isGenerating) return;

    const userMsg: BuilderMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsGenerating(true);

    // Build conversation context
    const apiMessages: { role: string; content: string }[] = [];

    // Include previous conversation
    for (const m of messages) {
      apiMessages.push({ role: m.role, content: m.content });
    }

    // If iterating on existing files, include current project state
    if (currentFiles.length > 0) {
      const fileContext = currentFiles
        .map(f => `===FILE: ${f.path}===\n${f.content}`)
        .join('\n\n');
      apiMessages.push({
        role: 'user',
        content: `Here is my current project:\n\n${fileContext}\n\nNow please: ${input}`,
      });
    } else {
      apiMessages.push({ role: 'user', content: input });
    }

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
        body: JSON.stringify({
          messages: apiMessages,
          stream: true,
          supabaseConfig: supabaseConfig || undefined,
          stripeConfig: stripeConfig || undefined,
          openaiConfig: openaiConfig || undefined,
        }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ error: 'Unknown error' }));
        if (resp.status === 429) toast.error('Rate limited — please wait and try again.');
        else if (resp.status === 402) toast.error('AI credits exhausted.');
        else toast.error(errData.error || 'Failed to generate');
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
            { id: crypto.randomUUID(), role: 'assistant' as const, content, timestamp: new Date() },
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
          if (jsonStr === '[DONE]') { streamDone = true; break; }

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

      // Flush remaining
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

      // Parse multi-file output
      const parsedFiles = parseMultiFileOutput(fullContent);
      if (parsedFiles.length > 0) {
        setLatestFiles(parsedFiles);
        // Update assistant message with file count
        setMessages(prev =>
          prev.map((m, i) =>
            i === prev.length - 1 && m.role === 'assistant'
              ? { ...m, filesGenerated: parsedFiles.length }
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
  }, [messages, isGenerating]);

  const stopGenerating = useCallback(() => {
    abortRef.current?.abort();
    setIsGenerating(false);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setLatestFiles([]);
  }, []);

  return {
    messages,
    isGenerating,
    latestFiles,
    sendMessage,
    stopGenerating,
    clearChat,
  };
}
