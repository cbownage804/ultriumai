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
  MessageSquare, 
  X, 
  Bot,
  Zap,
  ChevronUp,
  ChevronDown,
  Send
} from 'lucide-react';
import { useVoiceInterface } from '@/hooks/useVoiceInterface';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const SafeShieldVoiceAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  
  const { speak, stopSpeaking, isPlaying, isLoading: voiceLoading, settings } = useVoiceInterface();
  const { toast } = useToast();
  const { user } = useAuth();
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Don't show the assistant if user is not authenticated
  if (!user) {
    return null;
  }

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

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
        toast({
          title: "Voice Recognition Error",
          description: "Unable to process voice input. Please try again.",
          variant: "destructive",
        });
      };
    }
  }, [currentTranscript]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // Get current security context/metrics for better responses
      const context = {
        activeTab: window.location.pathname,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };

      // Mock security metrics (in real app, these would come from actual data)
      const metrics = {
        security_score: 94,
        active_incidents: 2,
        protected_endpoints: 847,
        threats_blocked_24h: 23
      };

      const { data, error } = await supabase.functions.invoke('safeshield-voice-chat', {
        body: {
          action: 'chat',
          message: message,
          context: context,
          metrics: metrics
        }
      });

      if (error) throw error;

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiResponse]);

      // Auto-speak the response if enabled
      if (settings.autoSpeak) {
        await speak(data.response);
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

  const clearChat = () => {
    setMessages([]);
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

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 rounded-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transition-all duration-300 group relative"
        >
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full animate-pulse border-2 border-white"></div>
          <Shield className="h-8 w-8 text-white group-hover:scale-110 transition-transform" />
        </Button>
        <div className="absolute bottom-full right-0 mb-2 bg-black/80 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          SafeShield AI Assistant
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className={cn(
        "w-96 shadow-2xl bg-gradient-to-b from-gray-900 to-black border-red-500/20 transition-all duration-300",
        isMinimized ? "h-16" : "h-[600px]"
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
                    <p className="text-sm">Click the microphone to ask about your security</p>
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

            {/* Text Input */}
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
                  
                  {messages.length > 0 && (
                    <Button
                      onClick={clearChat}
                      variant="secondary"
                      size="sm"
                      className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300"
                    >
                      Clear
                    </Button>
                  )}
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
                </div>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};