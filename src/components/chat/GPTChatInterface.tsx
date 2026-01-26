import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, ArrowLeft, Bot, User, Brain, FileText, Image, File, Settings2, Sparkles, History, PanelLeftClose, PanelLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCustomGPTs } from "@/hooks/useCustomGPTs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAnalyticsTracking } from "@/hooks/useAnalyticsTracking";
import { useGPTConversations } from "@/hooks/useGPTConversations";
import { useGPTAnalytics } from "@/hooks/useGPTAnalytics";
import { KnowledgeSearchService } from "@/services/KnowledgeSearchService";
import ChatFileUploader from "./ChatFileUploader";
import { CleanMarkdownRenderer } from "./CleanMarkdownRenderer";
import ConversationSidebar from "./ConversationSidebar";
import { motion, AnimatePresence } from "framer-motion";

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  uploading?: boolean;
  url?: string;
  content?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  loading?: boolean;
  attachments?: AttachedFile[];
}

export const GPTChatInterface = () => {
  const { gptId } = useParams<{ gptId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { gpts } = useCustomGPTs();
  const { toast } = useToast();
  const { trackMessageExchange, startSession } = useAnalyticsTracking();
  const { trackMessage } = useGPTAnalytics(gptId);
  
  const {
    conversations,
    currentConversation,
    createConversation,
    selectConversation,
    saveMessage,
    updateConversationTitle,
    deleteConversation,
    loadMessages,
    isLoading: isLoadingConversations
  } = useGPTConversations(gptId);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const gpt = gpts.find(g => g.id === gptId);

  // Initialize session
  useEffect(() => {
    if (!gpt || !user) return;
    
    const initSession = async () => {
      const session = await startSession(gpt.id);
      setSessionId(session);
    };
    
    initSession();
  }, [gpt, user, startSession]);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id).then((dbMessages) => {
        const formattedMessages: Message[] = dbMessages.map(m => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.created_at)
        }));
        setMessages(formattedMessages);
      });
    } else if (gpt) {
      // No conversation selected - show welcome
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Hello! I'm ${gpt.name}. ${gpt.description ? gpt.description + ' ' : ''}How can I help you today?`,
        timestamp: new Date()
      }]);
    }
  }, [currentConversation, gpt, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewConversation = useCallback(async () => {
    if (!gpt) return;
    await createConversation();
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm ${gpt.name}. ${gpt.description ? gpt.description + ' ' : ''}How can I help you today?`,
      timestamp: new Date()
    }]);
  }, [gpt, createConversation]);

  const handleSelectConversation = useCallback(async (conversation: any) => {
    await selectConversation(conversation);
  }, [selectConversation]);

  const sendMessage = async () => {
    if ((!inputMessage.trim() && attachedFiles.length === 0) || !gpt || !user || isLoading) return;

    // Create conversation if none exists
    let conversationId = currentConversation?.id;
    if (!conversationId) {
      const newConv = await createConversation(inputMessage.slice(0, 50));
      if (!newConv) return;
      conversationId = newConv.id;
    }

    // Build message content with file context
    let messageContent = inputMessage.trim();
    const messageAttachments = [...attachedFiles];
    
    if (attachedFiles.length > 0) {
      const fileContext = attachedFiles
        .map(file => {
          let context = `File: ${file.name} (${file.type})`;
          if (file.content) {
            context += `\nContent:\n${file.content.substring(0, 2000)}${file.content.length > 2000 ? '...' : ''}`;
          }
          return context;
        })
        .join('\n\n');
      
      messageContent = messageContent ? 
        `${messageContent}\n\nAttached files:\n${fileContext}` : 
        `Attached files:\n${fileContext}`;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim() || `[${attachedFiles.length} file(s) attached]`,
      timestamp: new Date(),
      attachments: messageAttachments
    };

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      loading: true
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputMessage('');
    setAttachedFiles([]);
    setIsLoading(true);

    const startTime = Date.now();

    try {
      // Save user message to database
      await saveMessage(conversationId, userMessage.content, 'user');

      // Search knowledge base
      let knowledgeContext = '';
      if (KnowledgeSearchService.shouldUseKnowledgeSearch(inputMessage.trim())) {
        const searchResult = await KnowledgeSearchService.searchKnowledge({
          query: inputMessage.trim(),
          gptId: gpt.id,
          limit: 3
        });
        
        if (searchResult.success && searchResult.results.length > 0) {
          knowledgeContext = KnowledgeSearchService.formatSearchResultsForContext(searchResult.results);
        }
      }

      const enhancedContent = messageContent + knowledgeContext;

      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          gptId: gpt.id,
          messages: [...messages.filter(m => !m.loading), { 
            role: userMessage.role, 
            content: enhancedContent
          }].map(m => ({
            role: m.role,
            content: m.content
          })),
          systemPrompt: gpt.system_prompt,
          sessionId,
          customGPT: gpt
        }
      });

      if (error) throw error;

      const responseTime = Date.now() - startTime;
      
      const assistantMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => prev.slice(0, -1).concat(assistantMessage));

      // Save assistant message to database
      await saveMessage(conversationId, data.message, 'assistant', data.tokensUsed, responseTime);

      // Track analytics
      await trackMessage(data.tokensUsed, responseTime);
      
      if (sessionId) {
        await trackMessageExchange(gpt.id, responseTime, data.tokensUsed, sessionId);
      }

      // Auto-update conversation title from first user message
      if (messages.length <= 2 && inputMessage.trim()) {
        const title = inputMessage.trim().slice(0, 60) + (inputMessage.length > 60 ? '...' : '');
        await updateConversationTitle(conversationId, title);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => prev.slice(0, -1).concat(errorMessage));
      
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
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

  const handleFileAttached = (file: AttachedFile) => {
    setAttachedFiles(prev => {
      const existingIndex = prev.findIndex(f => f.id === file.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = file;
        return updated;
      }
      return [...prev, file];
    });
  };

  const handleFileRemoved = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.includes('text') || type.includes('json') || type.includes('csv')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!gpt) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">GPT Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The Custom GPT you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to GPTs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-background">
      {/* Conversation History Sidebar */}
      <AnimatePresence mode="wait">
        {showHistory && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-r bg-muted/20 flex flex-col overflow-hidden"
          >
            <div className="p-3 border-b flex items-center justify-between bg-background/50">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-sm">Chat History</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setShowHistory(false)}
              >
                <PanelLeftClose className="w-4 h-4" />
              </Button>
            </div>
            <ConversationSidebar
              conversations={conversations}
              currentConversationId={currentConversation?.id || null}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
              onDeleteConversation={deleteConversation}
              onRenameConversation={updateConversationTitle}
              isLoading={isLoadingConversations}
              themeColor={gpt.theme_color || '#3b82f6'}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* GPT Info Sidebar */}
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-80 border-r bg-muted/30 flex flex-col backdrop-blur-sm"
      >
        <div className="p-4 border-b bg-background/50">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
              className="hover:bg-primary/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            {!showHistory && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowHistory(true)}
              >
                <PanelLeft className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Avatar className="w-14 h-14 ring-2 ring-offset-2 ring-offset-background transition-transform hover:scale-105"
              style={{ '--tw-ring-color': gpt.theme_color || '#3b82f6' } as any}
            >
              {gpt.logo_url ? (
                <AvatarImage src={gpt.logo_url} alt={gpt.name} />
              ) : (
                <AvatarFallback 
                  className="text-white text-xl font-semibold"
                  style={{ backgroundColor: gpt.theme_color || '#3b82f6' }}
                >
                  {gpt.name.charAt(0)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg truncate">{gpt.name}</h2>
              {gpt.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {gpt.description}
                </p>
              )}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/ai-studio/settings/${gpt.id}`)}
            className="w-full mt-4 gap-2 hover:bg-primary hover:text-primary-foreground transition-all"
          >
            <Settings2 className="w-4 h-4" />
            Edit GPT Settings
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-5">
            {/* Instructions Section */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                <Brain className="w-4 h-4" />
                Instructions
              </h3>
              <div className="text-sm text-foreground bg-background/80 p-4 rounded-xl border shadow-sm">
                <p className="line-clamp-8 leading-relaxed whitespace-pre-wrap break-words">
                  {gpt.system_prompt}
                </p>
              </div>
            </motion.div>

            {/* Features Section */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Features</h3>
              <div className="flex flex-wrap gap-2">
                {gpt.enable_web_search && (
                  <Badge variant="secondary" className="text-xs px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Web Search
                  </Badge>
                )}
                {gpt.api_enabled && (
                  <Badge variant="secondary" className="text-xs px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                    API Access
                  </Badge>
                )}
                {gpt.embed_enabled && (
                  <Badge variant="secondary" className="text-xs px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                    Embeddable
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs px-3 py-1 font-medium">
                  {gpt.preferred_model || 'gpt-4o'}
                </Badge>
              </div>
            </motion.div>

            {/* Starter Questions Section */}
            {gpt.starter_questions && Array.isArray(gpt.starter_questions) && gpt.starter_questions.length > 0 && (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                  Starter Questions
                </h3>
                <div className="space-y-2">
                  {gpt.starter_questions.slice(0, 4).map((question: string, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.25 + index * 0.05 }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-left h-auto py-3 px-4 text-sm bg-background/60 hover:bg-primary/10 border border-transparent hover:border-primary/20 rounded-xl transition-all leading-relaxed whitespace-normal"
                        onClick={() => setInputMessage(question)}
                      >
                        <span className="text-primary mr-2">→</span>
                        <span className="break-words">{question}</span>
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>
      </motion.div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-background to-muted/20">
        {/* Chat Header */}
        <motion.div 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="border-b p-4 bg-background/95 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                <div className="absolute inset-0 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
              </div>
              <h1 className="text-lg font-bold">
                {currentConversation?.title || `Chat with ${gpt.name}`}
              </h1>
            </div>
            <Badge variant="secondary" className="text-xs font-medium">
              {messages.filter(m => m.role === 'user').length} messages
            </Badge>
          </div>
        </motion.div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6 max-w-4xl mx-auto pb-4">
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: index === messages.length - 1 ? 0 : 0,
                    ease: "easeOut"
                  }}
                  className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="w-9 h-9 flex-shrink-0 ring-2 ring-offset-2 ring-offset-background shadow-md"
                      style={{ '--tw-ring-color': gpt.theme_color || '#3b82f6' } as any}
                    >
                      {gpt.logo_url ? (
                        <AvatarImage src={gpt.logo_url} alt={gpt.name} />
                      ) : (
                        <AvatarFallback 
                          className="text-white text-sm font-semibold"
                          style={{ backgroundColor: gpt.theme_color || '#3b82f6' }}
                        >
                          {gpt.name.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  )}
                  
                  <div className={`max-w-[75%] ${message.role === 'user' ? 'order-1' : ''}`}>
                    <div
                      className={`rounded-2xl shadow-sm ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground px-5 py-3'
                          : 'bg-card border px-5 py-4'
                      }`}
                    >
                      {message.loading ? (
                        <div className="flex items-center gap-3 py-1">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                          <span className="text-sm text-muted-foreground">Thinking...</span>
                        </div>
                      ) : (
                        <>
                          {message.role === 'assistant' ? (
                            <CleanMarkdownRenderer content={message.content} className="text-foreground" />
                          ) : (
                            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                              {message.content}
                            </p>
                          )}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                              {message.attachments.map((file) => {
                                const IconComponent = getFileIcon(file.type);
                                return (
                                  <div key={file.id} className="flex items-center gap-2 text-xs bg-background/50 rounded-lg p-2">
                                    <IconComponent className="w-4 h-4 text-primary" />
                                    <span className="truncate font-medium">{file.name}</span>
                                    <span className="text-muted-foreground">({formatFileSize(file.size)})</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className={`text-xs text-muted-foreground mt-2 px-1 ${
                      message.role === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <Avatar className="w-9 h-9 flex-shrink-0 ring-2 ring-primary/20 ring-offset-2 ring-offset-background shadow-md">
                      <AvatarFallback className="bg-secondary">
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="border-t p-4 bg-background/95 backdrop-blur-sm"
        >
          <div className="max-w-4xl mx-auto">
            {/* Show attached files */}
            {attachedFiles.length > 0 && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mb-3 flex flex-wrap gap-2"
              >
                {attachedFiles.map((file) => {
                  const IconComponent = getFileIcon(file.type);
                  return (
                    <div key={file.id} className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5 text-xs">
                      <IconComponent className="w-3.5 h-3.5 text-primary" />
                      <span className="truncate max-w-32 font-medium">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFileRemoved(file.id)}
                        className="h-5 w-5 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                      >
                        ×
                      </Button>
                    </div>
                  );
                })}
              </motion.div>
            )}
            
            <div className="flex gap-3 items-end">
              <ChatFileUploader
                sessionId={sessionId}
                gptId={gpt.id}
                onFileAttached={handleFileAttached}
                onFileRemoved={handleFileRemoved}
                attachedFiles={attachedFiles}
              />
              <div className="flex-1 relative">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={gpt.placeholder_prompt || `Describe your IT issue and I'll provide step-by-step troubleshooting...`}
                  disabled={isLoading}
                  className="pr-14 py-6 rounded-xl border-2 focus:border-primary/50 transition-all text-base"
                />
                <Button
                  onClick={sendMessage}
                  disabled={(!inputMessage.trim() && attachedFiles.length === 0) || isLoading}
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-lg shadow-md hover:shadow-lg transition-all"
                  style={{ backgroundColor: gpt.theme_color || undefined }}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Press Enter to send, Shift+Enter for new line • Attach files up to 10MB
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
