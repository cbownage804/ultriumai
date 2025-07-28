import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Send,
  User,
  Loader2
} from 'lucide-react';

// Message type for demo chat
interface DemoMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Mock AI chat component for demo
const MockAIChat = () => {
  const [messages, setMessages] = useState<DemoMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm UltriumGPT, your intelligent AI assistant. I can help with security analysis, workflow automation, and business intelligence. What would you like to know?",
      timestamp: '2:30 PM'
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async () => {
    if (!currentMessage.trim()) return;

    const newMessage: DemoMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMessage]);
    setCurrentMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: DemoMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'This is a demo response. In the full platform, I would provide intelligent insights based on your specific data, workflows, and security policies. I can analyze logs, generate reports, automate tasks, and provide real-time threat intelligence.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-96">
      <ScrollArea className="flex-1 p-4 border rounded-t-lg">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={`rounded-lg p-3 ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {message.timestamp}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="flex gap-2 p-4 border-x border-b rounded-b-lg">
        <Input
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          placeholder="Ask me anything about security, automation, or business intelligence..."
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          disabled={isTyping}
        />
        <Button onClick={sendMessage} disabled={isTyping || !currentMessage.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Mock components for other features
const MockIntelligenceHub = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Threat Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">7</div>
          <p className="text-xs text-muted-foreground">Critical threats detected</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Security Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">94%</div>
          <p className="text-xs text-muted-foreground">Overall security posture</p>
        </CardContent>
      </Card>
    </div>
    <div className="bg-muted p-4 rounded-lg">
      <p className="text-sm text-muted-foreground">
        🔍 Demo Mode: Intelligence Hub provides real-time analysis of security events, threat intelligence, and automated incident response. Connect your security tools to see live data.
      </p>
    </div>
  </div>
);

const MockVoiceInterface = () => (
  <div className="space-y-4">
    <div className="text-center">
      <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
        <Mic className="h-12 w-12 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Voice AI Assistant</h3>
      <p className="text-muted-foreground mb-4">Click to start voice conversation</p>
      <Button className="mb-4">
        <Mic className="h-4 w-4 mr-2" />
        Start Voice Chat
      </Button>
    </div>
    <div className="bg-muted p-4 rounded-lg">
      <p className="text-sm text-muted-foreground">
        🎙️ Demo Mode: Voice interface supports natural language commands for security operations, report generation, and system control. Try the full version for live voice interaction.
      </p>
    </div>
  </div>
);

const MockVisionAnalyzer = () => (
  <div className="space-y-4">
    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
      <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <p className="text-sm text-muted-foreground mb-4">
        Drop images or documents here for AI analysis
      </p>
      <Button variant="outline">
        Upload Document
      </Button>
    </div>
    <div className="bg-muted p-4 rounded-lg">
      <p className="text-sm text-muted-foreground">
        👁️ Demo Mode: Vision analyzer can process screenshots, diagrams, documents, and images to extract security insights and generate reports.
      </p>
    </div>
  </div>
);

const MockWorkflowAutomation = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {['Incident Response', 'User Onboarding', 'Security Audit', 'Patch Management'].map((workflow) => (
        <Card key={workflow}>
          <CardHeader>
            <CardTitle className="text-sm">{workflow}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="mb-2">Active</Badge>
            <p className="text-xs text-muted-foreground">Automated workflow running</p>
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="bg-muted p-4 rounded-lg">
      <p className="text-sm text-muted-foreground">
        ⚡ Demo Mode: Workflow automation creates intelligent business processes that adapt to your specific needs and integrate with your existing tools.
      </p>
    </div>
  </div>
);

const UltriumGPTFullDemo = () => {
  const [activeModel] = useState('gpt-4o-mini');

  const aiFeatures = [
    {
      id: 'chat',
      title: 'Real-Time AI Chat',
      description: 'Conversational AI with streaming responses',
      icon: MessageCircle,
      status: 'Available',
      usage: '1.2K demo queries'
    },
    {
      id: 'intelligence',
      title: 'Intelligence Hub',
      description: 'Advanced AI analysis and insights',
      icon: Brain,
      status: 'Available',
      usage: '89 demo analyses'
    },
    {
      id: 'voice',
      title: 'Voice Interface',
      description: 'Natural language voice interactions',
      icon: Mic,
      status: 'Available',
      usage: '45 demo conversations'
    },
    {
      id: 'vision',
      title: 'Vision Analyzer',
      description: 'AI-powered image and document analysis',
      icon: Eye,
      status: 'Available',
      usage: '23 demo images'
    },
    {
      id: 'workflows',
      title: 'Workflow Automation',
      description: 'Intelligent automation workflows',
      icon: Workflow,
      status: 'Available',
      usage: '8 demo workflows'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <div className="relative">
              <Brain className="h-10 w-10 text-primary" />
              <Sparkles className="h-5 w-5 text-yellow-500 absolute -top-1 -right-1" />
            </div>
            Ultrium GPT Demo
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Experience our advanced AI platform for security operations analysis and automation
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-3 py-1">
            <Zap className="h-3 w-3 mr-1" />
            {activeModel}
          </Badge>
          <Badge variant="secondary" className="px-3 py-1">
            <TrendingUp className="h-3 w-3 mr-1" />
            Demo Mode
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
                Real-Time AI Chat Demo
              </CardTitle>
              <CardDescription>
                Experience conversational AI with intelligent responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MockAIChat />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Intelligence Hub Demo
              </CardTitle>
              <CardDescription>
                AI-powered threat analysis and security insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MockIntelligenceHub />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Voice Interface Demo
              </CardTitle>
              <CardDescription>
                Natural language voice interactions with AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MockVoiceInterface />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vision" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Vision Analyzer Demo
              </CardTitle>
              <CardDescription>
                AI-powered image and document analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MockVisionAnalyzer />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Workflow Automation Demo
              </CardTitle>
              <CardDescription>
                Intelligent automation for business processes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MockWorkflowAutomation />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Demo Queries Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">+15% from yesterday</p>
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
            <div className="text-2xl font-bold">0.8s</div>
            <p className="text-xs text-muted-foreground">Average response</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Demo Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* CTA Section */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardContent className="p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">Ready to Experience the Full Platform?</h3>
          <p className="text-muted-foreground mb-4">
            This demo shows just a glimpse of UltriumGPT's capabilities. The full platform includes real-time data integration, 
            advanced analytics, and personalized AI responses trained on your specific business processes.
          </p>
          <div className="flex justify-center gap-4">
            <Button>
              Schedule Full Demo
            </Button>
            <Button variant="outline">
              Contact Sales
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UltriumGPTFullDemo;