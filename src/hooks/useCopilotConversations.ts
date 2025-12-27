import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  tools_used: string[] | null;
  metadata: any;
  created_at: string;
}

export function useCopilotConversations() {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('copilot_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching conversations:', error);
      return;
    }

    setConversations(data || []);
  }, []);

  // Create a new conversation
  const createConversation = useCallback(async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('copilot_conversations')
      .insert({ user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    setCurrentConversation(data);
    setMessages([]);
    await fetchConversations();
    return data.id;
  }, [fetchConversations]);

  // Load a conversation's messages
  const loadConversation = useCallback(async (conversationId: string) => {
    setIsLoading(true);
    
    const { data: conv, error: convError } = await supabase
      .from('copilot_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError) {
      console.error('Error loading conversation:', convError);
      setIsLoading(false);
      return;
    }

    const { data: msgs, error: msgsError } = await supabase
      .from('copilot_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgsError) {
      console.error('Error loading messages:', msgsError);
      setIsLoading(false);
      return;
    }

    setCurrentConversation(conv);
    setMessages((msgs || []).map(m => ({ ...m, role: m.role as 'user' | 'assistant' })));
    setIsLoading(false);
  }, []);

  // Add a message to the current conversation
  const addMessage = useCallback(async (
    role: 'user' | 'assistant',
    content: string,
    toolsUsed?: string[],
    metadata?: any
  ) => {
    if (!currentConversation) return null;

    const { data, error } = await supabase
      .from('copilot_messages')
      .insert({
        conversation_id: currentConversation.id,
        role,
        content,
        tools_used: toolsUsed || null,
        metadata: metadata || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding message:', error);
      return null;
    }

    // Update conversation title if first user message
    if (role === 'user' && messages.filter(m => m.role === 'user').length === 0) {
      const title = content.length > 50 ? content.substring(0, 50) + '...' : content;
      await supabase
        .from('copilot_conversations')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', currentConversation.id);
      
      await fetchConversations();
    } else {
      // Just update the timestamp
      await supabase
        .from('copilot_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentConversation.id);
    }

    setMessages(prev => [...prev, { ...data, role: data.role as 'user' | 'assistant' }]);
    return data;
  }, [currentConversation, messages, fetchConversations]);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    const { error } = await supabase
      .from('copilot_conversations')
      .delete()
      .eq('id', conversationId);

    if (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete conversation',
        variant: 'destructive',
      });
      return;
    }

    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null);
      setMessages([]);
    }

    await fetchConversations();
  }, [currentConversation, fetchConversations, toast]);

  // Get messages formatted for API
  const getApiMessages = useCallback(() => {
    return messages.map(m => ({
      role: m.role,
      content: m.content,
    }));
  }, [messages]);

  // Initialize
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    currentConversation,
    messages,
    isLoading,
    createConversation,
    loadConversation,
    addMessage,
    deleteConversation,
    fetchConversations,
    getApiMessages,
    setCurrentConversation,
    setMessages,
  };
}
