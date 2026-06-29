import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, 
  Send, 
  AlertTriangle,
  Lock,
  Eye,
  HelpCircle,
  Loader2,
  Key,
  Search,
  Laptop,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import safeassistLogo from '@/assets/safeassist-logo.png';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface QuickQuestion {
  icon: React.ElementType;
  label: string;
  question: string;
  answer: string;
}

interface CompactProps {
  compactMode?: boolean;
}

// Pre-defined questions with Wrayth product recommendations
const quickQuestions: QuickQuestion[] = [
  { 
    icon: Key, 
    label: 'Protect Passwords', 
    question: 'How can I protect my passwords?',
    answer: `Great question! Here's how to **protect your passwords** effectively:

🔐 **Use Vault Password Vault**
Vault is included in your Wrayth subscription and provides:
- **256-bit encryption** for all stored passwords
- **Automatic password generation** - create 20+ character unique passwords instantly
- **Breach monitoring** - get alerted if any of your passwords appear in data leaks
- **Secure sharing** - share credentials with family or team members safely
- **Cross-device sync** - access passwords on all your devices

✅ **Best Practices:**
1. Never reuse passwords across sites
2. Enable two-factor authentication (2FA) on all accounts
3. Use Vault to generate and store unique passwords
4. Change passwords immediately after any breach notification

👉 **Get Started:** Open Vault from your Wrayth dashboard to import your existing passwords and start generating secure ones!`
  },
  { 
    icon: AlertTriangle, 
    label: 'Check for Breaches', 
    question: 'Has my data been exposed in a breach?',
    answer: `I can help you check for data breaches! 🔍

🌐 **Use Watch Dark Web Monitor**
Watch continuously monitors the dark web and data breach databases for your information:

**What Watch Monitors:**
- Email addresses and associated accounts
- Passwords appearing in breach databases
- Personal information on dark web forums
- Company domain exposure
- Credential dumps and leaks

🚨 **If a Breach is Found:**
1. Watch alerts you immediately
2. Shows exactly what data was exposed
3. Provides step-by-step remediation guidance
4. Recommends which passwords to change

**Take Action Now:**
1. Go to the **Watch** tab in Wrayth
2. Enter your email address or domain
3. Run a scan to check for exposures
4. Follow the recommended actions

💡 **Pro Tip:** Set up continuous monitoring to get instant alerts whenever your data appears in new breaches!`
  },
  { 
    icon: Search, 
    label: 'Scan for Threats', 
    question: 'How do I scan files and links for threats?',
    answer: `Scan provides **comprehensive threat detection** for files, emails, URLs, and more! 🛡️

🔍 **Scan Features:**

**Document Scanner**
- Upload any file (PDF, Office docs, executables)
- AI-powered malware detection
- Identifies hidden macros and exploits

**Email Threat Analysis**
- Paste suspicious emails for analysis
- Detects phishing attempts
- Identifies spoofed senders and malicious links

**URL Security Check**
- Scan links before clicking
- Identifies fake login pages
- Checks against known malware sites

**Password Security Analysis**
- Check if passwords appear in breaches
- Get strength ratings and recommendations
- Identify weak or reused passwords

📊 **Scan Results Include:**
✓ Threat level rating (Safe / Warning / Dangerous)
✓ Specific threats detected
✓ Recommended actions
✓ Detailed technical analysis

👉 **Try It:** Go to the **Scan** tab and paste a suspicious URL or upload a file to analyze!`
  },
  { 
    icon: Laptop, 
    label: 'Track My Devices', 
    question: 'How do I manage and secure my devices?',
    answer: `SafeTrack helps you **inventory and manage all your assets**! 📱💻

🏷️ **SafeTrack Asset Management:**

**What You Can Track:**
- Computers and laptops
- Mobile devices (phones, tablets)
- Software licenses
- Network equipment
- IoT devices

**Key Features:**
- **Asset Inventory** - Complete view of all devices
- **Warranty Tracking** - Never miss an expiration
- **License Management** - Track software renewals
- **Lifecycle Management** - Plan replacements
- **Assignment Tracking** - Know who has what

🔒 **Security Benefits:**
- Identify unpatched or outdated devices
- Track devices that need security updates
- Maintain compliance documentation
- Quick response during security incidents

**Getting Started:**
1. Open **SafeTrack** from Wrayth
2. Add your devices manually or import from spreadsheet
3. Set up warranty and license expiration alerts
4. Review the security status dashboard

💡 **Tip:** For businesses, SafeTrack integrates with Vanguard for advanced endpoint monitoring!`
  },
  { 
    icon: HelpCircle, 
    label: 'Phishing Help', 
    question: 'I clicked a suspicious link. What should I do?',
    answer: `🚨 **Don't panic!** Here's your immediate action plan:

**Step 1: Stop & Disconnect (if needed)**
- Close the browser tab immediately
- If you downloaded anything, disconnect from the internet
- Don't enter any passwords or personal info

**Step 2: Change Passwords NOW**
Use **Vault** to quickly:
- Reset your email password first
- Change banking and financial passwords
- Update any accounts using similar passwords

**Step 3: Scan for Threats**
Open **Scan** and:
- Run a full device scan
- Check for any downloaded malware
- Scan the suspicious URL to confirm it's malicious

**Step 4: Check for Exposure**
Use **Watch** to:
- Monitor if your credentials appear in breach databases
- Set up alerts for future exposures
- Check the dark web for your information

**Step 5: Enable Extra Protection**
- Turn on 2FA on all critical accounts
- Enable login alerts for your email
- Review recent account activity

⚠️ **If You Entered Credentials:**
- Change those passwords IMMEDIATELY
- Enable 2FA on that account
- Monitor for unauthorized activity
- Consider credit monitoring if financial info was shared

🛡️ **Wrayth has you covered** at every step of incident response!`
  },
  { 
    icon: Eye, 
    label: 'Privacy Tips', 
    question: 'How can I protect my privacy online?',
    answer: `Here's your **complete privacy protection guide** using Wrayth! 🔒

**🔐 Password Privacy with Vault**
- Use unique passwords for every site (hackers can't link accounts)
- Enable biometric unlock for extra security
- Use the password generator for truly random credentials

**🌐 Breach Monitoring with Watch**
- Monitor your email addresses for exposures
- Get alerted when your data appears on the dark web
- Check if your phone number or address is leaked

**🔍 Link Safety with Scan**
- Scan links before clicking to avoid trackers
- Check if sites are legitimate before entering info
- Identify data-harvesting phishing pages

**📱 Device Security with SafeTrack**
- Keep inventory of devices that have your data
- Know which devices need security updates
- Track software that may have privacy concerns

**🛡️ General Privacy Tips:**
1. Use different email addresses for different purposes
2. Review app permissions regularly
3. Opt out of data broker sites
4. Use private browsing for sensitive searches
5. Enable 2FA everywhere

**Wrayth Privacy Audit:**
Run a scan with each Wrayth tool to get a complete picture of your privacy posture!`
  }
];

const initialMessage = `Hi! I'm **SafeAssist**, your AI-powered security advisor. 🛡️

I can help you with security questions and show you how Wrayth tools protect you.

**Choose a question below** to see how Wrayth can help, or type your own question!`;

export const SafeAssistDemo = ({ compactMode = false }: CompactProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: initialMessage,
      timestamp: new Date()
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

  const handleSend = async (question?: string, answer?: string) => {
    const messageText = question || input;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

    // Use provided answer or find matching question
    let response = answer;
    if (!response) {
      const matchedQuestion = quickQuestions.find(
        q => q.question.toLowerCase() === messageText.toLowerCase()
      );
      response = matchedQuestion?.answer || getGenericResponse(messageText);
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const getGenericResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('password')) {
      const q = quickQuestions.find(q => q.label === 'Protect Passwords');
      return q?.answer || '';
    }
    if (lowerInput.includes('breach') || lowerInput.includes('leak') || lowerInput.includes('dark web')) {
      const q = quickQuestions.find(q => q.label === 'Check for Breaches');
      return q?.answer || '';
    }
    if (lowerInput.includes('scan') || lowerInput.includes('file') || lowerInput.includes('link') || lowerInput.includes('malware')) {
      const q = quickQuestions.find(q => q.label === 'Scan for Threats');
      return q?.answer || '';
    }
    if (lowerInput.includes('device') || lowerInput.includes('computer') || lowerInput.includes('laptop') || lowerInput.includes('asset')) {
      const q = quickQuestions.find(q => q.label === 'Track My Devices');
      return q?.answer || '';
    }
    if (lowerInput.includes('phish') || lowerInput.includes('click') || lowerInput.includes('suspicious')) {
      const q = quickQuestions.find(q => q.label === 'Phishing Help');
      return q?.answer || '';
    }
    if (lowerInput.includes('privacy') || lowerInput.includes('private') || lowerInput.includes('track')) {
      const q = quickQuestions.find(q => q.label === 'Privacy Tips');
      return q?.answer || '';
    }

    return `Thanks for your question! Let me point you to the right Wrayth tool:

🔐 **Vault** - Password storage, generation, and breach monitoring
🔍 **Scan** - Scan files, emails, URLs for threats
🌐 **Watch** - Dark web monitoring for your exposed data
📱 **SafeTrack** - Device and asset inventory management
🤖 **SafeAssist** - That's me! 24/7 security guidance

**Try asking about:**
- "How can I protect my passwords?"
- "Has my data been exposed in a breach?"
- "How do I scan files for threats?"
- "I clicked a suspicious link. What should I do?"

Each Wrayth tool works together to provide complete security coverage!`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showQuickQuestions = messages.length <= 2;

  return (
    <div className={cn('flex flex-col', compactMode ? 'h-[450px]' : 'min-h-[600px]')}>
      {/* Header with SafeAssist branding - centered logo only */}
      {!compactMode && (
        <div className="flex justify-center mb-4 px-4">
          <img src={safeassistLogo} alt="SafeAssist" className="h-28 w-auto" />
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
                    'max-w-[85%] rounded-lg p-3',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <div 
                    className="text-sm whitespace-pre-wrap break-words"
                    dangerouslySetInnerHTML={{ 
                      __html: message.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
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

        {/* Quick Questions */}
        {showQuickQuestions && (
          <div className="px-4 pb-3 border-t pt-3">
            <p className="text-xs text-muted-foreground mb-2">Ask a question:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickQuestions.slice(0, compactMode ? 4 : 6).map((q) => (
                <Button
                  key={q.label}
                  variant="outline"
                  size="sm"
                  className="text-xs h-auto py-2 px-3 justify-start"
                  onClick={() => handleSend(q.question, q.answer)}
                  disabled={isTyping}
                >
                  <q.icon className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span className="truncate">{q.label}</span>
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
            <div className="flex items-center justify-center gap-2 mb-2">
              <img src={safeassistLogo} alt="SafeAssist" className="h-16 w-auto" />
            </div>
            <div className="flex items-center justify-center gap-4 flex-wrap">
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
