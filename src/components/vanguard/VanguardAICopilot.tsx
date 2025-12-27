import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  Shield, 
  Network, 
  AlertTriangle,
  FileText,
  Trash2,
  Copy,
  Check,
  Search,
  Mail
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useVanguardAgents } from "@/hooks/useVanguardAgents";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolsUsed?: string[];
}

interface VanguardAICopilotProps {
  agentId?: string;
}

const QUICK_PROMPTS = [
  { icon: Shield, label: "Security Overview", prompt: "Give me a quick overview of my security posture. Any issues I should know about?" },
  { icon: AlertTriangle, label: "Check for Threats", prompt: "Are there any active threats or alerts I need to address right now?" },
  { icon: Network, label: "Scan Network", prompt: "Can you run a network scan and tell me what devices you find?" },
  { icon: Mail, label: "Check Email Breach", prompt: "Can you check if my email has been in any data breaches?" },
  { icon: Search, label: "Check a URL", prompt: "I want to check if a website is safe before I visit it" },
  { icon: FileText, label: "Compliance Status", prompt: "How are we doing on compliance? Any gaps I should know about?" },
];

export function VanguardAICopilot({ agentId }: VanguardAICopilotProps) {
  const { toast } = useToast();
  const { agents } = useVanguardAgents();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  // Get the first online agent if no specific agent provided
  const activeAgentId = agentId || agents.find(a => a.status === 'online')?.id;
  const onlineAgentCount = agents.filter(a => a.status === 'online').length;

  // Initialize with a proactive greeting from the AI
  useEffect(() => {
    if (hasInitialized.current || !userId) return;
    hasInitialized.current = true;

    // Start a conversation with the AI to get a personalized greeting
    initializeChat();
  }, [userId, activeAgentId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize chat with AI-generated personalized greeting
  const initializeChat = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vanguard-ai-copilot`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            messages: [{ role: 'user', content: 'Hello' }],
            agentId: activeAgentId,
            userId,
            isFirstMessage: true,
            useTools: false,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: data.response || "Hey! I'm your Vanguard AI security copilot. How can I help you today?",
          timestamp: new Date()
        }]);
      } else {
        // Fallback greeting
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: `Hey there! 👋 I'm your Vanguard AI security copilot.${onlineAgentCount > 0 ? ` I can see you have ${onlineAgentCount} agent${onlineAgentCount > 1 ? 's' : ''} online - nice!` : ''} What would you like to look into today?`,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      // Fallback greeting on error
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Hey! I'm your Vanguard AI security copilot. What can I help you with today?",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build messages for API (exclude welcome message)
      const apiMessages = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));
      apiMessages.push({ role: 'user', content: text });

      // Use non-streaming with tools for better responses
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vanguard-ai-copilot`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            messages: apiMessages,
            agentId: activeAgentId,
            userId,
            useTools: true,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        }
        if (response.status === 402) {
          throw new Error('AI credits exhausted. Please add credits to continue.');
        }
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const assistantId = (Date.now() + 1).toString();
      
      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: data.response || "I'm sorry, I couldn't process that request.",
        timestamp: new Date(),
        toolsUsed: data.tools_used,
      }]);

    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get response from AI",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const copyMessage = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    hasInitialized.current = false;
    setMessages([]);
    initializeChat();
  };

  return (
    <div className="h-[calc(100vh-20rem)] flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Vanguard AI</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  Security Operations Copilot
                  {onlineAgentCount > 0 && (
                    <Badge variant="outline" className="text-xs text-green-500 border-green-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1" />
                      {onlineAgentCount} agent{onlineAgentCount > 1 ? 's' : ''} online
                    </Badge>
                  )}
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={clearChat}>
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </CardHeader>

        {/* Quick Prompts - show when only welcome message */}
        {messages.length <= 1 && !isLoading && (
          <div className="px-6 pb-4">
            <p className="text-sm text-muted-foreground mb-3">Quick actions:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {QUICK_PROMPTS.map((prompt, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="justify-start h-auto py-3 text-left"
                  onClick={() => sendMessage(prompt.prompt)}
                  disabled={isLoading}
                >
                  <prompt.icon className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                  <span className="text-sm">{prompt.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full px-6" ref={scrollRef}>
            <div className="space-y-4 pb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {message.content.split('\n').map((line, i) => {
                        // Handle markdown-style bold
                        const parts = line.split(/(\*\*[^*]+\*\*)/g);
                        return (
                          <p key={i} className="mb-1 last:mb-0">
                            {parts.map((part, j) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={j}>{part.slice(2, -2)}</strong>;
                              }
                              return <span key={j}>{part}</span>;
                            })}
                          </p>
                        );
                      })}
                    </div>
                    
                    {message.role === 'assistant' && message.id !== 'welcome' && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => copyMessage(message.content, message.id)}
                        >
                          {copiedId === message.id ? (
                            <Check className="h-3 w-3 mr-1" />
                          ) : (
                            <Copy className="h-3 w-3 mr-1" />
                          )}
                          {copiedId === message.id ? 'Copied' : 'Copy'}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>

        {/* Input */}
        <div className="p-4 border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Vanguard AI anything about security..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
