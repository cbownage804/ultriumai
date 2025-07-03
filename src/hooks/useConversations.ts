import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Conversation } from "@/types/chat";

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          title,
          updated_at,
          messages(count)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const conversationsWithCount = data.map(conv => ({
        ...conv,
        message_count: conv.messages?.[0]?.count || 0
      }));

      setConversations(conversationsWithCount);
      return conversationsWithCount;
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations.",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const createNewConversation = async () => {
    if (!user) return null;

    try {
      const title = `New Chat ${new Date().toLocaleDateString()}`;
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title
        })
        .select()
        .single();

      if (error) throw error;

      const newConversation = { ...data, message_count: 0 };
      setConversations(prev => [newConversation, ...prev]);

      toast({
        title: "New conversation",
        description: "Started a new chat.",
      });

      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create new conversation.",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      setConversations(prev => prev.filter(conv => conv.id !== conversationId));

      toast({
        title: "Conversation deleted",
        description: "The conversation has been permanently deleted.",
      });

      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateConversationTitle = async (conversationId: string, title: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title })
        .eq('id', conversationId);

      if (error) throw error;

      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? { ...conv, title } : conv
        )
      );
    } catch (error) {
      console.error('Error updating conversation title:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  return {
    conversations,
    setConversations,
    isLoadingConversations,
    loadConversations,
    createNewConversation,
    updateConversationTitle,
    deleteConversation
  };
};