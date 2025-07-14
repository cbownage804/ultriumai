import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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
  BarChart3
} from 'lucide-react';

export const CustomGPTBuilderDemo = () => {
  const [activeTab, setActiveTab] = useState('builder');
  const [gptName, setGptName] = useState('Customer Support AI');
  const [gptDescription, setGptDescription] = useState('AI assistant specialized in customer support and product knowledge');
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);

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
          <TabsList className="grid w-full grid-cols-4 bg-slate-800">
            <TabsTrigger value="builder" className="data-[state=active]:bg-slate-700">Builder</TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-slate-700">Templates</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-slate-700">Analytics</TabsTrigger>
            <TabsTrigger value="deployment" className="data-[state=active]:bg-slate-700">Deployment</TabsTrigger>
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

          <TabsContent value="deployment" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Deployment Options</CardTitle>
                <CardDescription className="text-slate-400">
                  Choose how to deploy your custom GPT
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-700 rounded-lg">
                    <Globe className="h-8 w-8 text-blue-500 mb-3" />
                    <h4 className="font-semibold text-white mb-2">Web Widget</h4>
                    <p className="text-sm text-slate-400 mb-3">
                      Embed as a chat widget on your website
                    </p>
                    <Button variant="outline" size="sm" className="w-full border-slate-600 text-slate-300">
                      Generate Code
                    </Button>
                  </div>

                  <div className="p-4 bg-slate-700 rounded-lg">
                    <Code className="h-8 w-8 text-green-500 mb-3" />
                    <h4 className="font-semibold text-white mb-2">API Access</h4>
                    <p className="text-sm text-slate-400 mb-3">
                      Integrate via REST API endpoints
                    </p>
                    <Button variant="outline" size="sm" className="w-full border-slate-600 text-slate-300">
                      View Docs
                    </Button>
                  </div>

                  <div className="p-4 bg-slate-700 rounded-lg">
                    <Bot className="h-8 w-8 text-purple-500 mb-3" />
                    <h4 className="font-semibold text-white mb-2">Standalone App</h4>
                    <p className="text-sm text-slate-400 mb-3">
                      Deploy as a standalone application
                    </p>
                    <Button variant="outline" size="sm" className="w-full border-slate-600 text-slate-300">
                      Deploy Now
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-600">
                  <h4 className="font-semibold text-white mb-3">White-Label Options</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Palette className="h-5 w-5 text-orange-500" />
                      <div>
                        <div className="text-white font-medium">Custom Branding</div>
                        <div className="text-sm text-slate-400">Your logo, colors, and domain</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="text-white font-medium">Custom Domain</div>
                        <div className="text-sm text-slate-400">your-ai.yourdomain.com</div>
                      </div>
                    </div>
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