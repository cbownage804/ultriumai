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
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
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
            transition={{ duration: 0.2 }}
            className="space-y-4 pb-4"
          >
            <AnimatePresence initial={false}>
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
            </AnimatePresence>
            
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  key="typing-indicator"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4, transition: { duration: 0.15 } }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="flex gap-3 justify-start"
                >
                  <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                    <AvatarFallback style={{ backgroundColor: themeColor }} className="text-white text-sm">
                      {gptName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="flex gap-1">
                        <motion.span
                          className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        />
                        <motion.span
                          className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                        />
                        <motion.span
                          className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                        />
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </ScrollArea>
  );
};
