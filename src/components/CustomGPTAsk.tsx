import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Bot, Send, Settings } from "lucide-react";
import { BackToHubButton } from "@/components/shared/BackToHubButton";
import { useCustomGPTs } from "@/hooks/useCustomGPTs";
import { supabase } from "@/integrations/supabase/client";
import { useMessageOperations } from "@/hooks/useMessageOperations";
import { EnhancedMessageList } from "@/components/chat/EnhancedMessageList";
import { QuickActionToolbar } from "@/components/chat/QuickActionToolbar";
import { TemplateFeatureBadges } from "@/components/chat/TemplateFeatureBadges";
import { ChatStats } from "@/components/chat/ChatStats";
import { ModelSettings, ModelParams } from "@/components/chat/ModelSettings";
import { UsageDisplay } from "@/components/chat/UsageDisplay";
import { ChatMessage } from "@/types/chat";

const CustomGPTAsk = () => {
  const { gpts, isLoading: isLoadingGPTs } = useCustomGPTs();
  const { isLoading, copiedMessageId, copyMessage, sendMessage } = useMessageOperations();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [knowledgeBase, setKnowledgeBase] = useState<Array<{id: string, file_name: string, processed_content: string}>>([]);
  const [lastUsage, setLastUsage] = useState<any>(null);
  
  // Model parameters state
  const [modelParams, setModelParams] = useState<ModelParams>({
    model: 'gpt-4.1-2025-04-14',
    temperature: 0.7,
    max_tokens: 1000,
    top_p: 1.0,
    frequency_penalty: 0,
    presence_penalty: 0
  });

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

  const handleSendMessage = async () => {
    if (!currentGPT) return;
    
    try {
      // Enhanced sendMessage call with model parameters and usage tracking
      const result = await sendMessage(
        inputMessage, 
        currentGPT, 
        messages, 
        knowledgeBase, 
        setMessages, 
        setInputMessage, 
        modelParams
      );
      
      // Update usage if returned
      if (result && result.usage) {
        setLastUsage(result.usage);
      }
    } catch (error) {
      console.error('Send message error:', error);
    }
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ask Your GPT</h1>
          <p className="text-muted-foreground mt-2">
            Test and interact with your Custom GPT
          </p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <BackToHubButton />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Model Settings
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>AI Model Configuration</SheetTitle>
                <SheetDescription>
                  Configure AI model and generation parameters
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <ModelSettings 
                  modelParams={modelParams} 
                  onChange={setModelParams}
                  disabled={isLoading}
                />
                {lastUsage && <UsageDisplay usage={lastUsage} />}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Card className="h-[650px] flex flex-col">
        <CardHeader className="border-b flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: currentGPT.theme_color || '#3b82f6' }}
                >
                  {(currentGPT.name || 'G').charAt(0)}
                </div>
                {currentGPT.name || 'My Custom GPT'}
              </CardTitle>
              <CardDescription>
                {currentGPT.description || 'Chat with your Custom GPT to test its responses'}
              </CardDescription>
            </div>
            <TemplateFeatureBadges 
              enableWebSearch={currentGPT.enable_web_search}
              compact
            />
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 min-h-0">
          <EnhancedMessageList 
            messages={messages}
            isLoading={isLoading}
            copiedMessageId={copiedMessageId}
            onCopyMessage={copyMessage}
            gptName={currentGPT.name}
            gptDescription={currentGPT.description}
            features={(currentGPT.features as string[]) || []}
            starterQuestions={currentGPT.starter_questions as string[] || []}
            themeColor={currentGPT.theme_color || '#3b82f6'}
            category={currentGPT.category || undefined}
            onQuestionSelect={(question) => setInputMessage(question)}
          />
          
          <QuickActionToolbar
            category={currentGPT.category || undefined}
            onAction={(prompt) => {
              setInputMessage(prompt);
            }}
            disabled={isLoading}
          />
          
          <div className="p-4 border-t flex-shrink-0 bg-card">
            <div className="flex gap-2">
              <Input
                placeholder={currentGPT.placeholder_prompt || "Ask your Custom GPT anything..."}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="text-sm"
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