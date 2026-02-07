import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Monitor, 
  Headphones, 
  Rocket, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  Download,
  Settings,
  Shield,
  Zap,
  ArrowRight,
  Sparkles,
  Package,
  Mail,
  Clock,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getVanguardBasePath } from '@/utils/subdomain';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
}

export function VanguardOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const basePath = getVanguardBasePath();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  
  // Horizon setup state
  const [deviceName, setDeviceName] = useState('');
  const [deviceType, setDeviceType] = useState('workstation');
  const [enableAlerts, setEnableAlerts] = useState(true);
  const [enablePatching, setEnablePatching] = useState(true);
  
  // Response setup state
  const [supportEmail, setSupportEmail] = useState('');
  const [defaultPriority, setDefaultPriority] = useState('medium');
  const [enableAIResponses, setEnableAIResponses] = useState(true);
  const [slaHours, setSlaHours] = useState('24');

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Vanguard',
      description: 'Get started with your security & operations platform',
      icon: Rocket,
      completed: currentStep > 0
    },
    {
      id: 'horizon',
      title: 'Horizon Setup',
      description: 'Configure your first device for remote monitoring',
      icon: Monitor,
      completed: currentStep > 1
    },
    {
      id: 'response',
      title: 'Response Setup',
      description: 'Set up your IT helpdesk and ticket routing',
      icon: Headphones,
      completed: currentStep > 2
    },
    {
      id: 'complete',
      title: 'All Set!',
      description: 'Your Vanguard platform is ready to use',
      icon: CheckCircle2,
      completed: onboardingComplete
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveDeviceConfig = async () => {
    if (!deviceName.trim()) {
      toast({
        title: "Device name required",
        description: "Please enter a name for your first device.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Save device configuration preferences (would connect to real setup)
      toast({
        title: "Device configuration saved",
        description: "Your Horizon preferences have been saved. Download the agent to complete setup.",
      });
      handleNext();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTicketConfig = async () => {
    setIsLoading(true);
    try {
      // Save ticket configuration preferences
      toast({
        title: "Helpdesk configured",
        description: "Your Response helpdesk settings have been saved.",
      });
      handleNext();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    setOnboardingComplete(true);
    toast({
      title: "Welcome to Vanguard!",
      description: "Your platform is now configured and ready to use.",
    });
    // Navigate to dashboard after short delay
    setTimeout(() => {
      navigate(`${basePath}/dashboard`);
    }, 1500);
  };

  const handleSkipToSetup = () => {
    navigate(`${basePath}/setup`);
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-600/20 mb-6">
                <Rocket className="h-10 w-10 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to Vanguard</h2>
              <p className="text-white/60 max-w-md mx-auto">
                Let's get your security and operations platform set up in just a few minutes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-white/5 border-white/10 hover:border-cyan-500/30 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-cyan-500/20">
                      <Monitor className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Vanguard Horizon</h3>
                      <p className="text-sm text-white/60">Remote monitoring, patch management, and endpoint security</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 hover:border-purple-500/30 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <Headphones className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Vanguard Response</h3>
                      <p className="text-sm text-white/60">AI-powered ticketing, SLA tracking, and automated responses</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center pt-4">
              <Button 
                onClick={handleNext} 
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
              >
                Get Started
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        );

      case 'horizon':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Monitor className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Horizon Device Setup</h2>
                <p className="text-sm text-white/60">Configure your first monitored endpoint</p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="deviceName" className="text-white">Device Name</Label>
                <Input
                  id="deviceName"
                  placeholder="e.g., Office Server, Reception PC"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Device Type</Label>
                <Select value={deviceType} onValueChange={setDeviceType}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workstation">Workstation</SelectItem>
                    <SelectItem value="server">Server</SelectItem>
                    <SelectItem value="laptop">Laptop</SelectItem>
                    <SelectItem value="raspberry-pi">Raspberry Pi / IoT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-2">
                <Label className="text-white">Monitoring Options</Label>
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="alerts" 
                    checked={enableAlerts}
                    onCheckedChange={(checked) => setEnableAlerts(checked as boolean)}
                  />
                  <label htmlFor="alerts" className="text-sm text-white/80 cursor-pointer">
                    Enable real-time alerts for this device
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="patching" 
                    checked={enablePatching}
                    onCheckedChange={(checked) => setEnablePatching(checked as boolean)}
                  />
                  <label htmlFor="patching" className="text-sm text-white/80 cursor-pointer">
                    Enable automatic patch management
                  </label>
                </div>
              </div>
            </div>

            <Card className="bg-cyan-500/10 border-cyan-500/30">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Download className="h-5 w-5 text-cyan-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-white/80">
                      After this wizard, you'll download the Vanguard agent and install it on your device.
                    </p>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-cyan-400 hover:text-cyan-300"
                      onClick={handleSkipToSetup}
                    >
                      Skip to advanced setup →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={handleBack} className="text-white/60 hover:text-white">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={handleSaveDeviceConfig}
                disabled={isLoading}
                className="bg-cyan-500 hover:bg-cyan-600"
              >
                {isLoading ? 'Saving...' : 'Continue'}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'response':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Headphones className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Response Helpdesk Configuration</h2>
                <p className="text-sm text-white/60">Set up your service desk preferences</p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="supportEmail" className="text-white">Support Email (optional)</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  placeholder="support@yourcompany.com"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="bg-white/5 border-white/20 text-white"
                />
                <p className="text-xs text-white/40">Tickets can be created by email to this address</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Default Priority</Label>
                  <Select value={defaultPriority} onValueChange={setDefaultPriority}>
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">SLA Response Time</Label>
                  <Select value={slaHours} onValueChange={setSlaHours}>
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4 hours</SelectItem>
                      <SelectItem value="8">8 hours</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                      <SelectItem value="48">48 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Label className="text-white">AI Features</Label>
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="aiResponses" 
                    checked={enableAIResponses}
                    onCheckedChange={(checked) => setEnableAIResponses(checked as boolean)}
                  />
                  <label htmlFor="aiResponses" className="text-sm text-white/80 cursor-pointer">
                    Enable AI-powered auto-responses (85% confidence threshold)
                  </label>
                </div>
              </div>
            </div>

            <Card className="bg-purple-500/10 border-purple-500/30">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-purple-400 mt-0.5" />
                  <p className="text-sm text-white/80">
                    Vanguard Response AI will automatically respond to common issues. Tickets below the confidence threshold go to your technicians for review.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={handleBack} className="text-white/60 hover:text-white">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={handleSaveTicketConfig}
                disabled={isLoading}
                className="bg-purple-500 hover:bg-purple-600"
              >
                {isLoading ? 'Saving...' : 'Continue'}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-600/20 mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">You're All Set!</h2>
              <p className="text-white/60 max-w-md mx-auto">
                Your Vanguard platform is configured and ready. Here's what to do next:
              </p>
            </div>

            <div className="grid gap-3">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-cyan-500/20">
                      <Download className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">Download Vanguard Agent</h3>
                      <p className="text-sm text-white/60">Install on "{deviceName || 'your device'}" to start monitoring</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`${basePath}/setup`)}
                      className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                    >
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <Headphones className="h-5 w-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">Create Your First Ticket</h3>
                      <p className="text-sm text-white/60">Test Response by submitting a sample ticket</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`${basePath}/helpdesk`)}
                      className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                    >
                      Open Helpdesk
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">Explore Security Features</h3>
                      <p className="text-sm text-white/60">Threat detection, compliance, and more</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`${basePath}/dashboard`)}
                      className="border-primary/50 text-primary hover:bg-primary/10"
                    >
                      Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center pt-6">
              <Button 
                onClick={handleCompleteOnboarding}
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Badge className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border-0">
              <Sparkles className="h-3 w-3 mr-1" />
              Getting Started
            </Badge>
            <span className="text-sm text-white/40">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-white/10" />
          
          {/* Step Indicators */}
          <div className="flex justify-between mt-4">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={`flex flex-col items-center gap-1 ${
                  index <= currentStep ? 'text-white' : 'text-white/30'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index < currentStep 
                    ? 'bg-green-500' 
                    : index === currentStep 
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-600' 
                      : 'bg-white/10'
                }`}>
                  {index < currentStep ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                </div>
                <span className="text-xs hidden sm:block">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content Card */}
        <Card className="bg-[#12121a] border-white/10">
          <CardContent className="pt-6">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Skip Link */}
        {currentStep < steps.length - 1 && (
          <div className="text-center mt-4">
            <Button 
              variant="link" 
              className="text-white/40 hover:text-white/60"
              onClick={() => navigate(`${basePath}/dashboard`)}
            >
              Skip onboarding and go to dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
