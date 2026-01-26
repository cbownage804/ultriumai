import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { GPTTemplate } from "@/types/templates";
import { Send, Bot, User, Sparkles, Download, Play, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface TemplatePreviewDemoProps {
  template: GPTTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstall: (template: GPTTemplate) => void;
  isInstalling?: boolean;
  canInstall?: boolean;
}

interface DemoMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// Simulated responses based on template type
const getSimulatedResponse = (template: GPTTemplate, userMessage: string): string => {
  const category = template.category.toLowerCase();
  const name = template.name.toLowerCase();
  
  // Generic helpful responses based on category
  if (category.includes("cybersecurity") || category.includes("security")) {
    return `Based on my security analysis capabilities, I can help you with that. For "${userMessage}", I would recommend:\n\n1. **Initial Assessment**: Review current security posture\n2. **Risk Analysis**: Identify potential vulnerabilities\n3. **Remediation Steps**: Implement security controls\n\nWould you like me to elaborate on any of these areas?`;
  }
  
  if (category.includes("it") || category.includes("infrastructure")) {
    return `I can definitely help with that IT question. Here's my approach to "${userMessage}":\n\n• **Diagnosis**: Let me gather some information first\n• **Troubleshooting**: Check common causes\n• **Resolution**: Provide step-by-step solution\n\nWhat specific details can you share about your environment?`;
  }
  
  if (category.includes("development") || category.includes("software")) {
    return `Great development question! For "${userMessage}", here's my recommendation:\n\n\`\`\`\n// Example approach\nconst solution = {\n  pattern: "best-practice",\n  scalable: true,\n  maintainable: true\n};\n\`\`\`\n\nWould you like me to provide more detailed code examples?`;
  }
  
  if (category.includes("business") || category.includes("intelligence")) {
    return `Excellent question for business analysis. Regarding "${userMessage}":\n\n📊 **Key Insights**:\n- Data-driven approach recommended\n- Consider stakeholder impact\n- ROI analysis available\n\n📈 **Next Steps**:\n1. Define metrics\n2. Gather baseline data\n3. Implement tracking\n\nShall I create a detailed analysis framework?`;
  }
  
  // Default response
  return `Thank you for your question about "${userMessage}". As ${template.name}, I'm designed to help with ${template.category.toLowerCase()} tasks.\n\nHere's how I can assist:\n\n✅ ${template.features[0] || "Expert guidance"}\n✅ ${template.features[1] || "Detailed analysis"}\n✅ ${template.features[2] || "Actionable recommendations"}\n\nWould you like me to dive deeper into any specific area?`;
};

export function TemplatePreviewDemo({
  template,
  open,
  onOpenChange,
  onInstall,
  isInstalling = false,
  canInstall = true
}: TemplatePreviewDemoProps) {
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Reset messages when template changes
  useEffect(() => {
    if (template) {
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: `👋 Welcome to the **${template.name}** preview!\n\nI'm here to demonstrate how this template can help you with ${template.category.toLowerCase()} tasks.\n\n**Try asking me:**\n${template.starter_questions.slice(0, 3).map(q => `• ${q}`).join('\n')}\n\n_This is a demo - install the template to get the full experience!_`
      }]);
    }
  }, [template]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !template || isTyping) return;
    
    const userMessage: DemoMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputValue
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);
    
    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    const response = getSimulatedResponse(template, inputValue);
    
    setMessages(prev => [...prev, {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: response
    }]);
    setIsTyping(false);
  };

  const handleStarterQuestion = (question: string) => {
    setInputValue(question);
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
        {/* Header */}
        <div 
          className="p-4 border-b"
          style={{ backgroundColor: `${template.config.theme_color}10` }}
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${template.config.theme_color}20` }}
                >
                  {template.icon}
                </div>
                <div>
                  <DialogTitle className="flex items-center gap-2">
                    {template.name}
                    <Badge variant="outline" className="ml-2">
                      <Play className="h-3 w-3 mr-1" />
                      Demo Mode
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-1">
                    Try out this template before installing
                  </DialogDescription>
                </div>
              </div>
              <Button 
                onClick={() => onInstall(template)}
                disabled={isInstalling || !canInstall}
                style={{ backgroundColor: template.config.theme_color }}
              >
                {isInstalling ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Install & Use
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </DialogHeader>
        </div>

        {/* Chat Area */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
          <div className="space-y-4 max-w-2xl mx-auto">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "flex-row-reverse" : ""
                  )}
                >
                  <div 
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      message.role === "user" 
                        ? "bg-primary text-primary-foreground"
                        : ""
                    )}
                    style={message.role === "assistant" ? { 
                      backgroundColor: `${template.config.theme_color}20` 
                    } : {}}
                  >
                    {message.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <span className="text-lg">{template.icon}</span>
                    )}
                  </div>
                  <div 
                    className={cn(
                      "rounded-2xl px-4 py-3 max-w-[80%]",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content.split('**').map((part, i) => 
                        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${template.config.theme_color}20` }}
                >
                  <span className="text-lg">{template.icon}</span>
                </div>
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Starter Questions */}
        {messages.length === 1 && (
          <div className="px-4 pb-2">
            <div className="flex gap-2 flex-wrap justify-center">
              {template.starter_questions.slice(0, 3).map((question, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleStarterQuestion(question)}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {question.length > 40 ? question.slice(0, 40) + "..." : question}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t bg-background">
          <div className="flex gap-2 max-w-2xl mx-auto">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={template.config.placeholder_prompt || "Type a message to try the demo..."}
              disabled={isTyping}
              className="flex-1"
            />
            <Button 
              onClick={handleSend} 
              disabled={!inputValue.trim() || isTyping}
              style={{ backgroundColor: template.config.theme_color }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            This is a simulated preview. Install the template for full AI-powered responses.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
