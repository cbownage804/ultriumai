import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Zap, 
  Send, 
  Bot, 
  User, 
  BarChart3, 
  AlertTriangle, 
  Server, 
  Shield, 
  HeadphonesIcon,
  FileText,
  Loader2,
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
    action?: string;
    toolsUsed?: string[];
    ticketCreated?: string;
    reportGenerated?: boolean;
  };
}

interface AvailableAction {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: 'report' | 'support' | 'monitoring' | 'security' | 'research' | 'creative';
}

const availableActions: AvailableAction[] = [
  {
    id: 'generate-security-report',
    name: 'Security Report',
    description: 'Generate comprehensive security status report',
    icon: Shield,
    category: 'report'
  },
  {
    id: 'generate-rmm-report',
    name: 'RMM Report',
    description: 'Generate system monitoring and management report',
    icon: Server,
    category: 'report'
  },
  {
    id: 'check-threat-status',
    name: 'Threat Status',
    description: 'Check current threat detection status',
    icon: AlertTriangle,
    category: 'security'
  },
  {
    id: 'create-support-ticket',
    name: 'Support Ticket',
    description: 'Create a new support ticket',
    icon: HeadphonesIcon,
    category: 'support'
  },
  {
    id: 'system-health-check',
    name: 'System Health',
    description: 'Perform comprehensive system health check',
    icon: BarChart3,
    category: 'monitoring'
  },
  {
    id: 'web-search',
    name: 'Web Search',
    description: 'Search the web for current information',
    icon: FileText,
    category: 'research'
  },
  {
    id: 'generate-image',
    name: 'Generate Image',
    description: 'Create images with AI based on descriptions',
    icon: FileText,
    category: 'creative'
  }
];

export const UltriumGPTAssistant = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: `Hello! I'm UltriumGPT, your comprehensive AI assistant for IT support, system management, and more. I can help you with:

• **Generate Reports** - Security, RMM, threat analysis, and system health reports
• **IT Support** - Answer questions and troubleshoot issues
• **Monitor Systems** - Check status of your RMM, antivirus, and security tools
• **Create Tickets** - Automatically escalate issues to support when needed
• **Analyze Data** - Provide insights from your security and monitoring data
• **Web Search** - Search the internet for current information and research
• **Generate Images** - Create custom images and visual content with AI

What can I help you with today?`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    const userInput = input;
    setInput("");

    try {
      // Call the UltriumGPT assistant edge function
      const { data, error } = await supabase.functions.invoke('ultrium-gpt-assistant', {
        body: {
          message: userInput,
          userId: user?.id,
          context: 'dashboard'
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        metadata: data.metadata
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Show success notifications for actions taken
      if (data.metadata?.ticketCreated) {
        toast({
          title: "Support Ticket Created",
          description: `Ticket #${data.metadata.ticketCreated} has been created and assigned.`,
        });
      }

      if (data.metadata?.reportGenerated) {
        toast({
          title: "Report Generated",
          description: "Your report has been generated and is ready for download.",
        });
      }

    } catch (error) {
      console.error('Error calling UltriumGPT:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting to my systems right now. Please try again in a moment, or contact support if the issue persists.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Connection Error",
        description: "Unable to connect to UltriumGPT. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action: AvailableAction) => {
    const quickMessage = `Please ${action.name.toLowerCase()}: ${action.description}`;
    setInput(quickMessage);
    
    // Auto-send the message
    setTimeout(() => {
      handleSendMessage();
    }, 100);
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'report': return 'bg-blue-100 text-blue-800';
      case 'support': return 'bg-green-100 text-green-800';
      case 'monitoring': return 'bg-orange-100 text-orange-800';
      case 'security': return 'bg-red-100 text-red-800';
      case 'research': return 'bg-purple-100 text-purple-800';
      case 'creative': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            UltriumGPT Assistant
          </h1>
          <p className="text-muted-foreground">
            Your AI-powered IT support and system management assistant
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Quick Actions Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>
              Common tasks I can help you with
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {availableActions.map((action) => (
              <div key={action.id}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-auto p-3"
                  onClick={() => handleQuickAction(action)}
                  disabled={isLoading}
                >
                  <div className="flex items-start gap-2 w-full">
                    <action.icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-medium text-sm">{action.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {action.description}
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs mt-1 ${getCategoryColor(action.category)}`}
                      >
                        {action.category}
                      </Badge>
                    </div>
                  </div>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Chat with UltriumGPT
            </CardTitle>
            <CardDescription>
              Ask questions, request reports, or get IT support
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Messages */}
            <div className="h-96 overflow-y-auto space-y-4 p-4 border rounded-lg bg-muted/20">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : message.role === 'system'
                      ? 'bg-green-500 text-white'
                      : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div className={`flex-1 space-y-2 ${message.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-background border'
                    }`}>
                      <div className="whitespace-pre-wrap text-sm">
                        {message.content}
                      </div>
                      {message.metadata && (
                        <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                          {message.metadata.toolsUsed && (
                            <div className="flex flex-wrap gap-1">
                              {message.metadata.toolsUsed.map((tool, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tool}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {message.metadata.ticketCreated && (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              Ticket #{message.metadata.ticketCreated} created
                            </div>
                          )}
                          {message.metadata.reportGenerated && (
                            <div className="flex items-center gap-1 text-xs text-blue-600">
                              <FileText className="h-3 w-3" />
                              Report generated
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-background border rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        UltriumGPT is thinking...
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <Separator />

            {/* Input Area */}
            <div className="space-y-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your systems, request reports, or get IT support..."
                rows={3}
                disabled={isLoading}
                className="resize-none"
              />
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground">
                  Press Enter to send, Shift+Enter for new line
                </div>
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!input.trim() || isLoading}
                  size="sm"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};