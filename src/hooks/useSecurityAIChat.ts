import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface UseSecurityAIChatReturn {
  messages: AIMessage[];
  isConnected: boolean;
  isConnecting: boolean;
  isTyping: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendMessage: (message: string) => void;
  clearMessages: () => void;
}

const WELCOME_MESSAGE = `👋 **Hi there! I'm your Security Assistant**

I'm here to help you stay safe online. No technical knowledge required – just ask me anything in plain English!

**Here's what I can help with:**
- ✅ Checking if websites or links are safe
- ✅ Explaining what security warnings mean
- ✅ Tips to protect yourself online
- ✅ Answering any security questions you have

What would you like to know?`;

export function useSecurityAIChat(): UseSecurityAIChatReturn {
  const { toast } = useToast();
  const [messages, setMessages] = useState<AIMessage[]>([{
    id: 'welcome',
    role: 'assistant',
    content: WELCOME_MESSAGE,
    timestamp: new Date()
  }]);
  const [isConnected, setIsConnected] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }
      setIsConnected(true);
    } catch (error: any) {
      toast({
        title: "Connection Error",
        description: error.message || "Failed to connect",
        variant: "destructive"
      });
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, [toast]);

  const disconnect = useCallback(() => {
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      // Build context from previous messages
      const conversationHistory = messages
        .filter(m => m.id !== 'welcome')
        .slice(-10) // Last 10 messages for context
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      // Call the security AI assistant edge function
      const { data, error } = await supabase.functions.invoke('security-ai-assistant', {
        body: {
          message: message,
          context: {
            conversation_history: conversationHistory,
            source: 'safescan'
          }
        }
      });

      if (error) throw error;

      const aiContent = data?.response || data?.message || "I apologize, but I couldn't process your request. Please try again.";

      const assistantMessage: AIMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: aiContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('AI Chat error:', error);
      toast({
        title: "AI Error",
        description: error.message || "Failed to get AI response",
        variant: "destructive"
      });
      
      // Add error message
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [messages, toast]);

  const clearMessages = useCallback(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: WELCOME_MESSAGE,
      timestamp: new Date()
    }]);
  }, []);

  return {
    messages,
    isConnected,
    isConnecting,
    isTyping,
    connect,
    disconnect,
    sendMessage,
    clearMessages
  };
}
