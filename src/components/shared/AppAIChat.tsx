import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, Send, Loader2, X, Maximize2, Minimize2,
  Sparkles, MessageSquare, Shield, Lock, Mail, Link, FileText, Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type AppType = 'safescan' | 'safepass' | 'safemail' | 'safelink' | 'safedoc' | 'safenet' | 'safeshield' | 'safekb';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface AppAIChatProps {
  appType: AppType;
  context?: any;
  onClose?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  accentColor?: string;
}

const APP_CONFIG: Record<AppType, { 
  name: string; 
  icon: typeof Shield; 
  welcomeMessage: string;
  quickPrompts: { label: string; prompt: string }[];
  gradient: string;
}> = {
  safescan: {
    name: 'Scan AI',
    icon: Shield,
    gradient: 'from-red-500 to-red-600',
    welcomeMessage: `🛡️ **Scan AI Assistant**

I can help you with:
- **Threat Analysis**: Understand scan results and security threats
- **Risk Assessment**: Evaluate URLs, emails, and documents
- **Recommendations**: Get actionable security advice

What would you like to know?`,
    quickPrompts: [
      { label: 'Analyze Threats', prompt: 'What threats should I watch for in phishing emails?' },
      { label: 'Security Tips', prompt: 'Give me top 5 tips to identify malicious URLs' },
      { label: 'Scan Help', prompt: 'How do I interpret my scan results?' },
    ]
  },
  safepass: {
    name: 'Vault AI',
    icon: Lock,
    gradient: 'from-blue-500 to-cyan-500',
    welcomeMessage: `🔐 **Vault AI Assistant**

I can help you with:
- **Password Security**: Best practices for strong passwords
- **Breach Detection**: Understanding dark web exposure
- **Vault Management**: Organizing your credentials securely

How can I help secure your credentials?`,
    quickPrompts: [
      { label: 'Password Tips', prompt: 'How do I create a strong, memorable password?' },
      { label: 'Breach Check', prompt: 'What should I do if my password was found in a breach?' },
      { label: '2FA Guide', prompt: 'Explain the benefits of two-factor authentication' },
    ]
  },
  safemail: {
    name: 'SafeMail AI',
    icon: Mail,
    gradient: 'from-purple-500 to-pink-500',
    welcomeMessage: `📧 **SafeMail AI Assistant**

I can help you with:
- **Phishing Detection**: Identify suspicious emails
- **Email Security**: SPF, DKIM, DMARC analysis
- **Threat Response**: What to do with malicious emails

What email security question do you have?`,
    quickPrompts: [
      { label: 'Phishing Signs', prompt: 'What are the common signs of a phishing email?' },
      { label: 'Email Headers', prompt: 'How do I check if an email is spoofed?' },
      { label: 'Report Threat', prompt: 'What should I do if I clicked a suspicious link?' },
    ]
  },
  safelink: {
    name: 'SafeLink AI',
    icon: Link,
    gradient: 'from-emerald-500 to-teal-500',
    welcomeMessage: `🔗 **SafeLink AI Assistant**

I can help you with:
- **URL Analysis**: Understanding link safety scores
- **Domain Reputation**: Checking website trustworthiness
- **Safe Browsing**: Best practices for online safety

What would you like to know about link security?`,
    quickPrompts: [
      { label: 'URL Check', prompt: 'How can I tell if a shortened URL is safe?' },
      { label: 'SSL Guide', prompt: 'What does the padlock icon in my browser mean?' },
      { label: 'Safe Download', prompt: 'How do I safely download files from the internet?' },
    ]
  },
  safedoc: {
    name: 'SafeDoc AI',
    icon: FileText,
    gradient: 'from-amber-500 to-orange-500',
    welcomeMessage: `📄 **SafeDoc AI Assistant**

I can help you with:
- **Document Security**: Understanding scan results
- **Malware Detection**: Identifying malicious files
- **File Safety**: Best practices for file handling

What document security question do you have?`,
    quickPrompts: [
      { label: 'File Types', prompt: 'Which file types are most dangerous?' },
      { label: 'Macro Safety', prompt: 'Should I enable macros in Office documents?' },
      { label: 'Clean Files', prompt: 'How do I safely open a suspicious document?' },
    ]
  },
  safenet: {
    name: 'SafeNet AI',
    icon: Globe,
    gradient: 'from-indigo-500 to-violet-500',
    welcomeMessage: `🌐 **SafeNet AI Assistant**

I can help you with:
- **Network Security**: Understanding vulnerabilities
- **Firewall Rules**: Best practices for network protection
- **Intrusion Detection**: Monitoring for threats

What network security question do you have?`,
    quickPrompts: [
      { label: 'Network Scan', prompt: 'How do I interpret my network scan results?' },
      { label: 'Firewall Tips', prompt: 'What firewall rules should I implement?' },
      { label: 'VPN Guide', prompt: 'When should I use a VPN?' },
    ]
  },
  safeshield: {
    name: 'SafeShield AI',
    icon: Shield,
    gradient: 'from-rose-500 to-red-500',
    welcomeMessage: `🛡️ **SafeShield AI Assistant**

I can help you with:
- **Endpoint Protection**: Securing your devices
- **Threat Prevention**: Proactive security measures
- **Compliance**: Meeting security standards

How can I help protect your systems?`,
    quickPrompts: [
      { label: 'Endpoint Tips', prompt: 'How do I secure my endpoints?' },
      { label: 'Compliance', prompt: 'What security frameworks should I follow?' },
      { label: 'Zero Trust', prompt: 'Explain zero trust security model' },
    ]
  },
  safekb: {
    name: 'SafeKB AI',
    icon: MessageSquare,
    gradient: 'from-cyan-500 to-blue-500',
    welcomeMessage: `📚 **SafeKB AI Assistant**

I can help you with:
- **Knowledge Search**: Find security documentation
- **Best Practices**: Security policies and procedures
- **Training**: Security awareness topics

What security knowledge are you looking for?`,
    quickPrompts: [
      { label: 'Security Policy', prompt: 'Help me create a password policy' },
      { label: 'Training Topics', prompt: 'What security training should employees receive?' },
      { label: 'Incident Plan', prompt: 'What should an incident response plan include?' },
    ]
  }
};

export function AppAIChat({ 
  appType,
  context, 
  onClose, 
  isExpanded = false,
  onToggleExpand,
  accentColor
}: AppAIChatProps) {
  const { toast } = useToast();
  const config = APP_CONFIG[appType];
  const IconComponent = config.icon;
  
  const [messages, setMessages] = useState<Message[]>([{
    id: 'welcome',
    role: 'assistant',
    content: config.welcomeMessage,
    timestamp: new Date()
  }]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build context-aware prompt
      let systemContext = `You are ${config.name}, an AI security assistant. Be helpful, concise, and security-focused.`;
      
      if (context) {
        systemContext += `\n\nCurrent context: ${JSON.stringify(context, null, 2)}`;
      }

      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const { data, error } = await supabase.functions.invoke('app-ai-assistant', {
        body: {
          app_type: appType,
          messages: [...conversationHistory, { role: 'user', content: message }],
          context: context
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.response || 'I apologize, but I could not generate a response. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('AI Chat error:', error);
      toast({
        title: 'AI Error',
        description: error.message || 'Failed to get AI response',
        variant: 'destructive'
      });
      
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSend = () => sendMessage(inputValue);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className={`bg-[#0f0f0f] border-white/10 flex flex-col ${isExpanded ? 'fixed inset-4 z-50' : 'h-[500px]'}`}>
      {/* Header */}
      <CardHeader className="py-3 px-4 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${config.gradient} shadow-lg`}>
              <IconComponent className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                {config.name}
                <Badge className="text-xs bg-emerald-500/20 text-emerald-400">
                  AI
                </Badge>
              </CardTitle>
              <p className="text-xs text-gray-500">Security Assistant</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
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
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-xl px-4 py-3 ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                    : 'bg-[#1a1a1a] border border-white/10 text-gray-200'
                }`}>
                  <div className="text-sm whitespace-pre-wrap prose prose-invert prose-sm max-w-none">
                    {message.content}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {config.quickPrompts.map((prompt, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              onClick={() => sendMessage(prompt.prompt)}
              className="text-xs border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {prompt.label}
            </Button>
          ))}
        </div>
      )}

      {/* Input */}
      <CardContent className="p-3 border-t border-white/10 shrink-0">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about security..."
            className="flex-1 bg-[#1a1a1a] border-white/10 text-white placeholder:text-gray-500"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className={`bg-gradient-to-r ${config.gradient} hover:opacity-90`}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
