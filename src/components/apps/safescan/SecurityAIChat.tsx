import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, Send, Loader2, Wifi, WifiOff, X, Maximize2, Minimize2,
  ShieldCheck, Sparkles, MessageSquare, Zap
} from "lucide-react";
import { useSecurityAIRealtime } from "@/hooks/useSecurityAIRealtime";
import { motion, AnimatePresence } from "framer-motion";

interface SecurityAIChatProps {
  scanContext?: any;
  onClose?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function SecurityAIChat({ 
  scanContext, 
  onClose, 
  isExpanded = false,
  onToggleExpand 
}: SecurityAIChatProps) {
  const { 
    messages, 
    isConnected, 
    isConnecting, 
    isTyping, 
    connect, 
    disconnect, 
    sendMessage,
    clearMessages 
  } = useSecurityAIRealtime();
  
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
    
    // Include scan context if available
    if (scanContext && messages.length <= 1) {
      message = `I just scanned something and got these results:\n\n${JSON.stringify(scanContext, null, 2)}\n\nMy question: ${inputValue}`;
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

  const quickPrompts = [
    { label: 'Analyze Threats', prompt: 'What are the main threats I should be aware of?' },
    { label: 'Security Tips', prompt: 'Give me top 5 security recommendations for today' },
    { label: 'Check Compliance', prompt: 'How can I improve my security compliance?' },
    { label: 'Incident Help', prompt: 'Help me respond to a potential security incident' },
  ];

  return (
    <Card className={`bg-[#0f0f0f] border-red-500/20 flex flex-col ${isExpanded ? 'fixed inset-4 z-50' : 'h-[500px]'}`}>
      {/* Header */}
      <CardHeader className="py-3 px-4 border-b border-red-500/10 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/20">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0f0f0f] ${isConnected ? 'bg-emerald-500' : 'bg-gray-500'}`} />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                UltriumDefender AI
                <Badge className={`text-xs ${isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {isConnected ? 'Live' : 'Offline'}
                </Badge>
              </CardTitle>
              <p className="text-xs text-gray-500">Real-time Security Assistant</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {isConnected ? (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={disconnect}
                className="h-7 w-7 text-gray-500 hover:text-red-400"
              >
                <WifiOff className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={connect}
                disabled={isConnecting}
                className="h-7 w-7 text-gray-500 hover:text-emerald-400"
              >
                {isConnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wifi className="h-3.5 w-3.5" />}
              </Button>
            )}
            {onToggleExpand && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onToggleExpand}
                className="h-7 w-7 text-gray-500 hover:text-white"
              >
                {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </Button>
            )}
            {onClose && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onClose}
                className="h-7 w-7 text-gray-500 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${message.role === 'user' ? 'order-1' : ''}`}>
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="h-3 w-3 text-red-400" />
                      <span className="text-xs text-gray-500">UltriumDefender</span>
                    </div>
                  )}
                  <div className={`p-3 rounded-xl ${
                    message.role === 'user' 
                      ? 'bg-red-500 text-white rounded-br-sm'
                      : 'bg-[#1a1a1a] border border-red-500/10 text-gray-300 rounded-bl-sm'
                  }`}>
                    <div className="text-sm whitespace-pre-wrap prose prose-invert prose-sm max-w-none">
                      {message.content}
                      {message.isStreaming && (
                        <span className="inline-block w-1.5 h-4 bg-red-400 animate-pulse ml-0.5" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 px-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isTyping && messages[messages.length - 1]?.role === 'user' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-gray-500"
            >
              <div className="flex items-center gap-1 p-3 rounded-xl bg-[#1a1a1a] border border-red-500/10">
                <span className="h-2 w-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}

          {/* Quick prompts when empty or just welcome message */}
          {messages.length <= 1 && isConnected && (
            <div className="pt-4">
              <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Quick Actions
              </p>
              <div className="grid grid-cols-2 gap-2">
                {quickPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage(prompt.prompt)}
                    className="h-auto py-2 px-3 text-xs text-gray-400 border-gray-800 hover:border-red-500/50 hover:bg-red-500/10 hover:text-white justify-start"
                  >
                    <Zap className="h-3 w-3 mr-2 text-red-400" />
                    {prompt.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-red-500/10 shrink-0">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? "Ask about security..." : "Connect to start chatting..."}
            disabled={!isConnected}
            className="flex-1 bg-[#141414] border-red-500/20 text-white placeholder:text-gray-600 focus:border-red-500/50"
          />
          <Button
            onClick={handleSend}
            disabled={!isConnected || !inputValue.trim() || isTyping}
            className="bg-red-500 hover:bg-red-600 text-white shrink-0"
          >
            {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </Card>
  );
}
