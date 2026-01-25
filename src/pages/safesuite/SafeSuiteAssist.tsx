/**
 * SafeAssist - AI Security Assistant within SafeSuite
 */

import { useState, useRef, useEffect } from 'react';
import { FeatureGate, UsageLimitBanner } from '@/components/safesuite/SafeSuitePaywall';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedHeader } from '@/components/safesuite/SafeSuiteEffects';
import safeassistLogo from '@/assets/safeassist-logo.png';
import heroSafeassistBg from '@/assets/hero-safeassist-bg.jpg';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Bot, Send, Loader2, RefreshCw, User, Sparkles,
  Shield, Lock, Eye, AlertTriangle, HelpCircle,
  Key, Globe, FileSearch, Zap, MessageSquare,
  ShieldCheck, Coins, Plus, History, Trash2
} from "lucide-react";
import { useSafeAssist, SafeAssistMessage } from "@/hooks/useSafeAssist";
import { AIMessageContent } from "@/components/apps/safescan/AIMessageContent";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS = [
  { 
    icon: HelpCircle, 
    label: 'What is SafeAssist?', 
    prompt: 'Explain what SafeAssist can do for me in simple terms.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20'
  },
  { 
    icon: ShieldCheck, 
    label: 'Security Check-up', 
    prompt: 'Give me a quick security checkup - what should I be doing to stay safe online?',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20'
  },
  { 
    icon: Key, 
    label: 'Password Help', 
    prompt: 'Help me create a strong, memorable password and explain what makes passwords secure.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20'
  },
  { 
    icon: Eye, 
    label: 'Privacy Tips', 
    prompt: 'What are the top 5 things I can do right now to protect my privacy online?',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20'
  },
  { 
    icon: AlertTriangle, 
    label: 'Analyze a Threat', 
    prompt: 'I received a suspicious message or email. How do I know if it\'s a scam?',
    color: 'text-red-400',
    bg: 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20'
  },
  { 
    icon: Globe, 
    label: 'Safe Browsing', 
    prompt: 'How can I browse the internet more safely? What settings should I change?',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20'
  },
];

const CAPABILITY_CARDS = [
  {
    icon: MessageSquare,
    title: 'Security Q&A',
    description: 'Ask any security question in plain English',
    color: 'text-cyan-400',
    bg: 'from-cyan-500/20 to-cyan-500/5'
  },
  {
    icon: FileSearch,
    title: 'Threat Analysis',
    description: 'Paste suspicious emails or links for instant analysis',
    color: 'text-red-400',
    bg: 'from-red-500/20 to-red-500/5'
  },
  {
    icon: Key,
    title: 'Password Coach',
    description: 'Generate strong passwords and check for breaches',
    color: 'text-amber-400',
    bg: 'from-amber-500/20 to-amber-500/5'
  },
  {
    icon: Eye,
    title: 'Privacy Advisor',
    description: 'Guidance on settings and data protection',
    color: 'text-purple-400',
    bg: 'from-purple-500/20 to-purple-500/5'
  },
];

export default function SafeSuiteAssist() {
  const { 
    messages, 
    isConnected, 
    isTyping, 
    credits,
    sendMessage,
    clearMessages,
    loadCredits
  } = useSafeAssist();
  
  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'capabilities'>('chat');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim() || !isConnected || credits.remaining <= 0) return;
    sendMessage(inputValue);
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
    if (credits.remaining > 0) {
      sendMessage(prompt);
    }
  };

  return (
    <FeatureGate feature="safepass">
      <div 
        className="min-h-screen bg-[#0a0a0a] -m-6"
        style={{
          backgroundImage: `url(${heroSafeassistBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="min-h-screen bg-black/80 backdrop-blur-sm p-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <AnimatedHeader
              logo={safeassistLogo}
              logoAlt="SafeAssist"
              tagline="Your AI-powered security assistant - ask anything about staying safe online"
              theme="safedesk"
              badge="AI Assistant"
            />
          </motion.div>
          
          {/* Credits Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <Card className="bg-[#141414]/90 backdrop-blur-sm border-cyan-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30">
                      <Coins className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Monthly Credits</p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-white">{credits.remaining}</span>
                        <span className="text-gray-500">/ {credits.total}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all",
                          credits.remaining > credits.total * 0.5 
                            ? "bg-gradient-to-r from-cyan-500 to-teal-500" 
                            : credits.remaining > credits.total * 0.2
                            ? "bg-gradient-to-r from-amber-500 to-orange-500"
                            : "bg-gradient-to-r from-red-500 to-pink-500"
                        )}
                        style={{ width: `${(credits.remaining / credits.total) * 100}%` }}
                      />
                    </div>
                    <Button 
                      size="sm"
                      className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Buy More
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
              <TabsList className="bg-[#141414]/90 backdrop-blur-sm border border-cyan-500/20">
                <TabsTrigger value="chat" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="capabilities" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Capabilities
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Chat Area */}
                  <div className="lg:col-span-3">
                    <Card className="bg-[#141414]/90 backdrop-blur-sm border-cyan-500/20 h-[600px] flex flex-col">
                      {/* Chat Header */}
                      <CardHeader className="py-4 px-5 border-b border-cyan-500/10 shrink-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 shadow-lg shadow-cyan-500/30">
                                <Bot className="h-5 w-5 text-white" />
                              </div>
                              <span className={cn(
                                "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#141414]",
                                isConnected ? 'bg-emerald-500' : 'bg-gray-500'
                              )} />
                            </div>
                            <div>
                              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                                SafeAssist AI
                                <Badge className={cn(
                                  "text-xs font-medium",
                                  isConnected 
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                                    : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                )}>
                                  {isConnected ? '● Online' : '○ Offline'}
                                </Badge>
                              </CardTitle>
                              <p className="text-xs text-gray-500">Your personal security expert</p>
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
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-md">
                                      <ShieldCheck className="h-4 w-4 text-white" />
                                    </div>
                                  </div>
                                )}
                                
                                <div className={cn(
                                  "max-w-[85%] rounded-2xl",
                                  message.role === 'user' 
                                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-4 py-3 rounded-br-md'
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
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-md">
                                <ShieldCheck className="h-4 w-4 text-white" />
                              </div>
                              <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                  <span className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                  <span className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {/* Quick actions when chat is empty */}
                          {messages.length <= 1 && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                              className="pt-4"
                            >
                              <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="h-4 w-4 text-cyan-400" />
                                <p className="text-sm text-gray-400 font-medium">Quick Questions</p>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {QUICK_ACTIONS.map((action, index) => (
                                  <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + index * 0.05 }}
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleQuickAction(action.prompt)}
                                      disabled={credits.remaining <= 0}
                                      className={cn(
                                        "w-full justify-start h-auto py-2.5 px-3 text-left border transition-all",
                                        action.bg
                                      )}
                                    >
                                      <action.icon className={cn("h-4 w-4 mr-2 flex-shrink-0", action.color)} />
                                      <span className="text-gray-200 text-sm">{action.label}</span>
                                    </Button>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </ScrollArea>

                      {/* Input */}
                      <div className="p-4 border-t border-cyan-500/10 shrink-0 bg-[#0a0a0a]/50">
                        <div className="flex gap-2">
                          <Input
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={credits.remaining > 0 ? "Ask me anything about security..." : "No credits remaining"}
                            disabled={!isConnected || credits.remaining <= 0}
                            className="flex-1 bg-[#1a1a1a] border-gray-800 text-white placeholder:text-gray-600 focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-xl h-11"
                          />
                          <Button
                            onClick={handleSend}
                            disabled={!isConnected || !inputValue.trim() || isTyping || credits.remaining <= 0}
                            className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white shrink-0 rounded-xl h-11 w-11 p-0"
                          >
                            {isTyping ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                          </Button>
                        </div>
                        {credits.remaining <= 0 && (
                          <p className="text-xs text-red-400 mt-2 text-center">
                            You've used all your credits this month. Purchase more to continue chatting.
                          </p>
                        )}
                      </div>
                    </Card>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-4">
                    {/* Recent Topics */}
                    <Card className="bg-[#141414]/90 backdrop-blur-sm border-cyan-500/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                          <History className="h-4 w-4 text-cyan-400" />
                          Popular Topics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {['Password Security', 'Phishing Scams', 'Privacy Settings', '2FA Setup', 'VPN Explained'].map((topic, i) => (
                          <Button 
                            key={i}
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleQuickAction(`Tell me about ${topic}`)}
                            disabled={credits.remaining <= 0}
                            className="w-full justify-start text-gray-400 hover:text-white hover:bg-cyan-500/10 text-xs"
                          >
                            {topic}
                          </Button>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="capabilities" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {CAPABILITY_CARDS.map((cap, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className={cn(
                        "bg-gradient-to-br border-0 h-full",
                        cap.bg
                      )}>
                        <CardContent className="p-6">
                          <cap.icon className={cn("h-8 w-8 mb-4", cap.color)} />
                          <h3 className="text-lg font-semibold text-white mb-2">{cap.title}</h3>
                          <p className="text-sm text-gray-400">{cap.description}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </FeatureGate>
  );
}
