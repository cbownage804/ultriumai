import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GPTConfig, DEFAULT_GPT_CONFIG, GPTBuilderMessage } from '@/types/gptConfig';
import { useToast } from '@/hooks/use-toast';

export function useGPTBuilderChat(editGptId?: string) {
  const [config, setConfig] = useState<GPTConfig>({ ...DEFAULT_GPT_CONFIG });
  const [messages, setMessages] = useState<GPTBuilderMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savedGptId, setSavedGptId] = useState<string | null>(editGptId || null);
  const abortRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  // Load existing GPT for editing
  useEffect(() => {
    if (!editGptId) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('custom_gpts')
          .select('*')
          .eq('id', editGptId)
          .single();
        if (error) throw error;
        if (data) {
          setConfig(prev => ({
            ...prev,
            name: data.name || '',
            description: data.description || '',
            system_prompt: data.system_prompt || '',
            avatar_url: data.avatar_url || '',
            theme_color: data.theme_color || '#6366f1',
            welcome_message: (data as any).welcome_message || '',
            starter_questions: (data.starter_questions as string[]) || [],
            preferred_model: data.preferred_model || 'google/gemini-3-flash-preview',
            enable_web_search: data.enable_web_search || false,
            communication_style: (data as any).communication_style || '',
            expertise_areas: (data as any).expertise_areas || '',
            category: data.category || 'general',
            features: (data.features as string[]) || [],
            placeholder_prompt: data.placeholder_prompt || 'Ask me anything...',
          }));
          setSavedGptId(data.id);
        }
      } catch {
        toast({ title: 'Error', description: 'Failed to load GPT for editing.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [editGptId]);

  const sendMessage = useCallback(async (userInput: string) => {
    if (!userInput.trim() || isGenerating) return;

    const userMsg: GPTBuilderMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userInput,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsGenerating(true);

    let assistantContent = '';
    const assistantId = crypto.randomUUID();

    try {
      abortRef.current = new AbortController();

      const configContext = JSON.stringify(config, null, 2);
      const historyForAI = [...messages, userMsg].slice(-20).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gpt-builder-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: historyForAI,
            currentConfig: configContext,
          }),
          signal: abortRef.current.signal,
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast({ title: 'Rate limited', description: 'Too many requests. Please wait a moment.', variant: 'destructive' });
          setIsGenerating(false);
          return;
        }
        if (response.status === 402) {
          toast({ title: 'Credits exhausted', description: 'Please add credits to continue.', variant: 'destructive' });
          setIsGenerating(false);
          return;
        }
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');
      const decoder = new TextDecoder();
      let buffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.id === assistantId) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { id: assistantId, role: 'assistant', content: assistantContent, timestamp: new Date() }];
              });
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // After stream, check for config JSON in response
      try {
        const configMatch = assistantContent.match(/```json\s*\n([\s\S]*?)\n```/);
        if (configMatch) {
          const updates = JSON.parse(configMatch[1]) as Partial<GPTConfig>;
          setConfig(prev => ({ ...prev, ...updates }));
          const cleanContent = assistantContent.replace(/```json\s*\n[\s\S]*?\n```/, '').trim();
          if (cleanContent) {
            assistantContent = cleanContent;
            setMessages(prev =>
              prev.map((m, i) => i === prev.length - 1 ? { ...m, content: cleanContent } : m)
            );
          }
        }
      } catch {
        // Config parse failed, that's fine
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('GPT Builder chat error:', err);
        toast({ title: 'Error', description: 'Failed to get AI response. Please try again.', variant: 'destructive' });
      }
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  }, [config, messages, isGenerating, toast]);

  const updateConfig = useCallback((updates: Partial<GPTConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig({ ...DEFAULT_GPT_CONFIG });
    setMessages([]);
    setSavedGptId(null);
  }, []);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    setIsGenerating(false);
  }, []);

  return {
    config,
    messages,
    isGenerating,
    isLoading,
    savedGptId,
    setSavedGptId,
    sendMessage,
    updateConfig,
    resetConfig,
    stopGeneration,
  };
}
