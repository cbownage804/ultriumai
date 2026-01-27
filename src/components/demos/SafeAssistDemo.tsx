import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, 
  Send, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  MessageSquare,
  Sparkles,
  Lock,
  Eye,
  FileSearch,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'recommendation' | 'alert' | 'analysis';
}

interface QuickAction {
  icon: React.ElementType;
  label: string;
  prompt: string;
}

interface CompactProps {
  compactMode?: boolean;
}

const quickActions: QuickAction[] = [
  { icon: Shield, label: 'Security Best Practices', prompt: 'What are the top security best practices I should follow?' },
  { icon: AlertTriangle, label: 'Threat Analysis', prompt: 'Can you analyze this suspicious email I received?' },
  { icon: Lock, label: 'Password Help', prompt: 'How can I create strong, unique passwords?' },
  { icon: Eye, label: 'Privacy Tips', prompt: 'How do I protect my privacy online?' },
  { icon: FileSearch, label: 'Breach Check', prompt: 'How do I check if my data was in a breach?' },
  { icon: HelpCircle, label: 'Incident Response', prompt: 'I think I clicked a phishing link. What should I do?' },
];

const sampleResponses: Record<string, string> = {
  'What are the top security best practices I should follow?': `Great question! Here are the **top 5 security best practices** everyone should follow:

1. **Use a Password Manager** 🔐
   - Generate unique, complex passwords for every account
   - Never reuse passwords across sites

2. **Enable Two-Factor Authentication (2FA)** 📱
   - Use authenticator apps over SMS when possible
   - Enable on all critical accounts (email, banking, social)

3. **Keep Software Updated** ⬆️
   - Enable automatic updates on all devices
   - Don't ignore security patches

4. **Be Cautious with Links & Attachments** ⚠️
   - Verify sender before clicking
   - Hover over links to check the actual URL

5. **Regular Backups** 💾
   - Follow the 3-2-1 rule: 3 copies, 2 media types, 1 offsite

Would you like me to go deeper into any of these topics?`,

  'How can I create strong, unique passwords?': `Here's how to create **bulletproof passwords**:

**The Formula for Strong Passwords:**
- Minimum 16 characters (longer is better)
- Mix uppercase, lowercase, numbers, and symbols
- Never use personal information

**Best Approach: Use a Passphrase** 🎯
Example: \`Correct-Horse-Battery-Staple-42!\`
- Easy to remember, hard to crack

**Even Better: Use SafePass** 🔐
- Generates random 20+ character passwords
- Stores them securely with zero-knowledge encryption
- Auto-fills across all your devices

**Quick Tips:**
✅ Never reuse passwords
✅ Change passwords after any breach notification
✅ Enable 2FA as an extra layer

Want me to help you set up SafePass for your accounts?`,

  'I think I clicked a phishing link. What should I do?': `🚨 **Don't panic!** Here's your immediate action plan:

**Step 1: Disconnect (if malware suspected)**
- Disconnect from WiFi/ethernet
- Don't enter any credentials

**Step 2: Change Passwords Immediately**
- Start with your email account
- Then banking and financial accounts
- Use a clean device if possible

**Step 3: Enable 2FA Everywhere**
- This prevents attackers even if they have your password

**Step 4: Scan Your Device**
- Run a full antivirus scan
- Use SafeScan to check for threats

**Step 5: Monitor for Suspicious Activity**
- Check bank statements
- Review email sent folder
- Enable login alerts

**Step 6: Report the Phishing Attempt**
- Forward to your IT department
- Report to the impersonated company

Would you like me to help you run a security scan or check for compromised accounts?`,

  'How do I protect my privacy online?': `Here's your **privacy protection checklist**:

**Browser & Tracking** 🌐
- Use a privacy-focused browser (Firefox, Brave)
- Install an ad blocker (uBlock Origin)
- Enable "Do Not Track" settings
- Clear cookies regularly

**Social Media** 📱
- Review privacy settings quarterly
- Limit personal info in profiles
- Be cautious with location sharing

**Accounts & Data** 🔒
- Use unique emails for different services
- Opt out of data broker sites
- Review app permissions regularly

**Communication** 💬
- Use end-to-end encrypted messaging (Signal)
- Be aware of what you share in emails

**SafeWeb can help** by monitoring if your data appears on the dark web or in data broker databases.

Want me to run a privacy check for your email address?`,
};

export const SafeAssistDemo = ({ compactMode = false }: CompactProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm **SafeAssist**, your AI-powered security advisor. 🛡️

I can help you with:
- Security best practices and recommendations
- Threat analysis and incident response
- Password and privacy guidance
- Understanding security alerts

How can I help you stay secure today?`,
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (prompt?: string) => {
    const messageText = prompt || input;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const response = sampleResponses[messageText] || 
      `I understand you're asking about "${messageText}". 

As your security assistant, I can help you with:
- **Threat Analysis**: Understanding and responding to security incidents
- **Best Practices**: Recommendations for staying secure
- **Tool Guidance**: How to use SafeSuite tools effectively

Try asking about specific security topics, or use the quick actions below for common questions.`;

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      type: 'recommendation'
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn('flex flex-col', compactMode ? 'h-[450px]' : 'min-h-[600px]')}>
      {!compactMode && (
        <div className="text-center mb-4 px-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Bot className="h-8 w-8 text-emerald-500" />
            <h3 className="text-2xl font-bold">SafeAssist AI</h3>
          </div>
          <p className="text-muted-foreground">Your 24/7 AI-powered security advisor</p>
        </div>
      )}

      <Card className={cn('flex-1 flex flex-col', compactMode ? '' : 'mx-4')}>
        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-emerald-500" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg p-3',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <div 
                    className="text-sm prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: message.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br />')
                        .replace(/`(.*?)`/g, '<code class="bg-background/50 px-1 rounded text-xs">$1</code>')
                    }}
                  />
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        {!compactMode && messages.length <= 2 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-muted-foreground mb-2">Quick actions:</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.slice(0, 4).map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleSend(action.prompt)}
                >
                  <action.icon className="h-3 w-3 mr-1" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about security..."
              className="flex-1"
              disabled={isTyping}
            />
            <Button onClick={() => handleSend()} disabled={!input.trim() || isTyping}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            SafeAssist provides security guidance. For emergencies, contact your IT team.
          </p>
        </div>
      </Card>

      {/* Demo Footer */}
      {!compactMode && (
        <Card className="mx-4 mt-4 border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-4">
              <Badge className="bg-emerald-500/20 text-emerald-500">
                <Sparkles className="h-3 w-3 mr-1" />
                AI-Powered
              </Badge>
              <Badge variant="outline">
                <Lock className="h-3 w-3 mr-1" />
                Private & Secure
              </Badge>
              <Badge variant="outline">
                <MessageSquare className="h-3 w-3 mr-1" />
                24/7 Available
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
