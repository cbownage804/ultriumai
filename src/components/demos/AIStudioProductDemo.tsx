import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
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
  ArrowLeft,
  Building2,
  Users,
  Shield,
  Rocket,
  Copy,
  Code,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import aiStudioLogo from '@/assets/ultrium-gpt-logo.png';

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
      description: "Your AI assistant is now live and ready to use.",
    });
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="builder">
            <Bot className="h-4 w-4 mr-2" />
            GPT Builder
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Zap className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
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
      </Tabs>
    </div>
  );
};
