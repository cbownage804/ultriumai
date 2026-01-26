import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, Loader2 } from "lucide-react";
import { EnhancedMessageBubble } from "./EnhancedMessageBubble";
import { TemplateWelcomeScreen } from "./TemplateWelcomeScreen";
import { ChatMessage } from "@/types/chat";
import { motion, AnimatePresence } from "framer-motion";

interface EnhancedMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  copiedMessageId: string | null;
  onCopyMessage: (content: string, messageId: string) => void;
  gptName?: string;
  gptDescription?: string;
  features?: string[];
  starterQuestions?: string[];
  themeColor?: string;
  category?: string;
  showExport?: boolean;
  onQuestionSelect?: (question: string) => void;
  onRegenerate?: () => void;
  onFeedback?: (type: 'positive' | 'negative') => void;
}

export const EnhancedMessageList = ({ 
  messages, 
  isLoading, 
  copiedMessageId, 
  onCopyMessage, 
  gptName = "AI Assistant",
  gptDescription,
  features = [],
  starterQuestions = [],
  themeColor = "#3b82f6",
  category,
  showExport = true,
  onQuestionSelect,
  onRegenerate,
  onFeedback
}: EnhancedMessageListProps) => {
  // Check if we should show the welcome screen (no user messages yet)
  const hasUserMessages = messages.some(m => m.role === 'user');
  const showWelcome = !hasUserMessages && messages.length <= 1;

  return (
    <ScrollArea className="flex-1 p-4 min-h-0">
      <AnimatePresence mode="wait">
        {showWelcome && onQuestionSelect ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <TemplateWelcomeScreen
              gptName={gptName}
              description={gptDescription}
              features={features}
              starterQuestions={starterQuestions}
              themeColor={themeColor}
              category={category}
              onQuestionSelect={onQuestionSelect}
            />
          </motion.div>
        ) : (
          <motion.div
            key="messages"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4 pb-4"
          >
            {messages.map((message, index) => (
              <EnhancedMessageBubble
                key={message.id}
                message={message}
                copiedMessageId={copiedMessageId}
                onCopyMessage={onCopyMessage}
                gptName={gptName}
                showExport={showExport}
                themeColor={themeColor}
                onRegenerate={index === messages.length - 1 && message.role === 'assistant' ? onRegenerate : undefined}
                onFeedback={message.role === 'assistant' ? onFeedback : undefined}
              />
            ))}
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 justify-start"
              >
                <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                  <AvatarFallback style={{ backgroundColor: themeColor }} className="text-white text-sm">
                    {gptName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Generating response...</span>
                  </div>
                  <div className="flex gap-1 mt-2">
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </ScrollArea>
  );
};
