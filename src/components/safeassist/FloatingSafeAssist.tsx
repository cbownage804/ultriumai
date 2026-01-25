/**
 * Floating SafeAssist Chat Widget
 * Persistent chat assistant that stays available across all SafeSuite pages
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { useSafeAssist } from '@/hooks/useSafeAssist';
import { AIMessageContent } from '@/components/apps/safescan/AIMessageContent';
import { cn } from '@/lib/utils';
import safeassistLogo from '@/assets/safeassist-logo.png';
import safeassistHorizontal from '@/assets/safeassist-logo-horizontal.png';

export function FloatingSafeAssist() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isTyping,
    sendMessage,
  } = useSafeAssist();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && isOpen && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen, isMinimized]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 shadow-lg shadow-cyan-500/30 p-0"
            >
              <img src={safeassistLogo} alt="SafeAssist" className="h-9 w-9 object-contain" />
            </Button>
            {messages.length > 0 && (
              <div className="absolute -top-1 -right-1 h-5 w-5 bg-cyan-400 rounded-full flex items-center justify-center text-xs font-bold text-black">
                {messages.length}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 'auto' : 500
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-96 bg-[#0a0a0a] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-transparent">
              <div className="flex items-center gap-2">
                <img src={safeassistLogo} alt="SafeAssist" className="h-8 w-8 object-contain" />
                <span className="font-semibold text-cyan-400">SafeAssist</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content - Hidden when minimized */}
            {!isMinimized && (
              <>
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center py-8">
                        <img src={safeassistHorizontal} alt="SafeAssist" className="h-10 mx-auto mb-4 opacity-60" />
                        <p className="text-white/60 text-sm">
                          Ask me anything about security or how to use SafeSuite!
                        </p>
                      </div>
                    )}
                    
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3",
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center border border-cyan-500/30">
                              <img src={safeassistLogo} alt="SafeAssist" className="w-5 h-5 object-contain" />
                            </div>
                          </div>
                        )}
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                            message.role === 'user'
                              ? 'bg-cyan-500/20 text-white rounded-br-sm'
                              : 'bg-[#141414] border border-gray-800 rounded-bl-sm'
                          )}
                        >
                          {message.role === 'assistant' ? (
                            <AIMessageContent content={message.content} />
                          ) : (
                            <p>{message.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {isTyping && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center border border-cyan-500/30">
                          <img src={safeassistLogo} alt="SafeAssist" className="w-5 h-5 object-contain" />
                        </div>
                        <div className="bg-[#141414] border border-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
                          <div className="flex items-center gap-1">
                            <span className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-3 border-t border-cyan-500/20 bg-[#0a0a0a]">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask SafeAssist..."
                      className="bg-[#141414] border-gray-700 focus:border-cyan-500/50 text-sm"
                      disabled={isTyping}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || isTyping}
                      className="bg-cyan-500 hover:bg-cyan-400 text-black"
                      size="icon"
                    >
                      {isTyping ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
