import { useState } from 'react';
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import RealTimeAIChat from '@/components/RealTimeAIChat';
import { AIIntelligenceHub } from '@/components/AIIntelligenceHub';
import { AIVoiceInterface } from '@/components/AIVoiceInterface';
import { AIVisionAnalyzer } from '@/components/AIVisionAnalyzer';
import AIWorkflowAutomation from '@/components/AIWorkflowAutomation';
import { 
  Brain, 
  MessageCircle, 
  Mic, 
  Eye, 
  Workflow, 
  Zap,
  Bot,
  Sparkles,
  TrendingUp,
  ArrowLeft,
  Home
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const AIStudio = () => {
  const [activeModel, setActiveModel] = useState('gpt-4o-mini');
  const navigate = useNavigate();

  const aiFeatures = [
    {
      id: 'chat',
      title: 'Real-Time AI Chat',
      description: 'Conversational AI with streaming responses',
      icon: MessageCircle,
      component: RealTimeAIChat,
      status: 'Available',
      usage: '2.4K messages today'
    },
    {
      id: 'intelligence',
      title: 'Intelligence Hub',
      description: 'Advanced AI analysis and insights',
      icon: Brain,
      component: AIIntelligenceHub,
      status: 'Available',
      usage: '156 analyses this week'
    },
    {
      id: 'voice',
      title: 'Voice Interface',
      description: 'Natural language voice interactions',
      icon: Mic,
      component: AIVoiceInterface,
      status: 'Available',
      usage: '89 conversations'
    },
    {
      id: 'vision',
      title: 'Vision Analyzer',
      description: 'AI-powered image and document analysis',
      icon: Eye,
      component: AIVisionAnalyzer,
      status: 'Available',
      usage: '42 images analyzed'
    },
    {
      id: 'workflows',
      title: 'Workflow Automation',
      description: 'Intelligent automation workflows',
      icon: Workflow,
      component: AIWorkflowAutomation,
      status: 'Available',
      usage: '12 active workflows'
    }
  ];

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

      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <div className="relative">
                <Brain className="h-10 w-10 text-primary" />
                <Sparkles className="h-5 w-5 text-yellow-500 absolute -top-1 -right-1" />
              </div>
              AI Studio
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Comprehensive AI platform for enterprise operations
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-3 py-1">
              <Zap className="h-3 w-3 mr-1" />
              {activeModel}
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              94% Uptime
            </Badge>
          </div>
        </div>

        {/* AI Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {aiFeatures.map((feature) => (
            <Card key={feature.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <feature.icon className="h-5 w-5 text-primary" />
                  <Badge variant="outline" className="text-xs">
                    {feature.status}
                  </Badge>
                </div>
                <CardTitle className="text-sm">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-2">
                  {feature.description}
                </p>
                <p className="text-xs font-medium text-primary">
                  {feature.usage}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main AI Interface */}
        <Tabs defaultValue="chat" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="intelligence" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Intelligence
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Voice
            </TabsTrigger>
            <TabsTrigger value="vision" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Vision
            </TabsTrigger>
            <TabsTrigger value="workflows" className="flex items-center gap-2">
              <Workflow className="h-4 w-4" />
              Workflows
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Real-Time AI Chat
                </CardTitle>
                <CardDescription>
                  Engage in real-time conversations with advanced AI models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RealTimeAIChat context="general" title="AI Assistant" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-4">
            <AIIntelligenceHub />
          </TabsContent>

          <TabsContent value="voice" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Voice Interface
                </CardTitle>
                <CardDescription>
                  Natural language voice interactions with AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AIVoiceInterface />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vision" className="space-y-4">
            <AIVisionAnalyzer />
          </TabsContent>

          <TabsContent value="workflows" className="space-y-4">
            <AIWorkflowAutomation />
          </TabsContent>
        </Tabs>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">AI Queries Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,847</div>
              <p className="text-xs text-muted-foreground">+23% from yesterday</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Models</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">GPT-4, Claude, Gemini</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1.2s</div>
              <p className="text-xs text-muted-foreground">Average response</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">99.7%</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AIStudio;