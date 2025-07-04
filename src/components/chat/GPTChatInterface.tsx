import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send, Loader2, ArrowLeft, Bot, User, Brain, FileText, Image, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCustomGPTs } from "@/hooks/useCustomGPTs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAnalyticsTracking } from "@/hooks/useAnalyticsTracking";
import { KnowledgeSearchService } from "@/services/KnowledgeSearchService";
import ChatFileUploader from "./ChatFileUploader";

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
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const gpt = gpts.find(g => g.id === gptId);

  useEffect(() => {
    if (!gpt || !user) return;

    // Initialize session and welcome message
    const initializeChat = async () => {
      const session = await startSession(gpt.id);
      setSessionId(session);

      // Add welcome message
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Hello! I'm ${gpt.name}. ${gpt.description ? gpt.description + ' ' : ''}How can I help you today?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    };

    initializeChat();
  }, [gpt, user, startSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if ((!inputMessage.trim() && attachedFiles.length === 0) || !gpt || !user || isLoading) return;

    // Build message content with file context
    let messageContent = inputMessage.trim();
    const messageAttachments = [...attachedFiles];
    
    // Add file context to message if files are attached
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
      // Search knowledge base if the query suggests it would be helpful
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
          messages: [...messages, { 
            role: userMessage.role, 
            content: enhancedContent  // Use enhanced content with file context and knowledge
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

      // Track analytics
      if (sessionId) {
        await trackMessageExchange(gpt.id, responseTime, data.tokensUsed, sessionId);
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
        // Update existing file
        const updated = [...prev];
        updated[existingIndex] = file;
        return updated;
      } else {
        // Add new file
        return [...prev, file];
      }
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
    <div className="flex h-screen max-h-screen overflow-hidden">
      {/* Sidebar with GPT Info */}
      <div className="w-80 border-r bg-muted/30 flex flex-col">
        <div className="p-4 border-b">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to GPTs
          </Button>
          
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              {gpt.logo_url ? (
                <AvatarImage src={gpt.logo_url} alt={gpt.name} />
              ) : (
                <AvatarFallback 
                  className="text-white text-lg font-medium"
                  style={{ backgroundColor: gpt.theme_color || '#3b82f6' }}
                >
                  {gpt.name.charAt(0)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold truncate">{gpt.name}</h2>
              {gpt.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {gpt.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-4">
          <div>
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Instructions
            </h3>
            <div className="text-sm text-muted-foreground bg-background/50 p-3 rounded-lg">
              <p className="line-clamp-6">{gpt.system_prompt}</p>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Features</h3>
            <div className="flex flex-wrap gap-1">
              {gpt.enable_web_search && (
                <Badge variant="outline" className="text-xs">Web Search</Badge>
              )}
              {gpt.api_enabled && (
                <Badge variant="outline" className="text-xs">API Access</Badge>
              )}
              {gpt.embed_enabled && (
                <Badge variant="outline" className="text-xs">Embeddable</Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {gpt.preferred_model || 'GPT-4o-mini'}
              </Badge>
            </div>
          </div>

          {gpt.starter_questions && Array.isArray(gpt.starter_questions) && gpt.starter_questions.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Starter Questions</h3>
              <div className="space-y-2">
                {gpt.starter_questions.slice(0, 3).map((question: string, index: number) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto p-2 text-xs"
                    onClick={() => setInputMessage(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="border-b p-4 bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <h1 className="text-lg font-semibold">Chat with {gpt.name}</h1>
            </div>
            <Badge variant="outline" className="text-xs">
              {messages.filter(m => m.role === 'user').length} messages
            </Badge>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    {gpt.logo_url ? (
                      <AvatarImage src={gpt.logo_url} alt={gpt.name} />
                    ) : (
                      <AvatarFallback 
                        className="text-white text-sm"
                        style={{ backgroundColor: gpt.theme_color || '#3b82f6' }}
                      >
                        {gpt.name.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                )}
                
                <div className={`max-w-[80%] ${message.role === 'user' ? 'order-1' : ''}`}>
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted'
                    }`}
                  >
                    {message.loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map((file) => {
                              const IconComponent = getFileIcon(file.type);
                              return (
                                <div key={file.id} className="flex items-center gap-2 text-xs bg-background/50 rounded p-2">
                                  <IconComponent className="w-3 h-3" />
                                  <span className="truncate">{file.name}</span>
                                  <span className="text-muted-foreground">({formatFileSize(file.size)})</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className={`text-xs text-muted-foreground mt-1 ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>

                {message.role === 'user' && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-secondary">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4 bg-background/95 backdrop-blur">
          <div className="max-w-4xl mx-auto">
            {/* Show attached files */}
            {attachedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachedFiles.map((file) => {
                  const IconComponent = getFileIcon(file.type);
                  return (
                    <div key={file.id} className="flex items-center gap-2 bg-muted rounded-lg px-2 py-1 text-xs">
                      <IconComponent className="w-3 h-3" />
                      <span className="truncate max-w-24">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFileRemoved(file.id)}
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        ×
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="flex gap-2 items-end">
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
                  placeholder={gpt.placeholder_prompt || `Message ${gpt.name}...`}
                  disabled={isLoading}
                  className="pr-12"
                />
                <Button
                  onClick={sendMessage}
                  disabled={(!inputMessage.trim() && attachedFiles.length === 0) || isLoading}
                  size="icon"
                  className="absolute right-1 top-1 h-8 w-8"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Press Enter to send, Shift+Enter for new line • Attach files up to 10MB
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};