import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Bot, 
  Sparkles, 
  Upload, 
  Palette, 
  MessageSquare,
  Settings,
  Globe,
  FileText,
  Zap,
  Check,
  ArrowRight,
  Building2,
  Users,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

const builderSteps = [
  { step: 1, title: 'Name & Purpose', description: 'Define your assistant' },
  { step: 2, title: 'Knowledge Base', description: 'Upload training data' },
  { step: 3, title: 'Customize', description: 'Brand & personality' },
  { step: 4, title: 'Deploy', description: 'Launch your AI' },
];

export const AIStudioProductDemo = ({ compactMode = false }: CompactProps) => {
  const [activeTab, setActiveTab] = useState('builder');
  const [currentStep, setCurrentStep] = useState(1);
  const [gptName, setGptName] = useState('');

  return (
    <div className={cn('space-y-4', compactMode ? 'p-4' : 'p-6')}>
      {!compactMode && (
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h3 className="text-2xl font-bold">AI Studio</h3>
          </div>
          <p className="text-muted-foreground">Build, deploy, and govern custom AI assistants</p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={cn('grid w-full', compactMode ? 'grid-cols-2' : 'grid-cols-3')}>
          <TabsTrigger value="builder">
            <Bot className="h-4 w-4 mr-2" />
            GPT Builder
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Zap className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          {!compactMode && (
            <TabsTrigger value="preview">
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat Preview
            </TabsTrigger>
          )}
        </TabsList>

        {/* GPT Builder Tab */}
        <TabsContent value="builder" className="mt-4">
          <Card>
            <CardHeader className={compactMode ? 'pb-3' : ''}>
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
                {builderSteps.map((step, i) => (
                  <div key={step.step} className="flex items-center">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors',
                      currentStep >= step.step 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : 'border-muted-foreground/30 text-muted-foreground'
                    )}>
                      {currentStep > step.step ? <Check className="h-4 w-4" /> : step.step}
                    </div>
                    {i < builderSteps.length - 1 && (
                      <div className={cn(
                        'w-12 h-0.5 mx-2',
                        currentStep > step.step ? 'bg-primary' : 'bg-muted-foreground/30'
                      )} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step Content */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Assistant Name</label>
                    <Input 
                      placeholder="e.g., Customer Support Bot" 
                      value={gptName}
                      onChange={(e) => setGptName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Purpose</label>
                    <Input placeholder="e.g., Answer customer questions about our products" />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center">
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm font-medium mb-1">Upload your knowledge base</p>
                    <p className="text-xs text-muted-foreground mb-3">PDF, DOCX, TXT, or URLs supported</p>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Select Files
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span>Secure, private processing — your data never leaves your control</span>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Theme Color</label>
                      <div className="flex gap-2">
                        {['bg-primary', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500'].map((color) => (
                          <button 
                            key={color} 
                            className={cn('w-8 h-8 rounded-full', color, 'ring-2 ring-offset-2 ring-transparent hover:ring-primary/50')}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Personality</label>
                      <select className="w-full border rounded-md px-3 py-2 text-sm">
                        <option>Professional</option>
                        <option>Friendly</option>
                        <option>Concise</option>
                        <option>Custom...</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Welcome Message</label>
                    <Input placeholder="Hi! How can I help you today?" />
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Bot className="h-8 w-8 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Ready to Deploy!</h4>
                    <p className="text-sm text-muted-foreground">Your AI assistant is configured and ready</p>
                  </div>
                  <div className="flex justify-center gap-3">
                    <Button variant="outline">
                      <Globe className="h-4 w-4 mr-2" />
                      Embed Widget
                    </Button>
                    <Button className="bg-primary">
                      <Zap className="h-4 w-4 mr-2" />
                      Deploy Now
                    </Button>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                >
                  Back
                </Button>
                <Button 
                  onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                  disabled={currentStep === 4}
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-4">
          <div className={cn('grid gap-3', compactMode ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3')}>
            {templates.slice(0, compactMode ? 4 : 6).map((template) => (
              <Card 
                key={template.id} 
                className="cursor-pointer hover:border-primary/50 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-2xl">{template.icon}</span>
                    {template.popular && (
                      <Badge variant="secondary" className="text-xs">Popular</Badge>
                    )}
                  </div>
                  <h4 className="font-medium text-sm mb-1">{template.name}</h4>
                  <p className="text-xs text-muted-foreground">{template.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Button variant="outline">
              View All Templates
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </TabsContent>

        {/* Chat Preview Tab */}
        {!compactMode && (
          <TabsContent value="preview" className="mt-4">
            <Card className="overflow-hidden">
              <div className="bg-primary p-4 text-primary-foreground">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">Customer Support Bot</h4>
                    <p className="text-xs opacity-80">Powered by AI Studio</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4 space-y-4 bg-muted/30 min-h-[200px]">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-background rounded-lg p-3 shadow-sm">
                    <p className="text-sm">Hi! I'm here to help you with any questions about our products. What can I assist you with today?</p>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <div className="bg-primary text-primary-foreground rounded-lg p-3">
                    <p className="text-sm">What are your pricing plans?</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-background rounded-lg p-3 shadow-sm">
                    <p className="text-sm">We offer three plans: Starter ($29/mo), Professional ($79/mo), and Enterprise (custom pricing). Would you like me to explain the features of each?</p>
                  </div>
                </div>
              </CardContent>
              <div className="p-4 border-t flex gap-2">
                <Input placeholder="Type a message..." className="flex-1" />
                <Button>Send</Button>
              </div>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Demo Footer */}
      {!compactMode && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center">
                <Building2 className="h-8 w-8 text-primary mb-2" />
                <h4 className="font-semibold mb-1">Enterprise Ready</h4>
                <p className="text-xs text-muted-foreground">Multi-tenant, SOC 2 aligned</p>
              </div>
              <div className="flex flex-col items-center">
                <Users className="h-8 w-8 text-primary mb-2" />
                <h4 className="font-semibold mb-1">White-Label</h4>
                <p className="text-xs text-muted-foreground">Deploy under your brand</p>
              </div>
              <div className="flex flex-col items-center">
                <Shield className="h-8 w-8 text-primary mb-2" />
                <h4 className="font-semibold mb-1">Full Governance</h4>
                <p className="text-xs text-muted-foreground">Complete admin control</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
