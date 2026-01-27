import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Sparkles, Play, X, MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface DemoTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  systemPrompt: string;
  starterQuestions: string[];
  themeColor: string;
}

interface TemplateInteractiveDemoProps {
  template: DemoTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DemoMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// Simulated responses based on template type
const getSimulatedResponse = (template: DemoTemplate, userMessage: string): string => {
  const category = template.category.toLowerCase();
  const messageLC = userMessage.toLowerCase();
  
  if (category === "support") {
    if (messageLC.includes("refund") || messageLC.includes("return")) {
      return `I'd be happy to help you with your refund request! 🔄

Here's our refund process:

1. **Eligibility Check**: Items can be returned within 30 days of purchase
2. **Initiate Return**: Go to your order history and click "Return Item"
3. **Ship the Item**: Use our prepaid shipping label
4. **Refund Processing**: 5-7 business days after we receive the item

**Would you like me to:**
- Check your specific order status?
- Start a return request?
- Connect you with our returns team?`;
    }
    if (messageLC.includes("order") || messageLC.includes("shipping") || messageLC.includes("delivery")) {
      return `I can help you track your order! 📦

Let me look that up for you. To provide accurate tracking information, I'll need:
- Your **order number** (starts with #ORD-)
- Or the **email address** used for the purchase

Once you provide these details, I can show you:
✓ Current order status
✓ Estimated delivery date
✓ Real-time tracking link

What order would you like me to check?`;
    }
    return `Thank you for reaching out! I'm here to help with your support needs.

Based on your question about "${userMessage.slice(0, 50)}...", here's what I can assist with:

📋 **Common Support Topics:**
- Order status and tracking
- Returns and refunds
- Product information
- Account management
- Technical issues

How can I help you today? Feel free to provide more details and I'll guide you through the solution.`;
  }
  
  if (category === "sales") {
    if (messageLC.includes("price") || messageLC.includes("cost") || messageLC.includes("pricing")) {
      return `Great question about pricing! 💰

Our pricing is designed to scale with your business:

| Plan | Monthly | Best For |
|------|---------|----------|
| **Starter** | $49/mo | Small teams (1-5 users) |
| **Professional** | $149/mo | Growing businesses (6-25 users) |
| **Enterprise** | Custom | Large organizations |

**What's included in all plans:**
✓ Unlimited AI conversations
✓ Knowledge base integration
✓ Analytics dashboard
✓ Email support

Would you like me to schedule a demo to discuss which plan fits your needs best?`;
    }
    if (messageLC.includes("demo") || messageLC.includes("trial")) {
      return `I'd love to set up a personalized demo for you! 🎯

**What you'll see in the demo:**
- Live product walkthrough
- Custom use case discussion
- ROI analysis for your industry
- Q&A with our product team

**Available slots this week:**
- Tomorrow at 2:00 PM or 4:00 PM
- Friday at 10:00 AM or 3:00 PM

Which time works best for you? I'll also need your email to send the calendar invite.`;
    }
    return `Thanks for your interest! I'm here to help you find the perfect solution. 🚀

Regarding "${userMessage.slice(0, 40)}...", let me provide some insights:

**Quick Overview:**
Our platform helps businesses like yours:
- Reduce support costs by 60%
- Improve response times by 80%
- Scale customer service 24/7

**Next Steps:**
1. I can answer specific questions about features
2. Schedule a personalized demo
3. Provide case studies from your industry

What would be most helpful for you?`;
  }
  
  if (category === "technical") {
    if (messageLC.includes("api") || messageLC.includes("integration") || messageLC.includes("code")) {
      return `Great technical question! Here's the API integration guide: 💻

\`\`\`javascript
// Initialize the UltriumAI client
import { UltriumAI } from '@ultriumai/sdk';

const client = new UltriumAI({
  apiKey: process.env.ULTRIUM_API_KEY,
  gptId: 'your-gpt-id'
});

// Send a message
const response = await client.chat({
  message: "User question here",
  context: { userId: "user123" }
});

console.log(response.message);
\`\`\`

**Documentation links:**
- [API Reference](docs.ultriumai.com/api)
- [SDK Quickstart](docs.ultriumai.com/quickstart)
- [Authentication Guide](docs.ultriumai.com/auth)

Need help with a specific integration scenario?`;
    }
    return `I can help with that technical question! 🔧

For "${userMessage.slice(0, 50)}...", here's what I found:

**Quick Troubleshooting Steps:**
1. Verify your API key is correctly configured
2. Check the endpoint URL format
3. Ensure proper authentication headers
4. Review rate limiting status

**Useful Resources:**
- 📚 Documentation: docs.ultriumai.com
- 💬 Developer Discord: discord.gg/ultriumai
- 🎫 Support Ticket: support.ultriumai.com

Would you like me to dig deeper into any specific area?`;
  }
  
  if (category === "hr") {
    if (messageLC.includes("pto") || messageLC.includes("vacation") || messageLC.includes("time off")) {
      return `I can help with your PTO question! 🏖️

**Your PTO Balance:**
- Available: 15 days
- Used this year: 5 days
- Pending requests: 0 days

**How to Request Time Off:**
1. Go to the HR Portal → Time Off
2. Select your dates
3. Choose PTO type (vacation, personal, sick)
4. Submit for manager approval

**Quick Facts:**
- Requests need 2 weeks notice for 3+ days
- Manager approval typically takes 24-48 hours
- You can view team calendars before requesting

Would you like me to help you submit a PTO request?`;
    }
    if (messageLC.includes("benefit") || messageLC.includes("insurance") || messageLC.includes("health")) {
      return `Here's your benefits information! 🏥

**Your Current Coverage:**
- Medical: Premium PPO Plan
- Dental: Standard Coverage
- Vision: Basic Plan
- 401(k): 6% match

**Open Enrollment:**
- Next period: November 1-15
- You can change plans annually
- Life changes allow mid-year updates

**Resources:**
- Benefits portal: benefits.company.com
- HR contact: hr@company.com
- 24/7 nurse line: 1-800-NURSE

What specific benefit information do you need?`;
    }
    return `I'm here to help with your HR question! 👥

Regarding "${userMessage.slice(0, 40)}...", I can assist with:

**HR Self-Service:**
- 📅 Time off requests
- 💰 Payroll & benefits
- 📋 Policy information
- 🎓 Training & development
- 📝 Performance reviews

**Quick Links:**
- HR Portal: hr.company.com
- Employee Handbook: [link]
- Submit a Ticket: hr@company.com

What specific HR topic can I help you with today?`;
  }
  
  // Default response
  return `Thank you for your message! I'm ${template.name}, designed to help with ${template.category.toLowerCase()} tasks.

Regarding "${userMessage.slice(0, 50)}...", here's how I can assist:

✅ **Quick Actions:**
- Answer your specific questions
- Guide you through processes
- Connect you with the right resources

✅ **My Capabilities:**
- 24/7 availability
- Instant responses
- Knowledge base access

How can I help you further today?`;
};

export function TemplateInteractiveDemo({
  template,
  open,
  onOpenChange,
}: TemplateInteractiveDemoProps) {
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Reset messages when template changes
  useEffect(() => {
    if (template && open) {
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: `👋 Hi there! I'm **${template.name}**, your AI assistant for ${template.category.toLowerCase()} tasks.

I'm here to demonstrate how I can help you. Try asking me something, or use one of the quick actions below!

_This is a demo experience - sign up to deploy your own custom GPT!_`
      }]);
      setInputValue("");
    }
  }, [template, open]);

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
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    
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

  const Icon = template.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <div 
          className="p-4 border-b shrink-0"
          style={{ backgroundColor: `${template.themeColor}15` }}
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className={cn("w-10 h-10 rounded-xl flex items-center justify-center", template.bgColor)}
                >
                  <Icon className={cn("h-5 w-5", template.color)} />
                </div>
                <div>
                  <DialogTitle className="flex items-center gap-2">
                    {template.name}
                    <Badge variant="secondary" className="ml-2 text-xs">
                      <Play className="h-3 w-3 mr-1" />
                      Demo
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-0.5">
                    Interactive demo - try chatting with this AI assistant
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Chat Area */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
          <div className="space-y-4 max-w-xl mx-auto">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
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
                        : template.bgColor
                    )}
                  >
                    {message.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Icon className={cn("h-4 w-4", template.color)} />
                    )}
                  </div>
                  <div 
                    className={cn(
                      "rounded-2xl px-4 py-3 max-w-[85%]",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
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
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", template.bgColor)}>
                  <Icon className={cn("h-4 w-4", template.color)} />
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
        {messages.length <= 1 && template.starterQuestions.length > 0 && (
          <div className="px-4 pb-2 shrink-0">
            <div className="flex gap-2 flex-wrap justify-center">
              {template.starterQuestions.map((question, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-xs h-auto py-2 px-3"
                  onClick={() => handleStarterQuestion(question)}
                >
                  <Sparkles className="h-3 w-3 mr-1.5 shrink-0" />
                  <span className="truncate max-w-[200px]">{question}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t bg-background shrink-0">
          <div className="flex gap-2 max-w-xl mx-auto">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Type a message to try the demo..."
              disabled={isTyping}
              className="flex-1"
            />
            <Button 
              onClick={handleSend} 
              disabled={!inputValue.trim() || isTyping}
              style={{ backgroundColor: template.themeColor }}
            >
              {isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Demo mode • Sign up to create and deploy your own custom GPTs
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
