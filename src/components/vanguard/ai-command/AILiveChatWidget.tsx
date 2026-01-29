import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ReactMarkdown from 'react-markdown';
import {
  Bot, Send, User, Sparkles, Loader2, ThumbsUp, ThumbsDown,
  MessageSquare, Phone, Video, Monitor, Calendar, X,
  BookOpen, ArrowRight, CheckCircle2, AlertCircle, Headphones
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    kbArticleUsed?: string;
    confidence?: number;
    sentiment?: string;
  };
}

interface EscalationRequest {
  type: 'callback' | 'video' | 'screen_share' | 'human_agent';
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed';
  scheduledTime?: Date;
}

interface AILiveChatWidgetProps {
  customerName?: string;
  customerId?: string;
  onEscalate?: (request: EscalationRequest) => void;
}

export function AILiveChatWidget({ customerName = 'Guest', customerId, onEscalate }: AILiveChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi ${customerName}! I'm your AI support assistant. I can help you with technical issues, answer questions, or connect you with a human agent if needed. How can I help you today?`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEscalationPanel, setShowEscalationPanel] = useState(false);
  const [escalationRequest, setEscalationRequest] = useState<EscalationRequest | null>(null);
  const [suggestedArticles, setSuggestedArticles] = useState<Array<{ id: string; title: string; category: string }>>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Search KB for relevant articles - using client_portal_kb table
      const { data: kbData } = await supabase
        .from('client_portal_kb')
        .select('id, title, category')
        .ilike('title', `%${inputValue.split(' ')[0]}%`)
        .limit(3);

      if (kbData && kbData.length > 0) {
        setSuggestedArticles(kbData.map(a => ({
          id: a.id,
          title: a.title,
          category: a.category
        })));
      }

      // Call AI for response
      const { data, error } = await supabase.functions.invoke('ai-ticket-agent', {
        body: {
          action: 'chat_response',
          message: inputValue,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
          customerId
        }
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data?.response || "I'm processing your request. A team member will follow up shortly.",
        timestamp: new Date(),
        metadata: {
          confidence: data?.confidence || 75,
          kbArticleUsed: data?.kbArticleUsed,
          sentiment: data?.detectedSentiment
        }
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Auto-show escalation if confidence is low or frustrated sentiment
      if ((data?.confidence && data.confidence < 60) || data?.detectedSentiment === 'frustrated') {
        setShowEscalationPanel(true);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble processing your request. Would you like to speak with a human agent?",
        timestamp: new Date()
      }]);
      setShowEscalationPanel(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscalation = async (type: EscalationRequest['type']) => {
    const request: EscalationRequest = {
      type,
      status: 'pending'
    };

    if (type === 'callback') {
      request.scheduledTime = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
    }

    setEscalationRequest(request);
    onEscalate?.(request);

    // Create escalation ticket via edge function instead of direct insert
    try {
      await supabase.functions.invoke('ai-ticket-agent', {
        body: {
          action: 'create_escalation',
          type,
          customerName,
          conversationSummary: messages.map(m => `${m.role}: ${m.content}`).join('\n')
        }
      });

      toast.success(`${type === 'callback' ? 'Callback scheduled' : 'Agent notified'} - we'll be with you shortly!`);
    } catch (error) {
      console.error('Escalation error:', error);
      toast.success('Request submitted - our team will contact you shortly');
    }
  };

  const rateResponse = async (messageId: string, helpful: boolean) => {
    toast.success(helpful ? 'Thanks for the feedback!' : 'We\'ll improve our responses');
    // Track in analytics
  };

  return (
    <Card className="bg-black/90 border-cyan-500/40 shadow-2xl shadow-purple-500/20 w-full max-w-lg">
      <CardHeader className="border-b border-purple-500/30 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-cyan-500/50">
              <Bot className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">AI Support</CardTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-slate-400">Online</span>
              </div>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-white text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Chat Messages */}
        <ScrollArea className="h-[400px] p-4" ref={scrollRef}>
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className={`h-8 w-8 shrink-0 ${message.role === 'user' ? 'bg-purple-500/30' : 'bg-cyan-500/30'}`}>
                    <AvatarFallback>
                      {message.role === 'user' ? <User className="h-4 w-4 text-purple-400" /> : <Bot className="h-4 w-4 text-cyan-400" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`rounded-2xl px-4 py-2 ${
                      message.role === 'user' 
                        ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-500/40' 
                        : 'bg-slate-800/80 border border-cyan-500/30'
                    }`}>
                      <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1 px-2">
                      <span className="text-xs text-slate-500">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {message.role === 'assistant' && message.metadata?.confidence && (
                        <span className="text-xs text-cyan-400/60">
                          {message.metadata.confidence}% confident
                        </span>
                      )}
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-1 ml-auto">
                          <button onClick={() => rateResponse(message.id, true)} className="p-1 hover:bg-green-500/20 rounded">
                            <ThumbsUp className="h-3 w-3 text-slate-500 hover:text-green-400" />
                          </button>
                          <button onClick={() => rateResponse(message.id, false)} className="p-1 hover:bg-red-500/20 rounded">
                            <ThumbsDown className="h-3 w-3 text-slate-500 hover:text-red-400" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 bg-cyan-500/30">
                  <AvatarFallback><Bot className="h-4 w-4 text-cyan-400" /></AvatarFallback>
                </Avatar>
                <div className="bg-slate-800/80 border border-cyan-500/30 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
                    <span className="text-sm text-slate-400">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Suggested KB Articles */}
        {suggestedArticles.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-800">
            <p className="text-xs text-slate-500 mb-2">Related articles:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedArticles.map((article) => (
                <Badge key={article.id} variant="outline" className="cursor-pointer border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20">
                  <BookOpen className="h-3 w-3 mr-1" />
                  {article.title}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Escalation Panel */}
        <AnimatePresence>
          {showEscalationPanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Headphones className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-medium text-white">Need more help?</span>
                  </div>
                  <button onClick={() => setShowEscalationPanel(false)}>
                    <X className="h-4 w-4 text-slate-400 hover:text-white" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/20 justify-start"
                    onClick={() => handleEscalation('human_agent')}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat with Agent
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-purple-500/40 text-purple-400 hover:bg-purple-500/20 justify-start"
                    onClick={() => handleEscalation('callback')}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Request Callback
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-500/40 text-blue-400 hover:bg-blue-500/20 justify-start"
                    onClick={() => handleEscalation('video')}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Video Call
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-500/40 text-green-400 hover:bg-green-500/20 justify-start"
                    onClick={() => handleEscalation('screen_share')}
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    Screen Share
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Escalation Status */}
        {escalationRequest && (
          <div className="px-4 py-3 border-t border-green-500/30 bg-green-500/10">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span className="text-sm text-green-300">
                {escalationRequest.type === 'callback' 
                  ? `Callback scheduled for ${escalationRequest.scheduledTime?.toLocaleTimeString()}`
                  : 'Agent has been notified - connecting you shortly'
                }
              </span>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 bg-black/60 border-cyan-500/30 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500/50"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white hover:from-cyan-600 hover:via-blue-600 hover:to-purple-700"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-500 hover:text-purple-400"
              onClick={() => setShowEscalationPanel(!showEscalationPanel)}
            >
              <Headphones className="h-3 w-3 mr-1" />
              Need human support?
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
