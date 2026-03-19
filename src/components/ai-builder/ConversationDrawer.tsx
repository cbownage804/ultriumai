/**
 * Wave 9 Step 1: Conversation History Drawer
 * Shows past conversations with switch/delete actions.
 */

import { X, MessageSquare, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConversationRecord } from '@/hooks/useConversationHistory';
import { format } from 'date-fns';

interface ConversationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: ConversationRecord[];
  activeConversationId: string | null;
  onSwitch: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export function ConversationDrawer({
  isOpen, onClose, conversations, activeConversationId,
  onSwitch, onDelete, onNew,
}: ConversationDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-40 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-72 bg-[#0d0d18] border-r border-white/[0.06] flex flex-col animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-white/40" />
            <span className="text-sm font-medium text-white/80">Conversations</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onNew}
              className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
              title="New conversation"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onClose}
              className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto p-2 space-y-0.5">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-white/20 text-xs">No conversations yet</div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => { onSwitch(conv.id); onClose(); }}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg transition-colors group",
                  conv.id === activeConversationId
                    ? "bg-white/[0.08] text-white/80"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white/70"
                )}
              >
                <div className="text-[12px] font-medium truncate">{conv.title}</div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[10px] text-white/25">
                    {format(conv.updatedAt, 'MMM d, h:mm a')}
                  </span>
                  <span className="text-[10px] text-white/20">{conv.messages.length} msgs</span>
                </div>
                {/* Delete button on hover */}
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded flex items-center justify-center text-white/0 group-hover:text-white/20 hover:!text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
