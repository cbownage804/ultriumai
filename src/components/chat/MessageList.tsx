import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { ChatMessage } from "@/types/chat";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  copiedMessageId: string | null;
  onCopyMessage: (content: string, messageId: string) => void;
}

export const MessageList = ({ messages, isLoading, copiedMessageId, onCopyMessage }: MessageListProps) => {
  return (
    <ScrollArea className="flex-1 p-4 min-h-0">
      <div className="space-y-4 pb-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            copiedMessageId={copiedMessageId}
            onCopyMessage={onCopyMessage}
          />
        ))}
        
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
              <AvatarFallback>
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-lg p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};