import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, Trash2, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

interface CopilotConversationListProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string | null) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function CopilotConversationList({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isOpen,
  onClose
}: CopilotConversationListProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: -280, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -280, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            "absolute inset-y-0 left-0 w-64 z-20",
            "bg-[hsl(var(--copilot-surface))] border-r border-[hsl(var(--copilot-border))]",
            "flex flex-col"
          )}
        >
          {/* Header */}
          <div className="p-3 border-b border-[hsl(var(--copilot-border))] flex items-center justify-between">
            <h3 className="font-semibold text-sm text-[hsl(var(--copilot-text))]">
              Conversations
            </h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={onNewConversation}
                className="h-7 w-7 text-[hsl(var(--copilot-accent))] hover:bg-[hsl(var(--copilot-accent)/0.1)]"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-7 w-7 text-[hsl(var(--copilot-text-muted))] hover:text-[hsl(var(--copilot-text))]"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Conversations List */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations.length === 0 ? (
                <div className="px-3 py-8 text-center text-[hsl(var(--copilot-text-muted))]">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No conversations yet</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onHoverStart={() => setHoveredId(conv.id)}
                    onHoverEnd={() => setHoveredId(null)}
                    onClick={() => onSelectConversation(conv.id)}
                    className={cn(
                      "px-3 py-2 rounded-lg cursor-pointer transition-colors",
                      "flex items-center justify-between gap-2",
                      currentConversationId === conv.id
                        ? "bg-[hsl(var(--copilot-accent)/0.15)] border border-[hsl(var(--copilot-accent)/0.3)]"
                        : "hover:bg-[hsl(var(--copilot-bg))]"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm truncate",
                        currentConversationId === conv.id
                          ? "text-[hsl(var(--copilot-accent))]"
                          : "text-[hsl(var(--copilot-text))]"
                      )}>
                        {conv.title || 'New Conversation'}
                      </p>
                      <p className="text-[10px] text-[hsl(var(--copilot-text-muted))]">
                        {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                      </p>
                    </div>
                    
                    <AnimatePresence>
                      {hoveredId === conv.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-[hsl(var(--threat-critical))] hover:bg-[hsl(var(--threat-critical)/0.1)]"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteConversation(conv.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
