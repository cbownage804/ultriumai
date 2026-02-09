import { useState, useEffect, useRef, useCallback } from 'react';
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
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  sender_id: string;
  sender_type: string;
  message_content: string;
  visibility: string;
  is_pinned: boolean;
  created_at: string;
}

interface Channel {
  id: string;
  channel_name: string;
  channel_type: string;
  is_private: boolean;
}

interface CoManagedChatProps {
  organizationId?: string;
  organizationName?: string;
  currentUserType?: 'msp_tech' | 'internal_tech';
}

export function CoManagedChat({ 
  organizationId, 
  organizationName = 'Organization',
  currentUserType = 'msp_tech' 
}: CoManagedChatProps) {
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [messageVisibility, setMessageVisibility] = useState<string>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const loadChannels = useCallback(async () => {
    if (!organizationId) return;
    try {
      const { data, error } = await (supabase as any)
        .from('comanaged_chat_channels')
        .select('*')
        .eq('organization_id', organizationId)
        .order('channel_name');
      if (error) throw error;
      const mapped = (data || []).map((c: any) => ({
        id: c.id,
        channel_name: c.channel_name,
        channel_type: c.channel_type || 'general',
        is_private: c.is_private ?? false,
      }));
      setChannels(mapped);
      if (mapped.length > 0 && !selectedChannel) setSelectedChannel(mapped[0]);
    } catch (err) {
      console.error('Failed to load channels:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const loadMessages = useCallback(async () => {
    if (!selectedChannel) return;
    try {
      const { data, error } = await (supabase as any)
        .from('comanaged_chat_messages')
        .select('*')
        .eq('channel_id', selectedChannel.id)
        .order('created_at', { ascending: true })
        .limit(100);
      if (error) throw error;
      setMessages((data || []).map((m: any) => ({
        id: m.id,
        sender_id: m.sender_id,
        sender_type: m.sender_type || 'msp_tech',
        message_content: m.message_content,
        visibility: m.visibility || 'all',
        is_pinned: m.is_pinned ?? false,
        created_at: m.created_at,
      })));
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, [selectedChannel]);

  useEffect(() => { loadChannels(); }, [loadChannels]);
  useEffect(() => { loadMessages(); }, [loadMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChannel || !user) return;
    try {
      const { error } = await (supabase as any)
        .from('comanaged_chat_messages')
        .insert({
          channel_id: selectedChannel.id,
          sender_id: user.id,
          sender_type: currentUserType,
          message_content: newMessage,
          visibility: messageVisibility,
        });
      if (error) throw error;
      setNewMessage('');
      loadMessages();
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  const handleCreateChannel = async () => {
    if (!organizationId || !user) return;
    try {
      const { error } = await (supabase as any)
        .from('comanaged_chat_channels')
        .insert({
          organization_id: organizationId,
          channel_name: 'New Channel',
          channel_type: 'general',
          is_private: false,
          created_by: user.id,
        });
      if (error) throw error;
      toast.success('Channel created');
      loadChannels();
    } catch { toast.error('Failed to create channel'); }
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
    if (currentUserType === 'msp_tech') return msg.visibility !== 'internal_only';
    return msg.visibility !== 'msp_only';
  });

  const formatTime = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  if (loading) {
    return <Card className="h-[600px] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></Card>;
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">{organizationName} Chat</CardTitle>
              <p className="text-sm text-muted-foreground">Collaborate with internal IT team</p>
            </div>
          </div>
          <Badge variant="secondary"><Users className="h-3 w-3 mr-1" />Live</Badge>
        </div>
      </CardHeader>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-48 border-r p-3 space-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase">Channels</span>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleCreateChannel}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setSelectedChannel(channel)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                selectedChannel?.id === channel.id 
                  ? 'bg-primary/10 text-primary' 
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {channel.is_private ? <Lock className="h-3.5 w-3.5" /> : <Hash className="h-3.5 w-3.5" />}
              <span className="flex-1 text-left truncate">{channel.channel_name}</span>
            </button>
          ))}
          {channels.length === 0 && (
            <p className="text-xs text-muted-foreground italic px-2">No channels yet</p>
          )}
        </div>

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
                          {msg.sender_type === 'msp_tech' ? 'M' : 'I'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {msg.sender_id === user?.id ? 'You' : msg.sender_type === 'msp_tech' ? 'MSP Tech' : 'Internal Tech'}
                          </span>
                          <span className="text-xs text-muted-foreground">{formatTime(msg.created_at)}</span>
                          {msg.is_pinned && <Pin className="h-3 w-3 text-yellow-500" />}
                          {getVisibilityBadge(msg.visibility)}
                        </div>
                        <p className="text-sm">{msg.message_content}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t space-y-2">
            <div className="flex items-center gap-2">
              <Select value={messageVisibility} onValueChange={setMessageVisibility}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2"><Eye className="h-3 w-3" />Everyone</div>
                  </SelectItem>
                  {currentUserType === 'msp_tech' && (
                    <SelectItem value="msp_only">
                      <div className="flex items-center gap-2"><EyeOff className="h-3 w-3" />MSP Only</div>
                    </SelectItem>
                  )}
                  {currentUserType === 'internal_tech' && (
                    <SelectItem value="internal_only">
                      <div className="flex items-center gap-2"><EyeOff className="h-3 w-3" />Internal Only</div>
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
