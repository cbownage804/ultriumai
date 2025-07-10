import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface VoiceMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    voice?: string;
    speechRate?: number;
    context?: any;
  };
}

export const useVoiceHistory = () => {
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load conversation history on mount
  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Create a conversation for voice assistant if it doesn't exist
      let conversationId = localStorage.getItem('voiceAssistantConversationId');
      
      if (!conversationId) {
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            user_id: user.id,
            title: 'SafeShield Voice Assistant'
          })
          .select()
          .single();

        if (convError) throw convError;
        
        conversationId = conversation.id;
        localStorage.setItem('voiceAssistantConversationId', conversationId);
      }

      // Load message history
      const { data: messageHistory, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(50); // Last 50 messages

      if (error) throw error;

      const formattedMessages: VoiceMessage[] = messageHistory?.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content || '',
        timestamp: new Date(msg.created_at).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        metadata: (msg as any).metadata || {}
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading voice history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = async (message: Omit<VoiceMessage, 'id'>) => {
    if (!user) return;

    try {
      let conversationId = localStorage.getItem('voiceAssistantConversationId');
      
      if (!conversationId) {
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            user_id: user.id,
            title: 'SafeShield Voice Assistant'
          })
          .select()
          .single();

        if (convError) throw convError;
        
        conversationId = conversation.id;
        localStorage.setItem('voiceAssistantConversationId', conversationId);
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          user_id: user.id,
          role: message.role,
          content: message.content,
          metadata: message.metadata
        })
        .select()
        .single();

      if (error) throw error;

      const newMessage: VoiceMessage = {
        id: data.id,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
        metadata: message.metadata
      };

      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Error saving message:', error);
      // Still add to local state even if save fails
      const localMessage: VoiceMessage = {
        id: Date.now().toString(),
        ...message
      };
      setMessages(prev => [...prev, localMessage]);
    }
  };

  const clearHistory = async () => {
    if (!user) return;

    try {
      const conversationId = localStorage.getItem('voiceAssistantConversationId');
      
      if (conversationId) {
        const { error } = await supabase
          .from('messages')
          .delete()
          .eq('conversation_id', conversationId);

        if (error) throw error;
      }

      setMessages([]);
      toast({
        title: "History Cleared",
        description: "Voice conversation history has been cleared.",
      });
    } catch (error) {
      console.error('Error clearing history:', error);
      toast({
        title: "Error",
        description: "Failed to clear conversation history.",
        variant: "destructive",
      });
    }
  };

  return {
    messages,
    isLoading,
    addMessage,
    clearHistory,
    refreshHistory: loadHistory
  };
};