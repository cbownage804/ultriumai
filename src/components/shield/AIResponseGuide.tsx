import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Bot, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Shield,
  Zap,
  Lock,
  Play,
  Pause,
  RotateCcw,
  Activity
} from "lucide-react";

interface Threat {
  id: string;
  event_id: string;
  hostname: string;
  threat_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ai_confidence_score: number;
  detected_at: string;
  status: string;
  ai_analysis: {
    threat_assessment: string;
    recommended_actions: string[];
    isolation_required: boolean;
    walkthrough_steps: string[];
    impact_analysis: string;
    containment_strategy: string;
  };
  behavioral_indicators?: string[];
}

interface AIResponseGuideProps {
  threat: Threat | null;
  onAction: () => void;
}

export const AIResponseGuide = ({ threat, onAction }: AIResponseGuideProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [responseStarted, setResponseStarted] = useState(false);
  const { toast } = useToast();

  if (!threat) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">AI Response Guide</h3>
            <p className="text-muted-foreground">
              Select a threat from the Threat Monitor to get AI-powered response guidance
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-500';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const startResponse = () => {
    setResponseStarted(true);
    setCurrentStep(0);
    toast({
      title: "AI Response Protocol Activated",
      description: "Following AI-guided incident response procedure",
    });
  };

  const completeStep = (stepIndex: number) => {
    if (!completedSteps.includes(stepIndex)) {
      setCompletedSteps([...completedSteps, stepIndex]);
    }
    if (stepIndex < (threat.ai_analysis.walkthrough_steps?.length || 0) - 1) {
      setCurrentStep(stepIndex + 1);
    }
    
    toast({
      title: "Step Completed",
      description: `Step ${stepIndex + 1} marked as complete`,
    });
  };

  const resetResponse = () => {
    setResponseStarted(false);
    setCurrentStep(0);
    setCompletedSteps([]);
    toast({
      title: "Response Reset",
      description: "Starting fresh response procedure",
    });
  };

  const executeAutomatedAction = async (action: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      if (action === 'isolate_endpoint' && threat.ai_analysis.isolation_required) {
        const response = await supabase.functions.invoke('ultrium-shield-agent', {
          body: { 
            action: 'isolate_endpoint',
            hostname: threat.hostname,
            user_id: user.user.id
          }
        });

        if (response.error) throw response.error;

        toast({
          title: "Automated Action Executed",
          description: `${threat.hostname} has been automatically isolated`,
        });

        onAction();
      }
    } catch (error) {
      console.error('Error executing automated action:', error);
      toast({
        title: "Error",
        description: "Failed to execute automated action",
        variant: "destructive",
      });
    }
  };

  const progressPercentage = threat.ai_analysis.walkthrough_steps ? 
    (completedSteps.length / threat.ai_analysis.walkthrough_steps.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Threat Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                AI Response Guide
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                AI-powered incident response for {threat.hostname}
              </p>
            </div>
            <Badge variant={getSeverityBadgeColor(threat.severity)} className="text-sm">
              {threat.severity.toUpperCase()} SEVERITY
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Threat Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">{threat.threat_type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hostname:</span>
                    <span className="font-mono">{threat.hostname}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">AI Confidence:</span>
                    <span className="font-medium">{Math.round(threat.ai_confidence_score * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Detected:</span>
                    <span>{new Date(threat.detected_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">AI Assessment</h4>
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {threat.ai_analysis.threat_assessment}
                  </AlertDescription>
                </Alert>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Impact Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  {threat.ai_analysis.impact_analysis}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Response Progress */}
      {responseStarted && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Response Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completion Progress</span>
                <span className="text-sm text-muted-foreground">
                  {completedSteps.length} of {threat.ai_analysis.walkthrough_steps?.length || 0} steps
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Response Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Automated Response Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {threat.ai_analysis.recommended_actions?.map((action, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{action.replace('_', ' ').toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">
                    {action === 'isolate_endpoint' && 'Remove endpoint from network'}
                    {action === 'quarantine' && 'Quarantine malicious files'}
                    {action === 'scan' && 'Run comprehensive security scan'}
                    {action === 'monitor' && 'Enhanced monitoring activated'}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => executeAutomatedAction(action)}
                  disabled={action === 'isolate_endpoint' && !threat.ai_analysis.isolation_required}
                >
                  Execute
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step-by-Step Guide */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Response Walkthrough
            </CardTitle>
            <div className="flex gap-2">
              {!responseStarted ? (
                <Button onClick={startResponse}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Response
                </Button>
              ) : (
                <Button onClick={resetResponse} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!responseStarted ? (
            <div className="text-center py-8">
              <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Click "Start Response" to begin AI-guided incident response
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {threat.ai_analysis.walkthrough_steps?.map((step, index) => (
                <div 
                  key={index} 
                  className={`p-4 border rounded-lg ${
                    index === currentStep ? 'border-primary bg-primary/5' : 
                    completedSteps.includes(index) ? 'border-green-200 bg-green-50 dark:bg-green-950/20' : 
                    'border-muted'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          completedSteps.includes(index) ? 'bg-green-600 text-white' :
                          index === currentStep ? 'bg-primary text-white' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {completedSteps.includes(index) ? '✓' : index + 1}
                        </div>
                        <span className={`font-medium ${
                          index === currentStep ? 'text-primary' : 
                          completedSteps.includes(index) ? 'text-green-600' : 
                          'text-muted-foreground'
                        }`}>
                          Step {index + 1}
                        </span>
                        {index === currentStep && (
                          <Badge variant="default" className="text-xs">CURRENT</Badge>
                        )}
                      </div>
                      <p className="text-sm pl-8">{step}</p>
                    </div>
                    {index === currentStep && !completedSteps.includes(index) && (
                      <Button size="sm" onClick={() => completeStep(index)}>
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Containment Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Containment Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Strategy:</strong> {threat.ai_analysis.containment_strategy}
            </AlertDescription>
          </Alert>
          
          {threat.behavioral_indicators && threat.behavioral_indicators.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Behavioral Indicators</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {threat.behavioral_indicators.map((indicator, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {indicator.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};