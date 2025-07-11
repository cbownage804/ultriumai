import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertTriangle, TrendingDown, Users, Calendar, Heart, Phone, Mail, CheckCircle2 } from 'lucide-react';

interface ChurnPrediction {
  id: string;
  client_id: string;
  client_name: string;
  churn_risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  contributing_factors: string[];
  recommended_actions: string[];
  last_engagement_date: string;
  contract_renewal_date: string;
  satisfaction_trend: 'improving' | 'stable' | 'declining';
  support_ticket_trend: 'decreasing' | 'stable' | 'increasing';
  payment_history_score: number;
}

interface MSPChurnPredictionProps {
  mspId: string;
}

export const MSPChurnPrediction = ({ mspId }: MSPChurnPredictionProps) => {
  const [predictions, setPredictions] = useState<ChurnPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    const mockData: ChurnPrediction[] = [
      {
        id: '1',
        client_id: 'client-1',
        client_name: 'TechCorp Inc',
        churn_risk_score: 0.82,
        risk_level: 'high',
        contributing_factors: [
          'Support ticket volume increased 150% last month',
          'No engagement with account manager in 45 days',
          'Contract renewal approaching in 30 days',
          'Recent competitor pricing inquiry'
        ],
        recommended_actions: [
          'Schedule urgent executive meeting',
          'Conduct satisfaction survey',
          'Offer service optimization review',
          'Prepare retention offer'
        ],
        last_engagement_date: '2024-01-02',
        contract_renewal_date: '2024-02-15',
        satisfaction_trend: 'declining',
        support_ticket_trend: 'increasing',
        payment_history_score: 0.95
      },
      {
        id: '2',
        client_id: 'client-2',
        client_name: 'RetailPlus Co',
        churn_risk_score: 0.34,
        risk_level: 'low',
        contributing_factors: [
          'Minor decrease in platform usage',
          'Delayed payment by 5 days last month'
        ],
        recommended_actions: [
          'Send monthly check-in email',
          'Share new feature updates',
          'Monitor usage patterns'
        ],
        last_engagement_date: '2024-01-12',
        contract_renewal_date: '2024-06-20',
        satisfaction_trend: 'stable',
        support_ticket_trend: 'stable',
        payment_history_score: 0.88
      },
      {
        id: '3',
        client_id: 'client-3',
        client_name: 'FinanceFirst LLC',
        churn_risk_score: 0.67,
        risk_level: 'medium',
        contributing_factors: [
          'New IT director hired recently',
          'Asked about contract termination clauses',
          'Reduced service utilization by 25%',
          'Missed last two quarterly review meetings'
        ],
        recommended_actions: [
          'Introduction meeting with new IT director',
          'Present case studies and value proposition',
          'Offer pilot of additional services',
          'Schedule immediate business review'
        ],
        last_engagement_date: '2024-01-08',
        contract_renewal_date: '2024-04-10',
        satisfaction_trend: 'declining',
        support_ticket_trend: 'decreasing',
        payment_history_score: 0.92
      }
    ];

    setTimeout(() => {
      setPredictions(mockData);
      setIsLoading(false);
    }, 1000);
  }, [mspId]);

  const riskLevelColor = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    critical: 'bg-red-500'
  };

  const riskLevelBadge = {
    low: 'default' as const,
    medium: 'secondary' as const,
    high: 'destructive' as const,
    critical: 'destructive' as const
  };

  const trendIcon = {
    improving: '📈',
    stable: '➡️',
    declining: '📉',
    decreasing: '📉',
    increasing: '📈'
  };

  const highRiskClients = predictions.filter(p => p.risk_level === 'high' || p.risk_level === 'critical').length;
  const avgRiskScore = predictions.length > 0 ? 
    predictions.reduce((sum, p) => sum + p.churn_risk_score, 0) / predictions.length : 0;

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
          <h2 className="text-2xl font-bold">Churn Prediction & Prevention</h2>
          <p className="text-muted-foreground">
            AI-powered client retention insights and proactive intervention strategies
          </p>
        </div>
        <Button>
          <Heart className="w-4 h-4 mr-2" />
          Retention Campaign
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Clients</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{highRiskClients}</div>
            <div className="text-xs text-muted-foreground">
              Require immediate attention
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(avgRiskScore * 100).toFixed(0)}%</div>
            <Progress value={avgRiskScore * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">94.2%</div>
            <div className="text-xs text-green-600">
              +2.1% vs last quarter
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Intervention Success</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <div className="text-xs text-muted-foreground">
              Of at-risk clients retained
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="predictions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="predictions">Risk Assessment</TabsTrigger>
          <TabsTrigger value="intervention">Intervention Plans</TabsTrigger>
          <TabsTrigger value="analytics">Churn Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid gap-6">
            {predictions.sort((a, b) => b.churn_risk_score - a.churn_risk_score).map((prediction) => (
              <Card key={prediction.id} className="relative overflow-hidden">
                <div 
                  className={`absolute left-0 top-0 w-1 h-full ${riskLevelColor[prediction.risk_level]}`}
                />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {prediction.client_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{prediction.client_name}</CardTitle>
                        <CardDescription>
                          Contract renewal: {new Date(prediction.contract_renewal_date).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={riskLevelBadge[prediction.risk_level]}>
                        {prediction.risk_level} risk
                      </Badge>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {(prediction.churn_risk_score * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-muted-foreground">churn risk</div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Risk Indicators</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Satisfaction Trend</span>
                          <span className="flex items-center gap-1">
                            {trendIcon[prediction.satisfaction_trend]}
                            {prediction.satisfaction_trend}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Support Tickets</span>
                          <span className="flex items-center gap-1">
                            {trendIcon[prediction.support_ticket_trend]}
                            {prediction.support_ticket_trend}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Payment Score</span>
                          <span className="font-semibold">
                            {(prediction.payment_history_score * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Last Engagement</span>
                          <span>
                            {new Date(prediction.last_engagement_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-3">Contributing Factors</h4>
                      <ul className="space-y-2">
                        {prediction.contributing_factors.map((factor, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <AlertTriangle className="w-3 h-3 text-orange-500 mt-1 flex-shrink-0" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-3">Recommended Actions</h4>
                      <ul className="space-y-2 mb-4">
                        {prediction.recommended_actions.map((action, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="w-3 h-3 text-blue-500 mt-1 flex-shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1">
                          <Phone className="w-3 h-3 mr-1" />
                          Call Now
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Mail className="w-3 h-3 mr-1" />
                          Email
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="intervention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automated Intervention Campaigns</CardTitle>
              <CardDescription>
                Pre-configured retention strategies based on risk level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-red-600">Critical Risk Protocol</h4>
                    <Badge variant="destructive">Auto-triggered</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Immediate executive escalation, emergency meeting scheduling, and retention offer preparation
                  </p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• C-level meeting within 24 hours</li>
                    <li>• Dedicated success manager assignment</li>
                    <li>• Custom retention package</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-orange-600">High Risk Outreach</h4>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Proactive communication, satisfaction survey, and service optimization review
                  </p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Account manager call within 48 hours</li>
                    <li>• Quarterly business review</li>
                    <li>• Service optimization audit</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-yellow-600">Medium Risk Monitoring</h4>
                    <Badge variant="outline">Scheduled</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Enhanced monitoring, regular check-ins, and value demonstration
                  </p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Weekly usage reports</li>
                    <li>• Monthly success stories</li>
                    <li>• Feature adoption guidance</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Churn Risk Distribution</CardTitle>
                <CardDescription>Current client risk breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      Low Risk
                    </span>
                    <span className="font-semibold">
                      {predictions.filter(p => p.risk_level === 'low').length} clients
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                      Medium Risk
                    </span>
                    <span className="font-semibold">
                      {predictions.filter(p => p.risk_level === 'medium').length} clients
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full" />
                      High Risk
                    </span>
                    <span className="font-semibold">
                      {predictions.filter(p => p.risk_level === 'high').length} clients
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      Critical Risk
                    </span>
                    <span className="font-semibold">
                      {predictions.filter(p => p.risk_level === 'critical').length} clients
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Retention Metrics</CardTitle>
                <CardDescription>Historical performance data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Monthly Churn Rate</span>
                    <span className="font-semibold text-green-600">2.1%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Quarterly Churn Rate</span>
                    <span className="font-semibold text-green-600">5.8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Customer Lifetime</span>
                    <span className="font-semibold">3.2 years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Retention Investment ROI</span>
                    <span className="font-semibold text-green-600">420%</span>
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