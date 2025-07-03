import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import ConversationSidebar from "@/components/chat/ConversationSidebar";
import ChatArea from "@/components/chat/ChatArea";
import MessageInput from "@/components/chat/MessageInput";
import { Conversation, ConversationFile } from "@/types/chat";
import { useFileUpload } from "@/hooks/useFileUpload";

const ChatInterface = () => {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const {
    conversations,
    isLoadingConversations,
    loadConversations,
    createNewConversation,
    updateConversationTitle
  } = useConversations();
  
  const { messages, setMessages, loadMessages, saveMessage } = useMessages();
  const { getFileContent } = useFileUpload();

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    }
  }, [currentConversationId]);

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!currentConversationId && conversations.length > 0) {
      setCurrentConversationId(conversations[0].id);
    }
  }, [conversations, currentConversationId]);

  const handleSendMessage = async (attachments?: ConversationFile[]) => {
    if ((!input.trim() && !attachments?.length) || isLoading || !user) return;

    // Create conversation if none exists
    let conversationId = currentConversationId;
    if (!conversationId) {
      conversationId = await createNewConversation();
      if (!conversationId) return;
      setCurrentConversationId(conversationId);
    }

    let messageContent = input.trim();
    
    // If we have file attachments, prepare file content for AI
    if (attachments && attachments.length > 0) {
      const fileContents = await Promise.all(
        attachments.map(async (file) => {
          const content = await getFileContent(file);
          return `[File: ${file.file_name}]\n${content || 'File content not readable'}`;
        })
      );
      
      if (messageContent) {
        messageContent += '\n\n' + fileContents.join('\n\n');
      } else {
        messageContent = 'Please analyze the uploaded files:\n\n' + fileContents.join('\n\n');
      }
    }

    const userMessage = {
      id: Date.now().toString(),
      content: input.trim() || (attachments ? 'Uploaded files for analysis' : ''),
      role: "user" as const,
      created_at: new Date().toISOString(),
      file_attachments: attachments
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Save user message to database
      await saveMessage(conversationId, userMessage.content, "user");

      // Update conversation title if it's the first message
      if (messages.length === 0) {
        const title = userMessage.content.length > 50 
          ? userMessage.content.substring(0, 50) + "..." 
          : userMessage.content;
        await updateConversationTitle(conversationId, title);
      }

      // Call AI API with file content
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [...messages, { 
            ...userMessage, 
            content: messageContent // Send the content with file data to AI
          }].map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to get AI response');
      }

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        role: "assistant" as const,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save AI message to database
      await saveMessage(conversationId, aiMessage.content, "assistant");

      // Refresh conversations to update the timestamp
      loadConversations();

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConversationClick = (conversation: Conversation) => {
    setCurrentConversationId(conversation.id);
  };

  const handleNewConversation = async () => {
    const newId = await createNewConversation();
    if (newId) {
      setCurrentConversationId(newId);
      setMessages([]);
    }
  };

  if (isLoadingConversations) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <ConversationSidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onConversationClick={handleConversationClick}
        onNewConversation={handleNewConversation}
      />

      <div className="flex-1 flex flex-col">
        {currentConversationId ? (
          <>
            <ChatArea
              currentConversationId={currentConversationId}
              conversations={conversations}
              messages={messages}
              isLoading={isLoading}
            />
            <MessageInput
              input={input}
              setInput={setInput}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              conversationId={currentConversationId}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-4">Welcome to UltriumGPT</h2>
              <p className="text-muted-foreground mb-6">
                Select a conversation from the sidebar or start a new chat to begin.
              </p>
              <Button onClick={handleNewConversation} variant="hero">
                <Plus className="w-4 h-4 mr-2" />
                Start New Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;