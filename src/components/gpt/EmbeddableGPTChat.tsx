import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

interface GPTData {
  id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  logo_url: string | null;
  system_prompt: string;
  chat_count: number;
  agent_visibility: string;
  is_active: boolean;
  primary_color: string | null;
  secondary_color: string | null;
  background_color: string | null;
  background_type: string | null;
  placeholder_prompt: string | null;
  starter_questions: string[] | null;
  starter_questions_header: string | null;
  starter_questions_expand: string | null;
  starter_questions_collapse: string | null;
  remove_branding: boolean;
  theme_color: string | null;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface EmbeddableGPTChatProps {
  gptId: string;
  isEmbed?: boolean;
  hideHeader?: boolean;
}

const EmbeddableGPTChat = ({ gptId, isEmbed = false, hideHeader = false }: EmbeddableGPTChatProps) => {
  const { toast } = useToast();
  const [gpt, setGPT] = useState<GPTData | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showMoreQuestions, setShowMoreQuestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadGPT = async () => {
      if (!gptId) return;

      try {
        const { data, error } = await supabase
          .from('custom_gpts')
          .select('*')
          .eq('id', gptId)
          .eq('agent_visibility', 'public')
          .eq('is_active', true)
          .single();

        if (error || !data) {
          console.error('GPT not found:', error);
          return;
        }

        // Parse starter_questions if it's a string
        const parsedData = {
          ...data,
          starter_questions: Array.isArray(data.starter_questions) 
            ? data.starter_questions 
            : typeof data.starter_questions === 'string' 
              ? JSON.parse(data.starter_questions) 
              : null
        };

        setGPT(parsedData);
      } catch (error) {
        console.error('Error loading GPT:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGPT();
  }, [gptId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || inputMessage;
    if (!text.trim() || !gpt || sending) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('public-gpt-chat', {
        body: {
          message: text,
          gpt_id: gpt.id,
          conversation_id: conversationId
        }
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (!conversationId && data.conversation_id) {
        setConversationId(data.conversation_id);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleStarterQuestion = (question: string) => {
    sendMessage(question);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!gpt) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-background p-8 text-center">
        <MessageSquare className="h-12 w-12 mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">Assistant Not Found</h2>
        <p className="text-muted-foreground">
          This assistant is not available or doesn't exist.
        </p>
      </div>
    );
  }

  const primaryColor = gpt.primary_color || gpt.theme_color || '#0078d4';
  const starterQuestions = gpt.starter_questions || [];
  const visibleQuestions = showMoreQuestions ? starterQuestions : starterQuestions.slice(0, 3);

  return (
    <div 
      className="flex flex-col h-full bg-background"
      style={{ 
        '--gpt-primary': primaryColor,
        '--gpt-primary-foreground': '#ffffff'
      } as React.CSSProperties}
    >
      {/* Header */}
      {!hideHeader && (
        <div 
          className="flex items-center gap-3 p-4 border-b"
          style={{ backgroundColor: primaryColor }}
        >
          <Avatar className="h-10 w-10 border-2 border-white/20">
            <AvatarImage src={gpt.logo_url || gpt.avatar_url || undefined} />
            <AvatarFallback className="text-white" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              {gpt.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-white">{gpt.name}</span>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            {/* Welcome Avatar */}
            <Avatar className="h-16 w-16 mb-6 ring-4 ring-primary/20">
              <AvatarImage src={gpt.logo_url || gpt.avatar_url || undefined} />
              <AvatarFallback style={{ backgroundColor: primaryColor }} className="text-white text-xl">
                {gpt.name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            {/* Welcome Message */}
            <div className="max-w-lg text-center mb-6">
              <div className="flex items-start gap-3 bg-muted/50 rounded-lg p-4">
                <MessageSquare className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm">
                    {gpt.description || `Welcome! I'm ${gpt.name} — your virtual assistant. What do you need help with today?`}
                  </p>
                </div>
              </div>
            </div>

            {/* Starter Questions */}
            {starterQuestions.length > 0 && (
              <div className="w-full max-w-lg space-y-2">
                {visibleQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3 px-4 text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                    style={{ 
                      backgroundColor: primaryColor,
                      color: 'white',
                      borderColor: primaryColor
                    }}
                    onClick={() => handleStarterQuestion(question)}
                  >
                    "{question}"
                  </Button>
                ))}
                
                {starterQuestions.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground"
                    onClick={() => setShowMoreQuestions(!showMoreQuestions)}
                  >
                    {showMoreQuestions ? (
                      <>
                        {gpt.starter_questions_collapse || "View Less"} <ChevronUp className="ml-1 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        {gpt.starter_questions_expand || "View More"} <ChevronDown className="ml-1 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={gpt.logo_url || gpt.avatar_url || undefined} />
                    <AvatarFallback style={{ backgroundColor: primaryColor }} className="text-white text-xs">
                      {gpt.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user' 
                    ? 'text-white' 
                    : 'bg-muted'
                }`}
                style={message.role === 'user' ? { backgroundColor: primaryColor } : undefined}
                >
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                </div>
                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">U</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {sending && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={gpt.logo_url || gpt.avatar_url || undefined} />
                  <AvatarFallback style={{ backgroundColor: primaryColor }} className="text-white text-xs">
                    {gpt.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex gap-2 max-w-2xl mx-auto">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={gpt.placeholder_prompt || "How can I help you today?"}
            disabled={sending}
            className="flex-1 rounded-full px-4"
          />
          <Button 
            onClick={() => sendMessage()} 
            disabled={!inputMessage.trim() || sending}
            size="icon"
            className="rounded-full"
            style={{ backgroundColor: primaryColor }}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* Branding */}
        {!gpt.remove_branding && (
          <div className="text-center mt-3 text-xs text-muted-foreground">
            Powered by <span className="font-medium">UltriumAI</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmbeddableGPTChat;
