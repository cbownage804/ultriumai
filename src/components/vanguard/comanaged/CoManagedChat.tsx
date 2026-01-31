import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MessageSquare,
  Send,
  Users,
  Lock,
  Eye,
  EyeOff,
  Pin,
  MoreVertical,
  Hash,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_type: 'msp_tech' | 'internal_tech' | 'system';
  message_content: string;
  visibility: 'all' | 'msp_only' | 'internal_only';
  is_pinned: boolean;
  created_at: string;
}

interface Channel {
  id: string;
  channel_name: string;
  channel_type: 'general' | 'escalation' | 'announcement' | 'ticket';
  is_private: boolean;
  unread_count: number;
}

interface CoManagedChatProps {
  organizationId?: string;
  organizationName?: string;
  currentUserType?: 'msp_tech' | 'internal_tech';
}

export function CoManagedChat({ 
  organizationId, 
  organizationName = 'Acme Corp',
  currentUserType = 'msp_tech' 
}: CoManagedChatProps) {
  const [channels] = useState<Channel[]>([
    { id: '1', channel_name: 'General', channel_type: 'general', is_private: false, unread_count: 3 },
    { id: '2', channel_name: 'Escalations', channel_type: 'escalation', is_private: false, unread_count: 1 },
    { id: '3', channel_name: 'MSP Internal', channel_type: 'general', is_private: true, unread_count: 0 },
  ]);
  
  const [selectedChannel, setSelectedChannel] = useState<Channel>(channels[0]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender_id: 'tech1',
      sender_name: 'John (MSP)',
      sender_type: 'msp_tech',
      message_content: 'Hey team, we have a major outage reported for their main server.',
      visibility: 'all',
      is_pinned: true,
      created_at: '10:30 AM',
    },
    {
      id: '2',
      sender_id: 'tech2',
      sender_name: 'Sarah (Internal IT)',
      sender_type: 'internal_tech',
      message_content: 'Thanks for the heads up. We\'re seeing tickets come in now. Should we escalate?',
      visibility: 'all',
      is_pinned: false,
      created_at: '10:32 AM',
    },
    {
      id: '3',
      sender_id: 'tech1',
      sender_name: 'John (MSP)',
      sender_type: 'msp_tech',
      message_content: 'MSP Note: Customer is on premium SLA, prioritize this.',
      visibility: 'msp_only',
      is_pinned: false,
      created_at: '10:33 AM',
    },
    {
      id: '4',
      sender_id: 'system',
      sender_name: 'System',
      sender_type: 'system',
      message_content: 'Ticket #1234 has been escalated to MSP by Sarah',
      visibility: 'all',
      is_pinned: false,
      created_at: '10:35 AM',
    },
  ]);
  
  const [newMessage, setNewMessage] = useState('');
  const [messageVisibility, setMessageVisibility] = useState<'all' | 'msp_only' | 'internal_only'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      sender_id: 'current',
      sender_name: currentUserType === 'msp_tech' ? 'You (MSP)' : 'You (Internal)',
      sender_type: currentUserType,
      message_content: newMessage,
      visibility: messageVisibility,
      is_pinned: false,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  const getVisibilityBadge = (visibility: string) => {
    switch (visibility) {
      case 'msp_only':
        return <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/30"><Lock className="h-3 w-3 mr-1" />MSP Only</Badge>;
      case 'internal_only':
        return <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30"><Lock className="h-3 w-3 mr-1" />Internal Only</Badge>;
      default:
        return null;
    }
  };

  const getSenderColor = (type: string) => {
    switch (type) {
      case 'msp_tech': return 'bg-purple-500';
      case 'internal_tech': return 'bg-blue-500';
      case 'system': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (currentUserType === 'msp_tech') {
      return msg.visibility !== 'internal_only';
    } else {
      return msg.visibility !== 'msp_only';
    }
  });

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">{organizationName} Chat</CardTitle>
              <p className="text-sm text-muted-foreground">
                Collaborate with internal IT team
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              <Users className="h-3 w-3 mr-1" />
              5 online
            </Badge>
          </div>
        </div>
      </CardHeader>

      <div className="flex flex-1 overflow-hidden">
        {/* Channel Sidebar */}
        <div className="w-48 border-r p-3 space-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase">Channels</span>
            <Button variant="ghost" size="icon" className="h-5 w-5">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setSelectedChannel(channel)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                selectedChannel.id === channel.id 
                  ? 'bg-primary/10 text-primary' 
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {channel.is_private ? (
                <Lock className="h-3.5 w-3.5" />
              ) : (
                <Hash className="h-3.5 w-3.5" />
              )}
              <span className="flex-1 text-left truncate">{channel.channel_name}</span>
              {channel.unread_count > 0 && (
                <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {channel.unread_count}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {filteredMessages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.sender_type === 'system' ? 'justify-center' : ''}`}>
                  {msg.sender_type === 'system' ? (
                    <div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      {msg.message_content}
                    </div>
                  ) : (
                    <>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={getSenderColor(msg.sender_type)}>
                          {msg.sender_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{msg.sender_name}</span>
                          <span className="text-xs text-muted-foreground">{msg.created_at}</span>
                          {msg.is_pinned && (
                            <Pin className="h-3 w-3 text-yellow-500" />
                          )}
                          {getVisibilityBadge(msg.visibility)}
                        </div>
                        <p className="text-sm">{msg.message_content}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Pin className="h-3 w-3 mr-2" />
                            Pin message
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t space-y-2">
            <div className="flex items-center gap-2">
              <Select value={messageVisibility} onValueChange={(v: any) => setMessageVisibility(v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Eye className="h-3 w-3" />
                      Everyone
                    </div>
                  </SelectItem>
                  {currentUserType === 'msp_tech' && (
                    <SelectItem value="msp_only">
                      <div className="flex items-center gap-2">
                        <EyeOff className="h-3 w-3" />
                        MSP Only
                      </div>
                    </SelectItem>
                  )}
                  {currentUserType === 'internal_tech' && (
                    <SelectItem value="internal_only">
                      <div className="flex items-center gap-2">
                        <EyeOff className="h-3 w-3" />
                        Internal Only
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {messageVisibility !== 'all' && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" />
                This message will only be visible to {messageVisibility === 'msp_only' ? 'MSP technicians' : 'internal IT staff'}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
