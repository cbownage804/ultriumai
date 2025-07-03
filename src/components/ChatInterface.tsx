import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User, Plus, MessageSquare, Download, Share, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  message_count?: number;
}

const botLogo = "/lovable-uploads/782bff71-19ad-4277-bed5-375d4114e0c5.png";

const ChatInterface = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load conversations on component mount
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    }
  }, [currentConversationId]);

  // Filter conversations based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(conv =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
  }, [conversations, searchQuery]);

  // Filter messages based on search query
  useEffect(() => {
    if (!messageSearchQuery.trim()) {
      setFilteredMessages(messages);
    } else {
      const filtered = messages.filter(msg =>
        msg.content.toLowerCase().includes(messageSearchQuery.toLowerCase())
      );
      setFilteredMessages(filtered);
    }
  }, [messages, messageSearchQuery]);

  const loadConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          title,
          updated_at,
          messages(count)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const conversationsWithCount = data.map(conv => ({
        ...conv,
        message_count: conv.messages?.[0]?.count || 0
      }));

      setConversations(conversationsWithCount);

      // If no current conversation and we have conversations, select the first one
      if (!currentConversationId && conversationsWithCount.length > 0) {
        setCurrentConversationId(conversationsWithCount[0].id);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Ensure role types are properly typed
      const typedMessages = (data || []).map(msg => ({
        ...msg,
        role: msg.role as "user" | "assistant"
      }));
      
      setMessages(typedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages.",
        variant: "destructive",
      });
    }
  };

  const createNewConversation = async () => {
    if (!user) return;

    try {
      const title = `New Chat ${new Date().toLocaleDateString()}`;
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title
        })
        .select()
        .single();

      if (error) throw error;

      const newConversation = { ...data, message_count: 0 };
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversationId(data.id);
      setMessages([]);

      toast({
        title: "New conversation",
        description: "Started a new chat.",
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create new conversation.",
        variant: "destructive",
      });
    }
  };

  const saveMessage = async (conversationId: string, content: string, role: "user" | "assistant") => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content,
          role
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  };

  const updateConversationTitle = async (conversationId: string, title: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title })
        .eq('id', conversationId);

      if (error) throw error;

      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? { ...conv, title } : conv
        )
      );
    } catch (error) {
      console.error('Error updating conversation title:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !user) return;

    // Create conversation if none exists
    let conversationId = currentConversationId;
    if (!conversationId) {
      try {
        const title = input.length > 50 ? input.substring(0, 50) + "..." : input;
        const { data, error } = await supabase
          .from('conversations')
          .insert({
            user_id: user.id,
            title
          })
          .select()
          .single();

        if (error) throw error;
        conversationId = data.id;
        setCurrentConversationId(conversationId);
        
        const newConversation = { ...data, message_count: 0 };
        setConversations(prev => [newConversation, ...prev]);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create conversation.",
          variant: "destructive",
        });
        return;
      }
    }

    const userMessage = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user" as const,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Save user message to database
      await saveMessage(conversationId, userMessage.content, "user");

      // Update conversation title if it's the first message
      if (messages.length === 0) {
        const title = userMessage.content.length > 50 
          ? userMessage.content.substring(0, 50) + "..." 
          : userMessage.content;
        await updateConversationTitle(conversationId, title);
      }

      // Call AI API
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to get AI response');
      }

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        role: "assistant" as const,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save AI message to database
      await saveMessage(conversationId, aiMessage.content, "assistant");

      // Refresh conversations to update the timestamp
      loadConversations();

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleConversationClick = (conversation: Conversation) => {
    setCurrentConversationId(conversation.id);
    // Clear message search when switching conversations
    setMessageSearchQuery("");
  };

  // Helper function to highlight search terms
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">{part}</mark> : 
        part
    );
  };

  const exportConversationAsJSON = () => {
    const conversation = {
      id: currentConversationId,
      title: conversations.find(c => c.id === currentConversationId)?.title || "Untitled",
      messages: messages,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(conversation, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Conversation exported",
      description: "Downloaded as JSON file",
    });
  };

  const exportConversationAsMarkdown = () => {
    const conversation = conversations.find(c => c.id === currentConversationId);
    const title = conversation?.title || "Untitled";
    
    let markdown = `# ${title}\n\n`;
    markdown += `Exported on: ${new Date().toLocaleString()}\n\n`;
    
    messages.forEach((message, index) => {
      const role = message.role === 'user' ? '**You**' : '**Assistant**';
      markdown += `${role}: ${message.content}\n\n`;
    });
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Conversation exported",
      description: "Downloaded as Markdown file",
    });
  };

  const shareConversation = async () => {
    if (navigator.share && messages.length > 0) {
      const conversation = conversations.find(c => c.id === currentConversationId);
      const title = conversation?.title || "Untitled";
      
      let text = `${title}\n\n`;
      messages.forEach(message => {
        const role = message.role === 'user' ? 'You' : 'Assistant';
        text += `${role}: ${message.content}\n\n`;
      });
      
      try {
        await navigator.share({
          title: `UltriumGPT Conversation: ${title}`,
          text: text
        });
      } catch (error) {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(text);
        toast({
          title: "Conversation copied",
          description: "Copied to clipboard",
        });
      }
    } else {
      // Fallback: copy to clipboard
      const conversation = conversations.find(c => c.id === currentConversationId);
      const title = conversation?.title || "Untitled";
      
      let text = `${title}\n\n`;
      messages.forEach(message => {
        const role = message.role === 'user' ? 'You' : 'Assistant';
        text += `${role}: ${message.content}\n\n`;
      });
      
      await navigator.clipboard.writeText(text);
      toast({
        title: "Conversation copied",
        description: "Copied to clipboard",
      });
    }
  };

  if (isLoadingConversations) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Conversation Sidebar */}
      <div className="w-80 border-r bg-muted/30 flex flex-col">
        <div className="p-4 border-b space-y-3">
          <Button onClick={createNewConversation} className="w-full" variant="hero">
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
          
          {/* Search Conversations */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-8 w-8 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredConversations.map((conversation) => (
              <Card
                key={conversation.id}
                className={`p-3 mb-2 cursor-pointer hover:bg-muted/50 transition-colors ${
                  currentConversationId === conversation.id ? 'bg-muted border-primary' : ''
                }`}
                onClick={() => handleConversationClick(conversation)}
              >
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conversation.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(conversation.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
            
            {filteredConversations.length === 0 && conversations.length > 0 && (
              <div className="text-center py-8">
                <Search className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">No conversations found</p>
                <p className="text-muted-foreground text-xs">Try a different search term</p>
              </div>
            )}
            
            {conversations.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">No conversations yet</p>
                <p className="text-muted-foreground text-xs">Start a new chat to begin</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentConversationId ? (
          <>
            {/* Chat Header with Export Options */}
            <div className="border-b p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">
                    {conversations.find(c => c.id === currentConversationId)?.title || "Untitled"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {messageSearchQuery ? `${filteredMessages.length} of ${messages.length}` : messages.length} message{messages.length !== 1 ? 's' : ''}
                  </p>
                </div>
                
                {messages.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Share className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={exportConversationAsJSON}>
                        <Download className="w-4 h-4 mr-2" />
                        Export as JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={exportConversationAsMarkdown}>
                        <Download className="w-4 h-4 mr-2" />
                        Export as Markdown
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={shareConversation}>
                        <Share className="w-4 h-4 mr-2" />
                        Share/Copy
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Search Messages */}
              {messages.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages..."
                    value={messageSearchQuery}
                    onChange={(e) => setMessageSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {messageSearchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-8 w-8 p-0"
                      onClick={() => setMessageSearchQuery("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {(messageSearchQuery ? filteredMessages : messages).map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${
                      message.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {message.role === "assistant" ? (
                        <div className="w-8 h-8 rounded-full overflow-hidden">
                          <img src={botLogo} alt="UltriumGPT" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <Card
                      className={`max-w-[80%] p-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {messageSearchQuery ? highlightSearchTerm(message.content, messageSearchQuery) : message.content}
                      </p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </Card>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      <img src={botLogo} alt="UltriumGPT" className="w-full h-full object-cover" />
                    </div>
                    <Card className="bg-muted p-3">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-75" />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-150" />
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  variant="hero"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-4">Welcome to UltriumGPT</h2>
              <p className="text-muted-foreground mb-6">
                Select a conversation from the sidebar or start a new chat to begin.
              </p>
              <Button onClick={createNewConversation} variant="hero">
                <Plus className="w-4 h-4 mr-2" />
                Start New Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;