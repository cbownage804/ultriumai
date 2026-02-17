import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Send, Bot, User, Loader2, Volume2, VolumeX } from 'lucide-react';
import VoiceControls from './VoiceControls';
import { useAuth } from '@/hooks/useAuth';
import { useUserCredits } from '@/hooks/useUserCredits';
import { CREDIT_RATES } from '@/types/aiStudioCredits';
import { CleanMarkdownRenderer } from '@/components/chat/CleanMarkdownRenderer';
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  model?: string;
}

interface RealTimeAIChatProps {
  context?: 'security' | 'helpdesk' | 'rmm' | 'general' | 'ai_studio_help';
  title?: string;
  systemPromptOverride?: string;
  onReady?: (sendMessage: (message: string) => void) => void;
}

// Available ElevenLabs voices
const AVAILABLE_VOICES = [
  { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria', description: 'Professional female voice' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger', description: 'Authoritative male voice' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Friendly female voice' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', description: 'Deep male voice' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', description: 'Young male voice' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura', description: 'Clear female voice' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', description: 'Warm male voice' }
];

const RealTimeAIChat: React.FC<RealTimeAIChatProps> = ({ 
  context = 'general', 
  title = 'AI Assistant',
  systemPromptOverride,
  onReady
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const { deductCredits, totalRemaining } = useUserCredits();
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(() => {
    // Load saved voice from localStorage or default to Sarah
    return localStorage.getItem('ai-chat-voice') || 'EXAVITQu4vr4xnSDxMaL';
  });
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load or create conversation when component mounts
  useEffect(() => {
    if (user && !currentConversationId) {
      loadOrCreateConversation();
    }
  }, [user]);

  const loadOrCreateConversation = async () => {
    if (!user) return;

    try {
      // Try to find an existing conversation for this context
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('id, title')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      let conversationId: string;

      if (conversations && conversations.length > 0) {
        // Use existing conversation
        conversationId = conversations[0].id;
        await loadMessages(conversationId);
      } else {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            user_id: user.id,
            title: `${title} Chat - ${new Date().toLocaleDateString()}`
          })
          .select()
          .single();

        if (createError) throw createError;
        conversationId = newConversation.id;
      }

      setCurrentConversationId(conversationId);
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation history.",
        variant: "destructive",
      });
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data: dbMessages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages: Message[] = dbMessages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role as 'user' | 'assistant',
        timestamp: new Date(msg.created_at)
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const saveMessage = async (conversationId: string, content: string, role: 'user' | 'assistant') => {
    try {
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content,
          role,
          user_id: user?.id
        });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const handleVoiceTranscription = (text: string) => {
    setInput(text);
  };

  const speakText = async (text: string) => {
    // Stop any currently playing audio first
    stopCurrentAudio();
    
    try {
      setIsPlaying(true);

      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: { 
          text, 
          voice: selectedVoice
        }
      });

      if (error) throw error;

      const audioData = `data:audio/mp3;base64,${data.audioContent}`;
      const audio = new Audio(audioData);
      
      // Store reference to current audio
      setCurrentAudio(audio);
      
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentAudio(null);
      };
      audio.onerror = () => {
        setIsPlaying(false);
        setCurrentAudio(null);
        throw new Error('Audio playback failed');
      };

      await audio.play();
    } catch (error) {
      console.error('Error with text-to-speech:', error);
      setIsPlaying(false);
      setCurrentAudio(null);
      toast({
        title: "Text-to-Speech Failed",
        description: "Could not generate speech. Please try again.",
        variant: "destructive",
      });
    }
  };

  const stopCurrentAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    setIsPlaying(false);
  };

  const sendMessage = async (messageContent?: string) => {
    const content = messageContent || input.trim();
    if (!content || isLoading || !user || !currentConversationId) return;

    // Deduct credits before sending
    const creditCost = CREDIT_RATES.APP_CHAT;
    const credited = await deductCredits(creditCost, 'AI Chat');
    if (!credited) return; // Insufficient credits — toast shown by deductCredits

    // Stop any currently playing audio when sending a new message
    stopCurrentAudio();

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Save user message to database
    await saveMessage(currentConversationId, userMessage.content, 'user');

    try {
      const defaultSystemPrompt = `You are UltriumGPT's intelligent assistant with web browsing and memory capabilities. You help users with cybersecurity, MSP operations, SafeDesk management, and business technology questions. Be concise and direct in your responses. You have access to current information through web browsing and can learn from websites to build persistent knowledge. Available commands: /browse [url], /learn [url], /memory, /forget [topic]. If you need more context about a specific situation, ask targeted follow-up questions or suggest using web browsing commands.`;
      
      const { data, error } = await supabase.functions.invoke('ai-web-browser', {
        body: {
          message: content,
          model: 'gpt-4o-mini',
          context,
          systemPrompt: systemPromptOverride || defaultSystemPrompt
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
        model: data.model,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save AI message to database
      await saveMessage(currentConversationId, assistantMessage.content, 'assistant');

      // Auto-speak the response if enabled
      if (autoSpeak) {
        await speakText(assistantMessage.content);
      }

    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Expose sendMessage to parent via onReady callback
  useEffect(() => {
    if (onReady && currentConversationId && user) {
      onReady(sendMessage);
    }
  }, [onReady, currentConversationId, user]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const contextBadgeColor = {
    security: 'bg-red-500/10 text-red-700 border-red-500/20',
    helpdesk: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    rmm: 'bg-green-500/10 text-green-700 border-green-500/20',
    general: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={contextBadgeColor[context]}>
              {context.toUpperCase()}
            </Badge>
            <Select value={selectedVoice} onValueChange={(value) => {
              setSelectedVoice(value);
              localStorage.setItem('ai-chat-voice', value);
            }}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue>
                  {AVAILABLE_VOICES.find(v => v.id === selectedVoice)?.name || 'Select Voice'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_VOICES.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{voice.name}</span>
                      <span className="text-xs text-muted-foreground">{voice.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (autoSpeak) {
                  // When muting, also stop any currently playing audio
                  stopCurrentAudio();
                }
                setAutoSpeak(!autoSpeak);
              }}
              className="h-8 px-2"
            >
              {autoSpeak ? (
                <Volume2 className="h-4 w-4 text-green-600" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 px-4 py-2 max-h-[400px]">
          <div className="space-y-4 pr-4">{/* Added right padding for scrollbar */}
            {messages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Start a conversation with your AI assistant</p>
                <p className="text-sm mt-2">Your conversation will be saved automatically</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}>
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-[85%] rounded-lg p-4 break-words ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground ml-auto' 
                    : 'bg-muted mr-auto'
                }`}>
                  {message.role === 'assistant' ? (
                    <CleanMarkdownRenderer content={message.content} />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                    {message.role === 'user' ? (
                      <User className="h-3 w-3 flex-shrink-0" />
                    ) : (
                      <Bot className="h-3 w-3 flex-shrink-0" />
                    )}
                    <span>{message.timestamp.toLocaleTimeString()}</span>
                    {message.model && (
                      <Badge variant="secondary" className="text-xs">
                        {message.model}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="border-t p-4 space-y-3">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Voice Controls */}
          <VoiceControls 
            onTranscription={handleVoiceTranscription}
            disabled={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default RealTimeAIChat;