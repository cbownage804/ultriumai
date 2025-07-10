import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bot, 
  Send, 
  User, 
  Brain, 
  Shield, 
  HeadphonesIcon,
  Server,
  Scan,
  MessageSquare,
  ChevronUp,
  ChevronDown,
  Minimize2,
  Maximize2,
  X,
  Loader2,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    source?: 'ultrium' | 'security' | 'helpdesk' | 'safescan' | 'rmm';
    actions?: string[];
    ticketCreated?: string;
    scanCompleted?: boolean;
    threatLevel?: string;
  };
}

interface UnifiedAIAssistantProps {
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  defaultSource?: 'ultrium' | 'security' | 'helpdesk' | 'safescan' | 'rmm';
  context?: string;
  className?: string;
}

export const UnifiedAIAssistant = ({ 
  isMinimized = false, 
  onToggleMinimize,
  defaultSource = 'ultrium',
  context = 'dashboard',
  className = ""
}: UnifiedAIAssistantProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'ultrium' | 'security' | 'helpdesk' | 'safescan' | 'rmm'>(defaultSource);
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    role: 'system',
    content: `Hello! I'm your unified AI assistant. I can help with:

🔧 **IT Support & RMM** - System monitoring, device management, troubleshooting
🛡️ **Security Analysis** - Threat detection, vulnerability assessment, incident response  
📧 **SafeScan** - Email, URL, and document security scanning
🎫 **Helpdesk** - Ticket management, customer support automation
⚡ **UltriumGPT** - General assistance, reports, web search, image generation

Select a tab above or ask me anything!`,
    timestamp: new Date(),
    metadata: { source: 'ultrium' }
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getSourceConfig = (source: string) => {
    const configs = {
      ultrium: {
        icon: Zap,
        label: "UltriumGPT",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        function: "ultrium-gpt-assistant"
      },
      security: {
        icon: Shield,
        label: "Security AI",
        color: "text-red-600", 
        bgColor: "bg-red-50",
        function: "security-ai-assistant"
      },
      helpdesk: {
        icon: HeadphonesIcon,
        label: "Helpdesk AI",
        color: "text-green-600",
        bgColor: "bg-green-50", 
        function: "ai-helpdesk-assistant"
      },
      safescan: {
        icon: Scan,
        label: "SafeScan AI",
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        function: "safescan-ai-analyzer"
      },
      rmm: {
        icon: Server,
        label: "RMM AI",
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        function: "rmm-commands"
      }
    };
    return configs[source as keyof typeof configs] || configs.ultrium;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      metadata: { source: activeTab as any }
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    const userInput = input;
    setInput("");

    try {
      const sourceConfig = getSourceConfig(activeTab);
      
      const { data, error } = await supabase.functions.invoke(sourceConfig.function, {
        body: {
          message: userInput,
          userId: user?.id,
          context: context,
          source: activeTab
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.analysis || data.message || "I'm here to help!",
        timestamp: new Date(),
        metadata: {
          source: activeTab as any,
          ...data.metadata
        }
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle different response types
      if (data.metadata?.ticketCreated) {
        toast({
          title: "Support Ticket Created",
          description: `Ticket #${data.metadata.ticketCreated} has been created.`,
        });
      }

      if (data.metadata?.scanCompleted) {
        toast({
          title: "Security Scan Complete",
          description: `Scan completed with ${data.metadata.threatLevel || 'no'} threats detected.`,
        });
      }

    } catch (error) {
      console.error('Error calling AI assistant:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
        metadata: { source: activeTab as any }
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Connection Error",
        description: "Unable to connect to AI assistant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isMinimized) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          onClick={onToggleMinimize}
          size="lg"
          className="rounded-full h-14 w-14 bg-gradient-to-r from-primary to-primary/80 shadow-xl hover:shadow-2xl transition-all duration-300"
        >
          <Bot className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <Card className={`w-96 shadow-2xl border-0 bg-background/95 backdrop-blur-sm transition-all duration-300 ${
        isExpanded ? 'h-[600px]' : 'h-[400px]'
      }`}>
        <CardHeader className="pb-3 border-b bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              AI Assistant
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0"
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              {onToggleMinimize && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onToggleMinimize}
                  className="h-8 w-8 p-0"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 flex flex-col h-full">
          {/* AI Source Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-5 mb-3">
              {(['ultrium', 'security', 'helpdesk', 'safescan', 'rmm'] as const).map((source) => {
                const config = getSourceConfig(source);
                return (
                  <TabsTrigger 
                    key={source} 
                    value={source} 
                    className="p-1 text-xs"
                    title={config.label}
                  >
                    <config.icon className="h-4 w-4" />
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value={activeTab} className="flex-1 flex flex-col mt-0">
              {/* Messages */}
              <div className={`flex-1 overflow-y-auto space-y-3 mb-3 ${
                isExpanded ? 'max-h-[420px]' : 'max-h-[220px]'
              }`}>
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user' 
                        ? 'bg-primary text-white' 
                        : message.role === 'system'
                        ? 'bg-muted'
                        : getSourceConfig(message.metadata?.source || activeTab).bgColor
                    }`}>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        (() => {
                          const config = getSourceConfig(message.metadata?.source || activeTab);
                          return <config.icon className={`h-4 w-4 ${config.color}`} />;
                        })()
                      )}
                    </div>
                    
                    <div className={`flex-1 max-w-[85%] ${message.role === 'user' ? 'text-right' : ''}`}>
                      <div className={`inline-block p-3 rounded-lg text-sm ${
                        message.role === 'user'
                          ? 'bg-primary text-white ml-auto'
                          : 'bg-muted'
                      }`}>
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </div>
                        
                        {message.metadata && message.metadata.actions && (
                          <div className="mt-2 pt-2 border-t border-border/30">
                            <div className="flex flex-wrap gap-1">
                              {message.metadata.actions.map((action, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {action}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className={`text-xs text-muted-foreground mt-1 flex items-center gap-1 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}>
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      getSourceConfig(activeTab).bgColor
                    }`}>
                      <Loader2 className={`h-4 w-4 animate-spin ${getSourceConfig(activeTab).color}`} />
                    </div>
                    <div className="flex-1 max-w-[85%]">
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          {getSourceConfig(activeTab).label} is thinking...
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="space-y-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Ask ${getSourceConfig(activeTab).label} anything...`}
                  rows={2}
                  disabled={isLoading}
                  className="resize-none text-sm"
                />
                
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!input.trim() || isLoading}
                    size="sm"
                    className="bg-gradient-to-r from-primary to-primary/90"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};