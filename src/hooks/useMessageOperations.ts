import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage } from "@/types/chat";
import { CustomGPT } from "@/hooks/useCustomGPTs";
import { ModelParams } from "@/components/chat/ModelSettings";

export const useMessageOperations = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const copyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
      toast({
        title: "Copied!",
        description: "Message copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Unable to copy message to clipboard",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async (
    inputMessage: string,
    currentGPT: CustomGPT,
    messages: ChatMessage[],
    knowledgeBase: Array<{id: string, file_name: string, processed_content: string}>,
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
    setInputMessage: React.Dispatch<React.SetStateAction<string>>,
    modelParams?: ModelParams
  ) => {
    if (!inputMessage.trim() || !currentGPT) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date(),
      status: 'sending'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Update message status to sent
    setMessages(prev => prev.map(msg => 
      msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
    ));

    try {
      // Build enhanced system prompt with knowledge base
      let enhancedSystemPrompt = currentGPT.system_prompt;
      
      if (knowledgeBase.length > 0) {
        const knowledgeBaseContent = knowledgeBase
          .map(doc => `[Document: ${doc.file_name}]\n${doc.processed_content}`)
          .join('\n\n---\n\n');
        
        enhancedSystemPrompt = `${currentGPT.system_prompt}

KNOWLEDGE BASE:
The following documents have been uploaded to your knowledge base. Use this information to answer questions when relevant:

${knowledgeBaseContent}

When referencing information from these documents, mention the source document name.`;
      }

      // Call the chat completion API with the enhanced system prompt and model parameters
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: 'user',
              content: inputMessage
            }
          ],
          customGPT: {
            system_prompt: enhancedSystemPrompt,
            id: currentGPT.id,
            name: currentGPT.name,
            chat_count: currentGPT.chat_count
          },
          modelParams: modelParams || {
            model: 'gpt-4.1-2025-04-14',
            temperature: 0.7,
            max_tokens: 1000,
            top_p: 1.0,
            frequency_penalty: 0,
            presence_penalty: 0
          }
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to get AI response');
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Return usage data if available
      return data.usage ? { usage: data.usage } : null;
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I'm having trouble responding right now. Please try again.",
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    copiedMessageId,
    copyMessage,
    sendMessage
  };
};