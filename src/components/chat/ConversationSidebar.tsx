import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageSquare, Search, X, Trash2 } from "lucide-react";
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

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onConversationClick: (conversation: Conversation) => void;
  onNewConversation: () => void;
  onDeleteConversation: (conversationId: string) => void;
}

const ConversationSidebar = ({
  conversations,
  currentConversationId,
  onConversationClick,
  onNewConversation,
  onDeleteConversation
}: ConversationSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDelete = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering conversation click
    setDeletingId(conversationId);
    await onDeleteConversation(conversationId);
    setDeletingId(null);
  };

  return (
    <div className="w-80 border-r bg-muted/30 flex flex-col">
      <div className="p-4 border-b space-y-3">
        <Button onClick={onNewConversation} className="w-full" variant="hero">
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
        
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
              className={`group p-3 mb-2 cursor-pointer hover:bg-muted/50 transition-colors ${
                currentConversationId === conversation.id ? 'bg-muted border-primary' : ''
              }`}
              onClick={() => onConversationClick(conversation)}
            >
              <div className="flex items-start gap-3">
                <MessageSquare className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{conversation.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(conversation.updated_at).toLocaleDateString()}
                  </p>
                </div>
                
                {/* Delete Button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                      disabled={deletingId === conversation.id}
                    >
                      {deletingId === conversation.id ? (
                        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{conversation.title}"? This action cannot be undone and will permanently delete all messages in this conversation.
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
  );
};

export default ConversationSidebar;