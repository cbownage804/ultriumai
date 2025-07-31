import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, Volume2, VolumeX, MessageCircle, Brain, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIVoiceAssistant = () => {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI Security Assistant. I can help you with password management, security monitoring, threat analysis, and general cybersecurity guidance. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
      
      toast({
        title: "Listening...",
        description: "Speak your question or request",
      });
    } catch (error) {
      toast({
        title: "Microphone Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
      setIsListening(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Convert to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(
        String.fromCharCode(...new Uint8Array(arrayBuffer))
      );

      // Transcribe audio
      const { data: transcriptionData } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio }
      });

      if (transcriptionData?.text) {
        const userMessage: Message = {
          id: Date.now().toString(),
          type: 'user',
          content: transcriptionData.text,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, userMessage]);
        await getAIResponse(transcriptionData.text);
      }
    } catch (error) {
      toast({
        title: "Processing Error",
        description: "Could not process audio",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getAIResponse = async (userInput: string) => {
    try {
      // Get AI response using chat completion
      const { data: aiData } = await supabase.functions.invoke('ai-voice-tts', {
        body: {
          text: userInput,
          context: 'security_assistant',
          systemPrompt: `You are SecureVault's AI Security Assistant. You help users with:
          - Password management and security
          - Security monitoring and threat analysis
          - Cybersecurity best practices
          - SafePass features and guidance
          - Two-factor authentication setup
          - Security breach prevention
          
          Keep responses helpful, concise, and security-focused. Be friendly but professional.`
        }
      });

      if (aiData?.response) {
        const assistantMessage: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          content: aiData.response,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        
        // Speak the response if audio is enabled
        if (audioEnabled) {
          await speakText(aiData.response);
        }
      }
    } catch (error) {
      toast({
        title: "AI Error",
        description: "Could not get AI response",
        variant: "destructive",
      });
    }
  };

  const speakText = async (text: string) => {
    if (!audioEnabled) return;
    
    setIsSpeaking(true);
    
    try {
      const { data } = await supabase.functions.invoke('elevenlabs-tts', {
        body: { text, voice: 'alloy' }
      });

      if (data?.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        currentAudioRef.current = audio;
        
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);
        
        await audio.play();
      }
    } catch (error) {
      setIsSpeaking(false);
      console.error('Speech error:', error);
    }
  };

  const stopSpeaking = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setIsSpeaking(false);
    }
  };

  const clearConversation = () => {
    setMessages([{
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI Security Assistant. How can I help you with your security needs today?',
      timestamp: new Date()
    }]);
  };

  useEffect(() => {
    return () => {
      stopSpeaking();
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">AI Security Assistant</h2>
            <p className="text-muted-foreground">Your intelligent cybersecurity companion</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="hover-scale"
          >
            {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearConversation}
            className="hover-scale"
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <Card className="lg:col-span-2 hover-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Conversation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] mb-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Voice Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={isListening ? stopListening : startListening}
                disabled={isSpeaking || isProcessing}
                size="lg"
                className={`hover-scale ${isListening ? 'bg-destructive hover:bg-destructive/90' : ''}`}
              >
                {isListening ? <MicOff className="h-5 w-5 mr-2" /> : <Mic className="h-5 w-5 mr-2" />}
                {isListening ? 'Stop' : 'Speak'}
              </Button>

              {isSpeaking && (
                <Button
                  onClick={stopSpeaking}
                  variant="outline"
                  size="lg"
                  className="hover-scale"
                >
                  <VolumeX className="h-5 w-5 mr-2" />
                  Stop Speaking
                </Button>
              )}
            </div>

            {/* Status Indicators */}
            <div className="flex justify-center gap-2 mt-4">
              {isListening && (
                <Badge variant="secondary" className="animate-pulse">
                  <Mic className="h-3 w-3 mr-1" />
                  Listening...
                </Badge>
              )}
              {isProcessing && (
                <Badge variant="secondary" className="animate-pulse">
                  <Brain className="h-3 w-3 mr-1" />
                  Processing...
                </Badge>
              )}
              {isSpeaking && (
                <Badge variant="secondary" className="animate-pulse">
                  <Volume2 className="h-3 w-3 mr-1" />
                  Speaking...
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Assistant Features */}
        <Card className="hover-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              I can help with
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 bg-primary/5 rounded-lg">
                <h4 className="font-medium text-sm">Password Security</h4>
                <p className="text-xs text-muted-foreground">Generate, analyze, and manage strong passwords</p>
              </div>
              
              <div className="p-3 bg-primary/5 rounded-lg">
                <h4 className="font-medium text-sm">Threat Analysis</h4>
                <p className="text-xs text-muted-foreground">Identify and assess security risks</p>
              </div>
              
              <div className="p-3 bg-primary/5 rounded-lg">
                <h4 className="font-medium text-sm">Security Best Practices</h4>
                <p className="text-xs text-muted-foreground">Learn cybersecurity fundamentals</p>
              </div>
              
              <div className="p-3 bg-primary/5 rounded-lg">
                <h4 className="font-medium text-sm">SafePass Guidance</h4>
                <p className="text-xs text-muted-foreground">Navigate and optimize your password manager</p>
              </div>
              
              <div className="p-3 bg-primary/5 rounded-lg">
                <h4 className="font-medium text-sm">2FA Setup</h4>
                <p className="text-xs text-muted-foreground">Configure two-factor authentication</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center">
                Speak naturally or ask questions about any security topic
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIVoiceAssistant;