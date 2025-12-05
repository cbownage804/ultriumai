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
  Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { icon: Shield, label: "Security Assessment", prompt: "Perform a security assessment of my current environment. What should I check?" },
  { icon: AlertTriangle, label: "Incident Response", prompt: "I think we have a security incident. What steps should I take immediately?" },
  { icon: Network, label: "Network Analysis", prompt: "How can I analyze my network for potential vulnerabilities?" },
  { icon: FileText, label: "Compliance Check", prompt: "What compliance requirements should I be aware of for my industry?" },
];

export function VanguardAICopilot() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Add welcome message
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Welcome to Vanguard AI Copilot! I'm your security operations assistant.

I can help you with:
• **Ticket Analysis** - Analyze support tickets and suggest solutions
• **Security Assessment** - Evaluate risks and recommend mitigations
• **Incident Response** - Guide you through security incident handling
• **Compliance Guidance** - Answer compliance and audit questions
• **Network Security** - Help troubleshoot network security issues
• **Threat Intelligence** - Share insights on current threats

How can I assist you today?`,
        timestamp: new Date()
      }]);
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
      // Build messages for API
      const apiMessages = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));
      apiMessages.push({ role: 'user', content: text });

      // Use streaming for better UX
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
            stream: true 
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

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantId = (Date.now() + 1).toString();

      // Add empty assistant message
      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }]);

      let textBuffer = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        // Process line-by-line
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => prev.map(m => 
                m.id === assistantId ? { ...m, content: assistantContent } : m
              ));
            }
          } catch {
            // Incomplete JSON, put back
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw || !raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
            }
          } catch {}
        }
        setMessages(prev => prev.map(m => 
          m.id === assistantId ? { ...m, content: assistantContent } : m
        ));
      }

    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get response from AI",
        variant: "destructive",
      });
      
      // Remove the loading message if there was an error
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage.role === 'assistant' && !lastMessage.content) {
          return prev.slice(0, -1);
        }
        return prev;
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
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Chat cleared. How can I assist you today?`,
      timestamp: new Date()
    }]);
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
                <CardTitle className="text-lg">Vanguard AI Copilot</CardTitle>
                <CardDescription>Your security operations assistant</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={clearChat}>
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </CardHeader>

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <div className="px-6 pb-4">
            <p className="text-sm text-muted-foreground mb-3">Quick actions:</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_PROMPTS.map((prompt, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="justify-start h-auto py-3"
                  onClick={() => sendMessage(prompt.prompt)}
                >
                  <prompt.icon className="h-4 w-4 mr-2 text-primary" />
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
