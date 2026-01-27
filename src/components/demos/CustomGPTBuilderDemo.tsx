import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Users, 
  Brain, 
  Zap, 
  Settings,
  Play,
  Code,
  Database,
  Palette,
  Globe,
  Bot,
  MessageSquare,
  Upload,
  CheckCircle,
  Star,
  TrendingUp,
  Clock,
  BarChart3,
  Smartphone,
  Monitor,
  ExternalLink,
  Copy,
  Eye,
  Paintbrush,
  Link,
  Webhook,
  Slack,
  Mail,
  Chrome,
  Workflow,
  Wrench
} from 'lucide-react';
import { TemplateInteractiveDemo } from './TemplateInteractiveDemo';

export const CustomGPTBuilderDemo = () => {
  const [activeTab, setActiveTab] = useState('builder');
  const [gptName, setGptName] = useState('Customer Support AI');
  const [gptDescription, setGptDescription] = useState('AI assistant specialized in customer support and product knowledge');
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [showWhiteLabel, setShowWhiteLabel] = useState(true);
  const [customDomain, setCustomDomain] = useState('support.mycompany.com');
  const [brandColor, setBrandColor] = useState('#2563eb');
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof templateGPTs[0] | null>(null);
  const [showTemplateDemo, setShowTemplateDemo] = useState(false);

  const startTraining = () => {
    setIsTraining(true);
    setTrainingProgress(0);
    
    const interval = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev >= 100) {
          setIsTraining(false);
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const templateGPTs = [
    {
      id: 1,
      name: 'Customer Support AI',
      description: 'Handle customer inquiries, product questions, and support tickets',
      category: 'Support',
      deployments: 245,
      satisfaction: 4.8,
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      themeColor: '#2563eb',
      systemPrompt: 'You are a helpful customer support assistant...',
      starterQuestions: [
        'How do I return an item?',
        'Where is my order?',
        'I need help with my account'
      ]
    },
    {
      id: 2,
      name: 'Sales Assistant AI',
      description: 'Qualify leads, provide product information, and schedule demos',
      category: 'Sales',
      deployments: 189,
      satisfaction: 4.6,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      themeColor: '#16a34a',
      systemPrompt: 'You are a sales assistant helping qualify leads...',
      starterQuestions: [
        'What are your pricing plans?',
        'Can I schedule a demo?',
        'Tell me about your features'
      ]
    },
    {
      id: 3,
      name: 'Technical Documentation AI',
      description: 'Help users navigate technical docs and troubleshoot issues',
      category: 'Technical',
      deployments: 167,
      satisfaction: 4.9,
      icon: Code,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      themeColor: '#9333ea',
      systemPrompt: 'You are a technical documentation assistant...',
      starterQuestions: [
        'How do I integrate the API?',
        'Show me code examples',
        'Help me troubleshoot an error'
      ]
    },
    {
      id: 4,
      name: 'HR Assistant AI',
      description: 'Answer HR questions, manage policies, and assist employees',
      category: 'HR',
      deployments: 134,
      satisfaction: 4.7,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      themeColor: '#ea580c',
      systemPrompt: 'You are an HR assistant helping employees...',
      starterQuestions: [
        'How much PTO do I have?',
        'Tell me about benefits',
        'What is the dress code policy?'
      ]
    },
    {
      id: 5,
      name: 'IT Helpdesk AI',
      description: 'Technical support and troubleshooting for IT issues',
      category: 'Technical',
      deployments: 198,
      satisfaction: 4.5,
      icon: Wrench,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      themeColor: '#0891b2',
      systemPrompt: 'You are an IT helpdesk assistant...',
      starterQuestions: [
        'My computer is running slow',
        'I forgot my password',
        'How do I connect to VPN?'
      ]
    },
    {
      id: 6,
      name: 'Onboarding Guide AI',
      description: 'Help new employees navigate their first days and weeks',
      category: 'HR',
      deployments: 112,
      satisfaction: 4.8,
      icon: Star,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      themeColor: '#d97706',
      systemPrompt: 'You are an onboarding assistant for new employees...',
      starterQuestions: [
        'What do I do on my first day?',
        'Who should I meet with?',
        'Where can I find the handbook?'
      ]
    }
  ];

  const builderSteps = [
    {
      id: 1,
      title: 'Choose Template or Start Fresh',
      description: 'Select from pre-built templates or create from scratch',
      status: 'completed'
    },
    {
      id: 2,
      title: 'Upload Knowledge Base',
      description: 'Add documents, PDFs, websites, and data sources',
      status: 'completed'
    },
    {
      id: 3,
      title: 'Configure Behavior',
      description: 'Set personality, tone, and response guidelines',
      status: 'active'
    },
    {
      id: 4,
      title: 'Brand Customization',
      description: 'Apply your brand colors, logo, and styling',
      status: 'pending'
    },
    {
      id: 5,
      title: 'Test & Deploy',
      description: 'Test your GPT and deploy to production',
      status: 'pending'
    }
  ];

  const analyticsData = [
    { metric: 'Total Conversations', value: '12,847', change: '+18%', icon: MessageSquare },
    { metric: 'Avg Response Time', value: '1.2s', change: '-15%', icon: Clock },
    { metric: 'User Satisfaction', value: '4.8/5', change: '+5%', icon: Star },
    { metric: 'Resolution Rate', value: '94%', change: '+12%', icon: CheckCircle }
  ];

  const integrationOptions = [
    { name: 'Slack', icon: Slack, description: 'Connect to Slack channels and DMs', connected: true, color: 'text-purple-500' },
    { name: 'Microsoft Teams', icon: MessageSquare, description: 'Integrate with Teams chat', connected: true, color: 'text-blue-500' },
    { name: 'Zapier', icon: Workflow, description: 'Connect to 5000+ apps via Zapier', connected: false, color: 'text-orange-500' },
    { name: 'Email', icon: Mail, description: 'Email-based AI responses', connected: true, color: 'text-green-500' },
    { name: 'Webhooks', icon: Webhook, description: 'Custom webhook integrations', connected: false, color: 'text-red-500' },
    { name: 'Chrome Extension', icon: Chrome, description: 'Browser extension support', connected: true, color: 'text-yellow-500' },
  ];

  const embedCode = `<!-- UltriumAI Custom GPT Widget -->
<script src="https://widget.ultriumai.com/v1/widget.js"></script>
<script>
  UltriumAI.init({
    apiKey: 'your-api-key',
    gptId: 'custom-support-ai',
    theme: {
      primaryColor: '${brandColor}',
      domain: '${customDomain}',
      branding: ${!showWhiteLabel}
    },
    position: 'bottom-right',
    triggers: ['click', 'scroll']
  });
</script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="flex items-center justify-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Custom GPT Builder Demo</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Build, train, and deploy custom AI assistants for any business need with our no-code platform
          </p>
        </div>

        {/* Platform Overview */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <Brain className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Custom GPTs Created</div>
              </div>
              <div className="text-center">
                <Globe className="h-8 w-8 text-success mx-auto mb-2" />
                <div className="text-2xl font-bold text-success">50+</div>
                <div className="text-sm text-muted-foreground">Industries Served</div>
              </div>
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-violet-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-violet-500">95%</div>
                <div className="text-sm text-muted-foreground">Customer Satisfaction</div>
              </div>
              <div className="text-center">
                <Clock className="h-8 w-8 text-warning mx-auto mb-2" />
                <div className="text-2xl font-bold text-warning">24hrs</div>
                <div className="text-sm text-muted-foreground">Average Build Time</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="builder">Builder</TabsTrigger>
            <TabsTrigger value="branding">White-Label</TabsTrigger>
            <TabsTrigger value="embed">Embed</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Builder Form */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    <CardTitle>GPT Configuration</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="gpt-name">GPT Name</Label>
                    <Input
                      id="gpt-name"
                      value={gptName}
                      onChange={(e) => setGptName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="gpt-description">Description</Label>
                    <Textarea
                      id="gpt-description"
                      value={gptDescription}
                      onChange={(e) => setGptDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Knowledge Base</Label>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Documents
                      </Button>
                      <div className="text-sm text-muted-foreground">
                        Supported: PDF, DOCX, TXT, CSV, JSON
                      </div>
                    </div>
                  </div>

                  {isTraining ? (
                    <div className="space-y-2">
                      <Label>Training Progress</Label>
                      <Progress value={trainingProgress} className="w-full" />
                      <div className="text-sm text-muted-foreground">
                        {trainingProgress < 100 ? `Training... ${trainingProgress}%` : 'Training Complete!'}
                      </div>
                    </div>
                  ) : (
                    <Button onClick={startTraining} className="w-full">
                      <Brain className="mr-2 h-4 w-4" />
                      Start Training
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Build Steps */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <CardTitle>Build Progress</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {builderSteps.map((step) => (
                    <div key={step.id} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.status === 'completed' ? 'bg-success text-success-foreground' :
                        step.status === 'active' ? 'bg-primary text-primary-foreground' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {step.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <span className="text-sm font-medium">{step.id}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-medium ${
                          step.status === 'active' ? 'text-primary' : 'text-foreground'
                        }`}>
                          {step.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* White-Label Configuration */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Paintbrush className="h-5 w-5 text-violet-500" />
                    <CardTitle>Brand Customization</CardTitle>
                  </div>
                  <CardDescription>
                    Customize your AI assistant to match your brand
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="custom-domain">Custom Domain</Label>
                      <Input
                        id="custom-domain"
                        value={customDomain}
                        onChange={(e) => setCustomDomain(e.target.value)}
                        placeholder="ai.yourcompany.com"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="brand-color">Primary Brand Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="brand-color"
                          type="color"
                          value={brandColor}
                          onChange={(e) => setBrandColor(e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={brandColor}
                          onChange={(e) => setBrandColor(e.target.value)}
                          className="flex-1"
                          placeholder="#2563eb"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Remove "Powered by UltriumAI"</Label>
                        <p className="text-sm text-muted-foreground">Hide our branding from your AI assistant</p>
                      </div>
                      <Switch
                        checked={!showWhiteLabel}
                        onCheckedChange={(checked) => setShowWhiteLabel(!checked)}
                      />
                    </div>

                    <div>
                      <Label>Company Logo URL</Label>
                      <Input
                        placeholder="https://yourcompany.com/logo.png"
                      />
                    </div>

                    <div>
                      <Label>Welcome Message</Label>
                      <Textarea
                        placeholder="Hello! I'm your AI assistant. How can I help you today?"
                        rows={3}
                      />
                    </div>
                  </div>

                  <Button className="w-full bg-violet-600 hover:bg-violet-700">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview Changes
                  </Button>
                </CardContent>
              </Card>

              {/* Live Preview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-primary" />
                    <CardTitle>Live Preview</CardTitle>
                  </div>
                  <CardDescription>
                    See how your AI assistant will look to users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Desktop Preview */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-muted p-2 border-b">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-destructive rounded-full"></div>
                            <div className="w-2 h-2 bg-warning rounded-full"></div>
                            <div className="w-2 h-2 bg-success rounded-full"></div>
                          </div>
                          <div className="text-xs text-muted-foreground ml-2">{customDomain}</div>
                        </div>
                      </div>
                      <div className="bg-background p-6 min-h-[200px]">
                        <div className="max-w-md mx-auto">
                          <div 
                            className="rounded-lg shadow-lg p-4"
                            style={{ backgroundColor: brandColor, color: 'white' }}
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <Bot className="h-5 w-5" />
                              <span className="font-medium">{gptName}</span>
                            </div>
                            <div className="bg-white/10 rounded p-3 text-sm">
                              Hello! I'm your AI assistant. How can I help you today?
                            </div>
                          </div>
                          <div className="text-center mt-2">
                            {showWhiteLabel && (
                              <div className="text-xs text-muted-foreground">Powered by UltriumAI</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Preview */}
                    <div className="flex items-center gap-4">
                      <Smartphone className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="border rounded-lg w-48 h-32 bg-muted p-2">
                          <div className="bg-background rounded h-full p-2 text-xs">
                            <div 
                              className="rounded p-2 text-white text-xs"
                              style={{ backgroundColor: brandColor }}
                            >
                              <div className="flex items-center gap-1 mb-1">
                                <Bot className="h-3 w-3" />
                                <span className="font-medium">{gptName}</span>
                              </div>
                              <div className="bg-white/20 rounded p-1">
                                How can I help?
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="embed" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Embed Options */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-success" />
                    <CardTitle>Embedding Options</CardTitle>
                  </div>
                  <CardDescription>
                    Multiple ways to integrate your AI assistant
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 bg-muted rounded-lg border">
                      <div className="flex items-center gap-3 mb-3">
                        <Globe className="h-6 w-6 text-primary" />
                        <div>
                          <h4 className="font-medium">Website Widget</h4>
                          <p className="text-sm text-muted-foreground">Chat bubble on your website</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setShowEmbedCode(!showEmbedCode)}
                      >
                        {showEmbedCode ? 'Hide Code' : 'Show Embed Code'}
                      </Button>
                    </div>

                    <div className="p-4 bg-muted rounded-lg border">
                      <div className="flex items-center gap-3 mb-3">
                        <Code className="h-6 w-6 text-violet-500" />
                        <div>
                          <h4 className="font-medium">REST API</h4>
                          <p className="text-sm text-muted-foreground">Direct API integration</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">Endpoint:</div>
                        <div className="bg-background p-2 rounded text-xs text-success font-mono border">
                          POST https://api.ultriumai.com/v1/chat
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-muted rounded-lg border">
                      <div className="flex items-center gap-3 mb-3">
                        <Smartphone className="h-6 w-6 text-warning" />
                        <div>
                          <h4 className="font-medium">Mobile SDK</h4>
                          <p className="text-sm text-muted-foreground">iOS & Android libraries</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">iOS</Badge>
                        <Badge variant="outline">Android</Badge>
                        <Badge variant="outline">React Native</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Code Display */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code className="h-5 w-5 text-success" />
                      <CardTitle>Embed Code</CardTitle>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={copyToClipboard}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <CardDescription>
                    Ready-to-use code for your website
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {showEmbedCode ? (
                    <div className="bg-muted rounded-lg p-4 overflow-x-auto border">
                      <pre className="text-sm text-success font-mono whitespace-pre-wrap">
                        {embedCode}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">Click "Show Embed Code" to view the integration code</p>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowEmbedCode(true)}
                      >
                        View Code
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Integration Examples */}
            <Card>
              <CardHeader>
                <CardTitle>Integration Examples</CardTitle>
                <CardDescription>
                  See how other companies have integrated their AI assistants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <ExternalLink className="h-4 w-4 text-primary" />
                      <span className="font-medium">E-commerce Site</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Product support chatbot for online store</p>
                    <Badge variant="secondary" className="text-success">Live Example</Badge>
                  </div>
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <ExternalLink className="h-4 w-4 text-violet-500" />
                      <span className="font-medium">SaaS Platform</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Technical documentation assistant</p>
                    <Badge variant="secondary" className="text-success">Live Example</Badge>
                  </div>
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <ExternalLink className="h-4 w-4 text-warning" />
                      <span className="font-medium">Healthcare Portal</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Patient inquiry and appointment scheduling</p>
                    <Badge variant="secondary" className="text-success">Live Example</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Workflow className="h-5 w-5 text-primary" />
                  <CardTitle>Platform Integrations</CardTitle>
                </div>
                <CardDescription>
                  Connect your AI assistant to the tools your team already uses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {integrationOptions.map((integration, index) => {
                    const Icon = integration.icon;
                    return (
                      <div key={index} className="p-4 bg-muted rounded-lg border">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Icon className={`h-6 w-6 ${integration.color}`} />
                            <div>
                              <h4 className="font-medium">{integration.name}</h4>
                              <p className="text-sm text-muted-foreground">{integration.description}</p>
                            </div>
                          </div>
                          <Badge 
                            variant={integration.connected ? "default" : "outline"}
                          >
                            {integration.connected ? "Connected" : "Available"}
                          </Badge>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          disabled={integration.connected}
                        >
                          {integration.connected ? "Configure" : "Connect"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium mb-1">Custom Integrations</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Need a custom integration? Our team can build connections to any platform with an API.
                      </p>
                      <Button variant="outline" size="sm">
                        Request Custom Integration
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-primary" />
                  Interactive GPT Templates
                </CardTitle>
                <CardDescription>
                  Click any template to try an interactive demo - experience the AI in action!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templateGPTs.map((template) => {
                    const Icon = template.icon;
                    return (
                      <div 
                        key={template.id} 
                        className="p-4 bg-muted rounded-lg border border-transparent hover:border-primary/50 transition-all cursor-pointer group"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowTemplateDemo(true);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${template.bgColor} group-hover:scale-110 transition-transform`}>
                            <Icon className={`h-6 w-6 ${template.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-sm truncate">{template.name}</h4>
                            </div>
                            <Badge variant="outline" className="text-xs mb-2">
                              {template.category}
                            </Badge>
                            <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
                          <span>{template.deployments} deployments</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-warning" />
                            <span>{template.satisfaction}</span>
                          </div>
                        </div>
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="w-full mt-3 gap-2"
                          style={{ backgroundColor: template.themeColor }}
                        >
                          <Play className="h-3 w-3" />
                          Try Demo
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {analyticsData.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="text-xs text-muted-foreground">{item.metric}</span>
                      </div>
                      <div className="text-xl font-bold">{item.value}</div>
                      <div className="text-xs text-success">{item.change}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-success" />
                  <CardTitle>Usage Analytics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Conversations Today</span>
                    <span className="font-semibold">1,247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Peak Usage Time</span>
                    <span className="font-semibold">2:00 PM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Most Asked Topic</span>
                    <span className="font-semibold">Product Features</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">API Calls This Month</span>
                    <span className="font-semibold">47,892</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Interactive Template Demo Dialog */}
        <TemplateInteractiveDemo
          template={selectedTemplate}
          open={showTemplateDemo}
          onOpenChange={setShowTemplateDemo}
        />
      </div>
    </div>
  );
};