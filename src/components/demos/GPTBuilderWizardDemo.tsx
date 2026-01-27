import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  CheckCircle, 
  Bot, 
  Upload, 
  Settings, 
  Rocket,
  FileText,
  Globe,
  Palette,
  MessageSquare,
  Sparkles,
  Copy,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  X,
  Code,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface GPTBuilderWizardDemoProps {
  onComplete?: () => void;
}

const WIZARD_STEPS = [
  { id: 1, title: 'Identity', icon: Bot },
  { id: 2, title: 'Knowledge', icon: FileText },
  { id: 3, title: 'Behavior', icon: Settings },
  { id: 4, title: 'Deploy', icon: Rocket },
];

// Pre-filled demo data
const DEMO_DATA = {
  name: 'Customer Support AI',
  description: 'An intelligent assistant trained on your product documentation to handle customer inquiries 24/7',
  category: 'Support',
  icon: '🤖',
  themeColor: '#2563eb',
  knowledgeFiles: [
    { name: 'product-documentation.pdf', size: '2.4 MB', type: 'PDF' },
    { name: 'faq-database.csv', size: '156 KB', type: 'CSV' },
    { name: 'support-policies.docx', size: '89 KB', type: 'DOCX' },
  ],
  websites: [
    'https://docs.yourcompany.com',
    'https://help.yourcompany.com',
  ],
  systemPrompt: `You are a helpful customer support assistant for our company. Your role is to:

1. Answer customer questions about our products and services
2. Help troubleshoot common issues
3. Guide users through our documentation
4. Escalate complex issues to human agents when needed

Always be friendly, professional, and helpful. If you're unsure about something, acknowledge it and offer to connect the customer with a human agent.`,
  starterQuestions: [
    'How do I reset my password?',
    'What are your pricing plans?',
    'How do I contact support?',
  ],
  enableWebSearch: true,
  temperature: 0.7,
};

export const GPTBuilderWizardDemo = ({ onComplete }: GPTBuilderWizardDemoProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(DEMO_DATA);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isDeployed, setIsDeployed] = useState(false);
  const { toast } = useToast();

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
    // Simulate deployment
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
    theme: { primaryColor: '${formData.themeColor}' }
  });
</script>`;
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Embed code copied to clipboard",
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
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Name Your AI Assistant</h3>
              <p className="text-sm text-muted-foreground mt-1">Give your GPT a unique identity</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="gpt-name">Assistant Name</Label>
                <Input
                  id="gpt-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="gpt-desc">Description</Label>
                <Textarea
                  id="gpt-desc"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['Support', 'Sales', 'Technical', 'HR'].map((cat) => (
                      <Badge
                        key={cat}
                        variant={formData.category === cat ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setFormData({ ...formData, category: cat })}
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Theme Color</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="color"
                      value={formData.themeColor}
                      onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.themeColor}
                      onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
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
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-success/20 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold">Add Your Knowledge Base</h3>
              <p className="text-sm text-muted-foreground mt-1">Upload documents to train your AI</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Uploaded Documents
                </Label>
                <div className="mt-2 space-y-2">
                  {formData.knowledgeFiles.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{file.size} • {file.type}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Processed
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-3">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload More Files
                </Button>
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Connected Websites
                </Label>
                <div className="mt-2 space-y-2">
                  {formData.websites.map((url, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-primary" />
                        <span className="text-sm">{url}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Indexed
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-3">
                  <Globe className="h-4 w-4 mr-2" />
                  Add Website URL
                </Button>
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
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
                <Settings className="h-8 w-8 text-violet-500" />
              </div>
              <h3 className="text-xl font-semibold">Configure Behavior</h3>
              <p className="text-sm text-muted-foreground mt-1">Define how your AI responds</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="system-prompt">System Prompt</Label>
                <Textarea
                  id="system-prompt"
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                  rows={6}
                  className="mt-1 font-mono text-xs"
                />
              </div>

              <div>
                <Label>Starter Questions</Label>
                <div className="mt-2 space-y-2">
                  {formData.starterQuestions.map((q, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Input
                        value={q}
                        onChange={(e) => {
                          const newQuestions = [...formData.starterQuestions];
                          newQuestions[i] = e.target.value;
                          setFormData({ ...formData, starterQuestions: newQuestions });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Enable Web Search
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">Allow AI to search the web for current info</p>
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
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${formData.themeColor}20` }}
              >
                <Rocket className="h-8 w-8" style={{ color: formData.themeColor }} />
              </div>
              <h3 className="text-xl font-semibold">
                {isDeployed ? '🎉 Deployed!' : 'Ready to Deploy!'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isDeployed 
                  ? 'Your AI assistant is now live'
                  : 'Your AI assistant is configured and ready'
                }
              </p>
            </div>

            {/* Preview Card */}
            <Card className="overflow-hidden">
              <div 
                className="p-4"
                style={{ backgroundColor: `${formData.themeColor}15` }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${formData.themeColor}30` }}
                  >
                    🤖
                  </div>
                  <div>
                    <h4 className="font-semibold">{formData.name}</h4>
                    <p className="text-xs text-muted-foreground">{formData.category} Assistant</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-3">{formData.description}</p>
                <div className="flex flex-wrap gap-2">
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
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={copyEmbedCode}
              >
                <Code className="h-4 w-4 mr-2" />
                Embed Widget
              </Button>
              <Button 
                className="flex-1"
                style={{ backgroundColor: formData.themeColor }}
                onClick={handleDeploy}
                disabled={isDeploying || isDeployed}
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
                className="p-4 bg-success/10 border border-success/20 rounded-lg"
              >
                <div className="flex items-center gap-2 text-success mb-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Your GPT is Live!</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Sign up to create your own custom GPT and deploy it in minutes.
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
    <div className="space-y-6">
      {/* Step Progress */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Create Your AI Assistant</h3>
          <p className="text-sm text-muted-foreground">Build a custom GPT in minutes</p>
        </div>
        <Badge variant="secondary">Step {currentStep} of 4</Badge>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {WIZARD_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          
          return (
            <div key={step.id} className="flex items-center flex-1">
              <button
                onClick={() => setCurrentStep(step.id)}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary/20 text-primary ring-2 ring-primary",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </button>
              {index < WIZARD_STEPS.length - 1 && (
                <div 
                  className={cn(
                    "flex-1 h-1 mx-2 rounded-full transition-colors",
                    isCompleted ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        {currentStep < 4 ? (
          <Button onClick={handleNext}>
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={onComplete}
          >
            View Templates
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};
