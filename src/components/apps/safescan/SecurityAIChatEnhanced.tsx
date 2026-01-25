import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, Send, Loader2, X, Maximize2, Minimize2,
  ShieldCheck, Sparkles, HelpCircle, FileSearch,
  Lock, Globe, AlertTriangle, Zap, RefreshCw, User
} from "lucide-react";
import { useSecurityAIChat } from "@/hooks/useSecurityAIChat";
import { motion, AnimatePresence } from "framer-motion";
import { AIMessageContent } from "./AIMessageContent";
import { cn } from "@/lib/utils";

interface SecurityAIChatEnhancedProps {
  scanContext?: any;
  onClose?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const QUICK_ACTIONS = [
  { 
    icon: HelpCircle, 
    label: 'What is this?', 
    prompt: 'Explain what this security scanner does in simple terms that anyone can understand.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20'
  },
  { 
    icon: ShieldCheck, 
    label: 'Am I safe?', 
    prompt: 'Based on my recent scan results, give me a simple yes or no answer about whether I am safe, and explain why in plain language.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20'
  },
  { 
    icon: AlertTriangle, 
    label: 'What are the risks?', 
    prompt: 'Explain the main online security risks I should know about in simple, everyday language.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20'
  },
  { 
    icon: Lock, 
    label: 'How to stay safe', 
    prompt: 'Give me 5 easy tips to protect myself online that anyone can follow, no technical knowledge required.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20'
  },
];

export function SecurityAIChatEnhanced({ 
  scanContext, 
  onClose, 
  isExpanded = false,
  onToggleExpand 
}: SecurityAIChatEnhancedProps) {
  const { 
    messages, 
    isConnected, 
    isConnecting, 
    isTyping, 
    connect, 
    sendMessage,
    clearMessages 
  } = useSecurityAIChat();
  
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-connect when component mounts
  useEffect(() => {
    if (!isConnected && !isConnecting) {
      connect();
    }
  }, []);

  const handleSend = () => {
    if (!inputValue.trim() || !isConnected) return;
    
    let message = inputValue;
    
    // Include scan context if available (but don't show raw JSON to user)
    if (scanContext && messages.length <= 1) {
      const contextSummary = scanContext.risk_level 
        ? `I just scanned something with a "${scanContext.risk_level}" risk level. ` 
        : '';
      message = `${contextSummary}${inputValue}`;
    }
    
    sendMessage(message);
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (prompt: string) => {
    if (scanContext) {
      const contextSummary = scanContext.risk_level 
        ? `Based on my recent scan with a "${scanContext.risk_level}" risk level: ` 
        : '';
      sendMessage(`${contextSummary}${prompt}`);
    } else {
      sendMessage(prompt);
    }
  };

  return (
    <Card className={cn(
      "bg-gradient-to-b from-[#0f0f0f] to-[#141414] border-red-500/20 flex flex-col shadow-2xl shadow-red-500/5",
      isExpanded ? 'fixed inset-4 z-50' : 'h-[600px]'
    )}>
      {/* Header */}
      <CardHeader className="py-4 px-5 border-b border-red-500/10 shrink-0 bg-gradient-to-r from-red-500/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className={cn(
                "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0f0f0f]",
                isConnected ? 'bg-emerald-500' : 'bg-gray-500'
              )} />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                Security Assistant
                <Badge className={cn(
                  "text-xs font-medium",
                  isConnected 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                    : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                )}>
                  {isConnected ? '● Online' : '○ Offline'}
                </Badge>
              </CardTitle>
              <p className="text-xs text-gray-500">Your personal security guide</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={clearMessages}
              className="h-8 w-8 text-gray-500 hover:text-white hover:bg-gray-800"
              title="Clear chat"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {onToggleExpand && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onToggleExpand}
                className="h-8 w-8 text-gray-500 hover:text-white hover:bg-gray-800"
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            )}
            {onClose && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-gray-500 hover:text-white hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md">
                      <ShieldCheck className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
                
                <div className={cn(
                  "max-w-[85%] rounded-2xl",
                  message.role === 'user' 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-br-md'
                    : 'bg-[#1a1a1a] border border-gray-800 px-4 py-3 rounded-bl-md'
                )}>
                  {message.role === 'user' ? (
                    <p className="text-sm">{message.content}</p>
                  ) : (
                    <AIMessageContent 
                      content={message.content} 
                      isStreaming={message.isStreaming}
                    />
                  )}
                  <p className={cn(
                    "text-xs mt-2",
                    message.role === 'user' ? 'text-white/60' : 'text-gray-600'
                  )}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                
                {message.role === 'user' && (
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}

          {/* Quick actions - shown when chat is mostly empty */}
          {messages.length <= 1 && isConnected && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="pt-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-red-400" />
                <p className="text-sm text-gray-400 font-medium">Quick Questions</p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {QUICK_ACTIONS.map((action, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction(action.prompt)}
                      className={cn(
                        "w-full justify-start h-auto py-3 px-4 text-left border transition-all",
                        action.bg
                      )}
                    >
                      <action.icon className={cn("h-4 w-4 mr-3 flex-shrink-0", action.color)} />
                      <span className="text-gray-200 text-sm font-medium">{action.label}</span>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-red-500/10 shrink-0 bg-[#0a0a0a]">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? "Ask me anything about security..." : "Connecting..."}
            disabled={!isConnected}
            className="flex-1 bg-[#141414] border-gray-800 text-white placeholder:text-gray-600 focus:border-red-500/50 focus:ring-red-500/20 rounded-xl h-11"
          />
          <Button
            onClick={handleSend}
            disabled={!isConnected || !inputValue.trim() || isTyping}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shrink-0 rounded-xl h-11 w-11 p-0"
          >
            {isTyping ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
        <p className="text-xs text-gray-600 mt-2 text-center">
          Your security questions are answered in plain, easy-to-understand language
        </p>
      </div>
    </Card>
  );
}
