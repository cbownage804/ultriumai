import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Search, 
  Trash2, 
  Plus, 
  Calendar,
  Clock,
  MoreVertical,
  Pin,
  Star,
  Archive
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  message_count?: number;
  gpt_id?: string;
  gpt_name?: string;
  pinned?: boolean;
  starred?: boolean;
}

interface ConversationHistoryPanelProps {
  conversations: Conversation[];
  currentConversationId?: string;
  onSelect: (conversationId: string) => void;
  onDelete: (conversationId: string) => void;
  onCreate: () => void;
  onPin?: (conversationId: string) => void;
  onStar?: (conversationId: string) => void;
  onArchive?: (conversationId: string) => void;
  isLoading?: boolean;
  themeColor?: string;
}

export function ConversationHistoryPanel({
  conversations,
  currentConversationId,
  onSelect,
  onDelete,
  onCreate,
  onPin,
  onStar,
  onArchive,
  isLoading = false,
  themeColor = "#3b82f6"
}: ConversationHistoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<'all' | 'pinned' | 'starred'>('all');

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || 
      (filter === 'pinned' && conv.pinned) || 
      (filter === 'starred' && conv.starred);
    return matchesSearch && matchesFilter;
  });

  // Group conversations by date
  const groupedConversations = filteredConversations.reduce((groups, conv) => {
    const date = new Date(conv.updated_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let groupKey = 'Older';
    if (date.toDateString() === today.toDateString()) {
      groupKey = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = 'Yesterday';
    } else if (date > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
      groupKey = 'This Week';
    }
    
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(conv);
    return groups;
  }, {} as Record<string, Conversation[]>);

  const groupOrder = ['Today', 'Yesterday', 'This Week', 'Older'];

  return (
    <div className="h-full flex flex-col bg-card border-r">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Conversations</h3>
          <Button size="sm" onClick={onCreate} style={{ backgroundColor: themeColor }}>
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1">
          {(['all', 'pinned', 'starred'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "secondary" : "ghost"}
              size="sm"
              className="text-xs h-7 px-2"
              onClick={() => setFilter(f)}
            >
              {f === 'all' && <MessageSquare className="h-3 w-3 mr-1" />}
              {f === 'pinned' && <Pin className="h-3 w-3 mr-1" />}
              {f === 'starred' && <Star className="h-3 w-3 mr-1" />}
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: themeColor }} />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No conversations found</p>
            </div>
          ) : (
            groupOrder.map(group => {
              const groupConvs = groupedConversations[group];
              if (!groupConvs?.length) return null;
              
              return (
                <div key={group}>
                  <div className="flex items-center gap-2 px-2 mb-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">{group}</span>
                  </div>
                  <AnimatePresence>
                    {groupConvs.map((conv) => (
                      <motion.div
                        key={conv.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className={cn(
                          "group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                          currentConversationId === conv.id 
                            ? "bg-primary/10" 
                            : "hover:bg-muted/50"
                        )}
                        onClick={() => onSelect(conv.id)}
                      >
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${themeColor}20` }}
                        >
                          <MessageSquare className="h-4 w-4" style={{ color: themeColor }} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            {conv.pinned && <Pin className="h-3 w-3 text-primary" />}
                            {conv.starred && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                            <p className="text-sm font-medium truncate">{conv.title}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}</span>
                            {conv.message_count !== undefined && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1">
                                {conv.message_count} msgs
                              </Badge>
                            )}
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onPin && (
                              <DropdownMenuItem onClick={() => onPin(conv.id)}>
                                <Pin className="h-4 w-4 mr-2" />
                                {conv.pinned ? 'Unpin' : 'Pin'}
                              </DropdownMenuItem>
                            )}
                            {onStar && (
                              <DropdownMenuItem onClick={() => onStar(conv.id)}>
                                <Star className="h-4 w-4 mr-2" />
                                {conv.starred ? 'Unstar' : 'Star'}
                              </DropdownMenuItem>
                            )}
                            {onArchive && (
                              <DropdownMenuItem onClick={() => onArchive(conv.id)}>
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => onDelete(conv.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
