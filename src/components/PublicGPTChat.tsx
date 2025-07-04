import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PublicGPT {
  id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  system_prompt: string;
  chat_count: number;
  agent_visibility: string;
  is_active: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const PublicGPTChat = () => {
  const { gptId } = useParams();
  const { toast } = useToast();
  const [gpt, setGPT] = useState<PublicGPT | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    const loadGPT = async () => {
      if (!gptId) return;

      try {
        const { data, error } = await supabase
          .from('custom_gpts')
          .select('*')
          .eq('id', gptId)
          .eq('agent_visibility', 'public')
          .eq('is_active', true)
          .single();

        if (error || !data) {
          toast({
            title: "GPT not found",
            description: "This GPT is not publicly available or doesn't exist.",
            variant: "destructive",
          });
          return;
        }

        setGPT(data);
      } catch (error) {
        console.error('Error loading GPT:', error);
        toast({
          title: "Error",
          description: "Failed to load GPT information.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadGPT();
  }, [gptId, toast]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !gpt || sending) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('public-gpt-chat', {
        body: {
          message: inputMessage,
          gpt_id: gpt.id,
          conversation_id: conversationId
        }
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Set conversation ID if this is the first message
      if (!conversationId && data.conversation_id) {
        setConversationId(data.conversation_id);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!gpt) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">GPT Not Found</h2>
            <p className="text-muted-foreground">
              This GPT is not publicly available or doesn't exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* GPT Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={gpt.avatar_url || undefined} />
              <AvatarFallback>{gpt.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-2xl">{gpt.name}</CardTitle>
                <Badge variant="secondary">Public</Badge>
              </div>
              {gpt.description && (
                <p className="text-muted-foreground mb-2">{gpt.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{gpt.chat_count} total conversations</span>
                <span>•</span>
                <span>Powered by UltriumAI</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chat Interface */}
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Chat with {gpt.name}</CardTitle>
        </CardHeader>
        
        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="h-8 w-8 mx-auto mb-2" />
              <p>Start a conversation with {gpt.name}</p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={gpt.avatar_url || undefined} />
                  <AvatarFallback>{gpt.name.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted'
              }`}>
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
              {message.role === 'user' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {sending && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8">
                <AvatarImage src={gpt.avatar_url || undefined} />
                <AvatarFallback>{gpt.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </CardContent>

        {/* Input */}
        <CardContent className="pt-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${gpt.name}...`}
              disabled={sending}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!inputMessage.trim() || sending}
              size="icon"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicGPTChat;