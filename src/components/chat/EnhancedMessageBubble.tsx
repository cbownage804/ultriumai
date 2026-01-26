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
import ReactMarkdown from "react-markdown";
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
  
  // Detect if content contains code blocks or structured content
  const hasCodeBlocks = message.content.includes('```');
  const hasLists = message.content.includes('\n-') || message.content.includes('\n1.');
  const hasHeadings = message.content.includes('\n#') || message.content.includes('\n##');
  const isStructured = hasCodeBlocks || hasLists || hasHeadings;

  const handleFeedback = (type: 'positive' | 'negative') => {
    setFeedbackGiven(type);
    onFeedback?.(type);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
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
        {/* Content */}
        {message.role === 'assistant' && isStructured ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                code({ node, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match;
                  
                  if (isInline) {
                    return (
                      <code className="bg-background/50 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                        {children}
                      </code>
                    );
                  }
                  
                  return (
                    <div className="relative my-3">
                      <div className="flex items-center justify-between bg-background/80 px-3 py-1.5 rounded-t border border-b-0 text-xs">
                        <span className="text-muted-foreground font-medium">{match[1]}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => onCopyMessage(String(children), `${message.id}-code`)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <pre className="bg-background/50 p-3 rounded-b border overflow-x-auto">
                        <code className={`${className} text-sm`} {...props}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  );
                },
                h1: ({ children }) => (
                  <h1 className="text-lg font-bold mt-4 mb-2 flex items-center gap-2">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-base font-semibold mt-3 mb-2 flex items-center gap-2 border-b pb-1">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-4 space-y-1 my-2">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-4 space-y-1 my-2">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="text-sm">{children}</li>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-3">
                    <table className="min-w-full border text-sm">{children}</table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border px-3 py-2 bg-muted/50 text-left font-medium">{children}</th>
                ),
                td: ({ children }) => (
                  <td className="border px-3 py-2">{children}</td>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary/50 pl-4 my-2 italic text-muted-foreground">
                    {children}
                  </blockquote>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">{children}</strong>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
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
