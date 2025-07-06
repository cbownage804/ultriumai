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
  Clock,
  Download
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VisualReportDisplay } from "./VisualReportDisplay";

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


export const UltriumGPTAssistant = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: `Hello! I'm UltriumGPT, your comprehensive AI assistant. 

I can help you with IT support, generate reports, search the web, create images, and automatically handle system management tasks.

Choose a question below to get started, or ask me anything!`,
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const downloadReport = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const parseReportData = (message: Message) => {
    if (!message.metadata?.reportGenerated) return null;

    const toolUsed = message.metadata.toolsUsed?.[0];
    let reportType: 'security' | 'rmm' | 'system_health' | 'threat_status' = 'rmm';
    let title = 'System Report';

    if (toolUsed?.includes('security')) {
      reportType = 'security';
      title = 'Security Report';
    } else if (toolUsed?.includes('rmm')) {
      reportType = 'rmm';
      title = 'RMM Status Report';
    } else if (toolUsed?.includes('health')) {
      reportType = 'system_health';
      title = 'System Health Report';
    } else if (toolUsed?.includes('threat')) {
      reportType = 'threat_status';
      title = 'Threat Status Report';
    }

    // Parse mock data based on report type (in real implementation, this would come from the API)
    const summary = reportType === 'rmm' ? {
      total_devices: 247,
      online_devices: 231,
      offline_devices: 16,
      alerts_count: 8,
      clients_count: 12,
      recommendations: [
        "Review offline devices and ensure they are intentionally offline or address connectivity issues",
        "Monitor SERVER-01 for high CPU usage and investigate potential causes",
        "Resolve low disk space on WS-MARKETING-12 to prevent service disruptions"
      ]
    } : {
      total_events: 15,
      critical_events: 2,
      high_severity_events: 5,
      open_incidents: 3,
      resolved_incidents: 8,
      recommendations: [
        "Immediate attention required for critical security events",
        "Review and address open security incidents",
        "Update security policies based on recent threat patterns"
      ]
    };

    return {
      type: reportType,
      title,
      summary,
      details: message.content,
      timestamp: message.timestamp.toISOString()
    };
  };

  const handleRefreshReport = async (originalMessage: string) => {
    setInput(originalMessage);
    setTimeout(() => handleSendMessage(), 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-full bg-gradient-to-r from-primary to-primary/80 shadow-lg">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              UltriumGPT Assistant
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Your comprehensive AI assistant for IT support, system management, research, and creative tasks
          </p>
        </div>

        {/* Main Content Area */}
        <div className="max-w-5xl mx-auto">
          {/* Chat Interface */}
          <div>
            <Card className="border-0 shadow-xl bg-gradient-to-b from-card to-card/50 min-h-[700px]">
              <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-secondary/5 rounded-t-lg pb-6">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Bot className="h-6 w-6 text-primary" />
                  </div>
                  Chat with UltriumGPT
                </CardTitle>
                <CardDescription className="text-base">
                  Ask questions, request reports, search the web, generate images, or get IT support
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {/* Messages Container */}
                <div className="relative">
                  <div className="h-[450px] overflow-y-auto space-y-6 p-4 rounded-xl bg-gradient-to-b from-muted/20 to-muted/10 border border-border/50">
                    {messages.map((message) => {
                      const reportData = parseReportData(message);
                      
                      if (reportData && message.role === 'assistant') {
                        return (
                          <div key={message.id} className="w-full">
                            <VisualReportDisplay
                              reportData={reportData}
                              onDownload={() => {
                                const timestamp = new Date().toISOString().split('T')[0];
                                downloadReport(message.content, `${reportData.title.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.txt`);
                              }}
                              onRefresh={() => handleRefreshReport(`Generate ${reportData.title.toLowerCase()}`)}
                            />
                          </div>
                        );
                      }

                      return (
                        <div key={message.id} className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
                            message.role === 'user' 
                              ? 'bg-gradient-to-r from-primary to-primary/80 text-white' 
                              : message.role === 'system'
                              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                              : 'bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground'
                          }`}>
                            {message.role === 'user' ? (
                              <User className="h-5 w-5" />
                            ) : (
                              <Bot className="h-5 w-5" />
                            )}
                          </div>
                          
                          <div className={`flex-1 space-y-2 max-w-[85%] ${message.role === 'user' ? 'text-right' : ''}`}>
                            <div className={`inline-block p-4 rounded-2xl shadow-sm ${
                              message.role === 'user'
                                ? 'bg-gradient-to-r from-primary to-primary/90 text-white ml-auto'
                                : 'bg-background border border-border/50'
                            }`}>
                              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                {message.content}
                              </div>
                              
                              {message.metadata && !message.metadata.reportGenerated && (
                                <div className="mt-3 pt-3 border-t border-border/30 space-y-2">
                                  {message.metadata.toolsUsed && message.metadata.toolsUsed.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                      {message.metadata.toolsUsed.map((tool, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                          🔧 {tool.replace('_', ' ')}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                  {message.metadata.ticketCreated && (
                                    <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded-lg">
                                      <CheckCircle className="h-4 w-4" />
                                      Support ticket #{message.metadata.ticketCreated} created successfully
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className={`text-xs text-muted-foreground flex items-center gap-1 ${
                              message.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}>
                              <Clock className="h-3 w-3" />
                              {formatTimestamp(message.timestamp)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {isLoading && (
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-secondary to-secondary/80 flex items-center justify-center shadow-md">
                          <Loader2 className="h-5 w-5 animate-spin text-secondary-foreground" />
                        </div>
                        <div className="flex-1 max-w-[85%]">
                          <div className="bg-background border border-border/50 rounded-2xl p-4 shadow-sm">
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent font-medium">
                                UltriumGPT is thinking...
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Starter Questions */}
                <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-4 border border-border/30">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Try asking me:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="justify-start h-auto p-3 bg-background/50 hover:bg-background/80 border-border/50 hover:border-primary/50 transition-all duration-200"
                      onClick={() => {
                        setInput("Generate a security report for the last 7 days");
                        setTimeout(() => handleSendMessage(), 100);
                      }}
                      disabled={isLoading}
                    >
                      <div className="text-left">
                        <div className="font-medium text-sm">🛡️ Security Report</div>
                        <div className="text-xs text-muted-foreground">Show me our security status</div>
                      </div>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="justify-start h-auto p-3 bg-background/50 hover:bg-background/80 border-border/50 hover:border-primary/50 transition-all duration-200"
                      onClick={() => {
                        setInput("What's the current threat status across all systems?");
                        setTimeout(() => handleSendMessage(), 100);
                      }}
                      disabled={isLoading}
                    >
                      <div className="text-left">
                        <div className="font-medium text-sm">⚠️ Threat Status</div>
                        <div className="text-xs text-muted-foreground">Check for active threats</div>
                      </div>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="justify-start h-auto p-3 bg-background/50 hover:bg-background/80 border-border/50 hover:border-primary/50 transition-all duration-200"
                      onClick={() => {
                        setInput("Search the web for the latest cybersecurity threats");
                        setTimeout(() => handleSendMessage(), 100);
                      }}
                      disabled={isLoading}
                    >
                      <div className="text-left">
                        <div className="font-medium text-sm">🌐 Web Search</div>
                        <div className="text-xs text-muted-foreground">Find current information</div>
                      </div>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="justify-start h-auto p-3 bg-background/50 hover:bg-background/80 border-border/50 hover:border-primary/50 transition-all duration-200"
                      onClick={() => {
                        setInput("Perform a system health check on all monitored systems");
                        setTimeout(() => handleSendMessage(), 100);
                      }}
                      disabled={isLoading}
                    >
                      <div className="text-left">
                        <div className="font-medium text-sm">💚 System Health</div>
                        <div className="text-xs text-muted-foreground">Check all systems status</div>
                      </div>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="justify-start h-auto p-3 bg-background/50 hover:bg-background/80 border-border/50 hover:border-primary/50 transition-all duration-200"
                      onClick={() => {
                        setInput("Generate an image of a modern cybersecurity dashboard");
                        setTimeout(() => handleSendMessage(), 100);
                      }}
                      disabled={isLoading}
                    >
                      <div className="text-left">
                        <div className="font-medium text-sm">🎨 Generate Image</div>
                        <div className="text-xs text-muted-foreground">Create AI-powered visuals</div>
                      </div>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="justify-start h-auto p-3 bg-background/50 hover:bg-background/80 border-border/50 hover:border-primary/50 transition-all duration-200"
                      onClick={() => {
                        setInput("My server is running slow, can you help troubleshoot?");
                        setTimeout(() => handleSendMessage(), 100);
                      }}
                      disabled={isLoading}
                    >
                      <div className="text-left">
                        <div className="font-medium text-sm">🔧 IT Support</div>
                        <div className="text-xs text-muted-foreground">Get technical help</div>
                      </div>
                    </Button>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Enhanced Input Area */}
                <div className="space-y-4">
                  <div className="relative">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything - generate reports, search the web, create images, troubleshoot issues, or get IT support..."
                      rows={4}
                      disabled={isLoading}
                      className="resize-none border-border/50 focus:border-primary/50 bg-background/50 backdrop-blur-sm text-base p-4 rounded-xl"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                      💡 Press <kbd className="px-2 py-1 bg-background rounded text-xs">Enter</kbd> to send, <kbd className="px-2 py-1 bg-background rounded text-xs">Shift+Enter</kbd> for new line
                    </div>
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={!input.trim() || isLoading}
                      size="lg"
                      className="px-6 py-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};