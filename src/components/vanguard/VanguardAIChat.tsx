import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, X, Send, Loader2, Bot, User, Minus, Maximize2, Minimize2,
  Shield, AlertTriangle, CheckCircle, Sparkles, Square, History, Trash2,
  Copy, Check, Download, Search, Clock, RotateCcw, MessageSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { CopilotQuickActions, ChatMode } from './copilot/CopilotQuickActions';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolsUsed?: string[];
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  mode: ChatMode;
}

export const VanguardAIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<'normal' | 'minimized' | 'fullscreen'>('normal');
  const [chatMode, setChatMode] = useState<ChatMode>(() => {
    const saved = localStorage.getItem('vanguard-chat-mode');
    return (saved as ChatMode) || 'security';
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load conversations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('vanguard-ai-conversations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConversations(parsed.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
          mode: c.mode || 'security', // Default to security for old conversations
          messages: c.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        })));
      } catch (e) {
        console.error('Failed to parse saved conversations');
      }
    }
  }, []);

  // Save mode preference
  useEffect(() => {
    localStorage.setItem('vanguard-chat-mode', chatMode);
  }, [chatMode]);

  // Save conversations to localStorage
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('vanguard-ai-conversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && displayMode !== 'minimized' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, displayMode]);

  const generateId = () => Math.random().toString(36).substring(2, 15);

  const createNewConversation = useCallback(() => {
    const newId = generateId();
    setCurrentConversationId(newId);
    setMessages([]);
    setShowHistory(false);
  }, []);

  // Handle mode switching - must be after createNewConversation
  const handleModeSwitch = useCallback((newMode: ChatMode) => {
    if (newMode !== chatMode) {
      setChatMode(newMode);
      setMessages([]);
      setCurrentConversationId(generateId());
    }
  }, [chatMode]);

  const saveCurrentConversation = useCallback(() => {
    if (messages.length === 0) return;
    
    const title = messages[0]?.content.slice(0, 40) + (messages[0]?.content.length > 40 ? '...' : '') || 'New conversation';
    
    setConversations(prev => {
      const existing = prev.find(c => c.id === currentConversationId);
      if (existing) {
        return prev.map(c => c.id === currentConversationId 
          ? { ...c, messages, title, updatedAt: new Date() }
          : c
        );
      } else if (currentConversationId) {
        return [{
          id: currentConversationId,
          title,
          messages,
          createdAt: new Date(),
          updatedAt: new Date(),
          mode: chatMode
        }, ...prev];
      }
      return prev;
    });
  }, [messages, currentConversationId, chatMode]);

  // Auto-save conversation when messages change
  useEffect(() => {
    if (messages.length > 0 && currentConversationId) {
      saveCurrentConversation();
    }
  }, [messages, currentConversationId, saveCurrentConversation]);

  const loadConversation = useCallback((conv: Conversation) => {
    setCurrentConversationId(conv.id);
    setMessages(conv.messages);
    setChatMode(conv.mode);
    setShowHistory(false);
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversationId === id) {
      createNewConversation();
    }
  }, [currentConversationId, createNewConversation]);

  const clearAllConversations = useCallback(() => {
    setConversations([]);
    localStorage.removeItem('vanguard-ai-conversations');
    createNewConversation();
    toast.success('All conversations cleared');
  }, [createNewConversation]);

  const exportConversation = useCallback(() => {
    if (messages.length === 0) {
      toast.error('No messages to export');
      return;
    }
    
    const content = messages.map(m => 
      `[${format(m.timestamp, 'HH:mm:ss')}] ${m.role === 'user' ? 'You' : 'Vanguard AI'}: ${m.content}`
    ).join('\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vanguard-ai-conversation-${format(new Date(), 'yyyy-MM-dd-HHmm')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Conversation exported');
  }, [messages]);

  const copyMessage = useCallback((message: Message) => {
    navigator.clipboard.writeText(message.content);
    setCopiedId(message.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Copied to clipboard');
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    if (!currentConversationId) {
      setCurrentConversationId(generateId());
    }

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };
    
    setInput('');
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Use appropriate edge function based on mode
      const functionName = chatMode === 'security' ? 'vanguard-ai-copilot' : 'vanguard-general-chat';
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          messages: [...messages, { role: 'user', content: userMessage.content }].map(m => ({
            role: m.role,
            content: m.content
          })),
          ...(chatMode === 'security' ? { useTools: true } : {})
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        setMessages(prev => [...prev, { 
          id: generateId(),
          role: 'assistant', 
          content: `I encountered an error: ${data.error}`,
          timestamp: new Date()
        }]);
      } else {
        setMessages(prev => [...prev, { 
          id: generateId(),
          role: 'assistant', 
          content: data.response,
          toolsUsed: data.tools_used,
          timestamp: new Date()
        }]);
      }
    } catch (error: any) {
      console.error('AI chat error:', error);
      toast.error('Failed to get response from AI');
      setMessages(prev => [...prev, { 
        id: generateId(),
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  if (!isOpen) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 hover:scale-110 transition-transform"
          size="icon"
        >
          <div className="relative">
            <Bot className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
          </div>
        </Button>
      </motion.div>
    );
  }

  if (displayMode === 'minimized') {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Card className="w-72 shadow-xl border-primary/20">
          <CardHeader className="p-3 flex flex-row items-center justify-between bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">Vanguard AI</span>
              {messages.length > 0 && (
                <Badge variant="secondary" className="text-xs">{messages.length} msgs</Badge>
              )}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDisplayMode('normal')}>
                <Square className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>
      </motion.div>
    );
  }

  return (
    <>
      {/* Fullscreen backdrop */}
      <AnimatePresence>
        {displayMode === 'fullscreen' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40" 
            onClick={() => setDisplayMode('normal')} 
          />
        )}
      </AnimatePresence>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn(
          "fixed z-50 transition-all duration-300",
          displayMode === 'fullscreen' 
            ? "inset-4" 
            : "bottom-6 right-6"
        )}
      >
        <Card className={cn(
          "shadow-xl border-primary/20 flex flex-col overflow-hidden",
          displayMode === 'fullscreen' 
            ? "w-full h-full" 
            : "w-96 h-[600px]"
        )}>
          <CardHeader className="p-3 flex flex-col gap-2 bg-gradient-to-r from-primary/10 to-primary/5 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  {chatMode === 'security' ? <Shield className="h-6 w-6 text-primary" /> : <MessageSquare className="h-6 w-6 text-primary" />}
                  <Sparkles className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Vanguard AI</CardTitle>
                  <p className="text-xs text-muted-foreground">{chatMode === 'security' ? 'Security Mode' : 'General Assistant'}</p>
                </div>
              </div>
              <div className="flex gap-1">
              {/* New conversation */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7" 
                onClick={createNewConversation}
                title="New conversation"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              
              {/* History toggle */}
              <Button 
                variant={showHistory ? 'secondary' : 'ghost'}
                size="icon" 
                className="h-7 w-7" 
                onClick={() => setShowHistory(!showHistory)}
                title="Conversation history"
              >
                <History className="h-4 w-4" />
              </Button>
              
              {/* Export */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7" 
                onClick={exportConversation}
                title="Export conversation"
              >
                <Download className="h-4 w-4" />
              </Button>
              
              {/* Minimize button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7" 
                onClick={() => setDisplayMode('minimized')}
                title="Minimize"
              >
                <Minus className="h-4 w-4" />
              </Button>
              
              {/* Fullscreen toggle */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7" 
                onClick={() => setDisplayMode(displayMode === 'fullscreen' ? 'normal' : 'fullscreen')}
                title={displayMode === 'fullscreen' ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {displayMode === 'fullscreen' ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              
              {/* Close button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7" 
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
              </div>
            </div>
            
            {/* Mode Toggle */}
            <div className="flex items-center justify-center">
              <div className="flex bg-muted rounded-lg p-0.5">
                <button
                  onClick={() => handleModeSwitch('security')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all",
                    chatMode === 'security' 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Shield className="h-3 w-3" />
                  Security
                </button>
                <button
                  onClick={() => handleModeSwitch('general')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all",
                    chatMode === 'general' 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <MessageSquare className="h-3 w-3" />
                  General
                </button>
              </div>
            </div>
          </CardHeader>

          {/* History panel */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b bg-muted/30 overflow-hidden"
              >
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 text-sm"
                    />
                    {conversations.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllConversations}
                        className="h-8 text-destructive hover:text-destructive"
                        title="Clear all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="h-32">
                    {filteredConversations.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No conversations yet
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {filteredConversations.map(conv => (
                          <div
                            key={conv.id}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-md text-sm cursor-pointer hover:bg-muted transition-colors group",
                              currentConversationId === conv.id && "bg-muted"
                            )}
                            onClick={() => loadConversation(conv)}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="truncate font-medium text-xs">{conv.title}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(conv.updatedAt, 'MMM d, HH:mm')}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteConversation(conv.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="text-center py-6">
                  <Shield className="h-12 w-12 text-primary mx-auto mb-3 opacity-50" />
                  <h3 className="font-semibold mb-1">How can I help you?</h3>
                  <p className="text-sm text-muted-foreground">
                    I can check breaches, scan URLs, analyze IPs, and more.
                  </p>
                </div>
                <CopilotQuickActions 
                  onSelectAction={handleQuickAction}
                  compact={true}
                  mode={chatMode}
                />
              </motion.div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {messages.map((message, i) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={cn(
                        "flex gap-2 group",
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div className="flex flex-col max-w-[80%]">
                        <div
                          className={cn(
                            "rounded-lg px-3 py-2 text-sm relative",
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          )}
                        >
                          {message.role === 'assistant' ? (
                            <div className="whitespace-pre-wrap">{message.content}</div>
                          ) : (
                            message.content
                          )}
                          {message.toolsUsed && message.toolsUsed.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-border/50">
                              <p className="text-xs text-muted-foreground mb-1">Tools used:</p>
                              <div className="flex flex-wrap gap-1">
                                {message.toolsUsed.map((tool, j) => (
                                  <Badge key={j} variant="secondary" className="text-xs">
                                    {tool.replace(/_/g, ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Copy button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-6 w-6 absolute -right-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity",
                              message.role === 'user' && "-left-8 -right-auto"
                            )}
                            onClick={() => copyMessage(message)}
                          >
                            {copiedId === message.id ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1 px-1">
                          {format(message.timestamp, 'HH:mm')}
                        </span>
                      </div>
                      {message.role === 'user' && (
                        <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2 justify-start"
                  >
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex gap-1">
                          <motion.span
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
                            className="h-2 w-2 rounded-full bg-primary"
                          />
                          <motion.span
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                            className="h-2 w-2 rounded-full bg-primary"
                          />
                          <motion.span
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
                            className="h-2 w-2 rounded-full bg-primary"
                          />
                        </div>
                        <span>Analyzing...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </ScrollArea>

          <div className="p-3 border-t bg-background/50 shrink-0">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about security..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                onClick={sendMessage} 
                disabled={isLoading || !input.trim()} 
                size="icon"
                className="transition-transform hover:scale-105"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Powered by Vanguard AI • Real security tools
            </p>
          </div>
        </Card>
      </motion.div>
    </>
  );
};
