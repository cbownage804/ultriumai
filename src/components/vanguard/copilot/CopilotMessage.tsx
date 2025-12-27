import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Bot, User, Copy, Check, Volume2, VolumeX, Shield, AlertTriangle, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CopilotMessageProps {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  toolsUsed?: string[];
  actions?: Array<{
    label: string;
    action: string;
    variant?: 'default' | 'destructive' | 'outline';
    icon?: string;
  }>;
  onAction?: (action: string) => void;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
  onStopSpeaking?: () => void;
}

export function CopilotMessage({
  id,
  role,
  content,
  timestamp,
  isStreaming,
  toolsUsed,
  actions,
  onAction,
  onSpeak,
  isSpeaking,
  onStopSpeaking,
}: CopilotMessageProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [displayedContent, setDisplayedContent] = useState('');
  const contentRef = useRef(content);

  // Typing animation for streaming
  useEffect(() => {
    if (role === 'assistant' && isStreaming) {
      setDisplayedContent(content);
    } else {
      setDisplayedContent(content);
    }
    contentRef.current = content;
  }, [content, role, isStreaming]);

  const copyMessage = async () => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderContent = (text: string) => {
    // Parse markdown-like formatting
    const lines = text.split('\n');
    
    return lines.map((line, i) => {
      // Code blocks
      if (line.startsWith('```')) {
        return null; // Handle in block parser
      }
      
      // Headers
      if (line.startsWith('### ')) {
        return (
          <h4 key={i} className="text-sm font-semibold text-[hsl(var(--copilot-accent))] mt-3 mb-1">
            {line.slice(4)}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={i} className="text-base font-semibold text-[hsl(var(--copilot-accent))] mt-4 mb-2">
            {line.slice(3)}
          </h3>
        );
      }
      
      // Bullet points
      if (line.startsWith('- ') || line.startsWith('• ')) {
        const content = line.slice(2);
        return (
          <div key={i} className="flex items-start gap-2 ml-2 my-0.5">
            <span className="text-[hsl(var(--copilot-accent))] mt-1.5">•</span>
            <span>{renderInlineFormatting(content)}</span>
          </div>
        );
      }
      
      // Threat indicators
      if (line.includes('🔴') || line.includes('CRITICAL')) {
        return (
          <div key={i} className="flex items-center gap-2 p-2 rounded bg-[hsl(var(--threat-critical)/0.1)] border border-[hsl(var(--threat-critical)/0.3)] my-1">
            <AlertTriangle className="h-4 w-4 text-[hsl(var(--threat-critical))]" />
            <span className="text-[hsl(var(--threat-critical))]">{renderInlineFormatting(line)}</span>
          </div>
        );
      }
      
      if (line.includes('✅') || line.includes('SECURE') || line.includes('looking good')) {
        return (
          <div key={i} className="flex items-center gap-2 p-2 rounded bg-[hsl(var(--copilot-accent)/0.1)] border border-[hsl(var(--copilot-accent)/0.3)] my-1">
            <Shield className="h-4 w-4 text-[hsl(var(--copilot-accent))]" />
            <span className="text-[hsl(var(--copilot-accent))]">{renderInlineFormatting(line)}</span>
          </div>
        );
      }
      
      // Regular paragraph
      if (line.trim()) {
        return (
          <p key={i} className="mb-1.5 last:mb-0 leading-relaxed">
            {renderInlineFormatting(line)}
          </p>
        );
      }
      
      return <br key={i} />;
    });
  };

  const renderInlineFormatting = (text: string) => {
    // Handle bold, inline code, etc.
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    
    return parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className="font-semibold text-[hsl(var(--copilot-text))]">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={j} className="px-1.5 py-0.5 rounded bg-[hsl(var(--copilot-surface))] text-[hsl(var(--copilot-accent))] font-mono text-xs">
            {part.slice(1, -1)}
          </code>
        );
      }
      return <span key={j}>{part}</span>;
    });
  };

  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "flex gap-3",
        isUser ? "justify-end" : ""
      )}
    >
      {/* AI Avatar */}
      {!isUser && (
        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--copilot-accent))] to-[hsl(var(--cyber-purple))] flex items-center justify-center shadow-lg shadow-[hsl(var(--copilot-accent)/0.3)]">
            <Bot className="h-4 w-4 text-black" />
          </div>
          {isStreaming && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[hsl(var(--copilot-accent))] animate-pulse" />
          )}
        </div>
      )}
      
      {/* Message Content */}
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-4 py-3 shadow-lg",
          isUser 
            ? "bg-gradient-to-r from-[hsl(var(--copilot-accent))] to-[hsl(var(--cyber-purple))] text-black"
            : "bg-[hsl(var(--copilot-surface))] border border-[hsl(var(--copilot-border))] text-[hsl(var(--copilot-text))]"
        )}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none text-inherit">
          {renderContent(displayedContent)}
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-0.5 bg-[hsl(var(--copilot-accent))] animate-pulse" />
          )}
        </div>
        
        {/* Tools Used */}
        {toolsUsed && toolsUsed.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-[hsl(var(--copilot-border))]">
            {toolsUsed.map((tool, i) => (
              <Badge 
                key={i} 
                variant="outline" 
                className="text-[10px] bg-[hsl(var(--copilot-accent)/0.1)] border-[hsl(var(--copilot-accent)/0.3)] text-[hsl(var(--copilot-accent))]"
              >
                {tool.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Action Buttons */}
        {actions && actions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-[hsl(var(--copilot-border))]">
            {actions.map((action, i) => (
              <Button
                key={i}
                size="sm"
                variant={action.variant || "outline"}
                onClick={() => onAction?.(action.action)}
                className={cn(
                  "h-7 text-xs",
                  action.variant === 'destructive' 
                    ? "bg-[hsl(var(--threat-critical)/0.2)] border-[hsl(var(--threat-critical)/0.5)] text-[hsl(var(--threat-critical))] hover:bg-[hsl(var(--threat-critical)/0.3)]"
                    : "bg-[hsl(var(--copilot-accent)/0.1)] border-[hsl(var(--copilot-accent)/0.3)] text-[hsl(var(--copilot-accent))] hover:bg-[hsl(var(--copilot-accent)/0.2)]"
                )}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
        
        {/* Message Actions */}
        {!isUser && id !== 'welcome' && !isStreaming && (
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-[hsl(var(--copilot-border))]">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] text-[hsl(var(--copilot-text-muted))] hover:text-[hsl(var(--copilot-text))] hover:bg-[hsl(var(--copilot-surface-hover))]"
              onClick={copyMessage}
            >
              {copiedId === id ? (
                <Check className="h-3 w-3 mr-1 text-[hsl(var(--copilot-accent))]" />
              ) : (
                <Copy className="h-3 w-3 mr-1" />
              )}
              {copiedId === id ? 'Copied' : 'Copy'}
            </Button>
            
            {onSpeak && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-[hsl(var(--copilot-text-muted))] hover:text-[hsl(var(--copilot-text))] hover:bg-[hsl(var(--copilot-surface-hover))]"
                onClick={() => isSpeaking ? onStopSpeaking?.() : onSpeak(content)}
              >
                {isSpeaking ? (
                  <>
                    <Square className="h-3 w-3 mr-1 text-[hsl(var(--copilot-accent))]" />
                    Stop
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3 w-3 mr-1" />
                    Speak
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--cyber-purple))] to-[hsl(var(--primary))] flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-white" />
        </div>
      )}
    </motion.div>
  );
}
