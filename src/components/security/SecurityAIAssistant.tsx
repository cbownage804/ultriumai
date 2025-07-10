import { useState, useRef, useEffect, useCallback } from "react";
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
  Maximize2,
  Mic,
  MicOff,
  Zap,
  Eye,
  Activity,
  Terminal,
  Upload,
  FileText,
  Image,
  Network
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Speech Recognition API types
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

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
  const [isListening, setIsListening] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProactiveMode, setIsProactiveMode] = useState(true);
  const [speechRecognition, setSpeechRecognition] = useState<any>(null);
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize voice recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionAPI = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };
      
      recognition.onerror = () => {
        setIsListening(false);
        toast({
          title: "Voice Recognition Error",
          description: "Could not process voice input. Please try again.",
          variant: "destructive",
        });
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      setSpeechRecognition(recognition);
    }
  }, [toast]);

  const toggleVoiceRecognition = () => {
    if (!speechRecognition) {
      toast({
        title: "Voice Recognition Unavailable",
        description: "Your browser doesn't support voice recognition.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      speechRecognition.stop();
      setIsListening(false);
    } else {
      speechRecognition.start();
      setIsListening(true);
    }
  };

  // Proactive threat monitoring
  useEffect(() => {
    if (!isProactiveMode) return;
    
    const monitorThreats = async () => {
      if (securityContext && securityContext.criticalThreats > 0) {
        const proactiveMessage: SecurityMessage = {
          id: `proactive-${Date.now()}`,
          role: 'assistant',
          content: `🔴 **PROACTIVE ALERT**: I've detected ${securityContext.criticalThreats} critical threats in your environment. 

**Immediate Action Required:**
• Review threat details and assess impact
• Initiate containment procedures
• Document incident for compliance

Would you like me to analyze these threats and recommend response actions?`,
          timestamp: new Date(),
          context: {
            activeAlerts: securityContext.activeAlerts,
            criticalThreats: securityContext.criticalThreats,
            openIncidents: securityContext.openIncidents,
            complianceScore: securityContext.complianceScore,
            suggestions: ["Analyze critical threats", "Show containment options", "Generate incident report"]
          }
        };
        
        setMessages(prev => {
          // Only add if we don't already have a proactive message
          if (!prev.some(msg => msg.id.startsWith('proactive-'))) {
            return [...prev, proactiveMessage];
          }
          return prev;
        });
      }
    };

    const timer = setTimeout(monitorThreats, 3000); // Check after 3 seconds
    return () => clearTimeout(timer);
  }, [securityContext, isProactiveMode]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const validTypes = [
        'text/plain', 'text/csv', 'application/json', 'application/xml',
        'image/png', 'image/jpeg', 'image/gif', 'image/webp',
        'application/pdf', 'text/log'
      ];
      return validTypes.includes(file.type) || file.name.endsWith('.log') || file.name.endsWith('.pcap');
    });

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      toast({
        title: "Files Uploaded",
        description: `${validFiles.length} file(s) ready for analysis`,
      });
    }

    if (files.length > validFiles.length) {
      toast({
        title: "Some Files Rejected",
        description: "Only security logs, images, and supported formats are allowed",
        variant: "destructive",
      });
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // WebSocket connection for real-time streaming
  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket(`wss://nsyobmjpdpvesjwdphlh.functions.supabase.co/security-ai-realtime`);
      
      ws.onopen = () => {
        console.log('Connected to UltriumDefender AI real-time service');
        setWebSocket(ws);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received WebSocket message:', data.type);

        if (data.type === 'response.text.delta') {
          setStreamingMessage(prev => prev + data.delta);
          setIsStreaming(true);
        } else if (data.type === 'response.text.done' || data.type === 'response.done') {
          // Finalize the streaming message
          if (streamingMessage) {
            const assistantMessage: SecurityMessage = {
              id: Date.now().toString(),
              role: 'assistant',
              content: streamingMessage,
              timestamp: new Date(),
              context: {
                activeAlerts: securityContext?.activeAlerts,
                criticalThreats: securityContext?.criticalThreats,
                openIncidents: securityContext?.openIncidents,
                complianceScore: securityContext?.complianceScore
              }
            };
            
            setMessages(prev => [...prev, assistantMessage]);
            setStreamingMessage("");
            setIsStreaming(false);
            setIsLoading(false);
          }
        } else if (data.type === 'error') {
          console.error('WebSocket error:', data.error);
          toast({
            title: "Connection Error",
            description: data.error || "Failed to connect to AI service",
            variant: "destructive",
          });
          setIsLoading(false);
          setIsStreaming(false);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: "Connection Error", 
          description: "Failed to connect to UltriumDefender AI real-time service",
          variant: "destructive",
        });
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
        setWebSocket(null);
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };
    };

    connectWebSocket();

    return () => {
      webSocket?.close();
    };
  }, [toast, securityContext]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, streamingMessage]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !webSocket) return;

    const userMessage: SecurityMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputMessage;
    setInputMessage("");
    setIsLoading(true);
    setStreamingMessage("");

    try {
      // Send message via WebSocket for real-time streaming
      webSocket.send(JSON.stringify({
        type: 'send_text',
        text: messageToSend
      }));

    } catch (error) {
      console.error('Security AI error:', error);
      toast({
        title: "Error",
        description: "Failed to communicate with UltriumDefender AI",
        variant: "destructive",
      });
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
      <Card className="fixed bottom-4 right-4 w-16 h-16 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 z-50 bg-gradient-to-br from-red-950 to-gray-900 border-red-800/50">
        <CardContent 
          className="p-0 flex items-center justify-center h-full"
          onClick={onToggleMinimize}
        >
          <div className="relative">
            <Shield className="h-8 w-8 text-red-400 animate-pulse" />
            {securityContext && securityContext.activeAlerts > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-600 text-white animate-bounce">
                {securityContext.activeAlerts}
              </Badge>
            )}
            {securityContext && securityContext.criticalThreats > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[600px] flex flex-col shadow-2xl z-50 bg-gradient-to-b from-gray-900 to-black border border-red-800/30 backdrop-blur-sm">
      <CardHeader className="pb-3 border-b border-red-800/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Shield className="h-5 w-5 text-red-400" />
              <div className="absolute inset-0 animate-ping">
                <Shield className="h-5 w-5 text-red-400/50" />
              </div>
            </div>
            <CardTitle className="text-lg text-white">UltriumDefender AI</CardTitle>
            <Badge className="text-xs bg-green-600/80 text-green-100 animate-pulse">
              <Activity className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleMinimize}
              className="text-gray-400 hover:text-white hover:bg-red-900/20"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-red-900/20"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Real-time threat indicators */}
        <div className="flex gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400">{securityContext?.criticalThreats || 0} Critical</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            <span className="text-yellow-400">{securityContext?.activeAlerts || 0} Alerts</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-blue-400">{securityContext?.openIncidents || 0} Incidents</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 bg-gradient-to-b from-gray-900/50 to-black/50 overflow-hidden">
        <ScrollArea className="flex-1 px-4 max-h-[400px] overflow-y-auto" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4 pt-4 min-h-0">
            {messages.map((message) => (
              <div key={message.id} className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0 border border-red-800/30">
                  <AvatarFallback className={
                    message.role === 'assistant' 
                      ? 'bg-red-900/50 text-red-300' 
                      : 'bg-blue-900/50 text-blue-300'
                  }>
                    {message.role === 'assistant' ? (
                      <Shield className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <div className={`rounded-lg p-3 backdrop-blur-sm border ${
                    message.role === 'assistant' 
                      ? 'bg-gray-800/80 border-red-800/30 text-gray-100' 
                      : 'bg-blue-900/50 border-blue-700/30 text-blue-100'
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
                          className="text-xs h-6 bg-gray-800/50 border-red-700/30 text-red-300 hover:bg-red-900/30"
                          onClick={() => setInputMessage(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-400">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Show streaming response */}
            {isStreaming && streamingMessage && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0 border border-red-800/30">
                  <AvatarFallback className="bg-red-900/50 text-red-300">
                    <Shield className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <div className="bg-gray-800/80 border border-red-800/30 rounded-lg p-3 backdrop-blur-sm text-gray-100">
                    <div className="flex items-start gap-2">
                      {getSeverityIcon(streamingMessage)}
                      <p className="text-sm whitespace-pre-wrap flex-1">{streamingMessage}</p>
                      <div className="w-2 h-4 bg-red-400 animate-pulse ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {isLoading && !isStreaming && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 border border-red-800/30">
                  <AvatarFallback className="bg-red-900/50 text-red-300">
                    <Shield className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-800/80 border border-red-800/30 rounded-lg p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                    <span className="text-sm text-gray-200">Connecting to AI service...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-red-800/20 p-4 bg-gradient-to-t from-black/50 to-transparent">
          {/* File upload section */}
          {uploadedFiles.length > 0 && (
            <div className="mb-3 space-y-1">
              <div className="text-xs text-gray-400 mb-2">Uploaded Files for Analysis:</div>
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-800/30 rounded p-2 border border-red-800/20">
                  <div className="flex items-center gap-1 flex-1">
                    {file.type.startsWith('image/') ? (
                      <Image className="h-3 w-3 text-blue-400" />
                    ) : file.name.endsWith('.log') || file.type.includes('text') ? (
                      <FileText className="h-3 w-3 text-green-400" />
                    ) : (
                      <Network className="h-3 w-3 text-purple-400" />
                    )}
                    <span className="text-xs text-gray-300 truncate">{file.name}</span>
                    <span className="text-xs text-gray-500">({Math.round(file.size / 1024)}KB)</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(index)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Textarea
              placeholder={isListening ? "🎤 Listening..." : "Ask about threats, incidents, compliance... or say 'Hey Defender'"}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="min-h-[40px] max-h-[100px] resize-none bg-gray-800/50 border-red-800/30 text-gray-100 placeholder:text-gray-400 focus:border-red-600"
              rows={1}
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              accept=".log,.txt,.csv,.json,.xml,.png,.jpg,.jpeg,.gif,.webp,.pdf,.pcap"
              className="hidden"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              size="icon"
              variant="outline"
              className="h-10 w-10 flex-shrink-0 border-red-800/30 bg-gray-800/50 text-orange-400 hover:bg-orange-900/30"
              title="Upload security logs, screenshots, or network captures"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button 
              onClick={toggleVoiceRecognition}
              disabled={isLoading}
              size="icon"
              variant="outline"
              className={`h-10 w-10 flex-shrink-0 border-red-800/30 ${
                isListening 
                  ? 'bg-red-600 text-white animate-pulse' 
                  : 'bg-gray-800/50 text-red-400 hover:bg-red-900/30'
              }`}
            >
              {isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            <Button 
              onClick={sendMessage} 
              disabled={isLoading || !inputMessage.trim()}
              size="icon"
              className="h-10 w-10 flex-shrink-0 bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="flex gap-1 mt-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6 text-gray-400 hover:text-white hover:bg-red-900/20"
              onClick={() => setInputMessage("What are my current security risks?")}
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Risk Assessment
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6 text-gray-400 hover:text-white hover:bg-red-900/20"
              onClick={() => setInputMessage("Generate compliance report")}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Compliance
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6 text-gray-400 hover:text-white hover:bg-red-900/20"
              onClick={() => setInputMessage("Show active threats")}
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Threats
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6 text-gray-400 hover:text-white hover:bg-red-900/20"
              onClick={() => setIsProactiveMode(!isProactiveMode)}
            >
              <Eye className="h-3 w-3 mr-1" />
              {isProactiveMode ? 'Proactive ON' : 'Proactive OFF'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};