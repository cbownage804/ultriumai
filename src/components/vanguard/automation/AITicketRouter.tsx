import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Route, Brain, User, CheckCircle, AlertTriangle, 
  Zap, Target, Users, ArrowRight, RefreshCw, Settings
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface RoutingResult {
  recommended_technician: {
    id: string;
    name: string;
    confidence: number;
    reasons: string[];
  };
  alternative_technicians: Array<{
    id: string;
    name: string;
    confidence: number;
    reason: string;
  }>;
  skill_match_score: number;
  workload_score: number;
  urgency_factor: number;
  routing_notes: string;
  auto_assign_recommended: boolean;
  escalation_risk: string;
}

export function AITicketRouter() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [routingResult, setRoutingResult] = useState<RoutingResult | null>(null);
  const [ticketData, setTicketData] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    category: 'general'
  });

  // Technicians loaded from database (empty until populated)
  const [technicians] = useState<Array<{ id: string; name: string; skills: string[]; current_tickets: number; availability: number }>>([]);

  const analyzeRouting = async () => {
    if (!ticketData.subject || !ticketData.description) {
      toast({
        title: "Missing Information",
        description: "Please provide ticket subject and description",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-ticket-router', {
        body: {
          ticket: ticketData,
          technicians: technicians,
          workloadData: {
            average_resolution_time: '4.5 hours',
            current_queue_depth: 23,
            sla_at_risk_count: 3
          }
        }
      });

      if (error) throw error;

      if (data?.success && data.routing) {
        setRoutingResult(data.routing);
        toast({
          title: "Routing Analysis Complete",
          description: `Recommended: ${data.routing.recommended_technician?.name || 'No recommendation'}`,
        });
      }
    } catch (error) {
      console.error('Routing error:', error);
      toast({
        title: "Routing Failed",
        description: "Could not analyze ticket routing",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'low': return <Badge className="bg-green-500">Low Risk</Badge>;
      case 'medium': return <Badge className="bg-yellow-500">Medium Risk</Badge>;
      case 'high': return <Badge className="bg-red-500">High Risk</Badge>;
      default: return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Route className="h-6 w-6 text-primary" />
            <CardTitle>AI Ticket Router</CardTitle>
          </div>
          <CardDescription>
            Intelligent ticket assignment based on skills, workload, and availability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ticket Subject</label>
              <Input
                placeholder="Enter ticket subject..."
                value={ticketData.subject}
                onChange={(e) => setTicketData({ ...ticketData, subject: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select 
                  value={ticketData.priority}
                  onValueChange={(value) => setTicketData({ ...ticketData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select 
                  value={ticketData.category}
                  onValueChange={(value) => setTicketData({ ...ticketData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="network">Network</SelectItem>
                    <SelectItem value="hardware">Hardware</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="cloud">Cloud</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Describe the issue in detail..."
              rows={4}
              value={ticketData.description}
              onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })}
            />
          </div>

          <Button onClick={analyzeRouting} disabled={loading} className="w-full">
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Analyze & Route
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {routingResult && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Recommended Assignment
                </CardTitle>
                {routingResult.auto_assign_recommended && (
                  <Badge className="bg-green-500">Auto-Assign Ready</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {routingResult.recommended_technician && (
                <>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{routingResult.recommended_technician.name}</p>
                      <p className={`text-sm font-medium ${getConfidenceColor(routingResult.recommended_technician.confidence)}`}>
                        {(routingResult.recommended_technician.confidence * 100).toFixed(0)}% Confidence Match
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Match Reasons:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {routingResult.recommended_technician.reasons.map((reason, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1">
                      <Zap className="h-4 w-4 mr-2" />
                      Assign Now
                    </Button>
                    <Button variant="outline">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Routing Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Skill Match</span>
                    <span>{(routingResult.skill_match_score * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={routingResult.skill_match_score * 100} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Workload Balance</span>
                    <span>{(routingResult.workload_score * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={routingResult.workload_score * 100} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Urgency Factor</span>
                    <span>{(routingResult.urgency_factor * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={routingResult.urgency_factor * 100} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium">Escalation Risk</span>
                {getRiskBadge(routingResult.escalation_risk)}
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">{routingResult.routing_notes}</p>
              </div>
            </CardContent>
          </Card>

          {routingResult.alternative_technicians && routingResult.alternative_technicians.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Alternative Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-3">
                  {routingResult.alternative_technicians.map((tech, idx) => (
                    <div key={idx} className="p-3 border rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-medium">{tech.name}</p>
                        <p className="text-sm text-muted-foreground">{tech.reason}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${getConfidenceColor(tech.confidence)}`}>
                          {(tech.confidence * 100).toFixed(0)}%
                        </span>
                        <Button size="sm" variant="outline">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
