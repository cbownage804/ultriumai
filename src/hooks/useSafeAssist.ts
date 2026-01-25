import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface SafeAssistMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface Credits {
  total: number;
  remaining: number;
  used: number;
}

interface UseSafeAssistReturn {
  messages: SafeAssistMessage[];
  isConnected: boolean;
  isTyping: boolean;
  credits: Credits;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  loadCredits: () => Promise<void>;
}

const WELCOME_MESSAGE = `👋 **Welcome to SafeAssist!**

I'm your personal AI security assistant. I'm here to help you understand cybersecurity in plain, simple language — no technical jargon required!

**Here's what I can help you with:**

- 🔐 **Password Security** - Create strong passwords and check if yours have been compromised
- 🎣 **Threat Analysis** - Paste suspicious emails or links and I'll tell you if they're safe
- 🔒 **Privacy Tips** - Learn how to protect your personal information online
- 🛡️ **Security Checkups** - Get personalized advice to improve your online safety
- ❓ **Any Questions** - Ask me anything about staying safe online!

Each question uses 1 credit. What would you like to know?`;

export function useSafeAssist(): UseSafeAssistReturn {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<SafeAssistMessage[]>([{
    id: 'welcome',
    role: 'assistant',
    content: WELCOME_MESSAGE,
    timestamp: new Date()
  }]);
  const [isConnected, setIsConnected] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [credits, setCredits] = useState<Credits>({
    total: 50,  // Default for free tier
    remaining: 50,
    used: 0
  });

  // Load credits on mount
  useEffect(() => {
    if (user) {
      loadCredits();
    }
  }, [user]);

  const loadCredits = useCallback(async () => {
    if (!user) return;
    
    try {
      // Check user's tier and get credit allocation
      const { data: subscription } = await supabase
        .from('safesuite_subscriptions')
        .select('tier')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      const tier = subscription?.tier || 'free';
      
      // Credit allocation by tier
      const creditsByTier: Record<string, number> = {
        free: 25,
        pro: 100,
        business: 500
      };
      
      const totalCredits = creditsByTier[tier] || 25;
      
      // Get current month usage
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const { data: usage } = await supabase
        .from('safesuite_usage')
        .select('usage_count')
        .eq('user_id', user.id)
        .eq('product', 'safeassist')
        .gte('period_start', periodStart)
        .maybeSingle();

      const usedCredits = usage?.usage_count || 0;
      
      setCredits({
        total: totalCredits,
        used: usedCredits,
        remaining: Math.max(0, totalCredits - usedCredits)
      });
    } catch (error) {
      console.error('Error loading credits:', error);
    }
  }, [user]);

  const decrementCredits = useCallback(async () => {
    if (!user) return;
    
    try {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
      
      // Upsert usage record
      const { error } = await supabase
        .from('safesuite_usage')
        .upsert({
          user_id: user.id,
          product: 'safeassist',
          usage_count: credits.used + 1,
          period_start: periodStart,
          period_end: periodEnd
        }, {
          onConflict: 'user_id,product,period_start'
        });

      if (error) throw error;
      
      setCredits(prev => ({
        ...prev,
        used: prev.used + 1,
        remaining: Math.max(0, prev.remaining - 1)
      }));
    } catch (error) {
      console.error('Error updating credits:', error);
    }
  }, [user, credits.used]);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || credits.remaining <= 0) return;

    // Add user message
    const userMessage: SafeAssistMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Build context from previous messages
      const conversationHistory = messages
        .filter(m => m.id !== 'welcome')
        .slice(-10)
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      // Call the SafeAssist AI edge function
      const { data, error } = await supabase.functions.invoke('safeassist-ai', {
        body: {
          message: message,
          context: {
            conversation_history: conversationHistory,
            source: 'safeassist'
          }
        }
      });

      if (error) throw error;

      const aiContent = data?.response || data?.message || "I apologize, but I couldn't process your request. Please try again.";

      const assistantMessage: SafeAssistMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: aiContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Decrement credits after successful response
      await decrementCredits();
      
    } catch (error: any) {
      console.error('SafeAssist error:', error);
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
  }, [messages, credits.remaining, toast, decrementCredits]);

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
    isTyping,
    credits,
    sendMessage,
    clearMessages,
    loadCredits
  };
}
