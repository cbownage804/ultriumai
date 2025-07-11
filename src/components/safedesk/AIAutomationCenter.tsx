import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, Brain, Zap, Settings, Plus, Play, Pause, Edit, Trash2,
  Target, MessageSquare, Clock, Users, AlertTriangle, CheckCircle,
  TrendingUp, Sparkles, Cpu, Activity, Shield, Workflow
} from "lucide-react";

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger_event: string;
  conditions: any;
  actions: any;
  is_active: boolean;
  success_rate: number;
  executions: number;
  created_at: string;
  execution_count: number;
  last_executed_at: string;
  updated_at: string;
  user_id: string;
}

interface AIInsight {
  type: 'pattern' | 'recommendation' | 'optimization';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  suggested_action: string;
}

const TRIGGER_TYPES = [
  { value: 'keyword', label: 'Keyword Detection', icon: MessageSquare },
  { value: 'priority', label: 'Priority Level', icon: AlertTriangle },
  { value: 'time', label: 'Time-based', icon: Clock },
  { value: 'category', label: 'Category Match', icon: Target },
  { value: 'sentiment', label: 'Sentiment Analysis', icon: Brain }
];

const ACTION_TYPES = [
  { value: 'assign', label: 'Auto-assign to Agent' },
  { value: 'priority', label: 'Change Priority' },
  { value: 'category', label: 'Set Category' },
  { value: 'response', label: 'Send Auto-response' },
  { value: 'escalate', label: 'Escalate to Manager' },
  { value: 'resolve', label: 'Auto-resolve' },
  { value: 'tag', label: 'Add Tags' },
  { value: 'notify', label: 'Send Notification' }
];

export const AIAutomationCenter = () => {
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [aiInsights, setAIInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    trigger_type: 'keyword',
    trigger_conditions: {},
    actions: [],
    ai_confidence_threshold: 80
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAutomationData();
  }, []);

  const loadAutomationData = async () => {
    try {
      setLoading(true);
      
      // Load automation rules
      const { data: rules, error: rulesError } = await supabase
        .from('workflow_automation_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (rulesError) throw rulesError;

      // Simulate AI insights
      const insights: AIInsight[] = [
        {
          type: 'pattern',
          title: 'High Volume Pattern Detected',
          description: 'Email issues spike every Monday morning between 8-10 AM',
          impact: 'high',
          confidence: 92,
          suggested_action: 'Create proactive automation to handle email setup queries'
        },
        {
          type: 'recommendation',
          title: 'Auto-resolution Opportunity',
          description: 'Password reset requests can be automated with 95% success rate',
          impact: 'medium',
          confidence: 89,
          suggested_action: 'Implement self-service password reset workflow'
        },
        {
          type: 'optimization',
          title: 'Response Time Improvement',
          description: 'Network category tickets take 40% longer than average',
          impact: 'medium',
          confidence: 87,
          suggested_action: 'Create dedicated network specialist assignment rule'
        }
      ];

      setAutomationRules(rules?.map(rule => ({
        ...rule,
        success_rate: Math.floor(Math.random() * 20) + 80, // Simulated
        executions: rule.execution_count || 0
      })) || []);
      setAIInsights(insights);

    } catch (error) {
      console.error('Error loading automation data:', error);
      toast({
        title: "Error",
        description: "Failed to load automation data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRuleActive = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('workflow_automation_rules')
        .update({ is_active: isActive })
        .eq('id', ruleId);

      if (error) throw error;

      setAutomationRules(prev => prev.map(rule => 
        rule.id === ruleId ? { ...rule, is_active: isActive } : rule
      ));

      toast({
        title: "Rule Updated",
        description: `Automation rule ${isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Error updating rule:', error);
      toast({
        title: "Error",
        description: "Failed to update automation rule",
        variant: "destructive",
      });
    }
  };

  const createAutomationRule = async () => {
    try {
      const { data, error } = await supabase
        .from('workflow_automation_rules')
        .insert({
          name: newRule.name,
          description: newRule.description,
          trigger_event: newRule.trigger_type,
          conditions: newRule.trigger_conditions,
          actions: newRule.actions,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setAutomationRules(prev => [{ 
        ...data, 
        success_rate: 0, 
        executions: 0 
      }, ...prev]);
      
      setShowCreateRule(false);
      setNewRule({
        name: '',
        description: '',
        trigger_type: 'keyword',
        trigger_conditions: {},
        actions: [],
        ai_confidence_threshold: 80
      });

      toast({
        title: "Rule Created",
        description: "New automation rule has been created successfully",
      });
    } catch (error) {
      console.error('Error creating rule:', error);
      toast({
        title: "Error",
        description: "Failed to create automation rule",
        variant: "destructive",
      });
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            AI Automation Center
          </h2>
          <p className="text-muted-foreground">
            Intelligent workflows and automated ticket handling
          </p>
        </div>
        <Dialog open={showCreateRule} onOpenChange={setShowCreateRule}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Automation Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rule-name">Rule Name</Label>
                <Input
                  id="rule-name"
                  value={newRule.name}
                  onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter rule name"
                />
              </div>
              <div>
                <Label htmlFor="rule-description">Description</Label>
                <Textarea
                  id="rule-description"
                  value={newRule.description}
                  onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this rule does"
                />
              </div>
              <div>
                <Label htmlFor="trigger-type">Trigger Type</Label>
                <Select 
                  value={newRule.trigger_type} 
                  onValueChange={(value) => setNewRule(prev => ({ ...prev, trigger_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>AI Confidence Threshold</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="range"
                    min="50"
                    max="100"
                    value={newRule.ai_confidence_threshold}
                    onChange={(e) => setNewRule(prev => ({ 
                      ...prev, 
                      ai_confidence_threshold: parseInt(e.target.value) 
                    }))}
                    className="flex-1"
                  />
                  <Badge variant="outline" className="min-w-16">
                    {newRule.ai_confidence_threshold}%
                  </Badge>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateRule(false)}>
                  Cancel
                </Button>
                <Button onClick={createAutomationRule} disabled={!newRule.name}>
                  Create Rule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <Workflow className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {automationRules.filter(r => r.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              of {automationRules.length} total rules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Suggestions</CardTitle>
            <Sparkles className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{aiInsights.length}</div>
            <p className="text-xs text-muted-foreground">
              optimization opportunities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">94%</div>
            <p className="text-xs text-muted-foreground">
              average automation success
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">38h</div>
            <p className="text-xs text-muted-foreground">
              this week
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Automation Rules</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="templates">Rule Templates</TabsTrigger>
          <TabsTrigger value="monitoring">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {automationRules.map((rule) => (
              <Card key={rule.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{rule.name}</h3>
                        <Badge variant="outline" className="capitalize">
                          {rule.trigger_event}
                        </Badge>
                        <Badge 
                          variant={rule.is_active ? "default" : "secondary"}
                          className="flex items-center gap-1"
                        >
                          {rule.is_active ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span>Success Rate: <strong>{rule.success_rate}%</strong></span>
                        <span>Executions: <strong>{rule.executions}</strong></span>
                        <span>Conditions: <strong>{Object.keys(rule.conditions || {}).length}</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={(checked) => toggleRuleActive(rule.id, checked)}
                      />
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {automationRules.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No Automation Rules</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first automation rule to start improving efficiency
                  </p>
                  <Button onClick={() => setShowCreateRule(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Rule
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {aiInsights.map((insight, index) => (
              <Alert key={index} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{insight.title}</h3>
                        <Badge 
                          variant="outline" 
                          className={getImpactColor(insight.impact)}
                        >
                          {insight.impact} impact
                        </Badge>
                        <Badge variant="secondary">
                          {insight.confidence}% confidence
                        </Badge>
                      </div>
                      <AlertDescription className="text-sm">
                        {insight.description}
                      </AlertDescription>
                      <div className="mt-3">
                        <p className="text-sm font-medium text-primary">
                          Suggested Action:
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {insight.suggested_action}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button size="sm">
                      Implement
                    </Button>
                    <Button variant="outline" size="sm">
                      Learn More
                    </Button>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                name: "Password Reset Auto-Response",
                description: "Automatically respond to password reset requests with self-service instructions",
                category: "Self-Service",
                popularity: 95
              },
              {
                name: "High Priority Escalation",
                description: "Escalate urgent tickets to managers within 15 minutes",
                category: "Escalation",
                popularity: 87
              },
              {
                name: "Email Setup Assistant",
                description: "Guide users through email setup with step-by-step instructions",
                category: "Guidance",
                popularity: 78
              },
              {
                name: "Hardware Request Routing",
                description: "Route hardware requests to appropriate procurement team",
                category: "Routing",
                popularity: 82
              }
            ].map((template, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold">{template.name}</h3>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Popularity:</span>
                        <Badge variant="secondary">{template.popularity}%</Badge>
                      </div>
                      <Button size="sm">
                        Use Template
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-green-600">1,247</div>
                    <div className="text-sm text-muted-foreground">Tickets Automated</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">156h</div>
                    <div className="text-sm text-muted-foreground">Time Saved</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">$12,400</div>
                    <div className="text-sm text-muted-foreground">Cost Savings</div>
                  </div>
                </div>
                
                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertDescription>
                    Your automation rules are performing excellently with a 94% success rate. 
                    Consider implementing the AI suggestions above to further optimize performance.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};