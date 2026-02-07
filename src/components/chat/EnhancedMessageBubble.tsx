import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  User, 
  Copy, 
  Check, 
  Clock, 
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Sparkles
} from "lucide-react";
import { ChatMessage } from "@/types/chat";
import EnhancedDocumentExport from "@/components/gpt/EnhancedDocumentExport";
import { CleanMarkdownRenderer } from "./CleanMarkdownRenderer";
import { motion } from "framer-motion";

interface EnhancedMessageBubbleProps {
  message: ChatMessage;
  copiedMessageId: string | null;
  onCopyMessage: (content: string, messageId: string) => void;
  gptName?: string;
  showExport?: boolean;
  themeColor?: string;
  onRegenerate?: () => void;
  onFeedback?: (type: 'positive' | 'negative') => void;
}

export const EnhancedMessageBubble = ({ 
  message, 
  copiedMessageId, 
  onCopyMessage, 
  gptName = "AI Assistant", 
  showExport = true,
  themeColor = "#3b82f6",
  onRegenerate,
  onFeedback
}: EnhancedMessageBubbleProps) => {
  const [feedbackGiven, setFeedbackGiven] = useState<'positive' | 'negative' | null>(null);
  
  // Determine if this is a "document-like" response (longer content from assistant)
  const isDocumentResponse = message.role === 'assistant' && message.content.length > 200;

  const handleFeedback = (type: 'positive' | 'negative') => {
    setFeedbackGiven(type);
    onFeedback?.(type);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 500, 
        damping: 30,
        mass: 0.8
      }}
      layout
      className={`flex gap-3 ${
        message.role === 'user' ? 'justify-end' : 'justify-start'
      }`}
    >
      {message.role === 'assistant' && (
        <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
          <AvatarFallback style={{ backgroundColor: themeColor }} className="text-white text-sm">
            {gptName.charAt(0)}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-[85%] rounded-lg relative group ${
        message.role === 'user' 
          ? 'bg-primary text-primary-foreground p-3' 
          : 'bg-muted p-4'
      }`}>
        {/* Content - Use clean markdown for assistant, plain text for user */}
        {message.role === 'assistant' ? (
          <CleanMarkdownRenderer content={message.content} />
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        )}

        {/* Metadata & Actions */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30 gap-2">
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
            {message.role === 'assistant' && isDocumentResponse && (
              <Badge variant="outline" className="text-[10px] h-5">
                <Sparkles className="h-2.5 w-2.5 mr-1" />
                Document
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {/* Feedback buttons for assistant messages */}
            {message.role === 'assistant' && onFeedback && !feedbackGiven && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                  onClick={() => handleFeedback('positive')}
                >
                  <ThumbsUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                  onClick={() => handleFeedback('negative')}
                >
                  <ThumbsDown className="h-3 w-3" />
                </Button>
              </>
            )}
            
            {feedbackGiven && (
              <Badge variant="outline" className="text-[10px] h-5">
                {feedbackGiven === 'positive' ? (
                  <ThumbsUp className="h-2.5 w-2.5 mr-1" />
                ) : (
                  <ThumbsDown className="h-2.5 w-2.5 mr-1" />
                )}
                Thanks!
              </Badge>
            )}

            {/* Regenerate button */}
            {message.role === 'assistant' && onRegenerate && (
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                onClick={onRegenerate}
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
            
            {/* Export button for document-like assistant responses */}
            {showExport && isDocumentResponse && message.role === 'assistant' && (
              <EnhancedDocumentExport
                content={message.content}
                title="Generated Document"
                gptName={gptName}
              />
            )}
            
            {/* Copy button */}
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
              onClick={() => onCopyMessage(message.content, message.id)}
            >
              {copiedMessageId === message.id ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {message.role === 'user' && (
        <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
          <AvatarFallback className="bg-secondary">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  );
};
