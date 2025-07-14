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
  Workflow
} from 'lucide-react';

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
      bgColor: 'bg-blue-100'
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
      bgColor: 'bg-green-100'
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
      bgColor: 'bg-purple-100'
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
      bgColor: 'bg-orange-100'
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
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="flex items-center justify-center gap-2">
            <Users className="h-8 w-8 text-blue-500" />
            <h1 className="text-4xl font-bold">Custom GPT Builder Demo</h1>
          </div>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Build, train, and deploy custom AI assistants for any business need with our no-code platform
          </p>
        </div>

        {/* Platform Overview */}
        <Card className="mb-8 bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <Brain className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-500">500+</div>
                <div className="text-sm text-slate-400">Custom GPTs Created</div>
              </div>
              <div className="text-center">
                <Globe className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-500">50+</div>
                <div className="text-sm text-slate-400">Industries Served</div>
              </div>
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-500">95%</div>
                <div className="text-sm text-slate-400">Customer Satisfaction</div>
              </div>
              <div className="text-center">
                <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-500">24hrs</div>
                <div className="text-sm text-slate-400">Average Build Time</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-slate-800">
            <TabsTrigger value="builder" className="data-[state=active]:bg-slate-700">Builder</TabsTrigger>
            <TabsTrigger value="branding" className="data-[state=active]:bg-slate-700">White-Label</TabsTrigger>
            <TabsTrigger value="embed" className="data-[state=active]:bg-slate-700">Embed</TabsTrigger>
            <TabsTrigger value="integrations" className="data-[state=active]:bg-slate-700">Integrations</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-slate-700">Analytics</TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-slate-700">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Builder Form */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-white">GPT Configuration</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="gpt-name" className="text-white">GPT Name</Label>
                    <Input
                      id="gpt-name"
                      value={gptName}
                      onChange={(e) => setGptName(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="gpt-description" className="text-white">Description</Label>
                    <Textarea
                      id="gpt-description"
                      value={gptDescription}
                      onChange={(e) => setGptDescription(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label className="text-white">Knowledge Base</Label>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full border-slate-600 text-slate-300">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Documents
                      </Button>
                      <div className="text-sm text-slate-400">
                        Supported: PDF, DOCX, TXT, CSV, JSON
                      </div>
                    </div>
                  </div>

                  {isTraining ? (
                    <div className="space-y-2">
                      <Label className="text-white">Training Progress</Label>
                      <Progress value={trainingProgress} className="w-full" />
                      <div className="text-sm text-slate-400">
                        {trainingProgress < 100 ? `Training... ${trainingProgress}%` : 'Training Complete!'}
                      </div>
                    </div>
                  ) : (
                    <Button onClick={startTraining} className="w-full bg-blue-600 hover:bg-blue-700">
                      <Brain className="mr-2 h-4 w-4" />
                      Start Training
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Build Steps */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-white">Build Progress</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {builderSteps.map((step) => (
                    <div key={step.id} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.status === 'completed' ? 'bg-green-600' :
                        step.status === 'active' ? 'bg-blue-600' :
                        'bg-slate-600'
                      }`}>
                        {step.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4 text-white" />
                        ) : (
                          <span className="text-sm font-medium text-white">{step.id}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-medium ${
                          step.status === 'active' ? 'text-blue-400' : 'text-white'
                        }`}>
                          {step.title}
                        </h4>
                        <p className="text-sm text-slate-400">{step.description}</p>
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
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Paintbrush className="h-5 w-5 text-purple-500" />
                    <CardTitle className="text-white">Brand Customization</CardTitle>
                  </div>
                  <CardDescription className="text-slate-400">
                    Customize your AI assistant to match your brand
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="custom-domain" className="text-white">Custom Domain</Label>
                      <Input
                        id="custom-domain"
                        value={customDomain}
                        onChange={(e) => setCustomDomain(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="ai.yourcompany.com"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="brand-color" className="text-white">Primary Brand Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="brand-color"
                          type="color"
                          value={brandColor}
                          onChange={(e) => setBrandColor(e.target.value)}
                          className="w-16 h-10 bg-slate-700 border-slate-600"
                        />
                        <Input
                          value={brandColor}
                          onChange={(e) => setBrandColor(e.target.value)}
                          className="flex-1 bg-slate-700 border-slate-600 text-white"
                          placeholder="#2563eb"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Remove "Powered by UltriumAI"</Label>
                        <p className="text-sm text-slate-400">Hide our branding from your AI assistant</p>
                      </div>
                      <Switch
                        checked={!showWhiteLabel}
                        onCheckedChange={(checked) => setShowWhiteLabel(!checked)}
                      />
                    </div>

                    <div>
                      <Label className="text-white">Company Logo URL</Label>
                      <Input
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="https://yourcompany.com/logo.png"
                      />
                    </div>

                    <div>
                      <Label className="text-white">Welcome Message</Label>
                      <Textarea
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="Hello! I'm your AI assistant. How can I help you today?"
                        rows={3}
                      />
                    </div>
                  </div>

                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview Changes
                  </Button>
                </CardContent>
              </Card>

              {/* Live Preview */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-white">Live Preview</CardTitle>
                  </div>
                  <CardDescription className="text-slate-400">
                    See how your AI assistant will look to users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Desktop Preview */}
                    <div className="border border-slate-600 rounded-lg overflow-hidden">
                      <div className="bg-slate-900 p-2 border-b border-slate-600">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          </div>
                          <div className="text-xs text-slate-400 ml-2">{customDomain}</div>
                        </div>
                      </div>
                      <div className="bg-white p-6 min-h-[200px]" style={{ backgroundColor: '#f8fafc' }}>
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
                              <div className="text-xs text-slate-500">Powered by UltriumAI</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Preview */}
                    <div className="flex items-center gap-4">
                      <Smartphone className="h-5 w-5 text-slate-400" />
                      <div className="flex-1">
                        <div className="border border-slate-600 rounded-lg w-48 h-32 bg-slate-900 p-2">
                          <div className="bg-white rounded h-full p-2 text-xs">
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
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-white">Embedding Options</CardTitle>
                  </div>
                  <CardDescription className="text-slate-400">
                    Multiple ways to integrate your AI assistant
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
                      <div className="flex items-center gap-3 mb-3">
                        <Globe className="h-6 w-6 text-blue-500" />
                        <div>
                          <h4 className="font-medium text-white">Website Widget</h4>
                          <p className="text-sm text-slate-400">Chat bubble on your website</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full border-slate-600 text-slate-300"
                        onClick={() => setShowEmbedCode(!showEmbedCode)}
                      >
                        {showEmbedCode ? 'Hide Code' : 'Show Embed Code'}
                      </Button>
                    </div>

                    <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
                      <div className="flex items-center gap-3 mb-3">
                        <Code className="h-6 w-6 text-purple-500" />
                        <div>
                          <h4 className="font-medium text-white">REST API</h4>
                          <p className="text-sm text-slate-400">Direct API integration</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs text-slate-400">Endpoint:</div>
                        <div className="bg-slate-900 p-2 rounded text-xs text-green-400 font-mono">
                          POST https://api.ultriumai.com/v1/chat
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
                      <div className="flex items-center gap-3 mb-3">
                        <Smartphone className="h-6 w-6 text-orange-500" />
                        <div>
                          <h4 className="font-medium text-white">Mobile SDK</h4>
                          <p className="text-sm text-slate-400">iOS & Android libraries</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-slate-300 border-slate-500">iOS</Badge>
                        <Badge variant="outline" className="text-slate-300 border-slate-500">Android</Badge>
                        <Badge variant="outline" className="text-slate-300 border-slate-500">React Native</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Code Display */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code className="h-5 w-5 text-green-500" />
                      <CardTitle className="text-white">Embed Code</CardTitle>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={copyToClipboard}
                      className="border-slate-600 text-slate-300"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <CardDescription className="text-slate-400">
                    Ready-to-use code for your website
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {showEmbedCode ? (
                    <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                        {embedCode}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Code className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 mb-4">Click "Show Embed Code" to view the integration code</p>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowEmbedCode(true)}
                        className="border-slate-600 text-slate-300"
                      >
                        View Code
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Integration Examples */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Integration Examples</CardTitle>
                <CardDescription className="text-slate-400">
                  See how other companies have integrated their AI assistants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-700 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <ExternalLink className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-white">E-commerce Site</span>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">Product support chatbot for online store</p>
                    <Badge variant="outline" className="text-green-300 border-green-500">Live Example</Badge>
                  </div>
                  
                  <div className="p-4 bg-slate-700 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <ExternalLink className="h-4 w-4 text-purple-500" />
                      <span className="font-medium text-white">SaaS Platform</span>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">Technical documentation assistant</p>
                    <Badge variant="outline" className="text-green-300 border-green-500">Live Example</Badge>
                  </div>
                  
                  <div className="p-4 bg-slate-700 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <ExternalLink className="h-4 w-4 text-orange-500" />
                      <span className="font-medium text-white">Healthcare Portal</span>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">Patient inquiry and appointment scheduling</p>
                    <Badge variant="outline" className="text-green-300 border-green-500">Live Example</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Workflow className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-white">Platform Integrations</CardTitle>
                </div>
                <CardDescription className="text-slate-400">
                  Connect your AI assistant to the tools your team already uses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {integrationOptions.map((integration, index) => {
                    const Icon = integration.icon;
                    return (
                      <div key={index} className="p-4 bg-slate-700 rounded-lg border border-slate-600">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Icon className={`h-6 w-6 ${integration.color}`} />
                            <div>
                              <h4 className="font-medium text-white">{integration.name}</h4>
                              <p className="text-sm text-slate-400">{integration.description}</p>
                            </div>
                          </div>
                          <Badge 
                            variant={integration.connected ? "default" : "outline"}
                            className={integration.connected ? "bg-green-600" : "border-slate-500 text-slate-300"}
                          >
                            {integration.connected ? "Connected" : "Available"}
                          </Badge>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full border-slate-600 text-slate-300"
                          disabled={integration.connected}
                        >
                          {integration.connected ? "Configure" : "Connect"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-white mb-1">Custom Integrations</h4>
                      <p className="text-sm text-slate-400 mb-3">
                        Need a custom integration? Our team can build connections to any platform with an API.
                      </p>
                      <Button variant="outline" size="sm" className="border-blue-600 text-blue-300">
                        Request Custom Integration
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">GPT Templates</CardTitle>
                <CardDescription className="text-slate-400">
                  Start with pre-built templates optimized for specific use cases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {templateGPTs.map((template) => {
                    const Icon = template.icon;
                    return (
                      <div key={template.id} className="p-4 bg-slate-700 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${template.bgColor}`}>
                            <Icon className={`h-6 w-6 ${template.color}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-white">{template.name}</h4>
                              <Badge variant="outline" className="text-slate-300 border-slate-500">
                                {template.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-400 mb-3">{template.description}</p>
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>{template.deployments} deployments</span>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500" />
                                <span>{template.satisfaction}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-3 border-slate-600 text-slate-300">
                          Use Template
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
                  <Card key={index} className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-4 w-4 text-blue-500" />
                        <span className="text-xs text-slate-400">{item.metric}</span>
                      </div>
                      <div className="text-xl font-bold text-white">{item.value}</div>
                      <div className="text-xs text-green-400">{item.change}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-white">Usage Analytics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Conversations Today</span>
                    <span className="font-semibold text-white">1,247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Peak Usage Time</span>
                    <span className="font-semibold text-white">2:00 PM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Most Asked Topic</span>
                    <span className="font-semibold text-white">Product Features</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">API Calls This Month</span>
                    <span className="font-semibold text-white">47,892</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};