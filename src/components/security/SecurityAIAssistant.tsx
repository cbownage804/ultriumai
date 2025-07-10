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
  User, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  Settings,
  Minimize2,
  Mic,
  MicOff,
  Activity,
  Upload,
  FileText,
  Image,
  X,
  Volume2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VoiceControls } from './VoiceControls';
import { useVoiceInterface } from '@/hooks/useVoiceInterface';

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
  // Cache-busting comment for browser refresh
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { speak, settings: voiceSettings } = useVoiceInterface();

  // Initialize voice recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      try {
        const SpeechRecognitionAPI = window.webkitSpeechRecognition || window.SpeechRecognition;
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event) => {
          try {
            const transcript = event.results[0][0].transcript;
            setInputMessage(transcript);
            setIsListening(false);
            toast({
              title: "Voice Input Received",
              description: "Successfully captured your voice input",
            });
          } catch (error) {
            console.error('Speech recognition result error:', error);
            setIsListening(false);
          }
        };
        
        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          
          let errorMessage = "Could not process voice input. Please try again.";
          if (event.error === 'not-allowed') {
            errorMessage = "Microphone access denied. Please allow microphone permissions.";
          } else if (event.error === 'no-speech') {
            errorMessage = "No speech detected. Please try speaking again.";
          } else if (event.error === 'network') {
            errorMessage = "Network error. Please check your connection.";
          }
          
          toast({
            title: "Voice Recognition Error",
            description: errorMessage,
            variant: "destructive",
          });
        };
        
        recognition.onend = () => {
          setIsListening(false);
        };
        
        setSpeechRecognition(recognition);
      } catch (error) {
        console.error('Failed to initialize speech recognition:', error);
        toast({
          title: "Voice Recognition Unavailable",
          description: "Could not initialize voice recognition. Please check browser compatibility.",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  const toggleVoiceRecognition = async () => {
    if (!speechRecognition) {
      toast({
        title: "Voice Recognition Unavailable",
        description: "Your browser doesn't support voice recognition. Try using Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      try {
        speechRecognition.stop();
        setIsListening(false);
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
        setIsListening(false);
      }
    } else {
      try {
        // Request microphone permission first
        await navigator.mediaDevices.getUserMedia({ audio: true });
        speechRecognition.start();
        setIsListening(true);
        toast({
          title: "Listening...",
          description: "Speak now, I'm listening for your command",
        });
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsListening(false);
        
        if (error.name === 'NotAllowedError') {
          toast({
            title: "Microphone Permission Required",
            description: "Please allow microphone access to use voice input",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Voice Recognition Error",
            description: "Could not start voice recognition. Please try again.",
            variant: "destructive",
          });
        }
      }
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

  // Auto-scroll to bottom when new messages arrive
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
    const messageToSend = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    try {
      // Use the stable edge function for responses
      const { data, error } = await supabase.functions.invoke('security-ai-assistant', {
        body: {
          message: messageToSend,
          context: {
            security_state: securityContext,
            conversation_history: messages.slice(-5)
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

      // Auto-speak the response if enabled
      if (voiceSettings.autoSpeak && data.response) {
        await speak(data.response);
      }

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

                  {/* Context suggestions */}
                  {message.context?.suggestions && (
                    <div className="flex flex-wrap gap-1">
                      {message.context.suggestions.map((suggestion, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          className="text-xs h-6 bg-red-900/20 border-red-700/30 text-red-300 hover:bg-red-800/30"
                          onClick={() => setInputMessage(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0 border border-red-800/30">
                  <AvatarFallback className="bg-red-900/50 text-red-300">
                    <Shield className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="bg-gray-800/80 border border-red-800/30 rounded-lg p-3 backdrop-blur-sm text-gray-100">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                      <span className="text-sm">UltriumDefender AI analyzing...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* File upload area */}
        {uploadedFiles.length > 0 && (
          <div className="px-4 py-2 border-t border-red-800/20 bg-gray-900/50">
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-1 bg-red-900/20 border border-red-700/30 rounded px-2 py-1 text-xs text-red-300">
                  <FileText className="h-3 w-3" />
                  <span className="truncate max-w-20">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 text-red-400 hover:text-red-300"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Voice Controls */}
        <div className="px-4 py-2 border-t border-red-800/20 bg-gray-900/90">
          <VoiceControls 
            onVoiceMessage={(message) => {
              setInputMessage(message);
            }}
            className="mb-2"
          />
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-red-800/20 bg-gray-900/80 backdrop-blur-sm">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask UltriumDefender AI about security threats, compliance, or incidents..."
                className="min-h-[40px] resize-none bg-gray-800/50 border-red-800/30 text-gray-100 placeholder-gray-400 focus:border-red-600 focus:ring-red-600/50"
                disabled={isLoading}
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white border-red-500"
              >
                <Send className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={toggleVoiceRecognition}
                variant="outline"
                size="sm"
                className={`border-red-700/30 ${isListening ? 'bg-red-600 text-white' : 'text-red-400 hover:bg-red-900/20'}`}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
                className="text-red-400 border-red-700/30 hover:bg-red-900/20"
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".log,.txt,.csv,.json,.xml,.pdf,.png,.jpg,.jpeg,.gif,.webp,.pcap"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  );
};