import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, 
  Trash2, 
  Maximize2, 
  Minimize2, 
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  History,
  Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useVanguardAgents } from "@/hooks/useVanguardAgents";
import { useCopilotVoice } from "@/hooks/useCopilotVoice";
import { useCopilotConversations } from "@/hooks/useCopilotConversations";
import { useCopilotAlerts } from "@/hooks/useCopilotAlerts";
import { CopilotMessage } from "./copilot/CopilotMessage";
import { CopilotInput } from "./copilot/CopilotInput";
import { CopilotQuickActions } from "./copilot/CopilotQuickActions";
import { CopilotThreatMap } from "./copilot/CopilotThreatMap";
import { CopilotAlertPopup } from "./copilot/CopilotAlertPopup";
import { CopilotConversationList } from "./copilot/CopilotConversationList";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolsUsed?: string[];
  isStreaming?: boolean;
  actions?: Array<{
    label: string;
    action: string;
    variant?: 'default' | 'destructive' | 'outline';
  }>;
}

interface VanguardAICopilotProps {
  agentId?: string;
}

export function VanguardAICopilot({ agentId }: VanguardAICopilotProps) {
  const { toast } = useToast();
  const { agents } = useVanguardAgents();
  const voice = useCopilotVoice();
  const conversations = useCopilotConversations();
  
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [activeThreats, setActiveThreats] = useState<any[]>([]);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [showConversations, setShowConversations] = useState(false);
  
  const copilotAlerts = useCopilotAlerts(userId, alertsEnabled);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  // Get the first online agent if no specific agent provided
  const activeAgentId = agentId || agents.find(a => a.status === 'online')?.id;
  const onlineAgentCount = agents.filter(a => a.status === 'online').length;

  // Fetch active threats for threat map
  useEffect(() => {
    if (!userId) return;
    
    const fetchThreats = async () => {
      const { data } = await supabase
        .from('security_incidents')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'investigating'])
        .order('created_at', { ascending: false })
        .limit(5);
      
      setActiveThreats(data || []);
    };
    
    fetchThreats();
  }, [userId]);

  // Initialize with proactive greeting or load existing conversation
  useEffect(() => {
    if (hasInitialized.current || !userId) return;
    hasInitialized.current = true;
    
    // Check for existing conversations
    if (conversations.conversations.length > 0 && !conversations.currentConversation) {
      // Start a new conversation
      startNewConversation();
    } else {
      initializeChat();
    }
  }, [userId, activeAgentId, conversations.conversations.length]);

  // Handle voice transcript
  useEffect(() => {
    if (voice.transcript && !voice.isListening) {
      setInput(voice.transcript);
    }
  }, [voice.transcript, voice.isListening]);

  // Auto-scroll on new messages - improved with smooth behavior
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollElement) {
          scrollElement.scrollTo({
            top: scrollElement.scrollHeight,
            behavior: 'smooth'
          });
        }
      }
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [localMessages, scrollToBottom]);

  const startNewConversation = async () => {
    const conversationId = await conversations.createConversation();
    if (conversationId) {
      initializeChat();
    }
  };

  const initializeChat = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vanguard-ai-copilot`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            messages: [{ role: 'user', content: 'Hello' }],
            agentId: activeAgentId,
            userId,
            isFirstMessage: true,
            useTools: false,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const welcomeMessage = data.response || getDefaultGreeting();
        setLocalMessages([{
          id: 'welcome',
          role: 'assistant',
          content: welcomeMessage,
          timestamp: new Date()
        }]);
      } else {
        setLocalMessages([{
          id: 'welcome',
          role: 'assistant',
          content: getDefaultGreeting(),
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      setLocalMessages([{
        id: 'welcome',
        role: 'assistant',
        content: getDefaultGreeting(),
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultGreeting = () => {
    const timeOfDay = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening';
    return `Good ${timeOfDay}! I'm your Vanguard AI security copilot.${onlineAgentCount > 0 ? ` You have ${onlineAgentCount} agent${onlineAgentCount > 1 ? 's' : ''} online and monitoring your environment.` : ''} What would you like to look into today?`;
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setLocalMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Persist user message
    if (conversations.currentConversation) {
      await conversations.addMessage('user', text);
    }

    // Add streaming placeholder
    const assistantId = (Date.now() + 1).toString();
    setLocalMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }]);

    try {
      const apiMessages = localMessages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));
      apiMessages.push({ role: 'user', content: text });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vanguard-ai-copilot`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            messages: apiMessages,
            agentId: activeAgentId,
            userId,
            useTools: true,
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        }
        if (response.status === 402) {
          throw new Error('AI credits exhausted. Please add credits to continue.');
        }
        throw new Error('Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let textBuffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          textBuffer += decoder.decode(value, { stream: true });
          
          // Process SSE lines
          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);
            
            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;
            
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                setLocalMessages(prev => prev.map(m => 
                  m.id === assistantId 
                    ? { ...m, content: fullContent }
                    : m
                ));
                // Auto-scroll during streaming
                scrollToBottom();
              }
            } catch {
              // Incomplete JSON, continue
            }
          }
        }
      }

      // If no streaming content, try to get JSON response
      let toolsUsed: string[] | undefined;
      if (!fullContent) {
        try {
          const data = await response.json();
          fullContent = data.response || "I processed your request.";
          toolsUsed = data.tools_used;
          
          setLocalMessages(prev => prev.map(m => 
            m.id === assistantId 
              ? { 
                  ...m, 
                  content: fullContent,
                  isStreaming: false,
                  toolsUsed: data.tools_used 
                }
              : m
          ));
        } catch {
          // Response was streamed, finalize
          setLocalMessages(prev => prev.map(m => 
            m.id === assistantId 
              ? { ...m, isStreaming: false }
              : m
          ));
        }
      } else {
        setLocalMessages(prev => prev.map(m => 
          m.id === assistantId 
            ? { ...m, isStreaming: false }
            : m
        ));
      }

      // Persist assistant message
      if (conversations.currentConversation && fullContent) {
        await conversations.addMessage('assistant', fullContent, toolsUsed);
      }

    } catch (error: any) {
      console.error('Error:', error);
      setLocalMessages(prev => prev.filter(m => m.id !== assistantId));
      toast({
        title: "Error",
        description: error.message || "Failed to get response from AI",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = async (text: string, messageId: string) => {
    if (!voiceEnabled) return;
    setSpeakingMessageId(messageId);
    await voice.speak(text);
    setSpeakingMessageId(null);
  };

  const handleStopSpeaking = () => {
    voice.stopSpeaking();
    setSpeakingMessageId(null);
  };

  const toggleVoiceInput = () => {
    if (voice.isListening) {
      voice.stopListening();
    } else {
      voice.startListening();
    }
  };

  const clearChat = async () => {
    hasInitialized.current = false;
    setLocalMessages([]);
    await startNewConversation();
  };

  const handleSelectConversation = async (conversationId: string | null) => {
    if (conversationId) {
      await conversations.loadConversation(conversationId);
      // Convert persisted messages to local format
      const loadedMessages: Message[] = conversations.messages.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(m.created_at),
        toolsUsed: m.tools_used || undefined,
      }));
      setLocalMessages(loadedMessages);
    }
    setShowConversations(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          "flex flex-col transition-all duration-300",
          isExpanded 
            ? "fixed inset-4 z-50" 
            : "h-[calc(100vh-12rem)]"
        )}
      >
        {/* Backdrop for expanded mode */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm -z-10"
            onClick={() => setIsExpanded(false)}
          />
        )}

        <Card className={cn(
          "flex-1 flex flex-col overflow-hidden border-0",
          "bg-[hsl(var(--copilot-bg))] text-[hsl(var(--copilot-text))]",
          "shadow-2xl shadow-[hsl(var(--copilot-accent)/0.1)]"
        )}>
          {/* Header */}
          <CardHeader className="pb-3 border-b border-[hsl(var(--copilot-border))] relative">
            {/* Proactive Alert Popup */}
            {copilotAlerts.alerts.length > 0 && (
              <CopilotAlertPopup
                alerts={copilotAlerts.alerts}
                onDismiss={copilotAlerts.dismissAlert}
                onDismissAll={copilotAlerts.dismissAllAlerts}
              />
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Animated Logo */}
                <motion.div 
                  className="relative"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--copilot-accent))] to-[hsl(var(--cyber-purple))] flex items-center justify-center shadow-lg shadow-[hsl(var(--copilot-accent)/0.4)]">
                    <Bot className="h-5 w-5 text-black" />
                  </div>
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-gradient-to-br from-[hsl(var(--copilot-accent))] to-[hsl(var(--cyber-purple))] blur-md"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
                
                <div>
                  <CardTitle className="text-lg font-semibold text-[hsl(var(--copilot-text))] flex items-center gap-2">
                    Vanguard AI
                    <Badge 
                      variant="outline" 
                      className="text-[10px] bg-[hsl(var(--copilot-accent)/0.1)] border-[hsl(var(--copilot-accent)/0.3)] text-[hsl(var(--copilot-accent))]"
                    >
                      COPILOT
                    </Badge>
                  </CardTitle>
                  <p className="text-xs text-[hsl(var(--copilot-text-muted))] flex items-center gap-2">
                    Security Operations Assistant
                    {onlineAgentCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[hsl(var(--copilot-accent))]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--copilot-accent))] animate-pulse" />
                        {onlineAgentCount} online
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              {/* Header Actions */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowConversations(!showConversations)}
                  className={cn(
                    "h-8 w-8 text-[hsl(var(--copilot-text-muted))] hover:text-[hsl(var(--copilot-text))] hover:bg-[hsl(var(--copilot-surface))]",
                    showConversations && "bg-[hsl(var(--copilot-accent)/0.2)] text-[hsl(var(--copilot-accent))]"
                  )}
                >
                  <History className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className="h-8 w-8 text-[hsl(var(--copilot-text-muted))] hover:text-[hsl(var(--copilot-text))] hover:bg-[hsl(var(--copilot-surface))]"
                >
                  {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setAlertsEnabled(!alertsEnabled)}
                  className={cn(
                    "h-8 w-8 text-[hsl(var(--copilot-text-muted))] hover:text-[hsl(var(--copilot-text))] hover:bg-[hsl(var(--copilot-surface))]",
                    copilotAlerts.alerts.length > 0 && alertsEnabled && "text-[hsl(var(--threat-high))]"
                  )}
                >
                  {alertsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                  {copilotAlerts.alerts.length > 0 && alertsEnabled && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[hsl(var(--threat-critical))] animate-pulse" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearChat}
                  className="h-8 w-8 text-[hsl(var(--copilot-text-muted))] hover:text-[hsl(var(--copilot-text))] hover:bg-[hsl(var(--copilot-surface))]"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-8 w-8 text-[hsl(var(--copilot-text-muted))] hover:text-[hsl(var(--copilot-text))] hover:bg-[hsl(var(--copilot-surface))]"
                >
                  {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Main Content Area */}
          <CardContent className="flex-1 flex flex-col overflow-hidden p-0 relative">
            {/* Conversation List Sidebar */}
            <CopilotConversationList
              conversations={conversations.conversations}
              currentConversationId={conversations.currentConversation?.id || null}
              onSelectConversation={handleSelectConversation}
              onNewConversation={clearChat}
              onDeleteConversation={conversations.deleteConversation}
              isOpen={showConversations}
              onClose={() => setShowConversations(false)}
            />
            
            {/* Threat Map - Only show when expanded and has threats */}
            {isExpanded && (
              <div className="p-4 border-b border-[hsl(var(--copilot-border))]">
                <CopilotThreatMap threats={activeThreats} />
              </div>
            )}

            {/* Quick Actions - Show when only welcome message */}
            {localMessages.length <= 1 && !isLoading && (
              <div className="p-4 border-b border-[hsl(var(--copilot-border))]">
                <CopilotQuickActions 
                  onSelectAction={sendMessage}
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 px-4" ref={scrollRef}>
              <div className="space-y-4 py-4">
                {localMessages.map((message) => (
                  <CopilotMessage
                    key={message.id}
                    {...message}
                    onSpeak={voiceEnabled ? (text) => handleSpeak(text, message.id) : undefined}
                    isSpeaking={speakingMessageId === message.id}
                    onStopSpeaking={handleStopSpeaking}
                  />
                ))}
                
                {/* Loading indicator */}
                {isLoading && localMessages[localMessages.length - 1]?.role === 'user' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--copilot-accent))] to-[hsl(var(--cyber-purple))] flex items-center justify-center">
                      <Bot className="h-4 w-4 text-black animate-pulse" />
                    </div>
                    <div className="bg-[hsl(var(--copilot-surface))] border border-[hsl(var(--copilot-border))] rounded-xl px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full bg-[hsl(var(--copilot-accent))]"
                            animate={{ 
                              scale: [1, 1.3, 1],
                              opacity: [0.5, 1, 0.5]
                            }}
                            transition={{ 
                              duration: 0.6, 
                              repeat: Infinity,
                              delay: i * 0.15
                            }}
                          />
                        ))}
                        <span className="ml-2 text-xs text-[hsl(var(--copilot-text-muted))]">
                          Analyzing...
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-[hsl(var(--copilot-border))] bg-[hsl(var(--copilot-bg))]">
              <CopilotInput
                value={voice.isListening ? voice.transcript : input}
                onChange={setInput}
                onSend={() => sendMessage()}
                isLoading={isLoading}
                isListening={voice.isListening}
                onToggleVoice={toggleVoiceInput}
                disabled={false}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
