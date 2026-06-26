import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, 
  Sparkles, 
  Upload, 
  MessageSquare,
  Settings,
  Globe,
  FileText,
  Zap,
  Check,
  ArrowRight,
  ArrowLeft,
  Rocket,
  Code,
  CheckCircle,
  Send,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import aiStudioLogo from '@/assets/ai-studio-logo.png';
import DOMPurify from 'dompurify';

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// Demo chat messages - predefined Q&A that doesn't use AI credits
interface DemoChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface DemoQA {
  question: string;
  keywords: string[];
  answer: string;
}

const DEMO_QA: DemoQA[] = [
  {
    question: "How do I reset my password?",
    keywords: ["password", "reset", "forgot", "change"],
    answer: `To reset your password, follow these simple steps:

1. **Go to the login page** and click "Forgot Password"
2. **Enter your email address** associated with your account
3. **Check your inbox** for a password reset link (check spam folder too)
4. **Click the link** and create a new secure password
5. **Log in** with your new credentials

💡 **Tip:** Use a password manager like **SafePass** to generate and store strong passwords securely!`
  },
  {
    question: "What are your pricing plans?",
    keywords: ["pricing", "price", "cost", "plan", "subscription", "pay"],
    answer: `We offer flexible pricing to fit your needs:

| Plan | Price | Features |
|------|-------|----------|
| **Starter** | Free | 100 messages/month, 1 GPT |
| **Pro** | $29/mo | Unlimited messages, 10 GPTs, Priority support |
| **Business** | $99/mo | Everything in Pro + Team features, API access |
| **Enterprise** | Custom | Dedicated support, Custom integrations, SLA |

🎉 **Special Offer:** Start with a 14-day free trial of Pro features!

Would you like me to help you choose the best plan for your needs?`
  },
  {
    question: "How do I contact support?",
    keywords: ["support", "help", "contact", "reach", "assistance", "issue"],
    answer: `We're here to help! Here are the ways to reach our support team:

📧 **Email:** support@ultriumai.com
💬 **Live Chat:** Available 24/7 in your dashboard
📞 **Phone:** +1 (888) 555-0123 (Business hours: 9AM-6PM EST)

**Response Times:**
- 🚀 Enterprise: < 1 hour
- ⚡ Pro: < 4 hours  
- 📬 Free: < 24 hours

You can also check our **Knowledge Base** at docs.ultriumai.com for instant answers!`
  },
  {
    question: "How do I create a custom GPT?",
    keywords: ["create", "build", "custom", "gpt", "assistant", "bot"],
    answer: `Creating a custom GPT is easy with AI Studio! Here's how:

1. **Click "Create New GPT"** in your dashboard
2. **Define Identity** - Name your assistant and describe its purpose
3. **Add Knowledge** - Upload documents, connect websites, or add FAQs
4. **Configure Behavior** - Set the system prompt and personality
5. **Deploy** - Get an embed code or API endpoint

🎨 **Pro Tips:**
- Start with a template to save time
- Test with real questions before deploying
- Use the web search feature for up-to-date information

Need help? Try our GPT Builder wizard - it guides you step by step!`
  },
  {
    question: "What file formats do you support?",
    keywords: ["file", "format", "upload", "document", "pdf", "csv", "type"],
    answer: `We support a wide variety of file formats for your knowledge base:

**📄 Documents:**
- PDF, DOCX, DOC, TXT, RTF

**📊 Spreadsheets:**
- CSV, XLSX, XLS

**🌐 Web Content:**
- HTML, Markdown, JSON

**📁 Other:**
- XML, YAML

**Size Limits:**
- Single file: Up to 50MB
- Total storage: 1GB (Pro), 10GB (Business)

💡 **Tip:** For best results, use well-structured documents with clear headings!`
  }
];

const WELCOME_MESSAGE = `👋 **Hi there! I'm your Customer Support AI**

I'm here to help you with any questions about our products and services. I've been trained on your company's documentation to provide accurate, helpful answers.

**Here are some things I can help with:**
- 🔐 Password and account issues
- 💰 Pricing and subscription questions
- 📞 How to contact support
- 🤖 Creating custom GPT assistants
- 📁 File formats and uploads

Just type your question below or click one of the suggested topics!`;

interface CompactProps {
  compactMode?: boolean;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  popular?: boolean;
}

const templates: Template[] = [
  { id: '1', name: 'Customer Support Bot', description: 'Handle tier-1 support inquiries', category: 'Support', icon: '💬', popular: true },
  { id: '2', name: 'Sales Assistant', description: 'Qualify leads and answer product questions', category: 'Sales', icon: '🎯', popular: true },
  { id: '3', name: 'HR Policy Expert', description: 'Answer employee policy questions', category: 'Internal', icon: '📋' },
  { id: '4', name: 'IT Helpdesk', description: 'Technical support and troubleshooting', category: 'Support', icon: '🔧', popular: true },
  { id: '5', name: 'Onboarding Guide', description: 'Guide new employees through onboarding', category: 'Internal', icon: '🚀' },
  { id: '6', name: 'Knowledge Base Q&A', description: 'Answer questions from your docs', category: 'General', icon: '📚' },
];

// Pre-filled demo data
const DEMO_DATA = {
  name: 'Customer Support AI',
  description: 'An intelligent assistant trained on your product documentation to handle customer inquiries 24/7',
  category: 'Support',
  themeColor: '#2563eb',
  knowledgeFiles: [
    { name: 'product-documentation.pdf', size: '2.4 MB', type: 'PDF' },
    { name: 'faq-database.csv', size: '156 KB', type: 'CSV' },
  ],
  websites: [
    'https://docs.yourcompany.com',
  ],
  systemPrompt: `You are a helpful customer support assistant. Your role is to:

1. Answer customer questions about products and services
2. Help troubleshoot common issues
3. Guide users through documentation

Always be friendly, professional, and helpful.`,
  starterQuestions: [
    'How do I reset my password?',
    'What are your pricing plans?',
    'How do I contact support?',
  ],
  enableWebSearch: true,
  welcomeMessage: "Hi! I'm your AI assistant. How can I help you today?",
  personality: 'Professional',
};

export const AIStudioProductDemo = ({ compactMode = false }: CompactProps) => {
  const [activeTab, setActiveTab] = useState('builder');
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(DEMO_DATA);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isDeployed, setIsDeployed] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#2563eb');
  const { toast } = useToast();

  // Demo chat state
  const [chatMessages, setChatMessages] = useState<DemoChatMessage[]>([
    { id: 'welcome', role: 'assistant', content: WELCOME_MESSAGE }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Find matching answer from demo Q&A
  const findDemoAnswer = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    for (const qa of DEMO_QA) {
      if (qa.keywords.some(keyword => lowerInput.includes(keyword))) {
        return qa.answer;
      }
    }
    
    // Default response if no match
    return `Thanks for your question! I understand you're asking about "${input}".

While I'm a demo assistant with limited responses, the full version can answer any question based on your uploaded knowledge base.

**Try asking me about:**
- Password reset
- Pricing plans
- Contacting support
- Creating custom GPTs
- Supported file formats

🚀 **Sign up for AI Studio** to create your own fully-trained assistant!`;
  };

  // Handle sending demo chat messages
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage: DemoChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: chatInput
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsTyping(true);
    
    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));
    
    const answer = findDemoAnswer(chatInput);
    const assistantMessage: DemoChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: answer
    };
    
    setChatMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  // Handle quick question click
  const handleQuickQuestion = (question: string) => {
    setChatInput(question);
    // Auto-send after setting
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} };
      handleSendMessage();
    }, 100);
  };

  const builderSteps = [
    { step: 1, title: 'Identity', icon: Bot },
    { step: 2, title: 'Knowledge', icon: FileText },
    { step: 3, title: 'Behavior', icon: Settings },
    { step: 4, title: 'Deploy', icon: Rocket },
  ];

  const themeColors = [
    { value: '#2563eb', name: 'Blue' },
    { value: '#10b981', name: 'Emerald' },
    { value: '#8b5cf6', name: 'Violet' },
    { value: '#f59e0b', name: 'Amber' },
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsDeploying(false);
    setIsDeployed(true);
    toast({
      title: "🎉 GPT Deployed Successfully!",
      description: "Try chatting with your new AI assistant!",
    });
    // Auto-switch to chat tab
    setTimeout(() => setActiveTab('chat'), 500);
  };

  const copyEmbedCode = () => {
    const code = `<script src="https://widget.ultriumai.com/v1/widget.js"></script>
<script>
  UltriumAI.init({
    gptId: 'demo-support-ai',
    theme: { primaryColor: '${selectedColor}' }
  });
</script>`;
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Embed code copied to clipboard",
    });
  };

  const handleTemplateSelect = (template: Template) => {
    setFormData({
      ...formData,
      name: template.name,
      description: template.description,
      category: template.category,
    });
    setActiveTab('builder');
    setCurrentStep(1);
    toast({
      title: `Template Selected: ${template.name}`,
      description: "Customize it in the GPT Builder",
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div>
              <label className="text-sm font-medium mb-2 block">Assistant Name</label>
              <Input 
                placeholder="e.g., Customer Support Bot" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Purpose</label>
              <Input 
                placeholder="e.g., Answer customer questions about our products" 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Uploaded Documents
              </label>
              <div className="space-y-2">
                {formData.knowledgeFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{file.size} • {file.type}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      Processed
                    </Badge>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-3" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload More Files
              </Button>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Connected Websites
              </label>
              <div className="space-y-2">
                {formData.websites.map((url, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-primary" />
                      <span className="text-sm">{url}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      Indexed
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div>
              <label className="text-sm font-medium mb-2 block">System Prompt</label>
              <Textarea
                value={formData.systemPrompt}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                rows={4}
                className="font-mono text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Theme Color</label>
                <div className="flex gap-2">
                  {themeColors.map((color) => (
                    <button 
                      key={color.value} 
                      className={cn(
                        'w-8 h-8 rounded-full transition-all',
                        selectedColor === color.value ? 'ring-2 ring-offset-2 ring-primary' : ''
                      )}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setSelectedColor(color.value)}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Web Search
                  </label>
                </div>
                <Switch
                  checked={formData.enableWebSearch}
                  onCheckedChange={(checked) => setFormData({ ...formData, enableWebSearch: checked })}
                />
              </div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Preview Card */}
            <div className="p-4 rounded-lg" style={{ backgroundColor: `${selectedColor}15` }}>
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{ backgroundColor: `${selectedColor}30` }}
                >
                  🤖
                </div>
                <div>
                  <h4 className="font-semibold">{formData.name}</h4>
                  <p className="text-xs text-muted-foreground">{formData.category} Assistant</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{formData.description}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  {formData.knowledgeFiles.length} docs
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Globe className="h-3 w-3 mr-1" />
                  {formData.websites.length} websites
                </Badge>
                {formData.enableWebSearch && (
                  <Badge variant="outline" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Web Search
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={copyEmbedCode}
                size="sm"
              >
                <Code className="h-4 w-4 mr-2" />
                Embed
              </Button>
              <Button 
                className="flex-1"
                style={{ backgroundColor: selectedColor }}
                onClick={handleDeploy}
                disabled={isDeploying || isDeployed}
                size="sm"
              >
                {isDeploying ? (
                  <>
                    <span className="animate-spin mr-2">⚡</span>
                    Deploying...
                  </>
                ) : isDeployed ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Deployed
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Deploy Now
                  </>
                )}
              </Button>
            </div>

            {isDeployed && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center"
              >
                <div className="flex items-center justify-center gap-2 text-emerald-500 mb-1">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium text-sm">Your GPT is Live!</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sign up to create your own custom GPT
                </p>
              </motion.div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn('space-y-4', compactMode ? 'p-4' : 'p-6')}>
      {/* Header with Logo */}
      {!compactMode && (
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src={aiStudioLogo} alt="AI Studio" className="h-10 w-auto" />
          </div>
          <p className="text-muted-foreground text-sm">Build, deploy, and govern custom AI assistants</p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={cn("grid w-full", isDeployed ? "grid-cols-3" : "grid-cols-2")}>
          <TabsTrigger value="builder">
            <Bot className="h-4 w-4 mr-2" />
            Builder
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Zap className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          {isDeployed && (
            <TabsTrigger value="chat" className="text-emerald-600">
              <MessageSquare className="h-4 w-4 mr-2" />
              Try It
            </TabsTrigger>
          )}
        </TabsList>

        {/* GPT Builder Tab */}
        <TabsContent value="builder" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Create Your AI Assistant</CardTitle>
                  <CardDescription>Build a custom GPT in minutes</CardDescription>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  Step {currentStep} of 4
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress Steps */}
              <div className="flex items-center justify-between">
                {builderSteps.map((step, i) => {
                  const StepIcon = step.icon;
                  return (
                    <div key={step.step} className="flex items-center">
                      <button
                        onClick={() => setCurrentStep(step.step)}
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors',
                          currentStep >= step.step 
                            ? 'bg-primary border-primary text-primary-foreground' 
                            : 'border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50'
                        )}
                      >
                        {currentStep > step.step ? <Check className="h-4 w-4" /> : step.step}
                      </button>
                      {i < builderSteps.length - 1 && (
                        <div className={cn(
                          'w-8 md:w-12 h-0.5 mx-1 md:mx-2',
                          currentStep > step.step ? 'bg-primary' : 'bg-muted-foreground/30'
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Step Content */}
              <AnimatePresence mode="wait">
                {renderStepContent()}
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex justify-between pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  size="sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                {currentStep < 4 && (
                  <Button 
                    onClick={handleNext}
                    size="sm"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-4">
          <div className="grid gap-3 grid-cols-2">
            {templates.slice(0, 4).map((template) => (
              <Card 
                key={template.id} 
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handleTemplateSelect(template)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-2xl">{template.icon}</span>
                    {template.popular && (
                      <Badge variant="secondary" className="text-xs">Popular</Badge>
                    )}
                  </div>
                  <h4 className="font-medium text-primary text-sm mb-1">{template.name}</h4>
                  <p className="text-xs text-muted-foreground">{template.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              View All Templates
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </TabsContent>

        {/* Live Demo Chat Tab */}
        {isDeployed && (
          <TabsContent value="chat" className="mt-4">
            <Card className="overflow-hidden">
              <CardHeader className="pb-2 pt-3 px-4" style={{ backgroundColor: `${selectedColor}10` }}>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: selectedColor }}
                  >
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{formData.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-xs text-muted-foreground">Online • Demo Mode</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Chat Messages */}
                <div ref={scrollRef} className="h-[280px] overflow-y-auto p-4 space-y-4">
                  {chatMessages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex gap-3",
                        message.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${selectedColor}20` }}
                        >
                          <Bot className="h-4 w-4" style={{ color: selectedColor }} />
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[80%] rounded-lg p-3 text-sm",
                        message.role === 'user' 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted"
                      )}>
                        <div className="whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
                          {message.content.split('\n').map((line, i) => {
                            // Escape first, then apply minimal markdown, then sanitize
                            let parsed = escapeHtml(line)
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/`(.*?)`/g, '<code class="bg-background/50 px-1 rounded text-xs">$1</code>');
                            const safe = DOMPurify.sanitize(parsed, { ALLOWED_TAGS: ['strong', 'code'], ALLOWED_ATTR: ['class'] });
                            return <p key={i} dangerouslySetInnerHTML={{ __html: safe }} />;
                          })}
                          })}
                        </div>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${selectedColor}20` }}
                      >
                        <Bot className="h-4 w-4" style={{ color: selectedColor }} />
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Questions */}
                {chatMessages.length <= 1 && (
                  <div className="px-4 pb-2">
                    <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
                    <div className="flex flex-wrap gap-2">
                      {DEMO_QA.slice(0, 3).map((qa, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => handleQuickQuestion(qa.question)}
                        >
                          {qa.question}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chat Input */}
                <div className="p-3 border-t">
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                    className="flex gap-2"
                  >
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1"
                      disabled={isTyping}
                    />
                    <Button 
                      type="submit" 
                      size="icon"
                      disabled={!chatInput.trim() || isTyping}
                      style={{ backgroundColor: selectedColor }}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                  <p className="text-[10px] text-muted-foreground mt-2 text-center">
                    Demo mode • No AI credits used • Sign up for full experience
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
