import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GPTConfig, DEFAULT_GPT_CONFIG, DEFAULT_WIDGET_THEME, GPTBuilderMessage } from '@/types/gptConfig';
import { useToast } from '@/hooks/use-toast';
import { useUserCredits } from '@/hooks/useUserCredits';

const GPT_TEMPLATES: Record<string, Partial<GPTConfig>> = {
  support: {
    name: 'Customer Support Bot',
    description: 'AI assistant trained on your knowledge base to handle customer inquiries',
    system_prompt: 'You are a friendly and professional customer support assistant. Answer questions based on the provided knowledge base. If you don\'t know the answer, politely say so and offer to escalate to a human agent. Always be empathetic, concise, and solution-oriented.',
    category: 'support',
    communication_style: 'Professional yet friendly',
    expertise_areas: 'Customer support, troubleshooting, FAQ handling',
    starter_questions: ['How can I reset my password?', 'What are your business hours?', 'I need help with my order'],
    welcome_message: 'Hi! I\'m here to help. What can I assist you with today?',
  },
  knowledge: {
    name: 'Knowledge Base Q&A',
    description: 'Query internal documentation in natural language',
    system_prompt: 'You are a knowledgeable assistant with access to internal documentation. Provide accurate, well-sourced answers based on the uploaded knowledge base. Cite specific documents when possible. If the information isn\'t in the knowledge base, clearly state that.',
    category: 'knowledge',
    communication_style: 'Clear and informative',
    expertise_areas: 'Document analysis, information retrieval, research',
    starter_questions: ['What does our policy say about...?', 'Summarize the key points of...', 'Where can I find information about...?'],
    welcome_message: 'I can help you find information from your documentation. What would you like to know?',
  },
  lead: {
    name: 'Website Lead Bot',
    description: 'Qualify website visitors and capture leads 24/7',
    system_prompt: 'You are a friendly sales assistant embedded on a website. Your goal is to engage visitors, understand their needs, qualify them as potential customers, and collect their contact information. Be conversational, not pushy. Ask about their business needs and suggest relevant solutions.',
    category: 'sales',
    communication_style: 'Conversational and engaging',
    expertise_areas: 'Lead qualification, sales discovery, product recommendations',
    starter_questions: ['Tell me about your product', 'What pricing plans do you offer?', 'Can I schedule a demo?'],
    welcome_message: 'Welcome! 👋 I\'d love to help you find the right solution. What brings you here today?',
  },
  docs: {
    name: 'Doc Analyzer',
    description: 'Upload and analyze contracts, proposals, and documents',
    system_prompt: 'You are an expert document analyst. Help users understand, summarize, and extract key information from uploaded documents including contracts, proposals, reports, and legal documents. Highlight important clauses, risks, and action items.',
    category: 'productivity',
    communication_style: 'Analytical and thorough',
    expertise_areas: 'Document analysis, contract review, summarization',
    starter_questions: ['Summarize this document', 'What are the key terms?', 'Are there any risks I should know about?'],
    welcome_message: 'Upload a document and I\'ll help you analyze it. What would you like to know?',
  },
};

export function useGPTBuilderChat(editGptId?: string, templateId?: string) {
  const [config, setConfig] = useState<GPTConfig>({ ...DEFAULT_GPT_CONFIG });
  const [messages, setMessages] = useState<GPTBuilderMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savedGptId, setSavedGptId] = useState<string | null>(editGptId || null);
  const abortRef = useRef<AbortController | null>(null);
  const { toast } = useToast();
  const { deductCredits, totalRemaining } = useUserCredits();

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
            widget_theme: {
              ...DEFAULT_WIDGET_THEME,
              ...((data.integration_settings as any)?.widget_theme || {}),
            },
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

  // Apply template if provided
  useEffect(() => {
    if (!templateId || editGptId) return;
    const template = GPT_TEMPLATES[templateId];
    if (template) {
      setConfig(prev => ({ ...prev, ...template }));
      setMessages([{
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `I've set up the **${template.name}** template for you! The system prompt, starter questions, and personality are pre-configured.\n\nYou can customize anything — just tell me what changes you'd like, or click **Save GPT** to create it as-is.`,
        timestamp: new Date(),
      }]);
    }
  }, [templateId, editGptId]);

  const sendMessage = useCallback(async (userInput: string, imageDataUrls?: string[] | null) => {
    if (!userInput.trim() || isGenerating) return;

    // Check credits before sending
    if (totalRemaining < 2) {
      toast({ title: 'Insufficient credits', description: 'You need at least 2 credits. Purchase more to continue.', variant: 'destructive' });
      return;
    }

    const userMsg: GPTBuilderMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userInput,
      timestamp: new Date(),
      imageUrls: imageDataUrls?.length ? imageDataUrls : undefined,
    };

    setMessages(prev => [...prev, userMsg]);
    setIsGenerating(true);

    let assistantContent = '';
    const assistantId = crypto.randomUUID();

    try {
      abortRef.current = new AbortController();

      const configContext = JSON.stringify(config, null, 2);
      const historyForAI = [...messages, userMsg].slice(-20).map(m => {
        // For user messages with images, build multimodal content
        if (m.role === 'user' && m.imageUrls?.length) {
          return {
            role: m.role,
            content: [
              { type: 'text', text: m.content },
              ...m.imageUrls.map(url => ({ type: 'image_url', image_url: { url } })),
            ],
          };
        }
        return { role: m.role, content: m.content };
      });

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

      // Deduct credits after successful response
      await deductCredits(2, 'GPT Builder chat');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('GPT Builder chat error:', err);
        toast({ title: 'Error', description: 'Failed to get AI response. Please try again.', variant: 'destructive' });
      }
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  }, [config, messages, isGenerating, toast, totalRemaining, deductCredits]);

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
