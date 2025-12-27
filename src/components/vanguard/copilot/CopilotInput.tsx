import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, MicOff, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopilotInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading?: boolean;
  isListening?: boolean;
  onToggleVoice?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CopilotInput({
  value,
  onChange,
  onSend,
  isLoading,
  isListening,
  onToggleVoice,
  placeholder = "Ask Vanguard AI anything...",
  disabled,
}: CopilotInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading && !disabled) {
        onSend();
      }
    }
  };

  return (
    <div className="relative">
      {/* Glow effect when focused */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -inset-0.5 bg-gradient-to-r from-[hsl(var(--copilot-accent)/0.3)] via-[hsl(var(--cyber-purple)/0.3)] to-[hsl(var(--copilot-accent)/0.3)] rounded-xl blur-sm"
          />
        )}
      </AnimatePresence>
      
      <div 
        className={cn(
          "relative flex items-end gap-2 p-2 rounded-xl transition-all duration-200",
          "bg-[hsl(var(--copilot-surface))] border border-[hsl(var(--copilot-border))]",
          isFocused && "border-[hsl(var(--copilot-accent)/0.5)]"
        )}
      >
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-[hsl(var(--copilot-accent)/0.5)] rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-[hsl(var(--copilot-accent)/0.5)] rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-[hsl(var(--copilot-accent)/0.5)] rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-[hsl(var(--copilot-accent)/0.5)] rounded-br-lg" />
        
        {/* Voice Input Button */}
        {onToggleVoice && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleVoice}
            disabled={disabled}
            className={cn(
              "h-9 w-9 rounded-lg flex-shrink-0 transition-all",
              isListening 
                ? "bg-[hsl(var(--threat-critical)/0.2)] text-[hsl(var(--threat-critical))] hover:bg-[hsl(var(--threat-critical)/0.3)]" 
                : "text-[hsl(var(--copilot-text-muted))] hover:text-[hsl(var(--copilot-accent))] hover:bg-[hsl(var(--copilot-surface-hover))]"
            )}
          >
            {isListening ? (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <MicOff className="h-4 w-4" />
              </motion.div>
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        )}
        
        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={isLoading || disabled}
            rows={1}
            className={cn(
              "w-full resize-none bg-transparent border-none outline-none",
              "text-[hsl(var(--copilot-text))] placeholder:text-[hsl(var(--copilot-text-muted))]",
              "text-sm leading-relaxed py-2 px-1",
              "scrollbar-thin scrollbar-thumb-[hsl(var(--copilot-border))] scrollbar-track-transparent"
            )}
            style={{ maxHeight: '150px' }}
          />
          
          {/* Voice listening indicator */}
          {isListening && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pr-2"
            >
              <div className="flex items-center gap-0.5">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-0.5 bg-[hsl(var(--threat-critical))] rounded-full"
                    animate={{ height: [8, 16, 8] }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 0.5, 
                      delay: i * 0.1,
                      ease: "easeInOut" 
                    }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-[hsl(var(--threat-critical))]">Listening...</span>
            </motion.div>
          )}
        </div>
        
        {/* Send Button */}
        <Button
          type="button"
          onClick={onSend}
          disabled={isLoading || disabled || !value.trim()}
          size="icon"
          className={cn(
            "h-9 w-9 rounded-lg flex-shrink-0 transition-all",
            value.trim() && !isLoading
              ? "bg-gradient-to-r from-[hsl(var(--copilot-accent))] to-[hsl(var(--cyber-purple))] text-black shadow-lg shadow-[hsl(var(--copilot-accent)/0.3)] hover:shadow-[hsl(var(--copilot-accent)/0.5)]"
              : "bg-[hsl(var(--copilot-surface-hover))] text-[hsl(var(--copilot-text-muted))]"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {/* Typing hint */}
      <div className="flex items-center justify-between mt-1.5 px-1">
        <span className="text-[10px] text-[hsl(var(--copilot-text-muted))]">
          Press Enter to send, Shift+Enter for new line
        </span>
        <div className="flex items-center gap-1 text-[10px] text-[hsl(var(--copilot-accent))]">
          <Sparkles className="h-3 w-3" />
          <span>AI-Powered</span>
        </div>
      </div>
    </div>
  );
}
