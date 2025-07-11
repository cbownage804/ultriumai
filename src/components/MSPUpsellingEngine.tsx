import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TrendingUp, Star, DollarSign, Calendar, Target, MessageSquare, CheckCircle } from 'lucide-react';

interface UpsellingOpportunity {
  id: string;
  client_id: string;
  client_name: string;
  opportunity_type: string;
  service_name: string;
  current_spend: number;
  potential_revenue: number;
  confidence_score: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'identified' | 'contacted' | 'proposal_sent' | 'negotiating' | 'closed_won' | 'closed_lost';
  reasons: string[];
  action_items: string[];
  estimated_close_date: string;
}

interface MSPUpsellingEngineProps {
  mspId: string;
}

export const MSPUpsellingEngine = ({ mspId }: MSPUpsellingEngineProps) => {
  const [opportunities, setOpportunities] = useState<UpsellingOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    const mockData: UpsellingOpportunity[] = [
      {
        id: '1',
        client_id: 'client-1',
        client_name: 'TechCorp Inc',
        opportunity_type: 'Service Upgrade',
        service_name: 'Premium Security Package',
        current_spend: 2500,
        potential_revenue: 4200,
        confidence_score: 0.85,
        priority: 'high',
        status: 'identified',
        reasons: [
          'Recent security incidents in their industry',
          'Current basic plan insufficient for compliance needs',
          'CEO mentioned cybersecurity concerns in last meeting'
        ],
        action_items: [
          'Schedule security assessment presentation',
          'Prepare ROI analysis for premium features',
          'Get compliance requirements documentation'
        ],
        estimated_close_date: '2024-02-15'
      },
      {
        id: '2',
        client_id: 'client-2',
        client_name: 'RetailPlus Co',
        opportunity_type: 'Additional Services',
        service_name: 'Cloud Backup & Recovery',
        current_spend: 1800,
        potential_revenue: 2700,
        confidence_score: 0.72,
        priority: 'medium',
        status: 'proposal_sent',
        reasons: [
          'Data loss incident last quarter',
          'Growing data storage needs',
          'Asked about backup solutions during support call'
        ],
        action_items: [
          'Follow up on proposal status',
          'Address any technical concerns',
          'Schedule demo of recovery process'
        ],
        estimated_close_date: '2024-02-28'
      },
      {
        id: '3',
        client_id: 'client-3',
        client_name: 'Healthcare Partners',
        opportunity_type: 'Compliance',
        service_name: 'HIPAA Compliance Package',
        current_spend: 3200,
        potential_revenue: 5800,
        confidence_score: 0.91,
        priority: 'urgent',
        status: 'negotiating',
        reasons: [
          'HIPAA audit coming up next month',
          'Current setup has compliance gaps',
          'Budget approved for compliance initiatives'
        ],
        action_items: [
          'Finalize contract terms',
          'Prepare implementation timeline',
          'Schedule compliance training session'
        ],
        estimated_close_date: '2024-02-10'
      }
    ];

    setTimeout(() => {
      setOpportunities(mockData);
      setIsLoading(false);
    }, 1000);
  }, [mspId]);

  const totalPotentialRevenue = opportunities.reduce((sum, opp) => sum + opp.potential_revenue, 0);
  const avgConfidenceScore = opportunities.length > 0 ?
    opportunities.reduce((sum, opp) => sum + opp.confidence_score, 0) / opportunities.length : 0;

  const priorityColor = {
    low: 'bg-blue-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    urgent: 'bg-red-500'
  };

  const statusBadgeVariant = {
    identified: 'secondary' as const,
    contacted: 'outline' as const,
    proposal_sent: 'default' as const,
    negotiating: 'destructive' as const,
    closed_won: 'default' as const,
    closed_lost: 'secondary' as const
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Automated Upselling Engine</h2>
          <p className="text-muted-foreground">
            AI-powered revenue opportunities and sales automation
          </p>
        </div>
        <Button>
          <Target className="w-4 h-4 mr-2" />
          Set Revenue Goals
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPotentialRevenue.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              From {opportunities.length} opportunities
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(avgConfidenceScore * 100).toFixed(0)}%</div>
            <Progress value={avgConfidenceScore * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {opportunities.filter(o => o.priority === 'high' || o.priority === 'urgent').length}
            </div>
            <div className="text-xs text-muted-foreground">
              Require immediate attention
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Close Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <div className="text-xs text-green-600">
              +12% vs last quarter
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipeline">Sales Pipeline</TabsTrigger>
          <TabsTrigger value="automation">Automation Rules</TabsTrigger>
          <TabsTrigger value="analytics">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid gap-6">
            {opportunities.map((opportunity) => (
              <Card key={opportunity.id} className="relative overflow-hidden">
                <div 
                  className={`absolute left-0 top-0 w-1 h-full ${priorityColor[opportunity.priority]}`}
                />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {opportunity.client_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{opportunity.client_name}</CardTitle>
                        <CardDescription>{opportunity.service_name}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusBadgeVariant[opportunity.status]}>
                        {opportunity.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className={`${priorityColor[opportunity.priority]} text-white`}>
                        {opportunity.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Financial Impact</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Current Spend:</span>
                          <span>${opportunity.current_spend.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold">
                          <span>Potential Revenue:</span>
                          <span className="text-green-600">
                            ${opportunity.potential_revenue.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Uplift:</span>
                          <span className="text-blue-600">
                            +{(((opportunity.potential_revenue - opportunity.current_spend) / opportunity.current_spend) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Confidence Score</span>
                          <span>{(opportunity.confidence_score * 100).toFixed(0)}%</span>
                        </div>
                        <Progress value={opportunity.confidence_score * 100} />
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-2">Key Reasons</h4>
                      <ul className="space-y-1">
                        {opportunity.reasons.map((reason, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-2">Next Actions</h4>
                      <ul className="space-y-1 mb-3">
                        {opportunity.action_items.map((action, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <Calendar className="w-3 h-3" />
                        Target close: {new Date(opportunity.estimated_close_date).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1">
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Contact
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          Update Status
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation Rules</CardTitle>
              <CardDescription>
                Configure automated upselling triggers and actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Security Incident Trigger</h4>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    When a client experiences a security incident, automatically suggest premium security packages
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Edit Rule</Button>
                    <Button size="sm" variant="outline">View Triggers</Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Usage Threshold Alert</h4>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Alert when client usage exceeds 80% of current plan limits
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Edit Rule</Button>
                    <Button size="sm" variant="outline">View Triggers</Button>
                  </div>
                </div>

                <Button className="w-full" variant="outline">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Create New Automation Rule
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>Track opportunities through the sales process</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Identified</span>
                    <span className="font-semibold">12 opportunities</span>
                  </div>
                  <Progress value={100} />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Contacted</span>
                    <span className="font-semibold">8 opportunities</span>
                  </div>
                  <Progress value={67} />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Proposal Sent</span>
                    <span className="font-semibold">5 opportunities</span>
                  </div>
                  <Progress value={42} />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Closed Won</span>
                    <span className="font-semibold">3 opportunities</span>
                  </div>
                  <Progress value={25} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Impact</CardTitle>
                <CardDescription>Upselling performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">This Month</span>
                    <span className="font-semibold text-green-600">+$24,500</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">This Quarter</span>
                    <span className="font-semibold text-green-600">+$78,200</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Average Deal Size</span>
                    <span className="font-semibold">$4,100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Time to Close</span>
                    <span className="font-semibold">18 days</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};