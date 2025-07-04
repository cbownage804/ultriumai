import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, Copy, Check, Clock, AlertTriangle } from "lucide-react";
import { ChatMessage } from "@/types/chat";

interface MessageBubbleProps {
  message: ChatMessage;
  copiedMessageId: string | null;
  onCopyMessage: (content: string, messageId: string) => void;
}

export const MessageBubble = ({ message, copiedMessageId, onCopyMessage }: MessageBubbleProps) => {
  return (
    <div
      key={message.id}
      className={`flex gap-3 ${
        message.role === 'user' ? 'justify-end' : 'justify-start'
      }`}
    >
      {message.role === 'assistant' && (
        <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
          <AvatarFallback>
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-[80%] rounded-lg p-3 relative group ${
        message.role === 'user' 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted'
      }`}>
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2">
            <p className="text-xs opacity-70">
              {message.timestamp.toLocaleTimeString()}
            </p>
            {message.status && message.role === 'user' && (
              <div className="flex items-center gap-1">
                {message.status === 'sending' && <Clock className="h-3 w-3 opacity-70" />}
                {message.status === 'sent' && <Check className="h-3 w-3 opacity-70" />}
                {message.status === 'error' && <AlertTriangle className="h-3 w-3 opacity-70 text-destructive" />}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
            onClick={() => onCopyMessage(message.content, message.id)}
          >
            {copiedMessageId === message.id ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
      
      {message.role === 'user' && (
        <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};