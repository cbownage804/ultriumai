import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot, User, Copy, Check, Clock, AlertTriangle } from "lucide-react";
import { useCustomGPTs, CustomGPT } from "@/hooks/useCustomGPTs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

const CustomGPTAsk = () => {
  const { gpts, isLoading: isLoadingGPTs } = useCustomGPTs();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState<Array<{id: string, file_name: string, processed_content: string}>>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

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

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentGPT) return;

    const userMessage: Message = {
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

      // Call the chat completion API with the enhanced system prompt
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
            name: currentGPT.name
          }
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to get AI response');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
      
      // Add error message to chat
      const errorMessage: Message = {
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
          <ScrollArea className="flex-1 p-4 min-h-0">
            <div className="space-y-4 pb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                      <AvatarFallback>
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`max-w-[80%] rounded-lg p-3 relative group ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                        {message.status && message.role === 'user' && (
                          <div className="flex items-center gap-1">
                            {message.status === 'sending' && <Clock className="h-3 w-3 opacity-70" />}
                            {message.status === 'sent' && <Check className="h-3 w-3 opacity-70" />}
                            {message.status === 'error' && <AlertTriangle className="h-3 w-3 opacity-70 text-destructive" />}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                        onClick={() => copyMessage(message.content, message.id)}
                      >
                        {copiedMessageId === message.id ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t flex-shrink-0 bg-card">
            <div className="flex gap-2">
              <Input
                placeholder="Ask your Custom GPT anything..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <Button onClick={sendMessage} disabled={isLoading || !inputMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Total Conversations</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Messages Today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Avg Response Time</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomGPTAsk;