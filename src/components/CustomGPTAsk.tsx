import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send } from "lucide-react";
import { useCustomGPTs } from "@/hooks/useCustomGPTs";
import { supabase } from "@/integrations/supabase/client";
import { useMessageOperations } from "@/hooks/useMessageOperations";
import { MessageList } from "@/components/chat/MessageList";
import { ChatStats } from "@/components/chat/ChatStats";
import { ChatMessage } from "@/types/chat";

const CustomGPTAsk = () => {
  const { gpts, isLoading: isLoadingGPTs } = useCustomGPTs();
  const { isLoading, copiedMessageId, copyMessage, sendMessage } = useMessageOperations();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [knowledgeBase, setKnowledgeBase] = useState<Array<{id: string, file_name: string, processed_content: string}>>([]);

  const currentGPT = gpts[0]; // Use the first/latest GPT

  // Load knowledge base documents for the current GPT
  useEffect(() => {
    const loadKnowledgeBase = async () => {
      if (!currentGPT) return;
      
      try {
        const { data, error } = await supabase
          .from('gpt_documents')
          .select('id, file_name, processed_content')
          .eq('gpt_id', currentGPT.id);
          
        if (error) throw error;
        setKnowledgeBase(data || []);
      } catch (error) {
        console.error('Error loading knowledge base:', error);
      }
    };
    
    loadKnowledgeBase();
  }, [currentGPT]);

  useEffect(() => {
    if (currentGPT) {
      setMessages([
        {
          id: '1',
          content: currentGPT.placeholder_prompt || "Hello! I'm your Custom GPT. How can I help you today?",
          role: 'assistant',
          timestamp: new Date()
        }
      ]);
    }
  }, [currentGPT]);

  const handleSendMessage = () => {
    if (!currentGPT) return;
    sendMessage(inputMessage, currentGPT, messages, knowledgeBase, setMessages, setInputMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoadingGPTs) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your Custom GPT...</p>
        </div>
      </div>
    );
  }

  if (!currentGPT) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Ask Your GPT</h1>
          <p className="text-muted-foreground mt-2">
            Test and interact with your Custom GPT
          </p>
        </div>
        <Card className="h-[600px] flex items-center justify-center">
          <div className="text-center">
            <Bot className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Custom GPT Found</h3>
            <p className="text-muted-foreground mb-4">
              You need to create and configure a Custom GPT first.
            </p>
            <Button onClick={() => window.location.href = '/dashboard/custom-gpts/personalize'}>
              Create Your GPT
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ask Your GPT</h1>
        <p className="text-muted-foreground mt-2">
          Test and interact with your Custom GPT
        </p>
      </div>

      <Card className="h-[600px] flex flex-col">
        <CardHeader className="border-b flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {currentGPT.name || 'My Custom GPT'}
          </CardTitle>
          <CardDescription>
            {currentGPT.description || 'Chat with your Custom GPT to test its responses'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 min-h-0">
          <MessageList 
            messages={messages}
            isLoading={isLoading}
            copiedMessageId={copiedMessageId}
            onCopyMessage={copyMessage}
          />
          
          <div className="p-4 border-t flex-shrink-0 bg-card">
            <div className="flex gap-2">
              <Input
                placeholder="Ask your Custom GPT anything..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <Button onClick={handleSendMessage} disabled={isLoading || !inputMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ChatStats />
    </div>
  );
};

export default CustomGPTAsk;