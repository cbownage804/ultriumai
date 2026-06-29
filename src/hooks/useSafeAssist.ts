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
  attachments?: Array<{ name: string; type: string; url?: string }>;
}

export interface SafeAssistConversation {
  id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
  preview?: string;
}

interface Credits {
  total: number;
  remaining: number;
  used: number;
}

interface ConversationLimits {
  maxConversations: number;
  canSaveHistory: boolean;
}

interface UseSafeAssistReturn {
  messages: SafeAssistMessage[];
  conversations: SafeAssistConversation[];
  currentConversationId: string | null;
  isConnected: boolean;
  isTyping: boolean;
  isLoadingConversations: boolean;
  credits: Credits;
  limits: ConversationLimits;
  sendMessage: (message: string, attachments?: File[]) => Promise<void>;
  clearMessages: () => void;
  loadCredits: () => Promise<void>;
  loadConversations: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  createNewConversation: () => void;
  deleteConversation: (conversationId: string) => Promise<void>;
  renameConversation: (conversationId: string, newTitle: string) => Promise<void>;
}

const WELCOME_MESSAGE = `Good to see you.

I'm **Ray** — the intelligence layer of Wrayth. I'm watching your vault, scans, and exposure data so you don't have to.

You can ask me things like:

- "Are any of my passwords weak?"
- "Is this email safe?" *(paste it in)*
- "Have my credentials shown up in a breach?"
- "What should I work on next?"

I'll keep it plain English. Just tell me what's on your mind.`;

export function useSafeAssist(): UseSafeAssistReturn {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<SafeAssistMessage[]>([{
    id: 'welcome',
    role: 'assistant',
    content: WELCOME_MESSAGE,
    timestamp: new Date()
  }]);
  const [conversations, setConversations] = useState<SafeAssistConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [credits, setCredits] = useState<Credits>({
    total: 25,
    remaining: 25,
    used: 0
  });
  const [limits, setLimits] = useState<ConversationLimits>({
    maxConversations: 0,
    canSaveHistory: false
  });
  const [userTier, setUserTier] = useState<string>('free');

  // Load user tier and set limits
  useEffect(() => {
    if (user) {
      loadUserTier();
      loadCredits();
      loadConversations();
    }
  }, [user]);

  const loadUserTier = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data: subscription } = await supabase
        .from('safesuite_subscriptions')
        .select('tier')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      const tier = subscription?.tier || 'free';
      setUserTier(tier);
      
      // Set conversation limits by tier
      const limitsByTier: Record<string, ConversationLimits> = {
        free: { maxConversations: 0, canSaveHistory: false },
        pro: { maxConversations: 10, canSaveHistory: true },
        business: { maxConversations: 25, canSaveHistory: true }
      };
      
      setLimits(limitsByTier[tier] || limitsByTier.free);
    } catch (error) {
      console.error('Error loading user tier:', error);
    }
  }, [user]);

  const loadCredits = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data: subscription } = await supabase
        .from('safesuite_subscriptions')
        .select('tier')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      const tier = subscription?.tier || 'free';
      
      const creditsByTier: Record<string, number> = {
        free: 25,
        pro: 100,
        business: 500
      };
      
      const totalCredits = creditsByTier[tier] || 25;
      
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

  const loadConversations = useCallback(async () => {
    if (!user || !limits.canSaveHistory) return;
    
    setIsLoadingConversations(true);
    try {
      const { data, error } = await supabase
        .from('safeassist_conversations')
        .select('id, title, created_at, updated_at')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false })
        .limit(limits.maxConversations);

      if (error) throw error;
      
      setConversations(data?.map(c => ({
        id: c.id,
        title: c.title,
        created_at: new Date(c.created_at),
        updated_at: new Date(c.updated_at)
      })) || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user, limits]);

  const selectConversation = useCallback(async (conversationId: string) => {
    if (!user) return;
    
    try {
      const { data: messagesData, error } = await supabase
        .from('safeassist_messages')
        .select('id, role, content, attachments, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setCurrentConversationId(conversationId);
      setMessages(messagesData?.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(m.created_at),
        attachments: m.attachments as any
      })) || []);
    } catch (error) {
      console.error('Error loading conversation messages:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  const createNewConversation = useCallback(() => {
    setCurrentConversationId(null);
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: WELCOME_MESSAGE,
      timestamp: new Date()
    }]);
  }, []);

  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('safeassist_conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (currentConversationId === conversationId) {
        createNewConversation();
      }
      
      toast({
        title: "Conversation deleted",
        description: "The conversation has been removed"
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive"
      });
    }
  }, [user, currentConversationId, createNewConversation, toast]);

  const renameConversation = useCallback(async (conversationId: string, newTitle: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('safeassist_conversations')
        .update({ title: newTitle })
        .eq('id', conversationId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, title: newTitle } : c
      ));
    } catch (error) {
      console.error('Error renaming conversation:', error);
    }
  }, [user]);

  const enforceConversationLimit = useCallback(async () => {
    if (!user || !limits.canSaveHistory) return;
    
    // Get count of conversations
    const { count } = await supabase
      .from('safeassist_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_archived', false);
    
    if (count && count >= limits.maxConversations) {
      // Delete oldest conversation
      const { data: oldest } = await supabase
        .from('safeassist_conversations')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('updated_at', { ascending: true })
        .limit(1)
        .single();
      
      if (oldest) {
        await supabase
          .from('safeassist_conversations')
          .delete()
          .eq('id', oldest.id);
      }
    }
  }, [user, limits]);

  const decrementCredits = useCallback(async () => {
    if (!user) return;
    
    try {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
      
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

  const sendMessage = useCallback(async (message: string, attachments?: File[]) => {
    if (!message.trim() || credits.remaining <= 0) return;
    if (!user) return;

    // Process attachments
    let attachmentData: Array<{ name: string; type: string; content?: string }> = [];
    if (attachments && attachments.length > 0) {
      for (const file of attachments) {
        if (file.type.startsWith('text/') || file.type === 'application/json') {
          const text = await file.text();
          attachmentData.push({ name: file.name, type: file.type, content: text });
        } else {
          attachmentData.push({ name: file.name, type: file.type });
        }
      }
    }

    // Add user message
    const userMessage: SafeAssistMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
      attachments: attachmentData
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    let conversationId = currentConversationId;

    try {
      // Create new conversation if needed and user can save history
      if (!conversationId && limits.canSaveHistory) {
        await enforceConversationLimit();
        
        // Generate title from first message
        const title = message.slice(0, 50) + (message.length > 50 ? '...' : '');
        
        const { data: newConv, error: convError } = await supabase
          .from('safeassist_conversations')
          .insert({
            user_id: user.id,
            title: title
          })
          .select('id')
          .single();

        if (convError) throw convError;
        
        conversationId = newConv.id;
        setCurrentConversationId(conversationId);
        
        // Update conversations list
        loadConversations();
      }

      // Save user message if we have a conversation
      if (conversationId && limits.canSaveHistory) {
        await supabase
          .from('safeassist_messages')
          .insert({
            conversation_id: conversationId,
            user_id: user.id,
            role: 'user',
            content: message,
            attachments: attachmentData
          });
      }

      // Build context
      const conversationHistory = messages
        .filter(m => m.id !== 'welcome')
        .slice(-10)
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      // Include attachment info in message
      let fullMessage = message;
      if (attachmentData.length > 0) {
        const attachmentInfo = attachmentData.map(a => 
          a.content ? `[File: ${a.name}]\n${a.content}` : `[Attached file: ${a.name} (${a.type})]`
        ).join('\n\n');
        fullMessage = `${message}\n\n---\nAttachments:\n${attachmentInfo}`;
      }

      // Call AI
      const { data, error } = await supabase.functions.invoke('safeassist-ai', {
        body: {
          message: fullMessage,
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

      // Save AI message if we have a conversation
      if (conversationId && limits.canSaveHistory) {
        await supabase
          .from('safeassist_messages')
          .insert({
            conversation_id: conversationId,
            user_id: user.id,
            role: 'assistant',
            content: aiContent
          });
      }
      
      await decrementCredits();
      
    } catch (error: any) {
      console.error('SafeAssist error:', error);
      toast({
        title: "AI Error",
        description: error.message || "Failed to get AI response",
        variant: "destructive"
      });
      
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [messages, credits.remaining, user, currentConversationId, limits, toast, decrementCredits, enforceConversationLimit, loadConversations]);

  const clearMessages = useCallback(() => {
    createNewConversation();
  }, [createNewConversation]);

  return {
    messages,
    conversations,
    currentConversationId,
    isConnected,
    isTyping,
    isLoadingConversations,
    credits,
    limits,
    sendMessage,
    clearMessages,
    loadCredits,
    loadConversations,
    selectConversation,
    createNewConversation,
    deleteConversation,
    renameConversation
  };
}
