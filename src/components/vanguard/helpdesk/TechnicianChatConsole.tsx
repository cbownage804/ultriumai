/**
 * Technician Chat Console
 * Backend interface for support agents to handle escalated chats
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageCircle, Send, Bot, User, Clock, CheckCheck, Phone,
  Mail, Building2, AlertTriangle, Sparkles, Search, Filter,
  MoreVertical, Archive, Tag, ExternalLink, Ticket, RefreshCw,
  UserPlus, X, Check, Pause, Play, Volume2, VolumeX
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface ChatMessage {
  id: string;
  role: 'customer' | 'agent' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  senderName?: string;
}

interface LiveChat {
  id: string;
  customerName: string;
  customerEmail: string;
  company?: string;
  status: 'waiting' | 'active' | 'resolved' | 'abandoned';
  priority: 'low' | 'medium' | 'high';
  startedAt: Date;
  assignedTo?: string;
  messages: ChatMessage[];
  aiSummary?: string;
  tags: string[];
}

const mockChats: LiveChat[] = [
  {
    id: 'chat-1',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    company: 'Acme Corp',
    status: 'active',
    priority: 'high',
    startedAt: new Date(Date.now() - 1000 * 60 * 5),
    assignedTo: 'Sarah',
    aiSummary: 'Customer experiencing login issues after password reset. AI attempted troubleshooting but customer requested human support.',
    tags: ['login', 'password'],
    messages: [
      { id: 'm1', role: 'customer', content: "I can't log into my account after resetting my password", timestamp: new Date(Date.now() - 1000 * 60 * 5), senderName: 'John' },
      { id: 'm2', role: 'ai', content: "I understand you're having trouble logging in. Have you tried clearing your browser cache and cookies?", timestamp: new Date(Date.now() - 1000 * 60 * 4) },
      { id: 'm3', role: 'customer', content: "Yes I tried that, still not working. Can I speak to a human please?", timestamp: new Date(Date.now() - 1000 * 60 * 3), senderName: 'John' },
      { id: 'm4', role: 'system', content: 'Chat escalated to human support', timestamp: new Date(Date.now() - 1000 * 60 * 2) },
      { id: 'm5', role: 'agent', content: "Hi John, I'm Sarah and I'll be helping you. I can see there might be an issue with your account. Let me check.", timestamp: new Date(Date.now() - 1000 * 60 * 1), senderName: 'Sarah' },
    ]
  },
  {
    id: 'chat-2',
    customerName: 'Jane Smith',
    customerEmail: 'jane@techstart.io',
    company: 'TechStart',
    status: 'waiting',
    priority: 'medium',
    startedAt: new Date(Date.now() - 1000 * 60 * 2),
    aiSummary: 'Customer asking about billing discrepancy. AI provided initial information but customer wants to speak with billing team.',
    tags: ['billing', 'invoice'],
    messages: [
      { id: 'm1', role: 'customer', content: "There's an issue with my last invoice", timestamp: new Date(Date.now() - 1000 * 60 * 2), senderName: 'Jane' },
      { id: 'm2', role: 'ai', content: "I'd be happy to help with your billing inquiry. Could you tell me more about the issue you're seeing?", timestamp: new Date(Date.now() - 1000 * 60 * 1.5) },
      { id: 'm3', role: 'customer', content: "I was charged twice for the same month. I need to talk to someone in billing.", timestamp: new Date(Date.now() - 1000 * 60 * 1), senderName: 'Jane' },
    ]
  },
  {
    id: 'chat-3',
    customerName: 'Mike Wilson',
    customerEmail: 'mike@dataflow.com',
    status: 'waiting',
    priority: 'high',
    startedAt: new Date(Date.now() - 1000 * 30),
    tags: ['urgent', 'outage'],
    messages: [
      { id: 'm1', role: 'customer', content: "URGENT: Our entire team can't access the dashboard!", timestamp: new Date(Date.now() - 1000 * 30), senderName: 'Mike' },
    ]
  },
];

export function TechnicianChatConsole() {
  const [chats, setChats] = useState<LiveChat[]>(mockChats);
  const [selectedChat, setSelectedChat] = useState<LiveChat | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChat?.messages]);

  const waitingCount = chats.filter(c => c.status === 'waiting').length;
  const activeCount = chats.filter(c => c.status === 'active').length;

  const filteredChats = chats.filter(chat => {
    if (filterStatus !== 'all' && chat.status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        chat.customerName.toLowerCase().includes(query) ||
        chat.customerEmail.toLowerCase().includes(query) ||
        chat.company?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handleSend = () => {
    if (!inputValue.trim() || !selectedChat) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'agent',
      content: inputValue,
      timestamp: new Date(),
      senderName: 'You'
    };

    setChats(prev => prev.map(chat => 
      chat.id === selectedChat.id 
        ? { ...chat, messages: [...chat.messages, newMessage] }
        : chat
    ));

    setSelectedChat(prev => prev ? {
      ...prev,
      messages: [...prev.messages, newMessage]
    } : null);

    setInputValue('');
  };

  const handleClaimChat = (chatId: string) => {
    setChats(prev => prev.map(chat =>
      chat.id === chatId
        ? { ...chat, status: 'active', assignedTo: 'You' }
        : chat
    ));
    toast.success('Chat claimed');
  };

  const handleResolveChat = (chatId: string) => {
    setChats(prev => prev.map(chat =>
      chat.id === chatId
        ? { ...chat, status: 'resolved' }
        : chat
    ));
    
    if (selectedChat?.id === chatId) {
      setSelectedChat(null);
    }
    toast.success('Chat resolved');
  };

  const handleCreateTicket = (chat: LiveChat) => {
    toast.success(`Ticket created from chat with ${chat.customerName}`);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDuration = (startedAt: Date) => {
    const minutes = Math.floor((Date.now() - startedAt.getTime()) / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  const getPriorityColor = (priority: LiveChat['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'low': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusColor = (status: LiveChat['status']) => {
    switch (status) {
      case 'waiting': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'resolved': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'abandoned': return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
  };

  return (
    <div className="h-[calc(100vh-200px)] flex gap-4">
      {/* Chat List */}
      <Card className="w-80 flex flex-col bg-slate-900/50 border-cyan-500/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between mb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-cyan-400" />
              Live Chats
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-white/40 hover:text-white"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-white/40" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 bg-slate-800/50 border-white/10 text-sm"
              />
            </div>
          </div>

          <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-full">
            <TabsList className="w-full bg-slate-800/50 h-8">
              <TabsTrigger value="all" className="flex-1 text-xs h-7 data-[state=active]:bg-cyan-500/20">
                All
              </TabsTrigger>
              <TabsTrigger value="waiting" className="flex-1 text-xs h-7 data-[state=active]:bg-amber-500/20">
                Waiting ({waitingCount})
              </TabsTrigger>
              <TabsTrigger value="active" className="flex-1 text-xs h-7 data-[state=active]:bg-emerald-500/20">
                Active ({activeCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {filteredChats.length === 0 ? (
              <div className="text-center py-8 text-white/40">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No chats found</p>
              </div>
            ) : (
              filteredChats.map(chat => (
                <motion.div
                  key={chat.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedChat?.id === chat.id
                      ? 'bg-cyan-500/20 border border-cyan-500/50'
                      : 'bg-slate-800/50 border border-transparent hover:border-white/10'
                  }`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-cyan-500/20 text-cyan-400 text-xs">
                          {chat.customerName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-white">{chat.customerName}</p>
                        {chat.company && (
                          <p className="text-xs text-white/50">{chat.company}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${getStatusColor(chat.status)}`}>
                      {chat.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-white/60 line-clamp-2 mb-2">
                    {chat.messages[chat.messages.length - 1]?.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      <Badge variant="outline" className={`text-[10px] ${getPriorityColor(chat.priority)}`}>
                        {chat.priority}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-white/40 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(chat.startedAt)}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Area */}
      {selectedChat ? (
        <Card className="flex-1 flex flex-col bg-slate-900/50 border-cyan-500/20">
          {/* Chat Header */}
          <CardHeader className="pb-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-cyan-500/20 text-cyan-400">
                    {selectedChat.customerName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{selectedChat.customerName}</h3>
                    <Badge variant="outline" className={`text-xs ${getStatusColor(selectedChat.status)}`}>
                      {selectedChat.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/50">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {selectedChat.customerEmail}
                    </span>
                    {selectedChat.company && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {selectedChat.company}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {selectedChat.status === 'waiting' && (
                  <Button
                    onClick={() => handleClaimChat(selectedChat.id)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    size="sm"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Claim
                  </Button>
                )}
                {selectedChat.status === 'active' && (
                  <Button
                    onClick={() => handleResolveChat(selectedChat.id)}
                    variant="outline"
                    size="sm"
                    className="border-emerald-500/30 text-emerald-400"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Resolve
                  </Button>
                )}
                <Button
                  onClick={() => handleCreateTicket(selectedChat)}
                  variant="outline"
                  size="sm"
                  className="border-cyan-500/30 text-cyan-400"
                >
                  <Ticket className="h-4 w-4 mr-1" />
                  Create Ticket
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white/40">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-slate-900 border-cyan-500/20">
                    <DropdownMenuItem className="text-white/80">
                      <Tag className="h-4 w-4 mr-2" />
                      Add Tags
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-white/80">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Customer
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem className="text-white/80">
                      <Archive className="h-4 w-4 mr-2" />
                      Archive Chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* AI Summary */}
            {selectedChat.aiSummary && (
              <div className="mt-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span className="text-xs font-medium text-purple-400">AI Summary</span>
                </div>
                <p className="text-xs text-white/70">{selectedChat.aiSummary}</p>
              </div>
            )}
          </CardHeader>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {selectedChat.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === 'customer' ? 'justify-start' : 
                    msg.role === 'system' ? 'justify-center' : 'justify-end'
                  }`}
                >
                  {msg.role === 'system' ? (
                    <div className="px-3 py-1 rounded-full bg-white/5 text-white/40 text-xs">
                      {msg.content}
                    </div>
                  ) : (
                    <div className={`max-w-[70%] ${msg.role === 'customer' ? 'order-1' : 'order-2'}`}>
                      <div className={`flex items-center gap-2 mb-1 ${msg.role !== 'customer' ? 'justify-end' : ''}`}>
                        {msg.role === 'ai' && <Bot className="h-3 w-3 text-purple-400" />}
                        <span className="text-xs text-white/50">{msg.senderName || (msg.role === 'ai' ? 'AI Assistant' : '')}</span>
                        <span className="text-xs text-white/30">{formatTime(msg.timestamp)}</span>
                      </div>
                      <div
                        className={`rounded-xl px-4 py-2 ${
                          msg.role === 'customer'
                            ? 'bg-slate-800 text-white rounded-bl-sm'
                            : msg.role === 'ai'
                            ? 'bg-purple-500/20 text-white rounded-br-sm'
                            : 'bg-cyan-500 text-white rounded-br-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          {selectedChat.status !== 'resolved' && (
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <Textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type your response... (Enter to send, Shift+Enter for new line)"
                  className="flex-1 min-h-[44px] max-h-32 bg-slate-800/50 border-white/10 resize-none"
                  disabled={selectedChat.status === 'waiting'}
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || selectedChat.status === 'waiting'}
                  className="bg-cyan-500 hover:bg-cyan-600 text-black h-auto"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {selectedChat.status === 'waiting' && (
                <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Claim this chat to respond
                </p>
              )}
            </div>
          )}
        </Card>
      ) : (
        <Card className="flex-1 flex items-center justify-center bg-slate-900/50 border-cyan-500/20">
          <div className="text-center text-white/40">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">Select a chat</p>
            <p className="text-sm">Choose a conversation from the list to start helping</p>
          </div>
        </Card>
      )}
    </div>
  );
}
