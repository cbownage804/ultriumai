/**
 * SafeAssist - AI Security Assistant within SafeSuite
 * ChatGPT-style interface with conversation history
 * Features animated VoiceOrb for voice interactions
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { 
  Bot, Send, Loader2, User, Sparkles, Plus, Trash2,
  Shield, Lock, Eye, AlertTriangle, HelpCircle, Menu,
  Key, Globe, FileSearch, MessageSquare, Coins,
  ShieldCheck, History, Upload, Paperclip, X, Edit2,
  ChevronLeft, ChevronRight, Crown, Zap, Mic, PhoneOff
} from "lucide-react";
import { useSafeAssist, SafeAssistMessage, SafeAssistConversation } from "@/hooks/useSafeAssist";
import { AIMessageContent } from "@/components/apps/safescan/AIMessageContent";
import { VoiceOrb } from "@/components/safeassist/VoiceOrb";
import { useFloatingSafeAssist } from "@/contexts/FloatingSafeAssistContext";
import { cn } from "@/lib/utils";
import safeassistLogo from '@/assets/safeassist-logo-horizontal.png';
import safeassistIcon from '@/assets/safeassist-logo.png';
import heroSafeassistBg from '@/assets/hero-safeassist-bg.jpg';

const QUICK_ACTIONS = [
  { icon: HelpCircle, label: 'What can you help with?', prompt: 'Explain what SafeAssist can do for me in simple terms.', color: 'text-cyan-400' },
  { icon: ShieldCheck, label: 'Security Check-up', prompt: 'Give me a quick security checkup - what should I be doing to stay safe online?', color: 'text-emerald-400' },
  { icon: Key, label: 'Password Help', prompt: 'Help me create a strong, memorable password and explain what makes passwords secure.', color: 'text-amber-400' },
  { icon: Eye, label: 'Privacy Tips', prompt: 'What are the top 5 things I can do right now to protect my privacy online?', color: 'text-purple-400' },
  { icon: AlertTriangle, label: 'Analyze a Threat', prompt: 'I received a suspicious message. How do I know if it\'s a scam?', color: 'text-red-400' },
  { icon: Globe, label: 'Safe Browsing', prompt: 'How can I browse the internet more safely?', color: 'text-blue-400' },
];

export default function SafeSuiteAssist() {
  const { 
    messages, 
    conversations,
    currentConversationId,
    isConnected, 
    isTyping, 
    isLoadingConversations,
    credits,
    limits,
    sendMessage,
    clearMessages,
    selectConversation,
    createNewConversation,
    deleteConversation,
    renameConversation
  } = useSafeAssist();
  
  // Shared voice state from context
  const {
    isVoiceActive,
    isSpeaking,
    isListening,
    isConnecting,
    voiceCredits,
    startVoice,
    stopVoice,
    setOnVoiceTranscript
  } = useFloatingSafeAssist();
  
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingConvoId, setEditingConvoId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Register transcript handler for voice
  useEffect(() => {
    setOnVoiceTranscript((text: string) => {
      sendMessage(text);
    });
    return () => setOnVoiceTranscript(undefined);
  }, [sendMessage, setOnVoiceTranscript]);
  
  // Sync voice mode with voice active state
  useEffect(() => {
    if (isVoiceActive) {
      setIsVoiceMode(true);
    }
  }, [isVoiceActive]);
  
  const handleStartVoice = useCallback(async () => {
    await startVoice();
  }, [startVoice]);
  
  const handleStopVoice = useCallback(async () => {
    await stopVoice();
    setIsVoiceMode(false);
  }, [stopVoice]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = () => {
    if ((!inputValue.trim() && attachedFiles.length === 0) || !isConnected || credits.remaining <= 0) return;
    sendMessage(inputValue, attachedFiles);
    setInputValue('');
    setAttachedFiles([]);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles(prev => [...prev, ...files].slice(0, 5)); // Max 5 files
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuickAction = (prompt: string) => {
    if (credits.remaining > 0) {
      sendMessage(prompt);
    }
  };

  const handleRenameSubmit = (convoId: string) => {
    if (editTitle.trim()) {
      renameConversation(convoId, editTitle.trim());
    }
    setEditingConvoId(null);
    setEditTitle('');
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div 
      className="min-h-screen bg-[#0a0a0a] -m-6 flex"
      style={{
        backgroundImage: `url(${heroSafeassistBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="min-h-screen bg-black/85 backdrop-blur-sm flex w-full">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-r border-cyan-500/20 bg-[#0a0a0a]/90 backdrop-blur-md flex flex-col overflow-hidden"
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b border-cyan-500/10">
                <Button 
                  onClick={createNewConversation}
                  className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
              </div>

              {/* Conversation History */}
              <ScrollArea className="flex-1">
                <div className="p-2">
                  {!limits.canSaveHistory ? (
                    <div className="p-4 text-center">
                      <Crown className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-400 mb-2">
                        Chat history is a Pro feature
                      </p>
                      <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                        <Zap className="h-3 w-3 mr-1" />
                        Upgrade
                      </Button>
                    </div>
                  ) : isLoadingConversations ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                    </div>
                  ) : conversations.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm py-8">
                      No conversations yet
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {conversations.map((convo) => (
                        <div
                          key={convo.id}
                          className={cn(
                            "group relative rounded-lg transition-all",
                            currentConversationId === convo.id 
                              ? "bg-cyan-500/20" 
                              : "hover:bg-gray-800/50"
                          )}
                        >
                          {editingConvoId === convo.id ? (
                            <div className="p-2">
                              <Input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onBlur={() => handleRenameSubmit(convo.id)}
                                onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(convo.id)}
                                className="h-8 text-sm bg-gray-900 border-cyan-500/30"
                                autoFocus
                              />
                            </div>
                          ) : (
                            <button
                              onClick={() => selectConversation(convo.id)}
                              className="w-full p-3 text-left"
                            >
                              <p className="text-sm text-gray-200 truncate pr-16">
                                {convo.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {formatDate(convo.updated_at)}
                              </p>
                            </button>
                          )}
                          
                          {/* Actions */}
                          {editingConvoId !== convo.id && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-400 hover:text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingConvoId(convo.id);
                                  setEditTitle(convo.title);
                                }}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-400 hover:text-red-400"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteConversation(convo.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Sidebar Footer - Limits */}
              {limits.canSaveHistory && (
                <div className="p-4 border-t border-cyan-500/10">
                  <p className="text-xs text-gray-500 text-center">
                    {conversations.length} / {limits.maxConversations} conversations
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="h-16 border-b border-cyan-500/20 bg-[#0a0a0a]/90 backdrop-blur-md px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-400 hover:text-white"
              >
                {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <div className="h-12 bg-black rounded-lg px-4 flex items-center justify-center border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
                <img src={safeassistLogo} alt="SafeAssist" className="h-8 w-auto object-contain" />
              </div>
            </div>
            
            {/* Credits */}
            <div className="flex items-center gap-3">
              {/* Text Credits */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141414] border border-cyan-500/20">
                <Coins className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-medium text-white">{credits.remaining}</span>
                <span className="text-xs text-gray-500">msgs</span>
              </div>
              
              {/* Voice Credits */}
              {(voiceCredits.enabled || voiceCredits.purchasedMinutes > 0) && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141414] border border-cyan-500/20">
                  <Mic className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-medium text-white">{voiceCredits.total}</span>
                  <span className="text-xs text-gray-500">min</span>
                </div>
              )}
              
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
                onClick={() => navigate('/credits')}
              >
                <Plus className="h-4 w-4 mr-1" />
                Buy Credits
              </Button>
            </div>
          </div>

          {/* Voice Mode Overlay */}
          {isVoiceMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-b from-[#0a0a0a]/95 to-[#050510]/95 backdrop-blur-sm"
            >
              <VoiceOrb 
                isActive={isVoiceActive}
                isSpeaking={isSpeaking}
                isListening={isListening}
                size="lg"
              />
              
              <p className="mt-8 text-white/80 text-lg font-medium">
                {isSpeaking ? 'SafeAssist is speaking...' : 'Listening to you...'}
              </p>
              <p className="mt-2 text-white/40 text-sm">
                Speak naturally - I'll respond when you pause
              </p>
              
              <Button
                onClick={handleStopVoice}
                variant="outline"
                className="mt-8 border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300 px-6"
              >
                <PhoneOff className="h-4 w-4 mr-2" />
                End Voice Session
              </Button>
            </motion.div>
          )}

          {/* Chat Area */}
          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="max-w-4xl mx-auto px-4 py-6">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      "flex gap-4 mb-6",
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-500/30 overflow-hidden">
                          <img src={safeassistIcon} alt="SafeAssist" className="w-7 h-7 object-contain" />
                        </div>
                      </div>
                    )}
                    
                    <div className={cn(
                      "max-w-[80%] rounded-2xl",
                      message.role === 'user' 
                        ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-5 py-4 rounded-br-sm'
                        : 'bg-[#141414] border border-gray-800 px-5 py-4 rounded-bl-sm'
                    )}>
                      {/* Attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {message.attachments.map((att, i) => (
                            <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/20 text-xs">
                              <Paperclip className="h-3 w-3" />
                              {att.name}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {message.role === 'user' ? (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <AIMessageContent 
                          content={message.content} 
                          isStreaming={message.isStreaming}
                        />
                      )}
                      <p className={cn(
                        "text-xs mt-3",
                        message.role === 'user' ? 'text-white/60' : 'text-gray-600'
                      )}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    
                    {message.role === 'user' && (
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
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
                  className="flex items-start gap-4 mb-6"
                >
                  <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-500/30 overflow-hidden">
                    <img src={safeassistIcon} alt="SafeAssist" className="w-7 h-7 object-contain" />
                  </div>
                  <div className="bg-[#141414] border border-gray-800 rounded-2xl rounded-bl-sm px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-2.5 w-2.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-2.5 w-2.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Quick actions when chat is empty */}
              {messages.length <= 1 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5 text-cyan-400" />
                    <p className="text-gray-400 font-medium">Try asking about...</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {QUICK_ACTIONS.map((action, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                        onClick={() => handleQuickAction(action.prompt)}
                        disabled={credits.remaining <= 0}
                        className="p-4 rounded-xl border border-gray-800 bg-[#141414]/80 hover:bg-[#1a1a1a] hover:border-cyan-500/30 transition-all text-left group disabled:opacity-50"
                      >
                        <action.icon className={cn("h-5 w-5 mb-2", action.color)} />
                        <p className="text-sm text-gray-300 group-hover:text-white transition-colors">
                          {action.label}
                        </p>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-cyan-500/20 bg-[#0a0a0a]/90 backdrop-blur-md p-4">
            <div className="max-w-4xl mx-auto">
              {/* Attached Files */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {attachedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-gray-700">
                      <Paperclip className="h-3.5 w-3.5 text-cyan-400" />
                      <span className="text-sm text-gray-300 truncate max-w-[150px]">{file.name}</span>
                      <button 
                        onClick={() => removeAttachment(index)}
                        className="text-gray-500 hover:text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-3 items-end">
                {/* File Upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".txt,.pdf,.doc,.docx,.json,.csv,.eml,.msg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 h-12 w-12 rounded-xl border-gray-700 hover:border-cyan-500/50 hover:bg-cyan-500/10"
                  title="Upload files for analysis"
                >
                  <Upload className="h-5 w-5 text-gray-400" />
                </Button>
                
                {/* Voice Button */}
                <Button
                  onClick={handleStartVoice}
                  disabled={!isConnected || credits.remaining <= 0 || isConnecting || isVoiceActive || voiceCredits.total <= 0}
                  variant="outline"
                  className={cn(
                    "shrink-0 h-12 w-12 rounded-xl border-gray-700 hover:border-cyan-500/50 hover:bg-cyan-500/10 relative",
                    isConnecting && "animate-pulse",
                    isVoiceActive && "border-cyan-500 bg-cyan-500/20",
                    voiceCredits.total <= 0 && "opacity-50"
                  )}
                  title={voiceCredits.total <= 0 
                    ? "No voice minutes - Buy more" 
                    : `${voiceCredits.total} voice minutes remaining`}
                >
                  {isConnecting ? (
                    <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                  ) : voiceCredits.total <= 0 ? (
                    <Lock className="h-5 w-5 text-gray-500" />
                  ) : (
                    <Mic className={cn("h-5 w-5", isVoiceActive ? "text-cyan-400" : "text-gray-400")} />
                  )}
                </Button>
                
                {/* Text Input */}
                <div className="flex-1 relative">
                  <Textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={credits.remaining > 0 ? "Ask me anything about security, or paste/upload something to analyze..." : "No credits remaining"}
                    disabled={!isConnected || credits.remaining <= 0}
                    className="min-h-[48px] max-h-[200px] resize-none bg-[#141414] border-gray-700 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-xl pr-14"
                    rows={1}
                  />
                </div>
                
                {/* Send Button */}
                <Button
                  onClick={handleSend}
                  disabled={!isConnected || (!inputValue.trim() && attachedFiles.length === 0) || isTyping || credits.remaining <= 0}
                  className="shrink-0 h-12 w-12 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white p-0"
                >
                  {isTyping ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
              </div>
              
              {credits.remaining <= 0 && (
                <p className="text-xs text-red-400 mt-2 text-center">
                  You've used all your credits this month. Purchase more to continue.
                </p>
              )}
              
              <p className="text-xs text-gray-600 mt-2 text-center">
                SafeAssist can make mistakes. Consider verifying important security information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
