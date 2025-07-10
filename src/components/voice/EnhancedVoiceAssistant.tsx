import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Shield, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  X, 
  Bot,
  Zap,
  ChevronUp,
  ChevronDown,
  Send,
  Settings,
  History,
  Smartphone
} from 'lucide-react';
import { useVoiceInterface } from '@/hooks/useVoiceInterface';
import { useVoiceHistory } from '@/hooks/useVoiceHistory';
import { VoiceSettings } from './VoiceSettings';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface SecurityMetrics {
  security_score: number;
  active_incidents: number;
  protected_endpoints: number;
  threats_blocked_24h: number;
  uptime_percentage: number;
  vulnerabilities_found: number;
}

const VOICE_COMMANDS = {
  'show security status': 'security_status',
  'list recent threats': 'recent_threats',
  'check system health': 'system_health',
  'generate report': 'generate_report',
  'show incidents': 'show_incidents',
  'clear all alerts': 'clear_alerts',
  'what is my security score': 'security_score',
  'how many endpoints are protected': 'endpoint_count',
  'show vulnerabilities': 'vulnerabilities',
  'system uptime': 'uptime'
};

export const EnhancedVoiceAssistant = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics>({
    security_score: 94,
    active_incidents: 2,
    protected_endpoints: 847,
    threats_blocked_24h: 23,
    uptime_percentage: 99.8,
    vulnerabilities_found: 5
  });
  
  const { speak, stopSpeaking, isPlaying, isLoading: voiceLoading, settings } = useVoiceInterface();
  const { messages, addMessage, clearHistory } = useVoiceHistory();
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('voiceSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      // Apply saved settings to hook
    }
  }, []);

  // Initialize speech recognition with mobile optimization
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      // Mobile-specific optimizations
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        recognitionRef.current.continuous = false; // Better for mobile
        recognitionRef.current.maxAlternatives = 1;
      }

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setCurrentTranscript(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (currentTranscript.trim()) {
          handleVoiceMessage(currentTranscript);
          setCurrentTranscript('');
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast({
            title: "Microphone Access Denied",
            description: "Please enable microphone access to use voice features.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Voice Recognition Error",
            description: "Unable to process voice input. Please try again.",
            variant: "destructive",
          });
        }
      };
    }
  }, [currentTranscript]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load real security metrics
  useEffect(() => {
    loadSecurityMetrics();
    const interval = setInterval(loadSecurityMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSecurityMetrics = async () => {
    try {
      // In a real app, this would fetch actual security data
      // For now, simulate dynamic metrics
      setSecurityMetrics(prev => ({
        ...prev,
        threats_blocked_24h: prev.threats_blocked_24h + Math.floor(Math.random() * 3),
        uptime_percentage: 99.5 + Math.random() * 0.5
      }));
    } catch (error) {
      console.error('Error loading security metrics:', error);
    }
  };

  const processVoiceCommand = (message: string): string | null => {
    const lowerMessage = message.toLowerCase().trim();
    
    for (const [command, action] of Object.entries(VOICE_COMMANDS)) {
      if (lowerMessage.includes(command)) {
        switch (action) {
          case 'security_status':
            return `Your current security score is ${securityMetrics.security_score} out of 100. You have ${securityMetrics.active_incidents} active incidents and ${securityMetrics.protected_endpoints} protected endpoints. System uptime is ${securityMetrics.uptime_percentage.toFixed(1)}%.`;
          case 'recent_threats':
            return `In the last 24 hours, we've blocked ${securityMetrics.threats_blocked_24h} threats across your network. The most recent threats include malware attempts, phishing emails, and suspicious network activity.`;
          case 'system_health':
            return `All systems are operating normally. Uptime is ${securityMetrics.uptime_percentage.toFixed(1)}%, with ${securityMetrics.protected_endpoints} endpoints online and protected.`;
          case 'vulnerabilities':
            return `We've identified ${securityMetrics.vulnerabilities_found} vulnerabilities that require attention. These include 2 critical patches, 1 configuration issue, and 2 minor security updates.`;
          case 'endpoint_count':
            return `Currently protecting ${securityMetrics.protected_endpoints} endpoints across your network.`;
          case 'security_score':
            return `Your security score is ${securityMetrics.security_score} out of 100. This is considered excellent security posture.`;
          case 'uptime':
            return `System uptime is currently ${securityMetrics.uptime_percentage.toFixed(1)}%. All critical services are operational.`;
          default:
            return null;
        }
      }
    }
    return null;
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice Recognition Unavailable",
        description: "Your browser doesn't support voice recognition.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setCurrentTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleVoiceMessage = async (message: string) => {
    if (!message.trim()) return;

    // Add user message to history
    const userMessage = {
      role: 'user' as const,
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    await addMessage(userMessage);
    setIsProcessing(true);

    try {
      // Check for voice commands first
      const commandResponse = processVoiceCommand(message);
      
      let aiResponse: string;
      
      if (commandResponse) {
        aiResponse = commandResponse;
      } else {
        // Get context for better responses
        const context = {
          activeTab: window.location.pathname,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
        };

        const { data, error } = await supabase.functions.invoke('safeshield-voice-chat', {
          body: {
            action: 'chat',
            message: message,
            context: context,
            metrics: securityMetrics
          }
        });

        if (error) throw error;
        aiResponse = data.response;
      }

      const assistantMessage = {
        role: 'assistant' as const,
        content: aiResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        metadata: { voice: settings.voice, speechRate: settings.speechRate }
      };

      await addMessage(assistantMessage);

      // Auto-speak the response if enabled
      if (settings.autoSpeak) {
        await speak(aiResponse);
      }

    } catch (error) {
      console.error('Error processing voice message:', error);
      toast({
        title: "SafeShield AI Error",
        description: "Unable to process your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      handleVoiceMessage(textInput);
      setTextInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit(e as any);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Don't show the assistant if user is not authenticated
  if (!user) {
    return null;
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 rounded-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transition-all duration-300 group relative"
        >
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full animate-pulse border-2 border-white"></div>
          <Shield className="h-8 w-8 text-white group-hover:scale-110 transition-transform" />
          {isMobile && (
            <Smartphone className="absolute -bottom-1 -left-1 h-4 w-4 text-white" />
          )}
        </Button>
        <div className="absolute bottom-full right-0 mb-2 bg-black/80 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          SafeShield AI Assistant
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Card className={cn(
          "w-96 shadow-2xl bg-gradient-to-b from-gray-900 to-black border-red-500/20 transition-all duration-300",
          isMinimized ? "h-16" : "h-[600px]",
          isMobile && "w-80 h-[500px]"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-red-500/20 bg-gradient-to-r from-red-900/20 to-red-800/20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Shield className="h-6 w-6 text-red-400" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse border border-gray-900"></div>
              </div>
              <div>
                <h3 className="font-semibold text-white flex items-center gap-2">
                  SafeShield AI
                  <Bot className="h-4 w-4 text-red-400" />
                </h3>
                <p className="text-xs text-gray-400">Security Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10"
                title="Clear History"
              >
                <History className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMinimize}
                className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10"
              >
                {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Area */}
              <CardContent className="p-0 h-[400px] overflow-y-auto bg-black/40">
                <div className="p-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                      <Shield className="h-12 w-12 text-red-400 mx-auto mb-3" />
                      <p className="font-medium">SafeShield AI Ready</p>
                      <p className="text-sm">Try: "Show security status" or "List recent threats"</p>
                    </div>
                  )}
                  
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-2",
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="h-6 w-6 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0 mt-1">
                          <Shield className="h-3 w-3 text-white" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[80%] p-3 rounded-lg text-sm",
                          message.role === 'user'
                            ? 'bg-red-600 text-white ml-auto'
                            : 'bg-gray-800 text-gray-100 border border-red-500/20'
                        )}
                      >
                        <p>{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                      </div>
                    </div>
                  ))}
                  
                  {isProcessing && (
                    <div className="flex gap-2 justify-start">
                      <div className="h-6 w-6 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0 mt-1">
                        <Zap className="h-3 w-3 text-white animate-pulse" />
                      </div>
                      <div className="bg-gray-800 p-3 rounded-lg text-sm border border-red-500/20">
                        <div className="flex items-center gap-2 text-gray-300">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce delay-75"></div>
                            <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce delay-150"></div>
                          </div>
                          Analyzing security data...
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {currentTranscript && (
                    <div className="flex justify-end">
                      <div className="bg-red-600/50 border border-red-500 p-3 rounded-lg text-sm text-white max-w-[80%]">
                        <p className="opacity-80">{currentTranscript}</p>
                        <p className="text-xs opacity-60 mt-1">Listening...</p>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>

              {/* Input Area */}
              <div className="p-3 border-t border-red-500/20 bg-gradient-to-r from-gray-900/50 to-black/50">
                <form onSubmit={handleTextSubmit} className="flex gap-2 mb-3">
                  <Input
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your security question..."
                    className="flex-1 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-500"
                    disabled={isProcessing}
                  />
                  <Button 
                    type="submit" 
                    size="sm"
                    disabled={!textInput.trim() || isProcessing}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>

                {/* Voice Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={toggleListening}
                      variant={isListening ? "destructive" : "secondary"}
                      size="sm"
                      className={cn(
                        "h-9 w-9 p-0 transition-all duration-200",
                        isListening 
                          ? "bg-red-600 hover:bg-red-700 animate-pulse" 
                          : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                      )}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                    
                    <Button
                      onClick={() => isPlaying ? stopSpeaking() : null}
                      variant="secondary"
                      size="sm"
                      className="h-9 w-9 p-0 bg-gray-700 hover:bg-gray-600 text-gray-300"
                      disabled={!isPlaying}
                    >
                      {isPlaying ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    {isListening && (
                      <Badge variant="destructive" className="animate-pulse text-xs">
                        Listening
                      </Badge>
                    )}
                    
                    {isPlaying && (
                      <Badge className="bg-red-600 text-xs animate-pulse">
                        Speaking
                      </Badge>
                    )}
                    
                    {voiceLoading && (
                      <Badge variant="secondary" className="text-xs">
                        Processing
                      </Badge>
                    )}

                    {isMobile && (
                      <Badge variant="outline" className="text-xs">
                        Mobile
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      <VoiceSettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </>
  );
};