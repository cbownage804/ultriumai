import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { useCustomGPTs } from "@/hooks/useCustomGPTs";
import { useAnalyticsTracking } from "@/hooks/useAnalyticsTracking";
import ConversationSidebar from "@/components/chat/ConversationSidebar";
import ChatArea from "@/components/chat/ChatArea";
import MessageInput from "@/components/chat/MessageInput";
import { Conversation, ConversationFile } from "@/types/chat";
import { useFileUpload } from "@/hooks/useFileUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ChatInterface = () => {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [selectedGPT, setSelectedGPT] = useState<string>("default");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const {
    conversations,
    isLoadingConversations,
    loadConversations,
    createNewConversation,
    updateConversationTitle,
    deleteConversation
  } = useConversations();
  
  const { messages, setMessages, loadMessages, saveMessage } = useMessages();
  const { gpts } = useCustomGPTs();
  const { getFileContent } = useFileUpload();
  const {
    startSession,
    endSession,
    trackMessageExchange,
    trackFileUpload
  } = useAnalyticsTracking();

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    }
  }, [currentConversationId]);

  // Start analytics session when GPT changes (for custom GPTs)
  useEffect(() => {
    const initializeSession = async () => {
      if (selectedGPT !== "default" && user) {
        // End current session if exists
        if (sessionId) {
          await endSession(sessionId, messages.length);
        }
        
        // Start new session for custom GPT
        const newSessionId = await startSession(selectedGPT);
        setSessionId(newSessionId);
      } else if (selectedGPT === "default" && sessionId) {
        // End session when switching back to default
        await endSession(sessionId, messages.length);
        setSessionId(null);
      }
    };

    initializeSession();
  }, [selectedGPT, user]);

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!currentConversationId && conversations.length > 0) {
      setCurrentConversationId(conversations[0].id);
    }
  }, [conversations, currentConversationId]);

  const handleSendMessage = async (
    attachments?: ConversationFile[], 
    generatedMedia?: { url: string; type: 'image' | 'video'; prompt: string }[],
    aiModel?: string,
    webSearchEnabled?: boolean
  ) => {
    if ((!input.trim() && !attachments?.length && !generatedMedia?.length) || isLoading || !user) return;

    // Create conversation if none exists
    let conversationId = currentConversationId;
    if (!conversationId) {
      conversationId = await createNewConversation();
      if (!conversationId) return;
      setCurrentConversationId(conversationId);
    }

    let messageContent = input.trim();
    let displayContent = input.trim();
    
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
        displayContent = 'Uploaded files for analysis';
      }
    }

    // If we have generated media, add context for AI
    if (generatedMedia && generatedMedia.length > 0) {
      const mediaDescriptions = generatedMedia.map(media => 
        `[Generated ${media.type}]: ${media.prompt}`
      ).join('\n');
      
      if (!displayContent && !messageContent) {
        displayContent = 'Generated media for discussion';
        messageContent = `Please discuss these generated media items:\n${mediaDescriptions}`;
      } else if (messageContent) {
        messageContent += '\n\n' + mediaDescriptions;
      }
    }

    const userMessage = {
      id: Date.now().toString(),
      content: displayContent || 'Media and files shared',
      role: "user" as const,
      created_at: new Date().toISOString(),
      file_attachments: attachments,
      generated_media: generatedMedia
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

      // Get selected GPT's system prompt
      const currentGPT = gpts.find(gpt => gpt.id === selectedGPT);
      const startTime = Date.now();
      
      // Call AI API with custom GPT context or default
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [...messages, { 
            ...userMessage, 
            content: messageContent // Send the content with file data to AI
          }].map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          customGPT: currentGPT ? {
            ...currentGPT,
            id: selectedGPT // Ensure ID is included for analytics
          } : null,
          sessionId: sessionId, // Include session ID for analytics
          model: aiModel || 'gpt-4o-mini',
          webSearchEnabled: webSearchEnabled || false
        }
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;

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

      // Track analytics for custom GPTs
      if (selectedGPT !== "default" && sessionId) {
        await trackMessageExchange(
          selectedGPT, 
          responseTime, 
          data.usage?.total_tokens, 
          sessionId
        );
        
        // Track file uploads if any
        if (attachments && attachments.length > 0) {
          for (const file of attachments) {
            await trackFileUpload(selectedGPT, file.file_name, file.file_size, sessionId);
          }
        }
      }

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

  const handleDeleteConversation = async (conversationId: string) => {
    const success = await deleteConversation(conversationId);
    if (success && conversationId === currentConversationId) {
      // If we deleted the current conversation, clear it
      setCurrentConversationId(null);
      setMessages([]);
      
      // If there are other conversations, select the first one
      if (conversations.length > 1) {
        const remainingConversations = conversations.filter(c => c.id !== conversationId);
        if (remainingConversations.length > 0) {
          setCurrentConversationId(remainingConversations[0].id);
        }
      }
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
        onDeleteConversation={handleDeleteConversation}
      />

      <div className="flex-1 flex flex-col">
        {currentConversationId ? (
          <>
            {/* GPT Selector Header */}
            <div className="border-b p-4 bg-muted/30">
              <div className="flex items-center gap-3">
                <Bot className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <Select value={selectedGPT} onValueChange={setSelectedGPT}>
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue placeholder="Select GPT" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center">
                            <Bot className="w-3 h-3 text-primary" />
                          </div>
                          Default UltriumGPT
                        </div>
                      </SelectItem>
                      {gpts.map((gpt) => (
                        <SelectItem key={gpt.id} value={gpt.id}>
                          <div className="flex items-center gap-2">
                            {gpt.logo_url ? (
                              <img src={gpt.logo_url} alt={gpt.name} className="w-4 h-4 rounded object-cover" />
                            ) : (
                              <div 
                                className="w-4 h-4 rounded flex items-center justify-center text-white text-xs font-medium"
                                style={{ backgroundColor: gpt.theme_color || '#3b82f6' }}
                              >
                                {gpt.name.charAt(0)}
                              </div>
                            )}
                            {gpt.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-xs text-muted-foreground">
                  {selectedGPT === "default" ? "General AI Assistant" : gpts.find(g => g.id === selectedGPT)?.description}
                </div>
              </div>
            </div>
            
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
              allowWebSearch={selectedGPT === "default" || gpts.find(g => g.id === selectedGPT)?.enable_web_search !== false}
              customGPTName={selectedGPT === "default" ? undefined : gpts.find(g => g.id === selectedGPT)?.name}
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