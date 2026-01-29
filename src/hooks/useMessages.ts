import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Message } from "@/types/chat";
import { devLog } from "@/lib/logger";

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const typedMessages = (data || []).map(msg => ({
        ...msg,
        role: msg.role as "user" | "assistant"
      }));
      
      setMessages(typedMessages);
    } catch (error) {
      devLog.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages.",
        variant: "destructive",
      });
    }
  };

  const saveMessage = async (conversationId: string, content: string, role: "user" | "assistant") => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content,
          role
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      devLog.error('Error saving message:', error);
      throw error;
    }
  };

  return {
    messages,
    setMessages,
    loadMessages,
    saveMessage
  };
};