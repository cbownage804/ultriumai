import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  ArrowRight, 
  Sparkles, 
  Settings, 
  Users, 
  Rocket,
  Brain,
  MessageSquare,
  Shield
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  route: string;
  completed: boolean;
  optional?: boolean;
}

const OnboardingFlow = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const steps: OnboardingStep[] = [
    {
      id: "profile",
      title: "Complete Your Profile",
      description: "Set up your name, avatar, and basic preferences to personalize your experience",
      icon: Settings,
      route: "/dashboard/profile",
      completed: false
    },
    {
      id: "mfa",
      title: "Set Up Two-Factor Authentication",
      description: "Protect your account with an authenticator app for enhanced security",
      icon: Shield,
      route: "/dashboard/security-center",
      completed: false
    },
    {
      id: "create-gpt",
      title: "Create Your First GPT",
      description: "Build your first custom AI assistant tailored to your specific needs",
      icon: Brain,
      route: "/dashboard/custom-gpts/personalize",
      completed: false
    },
    {
      id: "test-chat",
      title: "Test Your GPT",
      description: "Try out your new AI assistant and see how it responds to your questions",
      icon: MessageSquare,
      route: "/dashboard/custom-gpts/ask",
      completed: false
    },
    {
      id: "explore-features",
      title: "Explore Advanced Features",
      description: "Discover analytics, actions, and deployment options for your GPT",
      icon: Sparkles,
      route: "/dashboard/custom-gpts/actions",
      completed: false,
      optional: true
    },
    {
      id: "invite-team",
      title: "Invite Your Team",
      description: "Collaborate with team members and share your AI assistants",
      icon: Users,
      route: "/dashboard/teams",
      completed: false,
      optional: true
    }
  ];

  useEffect(() => {
    checkOnboardingStatus();
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      // Check if user has completed profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Check if user has created a GPT
      const { data: gpts } = await supabase
        .from('custom_gpts')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      // Check if user has had conversations
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      // Check if user has team memberships
      const { data: teams } = await supabase
        .from('team_memberships')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      // Check MFA status
      const { data: securitySettings } = await supabase
        .from('security_settings')
        .select('two_factor_enabled')
        .eq('user_id', user.id)
        .maybeSingle();

      const updatedSteps = steps.map(step => {
        switch (step.id) {
          case "profile":
            return { ...step, completed: profile && profile.full_name };
          case "mfa":
            return { ...step, completed: !!securitySettings?.two_factor_enabled };
          case "create-gpt":
            return { ...step, completed: gpts && gpts.length > 0 };
          case "test-chat":
            return { ...step, completed: conversations && conversations.length > 0 };
          case "invite-team":
            return { ...step, completed: teams && teams.length > 0 };
          case "explore-features":
            return { ...step, completed: false };
          default:
            return step;
        }
      });

      setOnboardingData(updatedSteps);
      
      // Find current step (first incomplete required step)
      const currentStepIndex = updatedSteps.findIndex(step => !step.completed && !step.optional);
      setCurrentStep(currentStepIndex === -1 ? updatedSteps.length : currentStepIndex);
      
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  const progress = onboardingData ? 
    (onboardingData.filter((step: OnboardingStep) => step.completed).length / onboardingData.filter((step: OnboardingStep) => !step.optional).length) * 100 : 0;

  const requiredStepsCompleted = onboardingData ? 
    onboardingData.filter((step: OnboardingStep) => step.completed && !step.optional).length : 0;
  
  const totalRequiredSteps = onboardingData ? 
    onboardingData.filter((step: OnboardingStep) => !step.optional).length : 0;

  const handleStepClick = (step: OnboardingStep) => {
    navigate(step.route);
  };

  const handleSkipOnboarding = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your progress...</p>
        </div>
      </div>
    );
  }

  if (progress >= 100) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Welcome to AI Studio! 🎉</CardTitle>
            <p className="text-muted-foreground">
              You've completed the onboarding process. You're ready to build amazing AI experiences!
            </p>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Rocket className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Welcome to AI Studio</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Let's get you set up in just a few steps
            </p>
            <div className="mt-4">
              <Progress value={progress} className="w-full max-w-md mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">
                {requiredStepsCompleted} of {totalRequiredSteps} required steps completed
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {onboardingData?.map((step: OnboardingStep, index: number) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = step.completed;
              
              return (
                <Card 
                  key={step.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isActive ? 'ring-2 ring-primary' : ''
                  } ${isCompleted ? 'bg-green-50 border-green-200' : ''}`}
                  onClick={() => handleStepClick(step)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${
                        isCompleted 
                          ? 'bg-green-100 text-green-600' 
                          : isActive 
                            ? 'bg-primary/10 text-primary' 
                            : 'bg-muted text-muted-foreground'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="h-6 w-6" />
                        ) : (
                          <Icon className="h-6 w-6" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{step.title}</h3>
                          {step.optional && (
                            <Badge variant="secondary" className="text-xs">Optional</Badge>
                          )}
                          {isCompleted && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                              Completed
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {step.description}
                        </p>
                      </div>
                      
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-4 justify-center">
            <Button variant="outline" onClick={handleSkipOnboarding}>
              Skip for now
            </Button>
            {currentStep < steps.length && (
              <Button onClick={() => handleStepClick(steps[currentStep])}>
                Continue Setup
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;