import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface GPTConversation {
  id: string;
  gpt_id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export interface GPTMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used: number | null;
  response_time_ms: number | null;
  created_at: string;
}

export const useGPTConversations = (gptId?: string) => {
  const [conversations, setConversations] = useState<GPTConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<GPTConversation | null>(null);
  const [messages, setMessages] = useState<GPTMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load conversations for a specific GPT
  const loadConversations = useCallback(async () => {
    if (!user || !gptId) return [];

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('gpt_conversations')
        .select('*')
        .eq('gpt_id', gptId)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      setConversations(data || []);
      return data || [];
    } catch (error) {
      console.error('Error loading GPT conversations:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user, gptId]);

  // Create a new conversation
  const createConversation = useCallback(async (title?: string) => {
    if (!user || !gptId) return null;

    try {
      const { data, error } = await supabase
        .from('gpt_conversations')
        .insert({
          gpt_id: gptId,
          user_id: user.id,
          title: title || `Chat ${new Date().toLocaleDateString()}`
        })
        .select()
        .single();

      if (error) throw error;

      setConversations(prev => [data, ...prev]);
      setCurrentConversation(data);
      setMessages([]);
      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive"
      });
      return null;
    }
  }, [user, gptId, toast]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('gpt_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const typedMessages = (data || []).map(msg => ({
        ...msg,
        role: msg.role as 'user' | 'assistant' | 'system'
      }));

      setMessages(typedMessages);
      return typedMessages;
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  }, []);

  // Save a message to a conversation
  const saveMessage = useCallback(async (
    conversationId: string,
    content: string,
    role: 'user' | 'assistant',
    tokensUsed?: number,
    responseTimeMs?: number
  ) => {
    try {
      const { data, error } = await supabase
        .from('gpt_messages')
        .insert({
          conversation_id: conversationId,
          content,
          role,
          tokens_used: tokensUsed || null,
          response_time_ms: responseTimeMs || null
        })
        .select()
        .single();

      if (error) throw error;

      const typedMessage = {
        ...data,
        role: data.role as 'user' | 'assistant' | 'system'
      };

      setMessages(prev => [...prev, typedMessage]);

      // Update conversation's updated_at
      await supabase
        .from('gpt_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return typedMessage;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }, []);

  // Update conversation title
  const updateConversationTitle = useCallback(async (conversationId: string, title: string) => {
    try {
      const { error } = await supabase
        .from('gpt_conversations')
        .update({ title })
        .eq('id', conversationId);

      if (error) throw error;

      setConversations(prev => 
        prev.map(conv => conv.id === conversationId ? { ...conv, title } : conv)
      );
    } catch (error) {
      console.error('Error updating conversation title:', error);
    }
  }, []);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('gpt_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }

      toast({
        title: "Conversation deleted",
        description: "The conversation has been removed"
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive"
      });
      return false;
    }
  }, [currentConversation, toast]);

  // Select a conversation
  const selectConversation = useCallback(async (conversation: GPTConversation) => {
    setCurrentConversation(conversation);
    await loadMessages(conversation.id);
  }, [loadMessages]);

  useEffect(() => {
    if (gptId && user) {
      loadConversations();
    }
  }, [gptId, user, loadConversations]);

  return {
    conversations,
    currentConversation,
    messages,
    isLoading,
    loadConversations,
    createConversation,
    loadMessages,
    saveMessage,
    updateConversationTitle,
    deleteConversation,
    selectConversation,
    setCurrentConversation,
    setMessages
  };
};
