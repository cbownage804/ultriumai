import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { AIStudioSubNav } from "@/components/ai-studio/AIStudioSubNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RealTimeAIChat from '@/components/RealTimeAIChat';
import { 
  Sparkles, 
  ArrowLeft,
  Home,
  BookOpen,
  Rocket,
  Settings,
  Palette,
  Share2,
  MessageCircle,
  Lightbulb,
  Send,
  Bot,
  Zap,
  ChevronRight
} from 'lucide-react';

const QUICK_ACTIONS = [
  { label: "Create a new GPT", icon: Rocket, route: "/dashboard/gpt/build" },
  { label: "Browse Templates", icon: BookOpen, route: "/ai-studio/use-cases" },
  { label: "AI Agents", icon: Share2, route: "/ai-studio/agents" },
  { label: "App Builder", icon: Palette, route: "/ai-studio/app-builder" },
  { label: "AI Workflows", icon: Settings, route: "/ai-studio/workflows" },
];

const STARTER_QUESTIONS = [
  "How do I create my first custom GPT?",
  "What AI models are available?",
  "How do I deploy my GPT to Microsoft Teams?",
  "How do I add knowledge sources to my GPT?",
  "What's the difference between public and private GPTs?",
  "How do I customize the chat appearance?",
];

const CONTEXTUAL_TIPS = [
  {
    title: "Building GPTs",
    description: "Start with a clear purpose and system prompt. Add knowledge sources for domain-specific expertise.",
    icon: Rocket,
  },
  {
    title: "Deployment Options",
    description: "Deploy via embed widget, API, direct link, or Microsoft Teams integration.",
    icon: Share2,
  },
  {
    title: "Customization",
    description: "Brand your GPT with custom colors, avatars, and starter questions for your users.",
    icon: Palette,
  },
];

const UltriumGPT = () => {
  const navigate = useNavigate();
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [chatSendMessage, setChatSendMessage] = useState<((msg: string) => void) | null>(null);

  // When a question is selected and chat is ready, send it
  useEffect(() => {
    if (selectedQuestion && chatSendMessage) {
      chatSendMessage(selectedQuestion);
      setSelectedQuestion(null);
    }
  }, [selectedQuestion, chatSendMessage]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <AIStudioSubNav />

      <div className="container mx-auto px-4 sm:p-6 py-4 sm:py-8 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 sm:space-y-4 py-4 sm:py-6">
          <div className="flex items-center justify-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Bot className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground" />
              </div>
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 absolute -top-1 -right-1" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold">Studio Assistant</h1>
            <p className="text-muted-foreground text-sm sm:text-lg mt-1 sm:mt-2">
              Your AI-powered guide to building, deploying, and managing custom GPTs
            </p>
          </div>
          <Badge variant="secondary" className="px-3 sm:px-4 py-1 text-xs sm:text-sm">
            <Lightbulb className="h-3 w-3 mr-1" />
            AI Studio Help & Documentation
          </Badge>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto py-3 sm:py-4 flex flex-col gap-1.5 sm:gap-2 hover:bg-primary/5 hover:border-primary/50 active:bg-primary/10 min-h-[64px]"
                onClick={() => navigate(action.route)}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <span className="text-xs sm:text-sm font-medium text-center leading-tight">{action.label}</span>
              </Button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Chat Interface */}
          <div className="lg:col-span-2 order-1">
            <Card className="min-h-[400px] sm:min-h-[500px]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageCircle className="h-5 w-5" />
                  Ask Me Anything
                </CardTitle>
                <CardDescription>
                  Get help with AI Studio features, building GPTs, deployment, and best practices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RealTimeAIChat 
                  context="ai_studio_help" 
                  title="Studio Assistant"
                  onReady={(sendFn) => setChatSendMessage(() => sendFn)}
                  systemPromptOverride={`You are the Studio Assistant, an AI helper for UltriumAI's AI Studio platform. Your purpose is to help users understand and use AI Studio to build, customize, and deploy their own custom GPT assistants.

## Available AI Models
AI Studio provides access to multiple powerful AI models via the Lovable AI Gateway:

**Google Gemini Models:**
- **Gemini 3 Flash Preview** - Fast next-gen model, balanced speed and capability (default)
- **Gemini 3 Pro Preview** - Next-generation advanced reasoning
- **Gemini 2.5 Pro** - Top-tier for complex reasoning, image-text, and large context
- **Gemini 2.5 Flash** - Balanced speed and quality for most use cases
- **Gemini 2.5 Flash Lite** - Fastest and most cost-effective for simple tasks

**OpenAI Models:**
- **GPT-5.2** - Latest model with enhanced reasoning capabilities
- **GPT-5** - Powerful all-rounder with excellent reasoning
- **GPT-5 Mini** - Lower cost while retaining most capabilities
- **GPT-5 Nano** - Speed-optimized for high-volume tasks

## Creating Custom GPTs
1. Go to **Build** in the sidebar
2. Choose "Start from Scratch" or pick a template
3. Configure your GPT:
   - **Name & Description**: Give it a clear identity
   - **System Prompt**: Define its personality and expertise
   - **Knowledge Sources**: Add documents, websites, or data
   - **Actions**: Connect webhooks and API integrations
4. Test in the preview panel
5. Deploy when ready

## Template Library
AI Studio includes 36+ production-ready templates across domains:
- IT & Infrastructure
- Cybersecurity  
- Software Development
- Business Intelligence
- Legal & Finance
- Sales & Marketing
- HR & Operations
- Real Estate

## Deployment Options
- **Embed Widget**: Add to any website with a code snippet
- **Direct Link**: Share a unique URL
- **API Access**: Integrate programmatically with API keys
- **Microsoft Teams**: Deploy directly to Teams channels

## Knowledge Sources
Train your GPT with:
- **Documents**: PDF, Word, Text files
- **Websites**: Crawl and learn from URLs
- **Custom Data**: Structured data and FAQs

## Key Features
- **Analytics Dashboard**: Track usage, conversations, and performance
- **Conversation History**: View and export past chats
- **Voice Integration**: Enable text-to-speech with ElevenLabs
- **White Label**: Custom branding for enterprise deployments
- **Team Collaboration**: Invite team members with role-based access

## Response Guidelines
- Be specific and actionable
- Reference exact navigation paths (e.g., "Go to **Build > Templates**")
- Provide step-by-step instructions
- Suggest related features when helpful

Always be helpful and focused on empowering users to build great AI assistants!`}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6 order-2">
            {/* Suggested Questions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Common Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {STARTER_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    onClick={() => setSelectedQuestion(question)}
                    className="w-full text-left text-sm p-3 rounded-lg border bg-card hover:bg-muted/50 hover:border-primary/30 transition-colors flex items-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="line-clamp-2">{question}</span>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Contextual Tips */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  Quick Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {CONTEXTUAL_TIPS.map((tip) => {
                  const Icon = tip.icon;
                  return (
                    <div key={tip.title} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{tip.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground pl-6">{tip.description}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Documentation Link */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">Need more help?</p>
                    <p className="text-xs text-muted-foreground">Browse full documentation</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/docs/ai-studio')}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Docs
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default UltriumGPT;
