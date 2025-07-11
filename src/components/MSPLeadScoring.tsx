import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Phone, Mail, Calendar, User, Building, DollarSign, TrendingUp, Target, Users } from 'lucide-react';

interface LeadScore {
  id: string;
  lead_name: string;
  company_name: string;
  email: string;
  phone: string;
  lead_score: number;
  score_breakdown: {
    company_size: number;
    industry_fit: number;
    budget_qualification: number;
    engagement_level: number;
    pain_points: number;
    decision_timeline: number;
  };
  lead_source: string;
  industry: string;
  company_size: string;
  budget_range: string;
  pain_points: string[];
  engagement_level: 'cold' | 'warm' | 'hot' | 'qualified';
  last_activity_date: string;
  next_action: string;
  assigned_to: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
}

interface MSPLeadScoringProps {
  mspId: string;
}

export const MSPLeadScoring = ({ mspId }: MSPLeadScoringProps) => {
  const [leads, setLeads] = useState<LeadScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load real lead data from database when available
    setTimeout(() => {
      setLeads([]);
      setIsLoading(false);
    }, 1000);
  }, [mspId]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'hot': return 'bg-red-500';
      case 'qualified': return 'bg-green-500';
      case 'warm': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const avgLeadScore = leads.length > 0 ? 
    leads.reduce((sum, lead) => sum + lead.lead_score, 0) / leads.length : 0;

  const qualifiedLeads = leads.filter(l => l.lead_score >= 70).length;
  const hotLeads = leads.filter(l => l.engagement_level === 'hot' || l.engagement_level === 'qualified').length;

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
          <h2 className="text-2xl font-bold">AI Lead Scoring & Management</h2>
          <p className="text-muted-foreground">
            Intelligent lead qualification and sales pipeline optimization
          </p>
        </div>
        <Button>
          <Target className="w-4 h-4 mr-2" />
          Import Leads
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.length}</div>
            <div className="text-xs text-muted-foreground">
              {leads.length > 0 ? 'Active leads' : 'No leads yet'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{qualifiedLeads}</div>
            <div className="text-xs text-muted-foreground">
              Score ≥ 70
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Lead Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgLeadScore.toFixed(0)}</div>
            <Progress value={avgLeadScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hot Leads</CardTitle>
            <Target className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{hotLeads}</div>
            <div className="text-xs text-muted-foreground">
              Immediate follow-up
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="leads" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leads">Lead Pipeline</TabsTrigger>
          <TabsTrigger value="scoring">Scoring Model</TabsTrigger>
          <TabsTrigger value="analytics">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-4">
          <div className="grid gap-6">
            {leads.sort((a, b) => b.lead_score - a.lead_score).map((lead) => (
              <Card key={lead.id} className="relative overflow-hidden">
                <div 
                  className={`absolute left-0 top-0 w-1 h-full ${getEngagementColor(lead.engagement_level)}`}
                />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {lead.lead_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{lead.lead_name}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Building className="w-3 h-3" />
                          {lead.company_name} • {lead.industry}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getScoreBadge(lead.lead_score) as any}>
                        Score: {lead.lead_score}
                      </Badge>
                      <Badge variant="outline" className={`${getEngagementColor(lead.engagement_level)} text-white`}>
                        {lead.engagement_level}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Lead Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          {lead.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {lead.phone}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3 h-3" />
                          {lead.company_size}
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3 h-3" />
                          {lead.budget_range}
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3" />
                          {lead.lead_source}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-3">Score Breakdown</h4>
                      <div className="space-y-2">
                        {Object.entries(lead.score_breakdown).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center text-xs">
                            <span className="capitalize">{key.replace('_', ' ')}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{value}</span>
                              <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${(value / 20) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-3">Pain Points</h4>
                      <ul className="space-y-1">
                        {lead.pain_points.map((pain, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                            {pain}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-3">Sales Activity</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Status</div>
                          <Badge variant="secondary">{lead.status.replace('_', ' ')}</Badge>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Assigned to</div>
                          <div className="text-sm font-medium">{lead.assigned_to}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Next Action</div>
                          <div className="text-sm">{lead.next_action}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Last Activity</div>
                          <div className="text-sm flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(lead.last_activity_date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" className="flex-1">
                            <Phone className="w-3 h-3 mr-1" />
                            Call
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <Mail className="w-3 h-3 mr-1" />
                            Email
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Scoring Model</CardTitle>
              <CardDescription>
                How leads are automatically scored based on various factors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold mb-4">Scoring Criteria</h4>
                  <div className="space-y-4">
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Company Size</span>
                        <span className="text-sm text-muted-foreground">Max: 20 points</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Larger companies typically have bigger IT budgets and more complex needs
                      </p>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Industry Fit</span>
                        <span className="text-sm text-muted-foreground">Max: 18 points</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Industries with higher compliance or security requirements score higher
                      </p>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Engagement Level</span>
                        <span className="text-sm text-muted-foreground">Max: 16 points</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Response rate, meeting attendance, and interaction quality
                      </p>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Budget Qualification</span>
                        <span className="text-sm text-muted-foreground">Max: 15 points</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Confirmed budget availability and decision authority
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-4">Scoring Thresholds</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="font-medium">High Priority</span>
                      <Badge variant="default">80-100 points</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <span className="font-medium">Medium Priority</span>
                      <Badge variant="secondary">60-79 points</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="font-medium">Low Priority</span>
                      <Badge variant="destructive">0-59 points</Badge>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h5 className="text-sm font-semibold mb-3">Model Performance</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Conversion Rate (High Priority)</span>
                        <span className="font-semibold text-green-600">45%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Conversion Rate (Medium Priority)</span>
                        <span className="font-semibold">18%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Conversion Rate (Low Priority)</span>
                        <span className="font-semibold text-red-600">3%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {leads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lead Source Performance</CardTitle>
                  <CardDescription>Conversion rates by lead source</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p>Analytics will appear when you have lead data</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pipeline Metrics</CardTitle>
                  <CardDescription>Current sales funnel performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p>Pipeline metrics will appear when you have lead data</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Lead Data Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Import leads to start using AI-powered scoring and analytics
                </p>
                <Button>
                  <Target className="w-4 h-4 mr-2" />
                  Import Your First Leads
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};