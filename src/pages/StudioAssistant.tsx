import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Footer from "@/components/Footer";
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
  { label: "Browse Templates", icon: BookOpen, route: "/dashboard/gpt/templates" },
  { label: "My GPTs", icon: Share2, route: "/dashboard/gpt" },
  { label: "AI Studio Hub", icon: Palette, route: "/dashboard" },
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
      {/* Navigation Header */}
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 py-6">
          <div className="flex items-center justify-center gap-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Bot className="h-8 w-8 text-primary-foreground" />
              </div>
              <Sparkles className="h-5 w-5 text-yellow-500 absolute -top-1 -right-1" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold">Studio Assistant</h1>
            <p className="text-muted-foreground text-lg mt-2">
              Your AI-powered guide to building, deploying, and managing custom GPTs
            </p>
          </div>
          <Badge variant="secondary" className="px-4 py-1">
            <Lightbulb className="h-3 w-3 mr-1" />
            AI Studio Help & Documentation
          </Badge>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/50"
                onClick={() => navigate(action.route)}
              >
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="min-h-[500px]">
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

## Your Knowledge Areas:
1. **Creating Custom GPTs**: Guide users through the GPT creation wizard, explain system prompts, and best practices for designing effective AI assistants.
2. **Templates**: Explain available templates and how to use them as starting points.
3. **Personalization**: Help with customizing appearance, themes, avatars, starter questions, and branding.
4. **Deployment Options**: Explain embed widgets, API access, share links, Microsoft Teams integration, and analytics.
5. **Knowledge Sources**: Explain how to add documents, websites, and data to train GPTs.
6. **Actions & Integrations**: Guide on adding webhook actions, API integrations, and SafeSuite tools.
7. **Security & Settings**: Help with visibility settings, API keys, and access controls.

## Response Guidelines:
- Be concise and action-oriented
- Provide step-by-step guidance when explaining how to do something
- Reference specific UI elements and navigation paths
- Suggest related features when relevant
- If asked about something outside AI Studio, politely redirect to AI Studio topics

## Example Responses:
- "To create your first GPT, go to **Build** in the sidebar and click 'Start from Scratch' or choose a template."
- "You can deploy your GPT to Teams by going to **Deploy > Teams** and following the Quick Setup steps."

Always be helpful, encouraging, and focused on empowering users to build great AI assistants!`}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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
