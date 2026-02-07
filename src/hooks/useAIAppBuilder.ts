import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { ProjectFile } from './useProjectFileSystem';

export interface BuilderMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  filesGenerated?: number;
  timestamp: Date;
  suggestions?: string[];
  imageUrl?: string;
}

export type BuilderMode = 'build' | 'discuss';
export type ThinkingPhase = 'analyzing' | 'planning' | 'writing' | null;

export interface VersionSnapshot {
  id: string;
  label: string;
  files: ProjectFile[];
  timestamp: Date;
  messageId: string;
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

  if (files.length === 0) {
    const trimmed = raw.trim();
    const htmlMatch = trimmed.match(/```html\n?([\s\S]*?)```/);
    const html = htmlMatch ? htmlMatch[1] : trimmed;
    if (html.includes('<') && html.includes('>')) {
      files.push({ path: 'index.html', content: html, language: 'html' });
    }
  }

  return files;
}

/** Generate contextual follow-up suggestions based on the response */
function generateSuggestions(content: string, mode: BuilderMode): string[] {
  if (mode === 'discuss') {
    return [
      "Let's build this now →",
      "Can you suggest alternatives?",
      "What about mobile layout?",
    ];
  }
  // Build mode — suggest refinements
  const suggestions: string[] = [];
  if (content.includes('===FILE:')) {
    suggestions.push('Make it darker & more premium');
    suggestions.push('Add smooth animations');
    suggestions.push('Make it fully responsive');
  }
  return suggestions.slice(0, 3);
}

export function useAIAppBuilder() {
  const [messages, setMessages] = useState<BuilderMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [latestFiles, setLatestFiles] = useState<ProjectFile[]>([]);
  const [mode, setMode] = useState<BuilderMode>('build');
  const [thinkingPhase, setThinkingPhase] = useState<ThinkingPhase>(null);
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (
    input: string,
    currentFiles: ProjectFile[] = [],
    supabaseConfig?: { url: string; anonKey: string } | null,
    stripeConfig?: { publishableKey: string } | null,
    serviceKeys?: { id: string; serviceId: string; apiKey: string }[],
    imageDataUrl?: string | null,
  ) => {
    if (!input.trim() || isGenerating) return;

    // Save current state as a version before generating
    if (currentFiles.length > 0) {
      setVersions(prev => [...prev, {
        id: crypto.randomUUID(),
        label: `Before: ${input.slice(0, 40)}...`,
        files: [...currentFiles],
        timestamp: new Date(),
        messageId: '',
      }]);
    }

    const userMsg: BuilderMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      imageUrl: imageDataUrl || undefined,
    };

    setMessages(prev => [...prev, userMsg]);
    setIsGenerating(true);

    // Thinking phases
    setThinkingPhase('analyzing');
    const phaseTimer1 = setTimeout(() => setThinkingPhase('planning'), 1500);
    const phaseTimer2 = setTimeout(() => setThinkingPhase('writing'), 3500);

    // Build conversation context
    const apiMessages: { role: string; content: string | any[] }[] = [];

    for (const m of messages) {
      apiMessages.push({ role: m.role, content: m.content });
    }

    // Build the user message content (potentially multimodal)
    if (imageDataUrl) {
      const userContent: any[] = [
        { type: 'text', text: currentFiles.length > 0
          ? `Here is my current project:\n\n${currentFiles.map(f => `===FILE: ${f.path}===\n${f.content}`).join('\n\n')}\n\nNow please: ${input}`
          : input
        },
        { type: 'image_url', image_url: { url: imageDataUrl } },
      ];
      apiMessages.push({ role: 'user', content: userContent });
    } else if (currentFiles.length > 0) {
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
          mode,
          supabaseConfig: supabaseConfig || undefined,
          stripeConfig: stripeConfig || undefined,
          activeServices: serviceKeys?.map(sk => sk.serviceId) || [],
        }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ error: 'Unknown error' }));
        if (resp.status === 429) toast.error('Rate limited — please wait and try again.');
        else if (resp.status === 402) toast.error('AI credits exhausted.');
        else toast.error(errData.error || 'Failed to generate');
        setIsGenerating(false);
        setThinkingPhase(null);
        clearTimeout(phaseTimer1);
        clearTimeout(phaseTimer2);
        return;
      }

      if (!resp.body) throw new Error('No response body');

      // Clear thinking phases once streaming starts
      setThinkingPhase(null);
      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);

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
      }

      // Add suggestions + file count to the final assistant message
      const suggestions = generateSuggestions(fullContent, mode);
      setMessages(prev =>
        prev.map((m, i) =>
          i === prev.length - 1 && m.role === 'assistant'
            ? { ...m, filesGenerated: parsedFiles.length || undefined, suggestions }
            : m
        )
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('AI Builder error:', err);
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setIsGenerating(false);
      setThinkingPhase(null);
      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);
      abortRef.current = null;
    }
  }, [messages, isGenerating, mode]);

  const stopGenerating = useCallback(() => {
    abortRef.current?.abort();
    setIsGenerating(false);
    setThinkingPhase(null);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setLatestFiles([]);
    setVersions([]);
  }, []);

  const restoreVersion = useCallback((versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (version) {
      setLatestFiles(version.files);
      toast.success(`Restored to: ${version.label}`);
    }
  }, [versions]);

  return {
    messages,
    isGenerating,
    latestFiles,
    mode,
    setMode,
    thinkingPhase,
    versions,
    sendMessage,
    stopGenerating,
    clearChat,
    restoreVersion,
  };
}
