/**
 * Live Chat Widget - Customer Facing
 * AI-first chat with human escalation
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageCircle, X, Send, Bot, User, Sparkles, Phone, 
  Minimize2, Maximize2, AlertCircle, Clock, CheckCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'agent';
  content: string;
  timestamp: Date;
  agentName?: string;
}

interface LiveChatWidgetProps {
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
  companyName?: string;
  welcomeMessage?: string;
}

export function LiveChatWidget({
  position = 'bottom-right',
  primaryColor = '#06b6d4',
  companyName = 'Support',
  welcomeMessage = "Hi! I'm your AI assistant. How can I help you today?"
}: LiveChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);
  const [waitingForAgent, setWaitingForAgent] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, welcomeMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendToAI = async (userMessage: string) => {
    setIsTyping(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: userMessage,
          model: 'google/gemini-3-flash-preview',
          context: 'helpdesk',
          systemPrompt: `You are a helpful customer support AI assistant for ${companyName}. 
            Be friendly, concise, and helpful. If the user's issue is complex or they seem frustrated, 
            suggest escalating to a human agent. Keep responses under 150 words unless detail is needed.
            If you cannot help with something, be honest and offer to connect them with a human.`
        }
      });

      if (error) throw error;

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('AI chat error:', err);
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I'm having trouble connecting right now. Would you like to speak with a human agent?",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    if (isEscalated) {
      // In real implementation, this would send to the human agent
      toast.info('Message sent to support agent');
    } else {
      await sendToAI(inputValue);
    }
  };

  const handleEscalate = () => {
    setWaitingForAgent(true);
    setIsEscalated(true);

    setMessages(prev => [...prev, {
      id: `system-${Date.now()}`,
      role: 'assistant',
      content: "I'm connecting you with a human agent. Please wait a moment...",
      timestamp: new Date()
    }]);

    // Simulate agent connection after 2 seconds
    setTimeout(() => {
      setWaitingForAgent(false);
      setMessages(prev => [...prev, {
        id: `agent-${Date.now()}`,
        role: 'agent',
        content: "Hi! I'm Sarah from the support team. I've reviewed your conversation. How can I help you further?",
        timestamp: new Date(),
        agentName: 'Sarah'
      }]);
    }, 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const positionClasses = position === 'bottom-right' 
    ? 'bottom-4 right-4' 
    : 'bottom-4 left-4';

  return (
    <div className={`fixed ${positionClasses} z-50`}>
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4"
          >
            <Card className="w-[380px] h-[520px] flex flex-col shadow-2xl border-0 overflow-hidden">
              {/* Header */}
              <CardHeader 
                className="p-4 text-white flex-row items-center justify-between"
                style={{ backgroundColor: primaryColor }}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-white/30">
                    <AvatarFallback className="bg-white/20">
                      {isEscalated ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-sm">
                      {isEscalated ? 'Live Support' : `${companyName} AI`}
                    </h3>
                    <p className="text-xs opacity-80">
                      {waitingForAgent ? 'Connecting...' : isEscalated ? 'Agent connected' : 'Online'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
                    onClick={() => setIsMinimized(true)}
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4 bg-slate-50">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                        {msg.role === 'agent' && msg.agentName && (
                          <span className="text-xs text-slate-500 ml-1 mb-1 block">
                            {msg.agentName}
                          </span>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            msg.role === 'user'
                              ? 'bg-cyan-500 text-white rounded-br-sm'
                              : msg.role === 'agent'
                              ? 'bg-emerald-100 text-slate-800 rounded-bl-sm'
                              : 'bg-white text-slate-800 shadow-sm rounded-bl-sm'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <div className={`flex items-center gap-1 mt-1 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                          <span className="text-[10px] text-slate-400">{formatTime(msg.timestamp)}</span>
                          {msg.role === 'user' && <CheckCheck className="h-3 w-3 text-cyan-400" />}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Escalation Banner */}
              {!isEscalated && messages.length > 4 && (
                <div className="px-4 py-2 bg-amber-50 border-t border-amber-100">
                  <button
                    onClick={handleEscalate}
                    className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1"
                  >
                    <Phone className="h-3 w-3" />
                    Need more help? Talk to a human
                  </button>
                </div>
              )}

              {/* Input */}
              <CardContent className="p-3 border-t bg-white">
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type your message..."
                    className="flex-1 border-slate-200 focus:border-cyan-400"
                    disabled={waitingForAgent}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || waitingForAgent}
                    style={{ backgroundColor: primaryColor }}
                    className="text-white"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-[10px] text-slate-400 text-center mt-2">
                  {isEscalated ? 'Connected to live support' : 'Powered by Vanguard Cortex AI'}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized State */}
      <AnimatePresence>
        {isOpen && isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mb-4"
          >
            <Card 
              className="w-[300px] p-3 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setIsMinimized(false)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8" style={{ backgroundColor: primaryColor + '20' }}>
                    <AvatarFallback style={{ color: primaryColor }}>
                      {isEscalated ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {isEscalated ? 'Live Support' : companyName}
                    </p>
                    <p className="text-xs text-slate-500">{messages.length} messages</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white"
        style={{ backgroundColor: primaryColor }}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </motion.button>
    </div>
  );
}
