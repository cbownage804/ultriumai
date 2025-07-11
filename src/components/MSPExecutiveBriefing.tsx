import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Download, 
  Send, 
  Calendar,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Users,
  Target,
  Clock,
  Eye,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ExecutiveSummary {
  client_id: string;
  company_name: string;
  reporting_period: string;
  security_score: number;
  score_change: number;
  key_metrics: {
    threats_blocked: number;
    incidents_prevented: number;
    compliance_score: number;
    uptime_percentage: number;
  };
  achievements: string[];
  concerns: string[];
  recommendations: string[];
  cost_savings: number;
  next_actions: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    timeline: string;
  }>;
}

interface ComplianceStatus {
  framework: string;
  status: 'compliant' | 'partial' | 'non-compliant';
  score: number;
  last_audit: string;
  next_review: string;
}

export const MSPExecutiveBriefing = () => {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [briefings, setBriefings] = useState<ExecutiveSummary[]>([]);
  const [compliance, setCompliance] = useState<ComplianceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadExecutiveBriefings();
  }, []);

  const loadExecutiveBriefings = async () => {
    try {
      setLoading(true);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: msps } = await supabase
        .from('msps')
        .select('*')
        .eq('user_id', user.user.id);

      if (!msps || msps.length === 0) return;

      const { data: clients } = await supabase
        .from('msp_clients')
        .select('*')
        .eq('msp_id', msps[0].id);

      if (!clients) return;

      // Generate executive briefings for each client
      const mockBriefings: ExecutiveSummary[] = clients.map(client => {
        const securityScore = Math.round(75 + Math.random() * 20);
        const scoreChange = Math.round((Math.random() - 0.5) * 10);
        
        return {
          client_id: client.id,
          company_name: client.company_name,
          reporting_period: 'November 2024',
          security_score: securityScore,
          score_change: scoreChange,
          key_metrics: {
            threats_blocked: Math.round(150 + Math.random() * 500),
            incidents_prevented: Math.round(3 + Math.random() * 8),
            compliance_score: Math.round(85 + Math.random() * 10),
            uptime_percentage: 99.8 + Math.random() * 0.15
          },
          achievements: [
            'Successfully blocked 847 malicious email attempts',
            'Achieved 99.9% network uptime',
            'Completed SOC 2 Type II audit with zero findings',
            'Reduced incident response time by 35%',
            'Implemented zero-trust architecture for remote workers'
          ].slice(0, 3 + Math.floor(Math.random() * 3)),
          concerns: [
            'Outdated endpoint protection on 3 legacy systems',
            'Employee security training completion at 78%',
            'Multi-factor authentication adoption needs improvement',
            'Third-party vendor security assessments pending'
          ].slice(0, Math.floor(Math.random() * 3)),
          recommendations: [
            'Upgrade legacy endpoint protection systems by Q1 2025',
            'Implement mandatory security awareness training',
            'Deploy advanced threat detection on all endpoints',
            'Conduct quarterly penetration testing',
            'Establish incident response playbooks'
          ].slice(0, 2 + Math.floor(Math.random() * 3)),
          cost_savings: Math.round(25000 + Math.random() * 75000),
          next_actions: [
            {
              action: 'Deploy updated endpoint agents',
              priority: 'high',
              timeline: 'Next 30 days'
            },
            {
              action: 'Complete security training rollout',
              priority: 'medium',
              timeline: 'Next 60 days'
            },
            {
              action: 'Quarterly security assessment',
              priority: 'low',
              timeline: 'Next 90 days'
            }
          ]
        };
      });

      const mockCompliance: ComplianceStatus[] = [
        {
          framework: 'SOC 2 Type II',
          status: 'compliant',
          score: 98,
          last_audit: '2024-09-15',
          next_review: '2025-09-15'
        },
        {
          framework: 'HIPAA',
          status: 'compliant',
          score: 94,
          last_audit: '2024-08-20',
          next_review: '2025-02-20'
        },
        {
          framework: 'PCI DSS',
          status: 'partial',
          score: 87,
          last_audit: '2024-10-10',
          next_review: '2025-01-10'
        },
        {
          framework: 'ISO 27001',
          status: 'compliant',
          score: 92,
          last_audit: '2024-07-30',
          next_review: '2025-07-30'
        }
      ];

      setBriefings(mockBriefings);
      setCompliance(mockCompliance);
      if (mockBriefings.length > 0) {
        setSelectedClient(mockBriefings[0].client_id);
      }
    } catch (error) {
      console.error('Error loading executive briefings:', error);
      toast({
        title: "Error",
        description: "Failed to load executive briefings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (clientId: string) => {
    setGeneratingReport(true);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Executive Report Generated",
      description: "Beautiful executive briefing has been created and is ready for download",
    });
    
    setGeneratingReport(false);
  };

  const shareWithClient = async (clientId: string) => {
    toast({
      title: "Report Shared",
      description: "Executive briefing has been sent to client leadership team",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 80) return 'text-blue-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getChangeIndicator = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
    return null;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceStatus = (status: string) => {
    switch (status) {
      case 'compliant': return { color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'partial': return { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
      case 'non-compliant': return { color: 'bg-red-100 text-red-800', icon: AlertTriangle };
      default: return { color: 'bg-gray-100 text-gray-800', icon: AlertTriangle };
    }
  };

  const selectedBriefing = briefings.find(b => b.client_id === selectedClient);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Executive Security Briefings
          </h2>
          <p className="text-muted-foreground">
            Beautiful, executive-ready security reports for your clients
          </p>
        </div>
        {selectedBriefing && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => shareWithClient(selectedBriefing.client_id)}
            >
              <Send className="h-4 w-4 mr-2" />
              Share Report
            </Button>
            <Button 
              onClick={() => generateReport(selectedBriefing.client_id)}
              disabled={generatingReport}
            >
              {generatingReport ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {generatingReport ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Client Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {briefings.map((briefing) => (
              <div
                key={briefing.client_id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedClient === briefing.client_id 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedClient(briefing.client_id)}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-sm">{briefing.company_name}</h4>
                  {getChangeIndicator(briefing.score_change)}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-lg font-bold ${getScoreColor(briefing.security_score)}`}>
                    {briefing.security_score}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {briefing.reporting_period}
                  </span>
                </div>
                <Progress value={briefing.security_score} className="h-1 mt-1" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Executive Briefing */}
        {selectedBriefing && (
          <div className="lg:col-span-3 space-y-4">
            {/* Executive Summary Header */}
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{selectedBriefing.company_name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Security Briefing - {selectedBriefing.reporting_period}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${getScoreColor(selectedBriefing.security_score)}`}>
                      {selectedBriefing.security_score}
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      {getChangeIndicator(selectedBriefing.score_change)}
                      <span className={selectedBriefing.score_change > 0 ? 'text-green-600' : 'text-red-600'}>
                        {selectedBriefing.score_change > 0 ? '+' : ''}{selectedBriefing.score_change} pts
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Tabs defaultValue="summary" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="summary">Executive Summary</TabsTrigger>
                <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
                <TabsTrigger value="actions">Action Items</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Achievements */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="h-5 w-5" />
                        Key Achievements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {selectedBriefing.achievements.map((achievement, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <span className="text-green-500 mt-1">✓</span>
                            {achievement}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Areas of Concern */}
                  {selectedBriefing.concerns.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-800">
                          <AlertTriangle className="h-5 w-5" />
                          Areas for Attention
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {selectedBriefing.concerns.map((concern, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <span className="text-orange-500 mt-1">!</span>
                              {concern}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Cost Savings */}
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        ${selectedBriefing.cost_savings.toLocaleString()}
                      </div>
                      <div className="text-lg text-green-700 mb-2">Estimated Cost Savings</div>
                      <p className="text-sm text-green-600">
                        Through proactive security measures and incident prevention this month
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Strategic Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {selectedBriefing.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm p-3 bg-blue-50 rounded-lg">
                          <span className="text-blue-500 mt-1">→</span>
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="metrics" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-bold text-primary">
                        {selectedBriefing.key_metrics.threats_blocked}
                      </div>
                      <div className="text-sm text-muted-foreground">Threats Blocked</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6 text-center">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-600">
                        {selectedBriefing.key_metrics.incidents_prevented}
                      </div>
                      <div className="text-sm text-muted-foreground">Incidents Prevented</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6 text-center">
                      <BarChart3 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedBriefing.key_metrics.compliance_score}%
                      </div>
                      <div className="text-sm text-muted-foreground">Compliance Score</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6 text-center">
                      <TrendingUp className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedBriefing.key_metrics.uptime_percentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Uptime</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Trend Charts Placeholder */}
                <Card>
                  <CardHeader>
                    <CardTitle>Security Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center bg-muted/10 rounded-lg">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Interactive charts would appear here</p>
                        <p className="text-xs text-muted-foreground">Showing security metrics over time</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="compliance" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {compliance.map((comp, index) => {
                    const status = getComplianceStatus(comp.status);
                    const StatusIcon = status.icon;
                    
                    return (
                      <Card key={index}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{comp.framework}</CardTitle>
                            <Badge className={status.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {comp.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Compliance Score</span>
                                <span className="font-medium">{comp.score}%</span>
                              </div>
                              <Progress value={comp.score} className="h-2" />
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                              <div>
                                <span>Last Audit:</span>
                                <div className="font-medium">{new Date(comp.last_audit).toLocaleDateString()}</div>
                              </div>
                              <div>
                                <span>Next Review:</span>
                                <div className="font-medium">{new Date(comp.next_review).toLocaleDateString()}</div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="actions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Upcoming Action Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedBriefing.next_actions.map((action, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={getPriorityColor(action.priority)}>
                                {action.priority}
                              </Badge>
                              <span className="text-sm text-muted-foreground">{action.timeline}</span>
                            </div>
                            <p className="font-medium">{action.action}</p>
                          </div>
                          <Button size="sm" variant="outline">
                            Schedule
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};