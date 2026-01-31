import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, Volume2, VolumeX, Settings, MessageSquare, Loader2, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}
import { useToast } from "@/hooks/use-toast";

interface VoiceCommand {
  id: string;
  command_text: string;
  intent: string;
  response_text: string;
  success: boolean;
  created_at: string;
}

interface VoiceSettings {
  voice_enabled: boolean;
  tts_enabled: boolean;
  voice_id: string;
  speech_rate: number;
  wake_word: string;
  language: string;
}

export function AIVoiceAssistant() {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [commandHistory, setCommandHistory] = useState<VoiceCommand[]>([]);
  const [settings, setSettings] = useState<VoiceSettings>({
    voice_enabled: true,
    tts_enabled: true,
    voice_id: 'alloy',
    speech_rate: 1.0,
    wake_word: 'hey vanguard',
    language: 'en-US'
  });
  const [showSettings, setShowSettings] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    loadSettings();
    loadCommandHistory();

    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = settings.language;

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const current = event.resultIndex;
        const result = event.results[current];
        const text = result[0].transcript;
        setTranscript(text);

        if (result.isFinal) {
          processVoiceCommand(text);
        }
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current?.start();
        }
      };
    }

    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await (supabase as any)
      .from('vanguard_voice_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setSettings(data);
    }
  };

  const loadCommandHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await (supabase as any)
      .from('vanguard_voice_commands')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setCommandHistory(data);
    }
  };

  const saveSettings = async (newSettings: Partial<VoiceSettings>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    await (supabase as any)
      .from('vanguard_voice_settings')
      .upsert({
        user_id: user.id,
        ...updatedSettings,
        updated_at: new Date().toISOString()
      });
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      setTranscript("");
    }
  };

  const processVoiceCommand = async (text: string) => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    const startTime = Date.now();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Determine intent from command
      const intent = detectIntent(text.toLowerCase());
      let responseText = "";
      let actionTaken = {};

      switch (intent) {
        case 'create_ticket':
          responseText = "I'll create a new ticket for you. Please provide the ticket title and description.";
          actionTaken = { action: 'prompt_ticket_details' };
          break;
        case 'search':
          responseText = `Searching for "${text.replace(/search|find|look for/gi, '').trim()}"...`;
          actionTaken = { action: 'search', query: text };
          break;
        case 'status':
          responseText = "Fetching the current status of your open tickets...";
          actionTaken = { action: 'get_status' };
          break;
        case 'assign':
          responseText = "Please specify which ticket you'd like to assign and to whom.";
          actionTaken = { action: 'prompt_assignment' };
          break;
        default:
          responseText = `I understood: "${text}". How can I help you with this?`;
          actionTaken = { action: 'general_query' };
      }

      // Save command to history
      const { data: savedCommand } = await (supabase as any)
        .from('vanguard_voice_commands')
        .insert({
          user_id: user.id,
          command_text: text,
          intent,
          response_text: responseText,
          action_taken: actionTaken,
          success: true,
          processing_time_ms: Date.now() - startTime
        })
        .select()
        .single();

      if (savedCommand) {
        setCommandHistory(prev => [savedCommand, ...prev.slice(0, 19)]);
      }

      // Speak response if TTS is enabled
      if (settings.tts_enabled) {
        speakResponse(responseText);
      }

      toast({
        title: "Command Processed",
        description: responseText
      });

    } catch (error) {
      console.error('Error processing voice command:', error);
      toast({
        title: "Error",
        description: "Failed to process voice command",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setTranscript("");
    }
  };

  const detectIntent = (text: string): string => {
    if (text.includes('create') || text.includes('new ticket') || text.includes('open ticket')) {
      return 'create_ticket';
    }
    if (text.includes('search') || text.includes('find') || text.includes('look for')) {
      return 'search';
    }
    if (text.includes('status') || text.includes('how many') || text.includes('overview')) {
      return 'status';
    }
    if (text.includes('assign') || text.includes('transfer') || text.includes('give to')) {
      return 'assign';
    }
    if (text.includes('update') || text.includes('change') || text.includes('modify')) {
      return 'update_ticket';
    }
    return 'general';
  };

  const speakResponse = async (text: string) => {
    if (!settings.tts_enabled) return;

    setIsSpeaking(true);

    try {
      // Use OpenAI TTS via edge function
      const { data, error } = await supabase.functions.invoke('ai-voice-tts', {
        body: { text, voice: settings.voice_id }
      });

      if (error) throw error;

      if (data?.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        audio.playbackRate = settings.speech_rate;
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => {
          setIsSpeaking(false);
          // Fallback to browser TTS
          fallbackSpeak(text);
        };
        await audio.play();
      } else {
        fallbackSpeak(text);
      }
    } catch (error) {
      console.error('TTS error:', error);
      fallbackSpeak(text);
    }
  };

  const fallbackSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = settings.speech_rate;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  const getIntentBadge = (intent: string) => {
    const colors: Record<string, string> = {
      create_ticket: 'bg-green-500',
      search: 'bg-blue-500',
      status: 'bg-purple-500',
      assign: 'bg-orange-500',
      update_ticket: 'bg-yellow-500',
      general: 'bg-gray-500'
    };
    return colors[intent] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Main Voice Control */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                AI Voice Assistant
              </CardTitle>
              <CardDescription>
                Use voice commands for hands-free ticket management
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Voice Control Panel */}
          <div className="flex flex-col items-center gap-6 p-8 bg-muted/50 rounded-lg">
            <div className="relative">
              <Button
                size="lg"
                variant={isListening ? "destructive" : "default"}
                className={`w-24 h-24 rounded-full ${isListening ? 'animate-pulse' : ''}`}
                onClick={toggleListening}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-10 w-10 animate-spin" />
                ) : isListening ? (
                  <MicOff className="h-10 w-10" />
                ) : (
                  <Mic className="h-10 w-10" />
                )}
              </Button>
              {isListening && (
                <div className="absolute -inset-2 rounded-full border-4 border-primary animate-ping opacity-20" />
              )}
            </div>

            <div className="text-center">
              <p className="text-lg font-medium">
                {isProcessing ? "Processing..." : isListening ? "Listening..." : "Click to start"}
              </p>
              {transcript && (
                <p className="text-muted-foreground mt-2 italic">"{transcript}"</p>
              )}
            </div>

            {isSpeaking && (
              <Button variant="outline" onClick={stopSpeaking}>
                <VolumeX className="h-4 w-4 mr-2" />
                Stop Speaking
              </Button>
            )}
          </div>

          {/* Quick Commands */}
          <div>
            <h4 className="text-sm font-medium mb-3">Quick Commands</h4>
            <div className="flex flex-wrap gap-2">
              {[
                "Create a new ticket",
                "Show open tickets",
                "Search for password issues",
                "What's my workload today?"
              ].map((cmd, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => processVoiceCommand(cmd)}
                  disabled={isProcessing}
                >
                  <Zap className="h-3 w-3 mr-1" />
                  {cmd}
                </Button>
              ))}
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">Voice Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Voice Recognition</Label>
                  <Switch 
                    checked={settings.voice_enabled}
                    onCheckedChange={(checked) => saveSettings({ voice_enabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Text-to-Speech</Label>
                  <Switch 
                    checked={settings.tts_enabled}
                    onCheckedChange={(checked) => saveSettings({ tts_enabled: checked })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block">Voice</Label>
                    <Select
                      value={settings.voice_id}
                      onValueChange={(value) => saveSettings({ voice_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alloy">Alloy</SelectItem>
                        <SelectItem value="echo">Echo</SelectItem>
                        <SelectItem value="fable">Fable</SelectItem>
                        <SelectItem value="onyx">Onyx</SelectItem>
                        <SelectItem value="nova">Nova</SelectItem>
                        <SelectItem value="shimmer">Shimmer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="mb-2 block">Language</Label>
                    <Select
                      value={settings.language}
                      onValueChange={(value) => saveSettings({ language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="en-GB">English (UK)</SelectItem>
                        <SelectItem value="es-ES">Spanish</SelectItem>
                        <SelectItem value="fr-FR">French</SelectItem>
                        <SelectItem value="de-DE">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Command History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Command History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {commandHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No voice commands yet. Start speaking to see history here.
                </p>
              ) : (
                commandHistory.map((cmd) => (
                  <div key={cmd.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getIntentBadge(cmd.intent)}>
                        {cmd.intent}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(cmd.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="font-medium">"{cmd.command_text}"</p>
                    {cmd.response_text && (
                      <p className="text-sm text-muted-foreground mt-1">
                        → {cmd.response_text}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
