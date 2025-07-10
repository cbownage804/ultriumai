import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield, 
  Send, 
  Loader2, 
  Bot, 
  User, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  Settings,
  Minimize2,
  Maximize2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SecurityMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: {
    activeAlerts?: number;
    criticalThreats?: number;
    openIncidents?: number;
    complianceScore?: number;
    suggestions?: string[];
  };
}

interface SecurityAIAssistantProps {
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  securityContext?: {
    activeAlerts: number;
    criticalThreats: number;
    openIncidents: number;
    complianceScore: number;
  };
}

export const SecurityAIAssistant = ({ 
  isMinimized = false, 
  onToggleMinimize,
  securityContext 
}: SecurityAIAssistantProps) => {
  const [messages, setMessages] = useState<SecurityMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `🛡️ **UltriumDefender AI** at your service. I'm your dedicated cybersecurity analyst with real-time access to your security infrastructure.

**Current Security Status:**
${securityContext ? `
• ${securityContext.activeAlerts} active alerts
• ${securityContext.criticalThreats} critical threats
• ${securityContext.openIncidents} open incidents  
• ${securityContext.complianceScore}% compliance score
` : '• Connecting to security systems...'}

How can I help secure your environment today?`,
      timestamp: new Date(),
      context: {
        activeAlerts: securityContext?.activeAlerts,
        criticalThreats: securityContext?.criticalThreats,
        openIncidents: securityContext?.openIncidents,
        complianceScore: securityContext?.complianceScore
      }
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: SecurityMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('security-ai-assistant', {
        body: {
          message: inputMessage,
          context: {
            security_state: securityContext,
            conversation_history: messages.slice(-5) // Last 5 messages for context
          }
        }
      });

      if (error) throw error;

      const assistantMessage: SecurityMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        context: data.context
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle any automated actions suggested by the AI
      if (data.suggested_actions?.length > 0) {
        toast({
          title: "AI Recommendations Available",
          description: `${data.suggested_actions.length} security actions suggested`,
        });
      }

    } catch (error) {
      console.error('Security AI error:', error);
      toast({
        title: "Error",
        description: "Failed to communicate with UltriumDefender AI",
        variant: "destructive",
      });
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

  const getSeverityIcon = (content: string) => {
    if (content.includes('critical') || content.includes('urgent')) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    if (content.includes('resolved') || content.includes('secure')) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (content.includes('analysis') || content.includes('trend')) {
      return <TrendingUp className="h-4 w-4 text-blue-500" />;
    }
    return <Shield className="h-4 w-4 text-primary" />;
  };

  if (isMinimized) {
    return (
      <Card className="fixed bottom-4 right-4 w-16 h-16 cursor-pointer hover:shadow-lg transition-shadow z-50">
        <CardContent 
          className="p-0 flex items-center justify-center h-full"
          onClick={onToggleMinimize}
        >
          <div className="relative">
            <Shield className="h-8 w-8 text-primary" />
            {securityContext && securityContext.activeAlerts > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {securityContext.activeAlerts}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[600px] flex flex-col shadow-xl z-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">UltriumDefender AI</CardTitle>
            <Badge variant="outline" className="text-xs">
              Live
            </Badge>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleMinimize}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div key={message.id} className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback>
                    {message.role === 'assistant' ? (
                      <Bot className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <div className={`rounded-lg p-3 ${
                    message.role === 'assistant' 
                      ? 'bg-muted' 
                      : 'bg-primary text-primary-foreground'
                  }`}>
                    <div className="flex items-start gap-2">
                      {message.role === 'assistant' && getSeverityIcon(message.content)}
                      <p className="text-sm whitespace-pre-wrap flex-1">{message.content}</p>
                    </div>
                  </div>
                  
                  {message.context?.suggestions && (
                    <div className="space-y-1">
                      {message.context.suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="text-xs h-6"
                          onClick={() => setInputMessage(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Analyzing security data...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Ask about threats, incidents, compliance..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="min-h-[40px] max-h-[100px] resize-none"
              rows={1}
            />
            <Button 
              onClick={sendMessage} 
              disabled={isLoading || !inputMessage.trim()}
              size="icon"
              className="h-10 w-10 flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="flex gap-1 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6"
              onClick={() => setInputMessage("What are my current security risks?")}
            >
              Risk Assessment
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6"
              onClick={() => setInputMessage("Generate compliance report")}
            >
              Compliance
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};