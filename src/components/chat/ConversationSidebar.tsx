import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageSquare, Search, X, Trash2, Edit2, Check, Clock, MessageSquarePlus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Conversation } from "@/types/chat";
import { GPTConversation } from "@/hooks/useGPTConversations";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

// Support both Conversation and GPTConversation types
type ConversationType = Conversation | GPTConversation;

interface ConversationSidebarProps {
  conversations: ConversationType[];
  currentConversationId: string | null;
  onConversationClick?: (conversation: Conversation) => void;
  onSelectConversation?: (conversation: GPTConversation) => void;
  onNewConversation: () => void;
  onDeleteConversation: (conversationId: string) => void;
  onRenameConversation?: (id: string, newTitle: string) => void;
  isLoading?: boolean;
  themeColor?: string;
}

const ConversationSidebar = ({
  conversations,
  currentConversationId,
  onConversationClick,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  isLoading,
  themeColor = '#3b82f6'
}: ConversationSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredConversations, setFilteredConversations] = useState<ConversationType[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(conv => {
        const title = conv.title || '';
        return title.toLowerCase().includes(searchQuery.toLowerCase());
      });
      setFilteredConversations(filtered);
    }
  }, [conversations, searchQuery]);

  const handleClick = (conv: ConversationType) => {
    if (onSelectConversation) {
      onSelectConversation(conv as GPTConversation);
    } else if (onConversationClick) {
      onConversationClick(conv as Conversation);
    }
  };

  const handleDelete = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(conversationId);
    await onDeleteConversation(conversationId);
    setDeletingId(null);
  };

  const startEditing = (conv: ConversationType, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title || '');
  };

  const saveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingId && editTitle.trim() && onRenameConversation) {
      onRenameConversation(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle('');
  };

  const getUpdatedAt = (conv: ConversationType): string => {
    return conv.updated_at;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 space-y-2">
        <Button 
          onClick={onNewConversation} 
          className="w-full gap-2" 
          style={{ backgroundColor: themeColor }}
          disabled={isLoading}
        >
          <MessageSquarePlus className="w-4 h-4" />
          New Chat
        </Button>
        
        {conversations.length > 3 && (
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 text-sm"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-7 w-7 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <AnimatePresence mode="popLayout">
            {filteredConversations.length === 0 && conversations.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 px-4"
              >
                <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground text-sm font-medium">No conversations yet</p>
                <p className="text-muted-foreground/70 text-xs mt-1">Start a new chat above</p>
              </motion.div>
            )}
            
            {filteredConversations.length === 0 && conversations.length > 0 && (
              <div className="text-center py-6 px-4">
                <Search className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground text-sm">No matches found</p>
              </div>
            )}

            {filteredConversations.map((conversation, index) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card
                  className={`group p-3 cursor-pointer transition-all ${
                    currentConversationId === conversation.id 
                      ? 'bg-primary/10 border-primary/30 shadow-sm' 
                      : 'hover:bg-muted/50 border-transparent'
                  }`}
                  onClick={() => handleClick(conversation)}
                >
                  {editingId === conversation.id ? (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(e as any);
                          if (e.key === 'Escape') cancelEdit(e as any);
                        }}
                        className="h-7 text-sm"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={saveEdit}>
                        <Check className="w-3 h-3 text-emerald-600" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={cancelEdit}>
                        <X className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {conversation.title || 'Untitled Chat'}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(getUpdatedAt(conversation)), { addSuffix: true })}
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 shrink-0">
                        {onRenameConversation && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => startEditing(conversation, e)}
                          >
                            <Edit2 className="h-3 h-3" />
                          </Button>
                        )}
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:text-destructive"
                              onClick={(e) => e.stopPropagation()}
                              disabled={deletingId === conversation.id}
                            >
                              {deletingId === conversation.id ? (
                                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this conversation and all messages.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={(e) => handleDelete(conversation.id, e)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ConversationSidebar;
