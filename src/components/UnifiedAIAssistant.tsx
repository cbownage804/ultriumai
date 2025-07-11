import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDropzone } from "react-dropzone";
import { 
  Bot, 
  Send, 
  User, 
  Brain, 
  Shield, 
  HeadphonesIcon,
  Server,
  Scan,
  MessageSquare,
  ChevronUp,
  ChevronDown,
  Minimize2,
  Maximize2,
  X,
  Loader2,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Paperclip,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  History,
  Save,
  Upload,
  Image as ImageIcon,
  FileText
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useSubscription } from "@/hooks/useSubscription";
import { deductCredits } from "@/utils/creditUtils";
import { CREDIT_COSTS } from "@/types/credits";
import ultriumBotIcon from "@/assets/ultrium-bot-icon.jpg";

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  files?: FileAttachment[];
  metadata?: {
    source?: 'ultrium' | 'security' | 'helpdesk' | 'safescan' | 'rmm';
    actions?: string[];
    ticketCreated?: string;
    scanCompleted?: boolean;
    threatLevel?: string;
    conversationId?: string;
    isVoice?: boolean;
    creditsUsed?: number;
  };
}

interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  content?: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface UnifiedAIAssistantProps {
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  defaultSource?: 'ultrium' | 'security' | 'helpdesk' | 'safescan' | 'rmm';
  context?: string;
  className?: string;
}

export const UnifiedAIAssistant = ({ 
  isMinimized = false, 
  onToggleMinimize,
  defaultSource = 'ultrium',
  context = 'dashboard',
  className = ""
}: UnifiedAIAssistantProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { credits, remainingCredits, refreshCredits } = useUserCredits();
  const { subscription } = useSubscription();
  
  // Enhanced state management
  const [activeTab, setActiveTab] = useState<'ultrium' | 'security' | 'helpdesk' | 'safescan' | 'rmm'>(defaultSource);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  
  // Voice functionality
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  
  // File upload functionality
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'system',
        content: `🚀 **Welcome to your Unified AI Assistant!**

I'm your comprehensive AI companion that adapts to your needs:

🔧 **IT Support & RMM** - System monitoring, device management, troubleshooting
🛡️ **Security Analysis** - Threat detection, vulnerability assessment, incident response  
📧 **SafeScan** - Email, URL, and document security scanning
🎫 **SafeDesk** - Ticket management, customer support automation
⚡ **UltriumGPT** - General assistance, reports, web search, image generation

💡 **Pro Tips:**
- Switch tabs above for specialized assistance
- Upload files for analysis
- Use voice input for hands-free interaction
- Your conversations are automatically saved

**Current context:** ${context.charAt(0).toUpperCase() + context.slice(1)}
Ask me anything to get started!`,
        timestamp: new Date(),
        metadata: { source: 'ultrium' }
      }]);
    }
  }, [context]);

  // Load conversations and handle persistence
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Conversation persistence functions
  const loadConversations = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, title, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      const conversationsWithCount = await Promise.all(
        (data || []).map(async (conv) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id);
          
          return {
            ...conv,
            message_count: count || 0
          };
        })
      );
      
      setConversations(conversationsWithCount);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const saveConversation = async () => {
    if (!user || messages.length <= 1) return;

    try {
      let conversationId = currentConversationId;
      
      if (!conversationId) {
        // Create new conversation
        const title = messages.find(m => m.role === 'user')?.content.slice(0, 50) + '...' || 'New conversation';
        
        const { data, error } = await supabase
          .from('conversations')
          .insert({
            user_id: user.id,
            title
          })
          .select('id')
          .single();

        if (error) throw error;
        conversationId = data.id;
        setCurrentConversationId(conversationId);
      }

      // Save messages (only new ones)
      const messagesToSave = messages
        .filter(m => m.role !== 'system' && !m.metadata?.conversationId)
        .map(m => ({
          conversation_id: conversationId,
          role: m.role,
          content: m.content,
          metadata: { ...m.metadata, conversationId }
        }));

      if (messagesToSave.length > 0) {
        const { error } = await supabase
          .from('messages')
          .insert(messagesToSave);

        if (error) throw error;
        
        // Mark messages as saved
        setMessages(prev => prev.map(m => ({
          ...m,
          metadata: { ...m.metadata, conversationId }
        })));
      }

      loadConversations();
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const loadedMessages: Message[] = data.map((msg: any) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        metadata: (msg.metadata as any) || {}
      }));

      setMessages(loadedMessages);
      setCurrentConversationId(conversationId);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  // File upload functionality
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: FileAttachment[] = acceptedFiles.map(file => ({
      id: Date.now().toString() + Math.random(),
      name: file.name,
      type: file.type,
      size: file.size
    }));
    
    setAttachedFiles(prev => [...prev, ...newFiles]);
    
    toast({
      title: "Files attached",
      description: `${acceptedFiles.length} file(s) ready for analysis.`,
    });
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/*': ['.txt', '.md', '.csv'],
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/json': ['.json']
    },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  // Voice functionality
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (event) => {
        setAudioChunks(prev => [...prev, event.data]);
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        await processVoiceInput(audioBlob);
        setAudioChunks([]);
      };
      
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Speak your message...",
      });
    } catch (error) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to use voice input.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        // Call voice-to-text edge function
        const { data, error } = await supabase.functions.invoke('voice-to-text', {
          body: { audio: base64Audio }
        });

        if (error) throw error;

        if (data.text) {
          setInput(data.text);
          toast({
            title: "Voice input processed",
            description: "You can now edit or send your message.",
          });
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error processing voice input:', error);
      toast({
        title: "Voice processing failed",
        description: "Please try again or type your message.",
        variant: "destructive",
      });
    }
  };

  const speakText = async (text: string) => {
    try {
      setIsSpeaking(true);
      
      const { data, error } = await supabase.functions.invoke('text-to-voice', {
        body: { 
          text: text.slice(0, 500), // Limit for performance
          voice: 'alloy'
        }
      });

      if (error) throw error;

      if (data.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        audio.onended = () => setIsSpeaking(false);
        audio.play();
      }
    } catch (error) {
      console.error('Error with text-to-speech:', error);
      setIsSpeaking(false);
    }
  };

  const getSourceConfig = (source: string) => {
    const configs = {
      ultrium: {
        icon: Zap,
        label: "UltriumGPT",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        function: "ultrium-gpt-assistant"
      },
      security: {
        icon: Shield,
        label: "Security AI",
        color: "text-red-600", 
        bgColor: "bg-red-50",
        function: "security-ai-assistant"
      },
      helpdesk: {
        icon: HeadphonesIcon,
        label: "SafeDesk AI",
        color: "text-green-600",
        bgColor: "bg-green-50", 
        function: "ai-helpdesk-assistant"
      },
      safescan: {
        icon: Scan,
        label: "SafeScan AI",
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        function: "safescan-ai-analyzer"
      },
      rmm: {
        icon: Server,
        label: "RMM AI",
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        function: "rmm-commands"
      }
    };
    return configs[source as keyof typeof configs] || configs.ultrium;
  };

  const getCreditCost = (source: string) => {
    switch (source) {
      case 'ultrium': return CREDIT_COSTS.CHAT_MESSAGE_ADVANCED;
      case 'security': return CREDIT_COSTS.CHAT_MESSAGE_ADVANCED; 
      case 'helpdesk': return CREDIT_COSTS.CHAT_MESSAGE_BASIC;
      case 'safescan': return CREDIT_COSTS.CHAT_MESSAGE_ADVANCED;
      case 'rmm': return CREDIT_COSTS.CHAT_MESSAGE_BASIC;
      default: return CREDIT_COSTS.CHAT_MESSAGE_BASIC;
    }
  };

  const checkSubscriptionAccess = (source: string) => {
    // Premium features require subscription
    if (['security', 'safescan', 'rmm'].includes(source)) {
      return subscription.subscribed && ['premium', 'enterprise'].includes(subscription.subscription_tier);
    }
    return true;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !user) return;

    // Check subscription access
    if (!checkSubscriptionAccess(activeTab)) {
      toast({
        title: "Premium Feature",
        description: `${getSourceConfig(activeTab).label} requires a premium subscription.`,
        variant: "destructive",
      });
      return;
    }

    // Check credit availability
    const creditsNeeded = getCreditCost(activeTab);
    if (remainingCredits < creditsNeeded) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${creditsNeeded} credits to use ${getSourceConfig(activeTab).label}. You have ${remainingCredits} remaining.`,
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      metadata: { source: activeTab as any }
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    const userInput = input;
    setInput("");

    try {
      // Deduct credits before making the call
      const creditResult = await deductCredits(user.id, 'CHAT_MESSAGE_ADVANCED', creditsNeeded);
      if (!creditResult.success) {
        throw new Error(creditResult.error || 'Failed to deduct credits');
      }

      const sourceConfig = getSourceConfig(activeTab);
      
      // Get MSP context if applicable
      const { data: mspData } = await supabase
        .from('msps')
        .select('id, company_name, brand_name')
        .eq('user_id', user.id)
        .single();

      const { data, error } = await supabase.functions.invoke(sourceConfig.function, {
        body: {
          message: userInput,
          userId: user?.id,
          context: context,
          source: activeTab,
          mspId: mspData?.id,
          mspName: mspData?.company_name || mspData?.brand_name,
          subscriptionTier: subscription.subscription_tier
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.analysis || data.message || "I'm here to help!",
        timestamp: new Date(),
        metadata: {
          source: activeTab as any,
          creditsUsed: creditsNeeded,
          ...data.metadata
        }
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Refresh credits to show updated balance
      refreshCredits();

      // Handle different response types
      if (data.metadata?.ticketCreated) {
        toast({
          title: "Support Ticket Created",
          description: `Ticket #${data.metadata.ticketCreated} has been created.`,
        });
      }

      if (data.metadata?.scanCompleted) {
        toast({
          title: "Security Scan Complete",
          description: `Scan completed with ${data.metadata.threatLevel || 'no'} threats detected.`,
        });
      }

    } catch (error) {
      console.error('Error calling AI assistant:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
        metadata: { source: activeTab as any }
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Connection Error",
        description: "Unable to connect to AI assistant. Please try again.",
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

  if (isMinimized) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          onClick={onToggleMinimize}
          size="lg"
          className="rounded-full h-14 w-14 bg-gradient-to-r from-primary to-primary/80 shadow-xl hover:shadow-2xl transition-all duration-300"
        >
          <Bot className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <Card className={`w-96 shadow-2xl border-0 bg-background/95 backdrop-blur-sm transition-all duration-300 ${
        isExpanded ? 'h-[600px]' : 'h-[400px]'
      }`}>
        <CardHeader className="pb-3 border-b bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                AI Assistant
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {remainingCredits} credits
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowConversations(!showConversations)}
                className="h-8 w-8 p-0"
                title="Conversation history"
              >
                <History className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={saveConversation}
                className="h-8 w-8 p-0"
                title="Save conversation"
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0"
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              {onToggleMinimize && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onToggleMinimize}
                  className="h-8 w-8 p-0"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 flex flex-col h-full">
          {/* Conversation History Dropdown */}
          {showConversations && (
            <div className="mb-3 p-3 bg-muted/30 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Recent Conversations</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMessages([{
                      id: 'welcome',
                      role: 'system',
                      content: `🚀 **New Conversation Started!**

I'm ready to help with your ${getSourceConfig(activeTab).label} needs.`,
                      timestamp: new Date(),
                      metadata: { source: activeTab }
                    }]);
                    setCurrentConversationId(null);
                  }}
                  className="text-xs"
                >
                  New Chat
                </Button>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {conversations.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No conversations yet</p>
                ) : (
                  conversations.map((conv) => (
                    <Button
                      key={conv.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => loadConversation(conv.id)}
                      className="w-full justify-start text-left h-auto p-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs truncate">{conv.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {conv.message_count} messages • {new Date(conv.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </Button>
                  ))
                )}
              </div>
            </div>
          )}
          {/* AI Source Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-5 mb-3">
              {(['ultrium', 'security', 'helpdesk', 'safescan', 'rmm'] as const).map((source) => {
                const config = getSourceConfig(source);
                return (
                  <TabsTrigger 
                    key={source} 
                    value={source} 
                    className="p-1 text-xs"
                    title={config.label}
                  >
                    <config.icon className="h-4 w-4" />
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value={activeTab} className="flex-1 flex flex-col mt-0">
              {/* Messages */}
              <div className={`flex-1 overflow-y-auto space-y-3 mb-3 ${
                isExpanded ? 'max-h-[420px]' : 'max-h-[220px]'
              }`}>
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user' 
                        ? 'bg-primary text-white' 
                        : message.role === 'system'
                        ? 'bg-muted'
                        : getSourceConfig(message.metadata?.source || activeTab).bgColor
                    }`}>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <img 
                          src={ultriumBotIcon} 
                          alt="UltriumGPT Bot" 
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      )}
                    </div>
                    
                    <div className={`flex-1 max-w-[85%] ${message.role === 'user' ? 'text-right' : ''}`}>
                      <div className={`inline-block p-3 rounded-lg text-sm ${
                        message.role === 'user'
                          ? 'bg-primary text-white ml-auto'
                          : 'bg-muted'
                      }`}>
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </div>
                        
                        {message.metadata && message.metadata.actions && (
                          <div className="mt-2 pt-2 border-t border-border/30">
                            <div className="flex flex-wrap gap-1">
                              {message.metadata.actions.map((action, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {action}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className={`text-xs text-muted-foreground mt-1 flex items-center gap-1 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}>
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted">
                      <img 
                        src={ultriumBotIcon} 
                        alt="UltriumGPT Bot" 
                        className="h-6 w-6 rounded-full object-cover opacity-50"
                      />
                    </div>
                    <div className="flex-1 max-w-[85%]">
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          {getSourceConfig(activeTab).label} is thinking...
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* File Upload Area */}
              {attachedFiles.length > 0 && (
                <div className="mb-2 p-2 bg-muted/30 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">Attached Files</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAttachedFiles([])}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {attachedFiles.map((file) => (
                      <div key={file.id} className="flex items-center gap-2 text-xs">
                        {file.type.startsWith('image/') ? (
                          <ImageIcon className="h-3 w-3 text-blue-500" />
                        ) : (
                          <FileText className="h-3 w-3 text-gray-500" />
                        )}
                        <span className="flex-1 truncate">{file.name}</span>
                        <span className="text-muted-foreground">
                          {(file.size / 1024).toFixed(1)}KB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File Drop Zone */}
              <div
                {...getRootProps()}
                className={`mb-2 p-2 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
                  isDragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/20 hover:border-primary/40'
                }`}
              >
                <input {...getInputProps()} />
                <div className="text-center">
                  <Upload className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {isDragActive ? 'Drop files here' : 'Drag files or click to upload'}
                  </p>
                </div>
              </div>

              {/* Input Area */}
              <div className="space-y-2">
                <div className="relative">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Ask ${getSourceConfig(activeTab).label} anything...`}
                    rows={2}
                    disabled={isLoading}
                    className="resize-none text-sm pr-16"
                  />
                  
                  {/* Voice Controls */}
                  <div className="absolute right-2 top-2 flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isLoading}
                      className="h-8 w-8 p-0"
                      title={isRecording ? "Stop recording" : "Start voice input"}
                    >
                      {isRecording ? (
                        <MicOff className="h-4 w-4 text-red-500" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Context indicator */}
                    <Badge variant="outline" className="text-xs">
                      {context}
                    </Badge>
                    
                    {/* Voice output toggle */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (messages.length > 1) {
                          const lastAssistantMessage = messages
                            .slice()
                            .reverse()
                            .find(m => m.role === 'assistant' && m.content);
                          if (lastAssistantMessage) {
                            speakText(lastAssistantMessage.content);
                          }
                        }
                      }}
                      disabled={isSpeaking || isLoading}
                      className="h-8 w-8 p-0"
                      title="Read last response aloud"
                    >
                      {isSpeaking ? (
                        <VolumeX className="h-4 w-4 text-green-500" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!input.trim() || isLoading}
                    size="sm"
                    className="bg-gradient-to-r from-primary to-primary/90"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};