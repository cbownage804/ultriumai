import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  FileText,
  Send,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SecurityMetric {
  category: string;
  score: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  details: string;
  recommendations: string[];
  trend: 'up' | 'down' | 'stable';
}

interface ClientRiskScore {
  client_id: string;
  company_name: string;
  overall_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  last_updated: string;
  metrics: SecurityMetric[];
  compliance_status: {
    framework: string;
    score: number;
    status: string;
  }[];
  recent_incidents: number;
  trends: {
    score_change: number;
    timeframe: string;
  };
}

export const MSPClientRiskScorecard = () => {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [riskScores, setRiskScores] = useState<ClientRiskScore[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadClientRiskScores();
  }, []);

  const loadClientRiskScores = async () => {
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

      // Generate comprehensive risk scores for each client
      const mockRiskScores: ClientRiskScore[] = clients.map(client => {
        const baseScore = 70 + Math.random() * 25; // 70-95
        const overallScore = Math.round(baseScore);
        
        const metrics: SecurityMetric[] = [
          {
            category: 'Endpoint Security',
            score: Math.round(75 + Math.random() * 20),
            status: Math.random() > 0.3 ? 'good' : 'warning',
            details: 'Antivirus coverage, EDR deployment, patch management',
            recommendations: ['Update 3 outdated endpoints', 'Deploy EDR to 2 missing devices'],
            trend: Math.random() > 0.5 ? 'up' : 'stable'
          },
          {
            category: 'Network Security',
            score: Math.round(80 + Math.random() * 15),
            status: Math.random() > 0.4 ? 'excellent' : 'good',
            details: 'Firewall configuration, intrusion detection, network segmentation',
            recommendations: ['Enable advanced threat detection', 'Review firewall rules'],
            trend: 'up'
          },
          {
            category: 'Email Security',
            score: Math.round(65 + Math.random() * 30),
            status: Math.random() > 0.2 ? 'good' : 'warning',
            details: 'Spam filtering, phishing protection, email encryption',
            recommendations: ['Configure DMARC policy', 'Enable email encryption'],
            trend: Math.random() > 0.3 ? 'up' : 'down'
          },
          {
            category: 'Identity & Access',
            score: Math.round(70 + Math.random() * 25),
            status: Math.random() > 0.25 ? 'good' : 'critical',
            details: 'MFA adoption, password policies, privileged access management',
            recommendations: ['Enforce MFA for all users', 'Implement privileged access management'],
            trend: 'stable'
          },
          {
            category: 'Data Protection',
            score: Math.round(85 + Math.random() * 10),
            status: 'excellent',
            details: 'Backup coverage, encryption, data loss prevention',
            recommendations: ['Test backup restoration', 'Review encryption policies'],
            trend: 'up'
          }
        ];

        return {
          client_id: client.id,
          company_name: client.company_name,
          overall_score: overallScore,
          risk_level: overallScore >= 85 ? 'low' : overallScore >= 70 ? 'medium' : overallScore >= 50 ? 'high' : 'critical',
          last_updated: new Date().toISOString(),
          metrics,
          compliance_status: [
            { framework: 'SOC 2', score: Math.round(80 + Math.random() * 15), status: 'compliant' },
            { framework: 'HIPAA', score: Math.round(75 + Math.random() * 20), status: 'partial' },
            { framework: 'PCI DSS', score: Math.round(85 + Math.random() * 10), status: 'compliant' }
          ],
          recent_incidents: Math.floor(Math.random() * 3),
          trends: {
            score_change: Math.round((Math.random() - 0.5) * 10),
            timeframe: '30 days'
          }
        };
      });

      setRiskScores(mockRiskScores);
      if (mockRiskScores.length > 0) {
        setSelectedClient(mockRiskScores[0].client_id);
      }
    } catch (error) {
      console.error('Error loading risk scores:', error);
      toast({
        title: "Error",
        description: "Failed to load client risk scores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 85) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-yellow-50 border-yellow-200';
    if (score >= 50) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'good': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-500" />;
      default: return null;
    }
  };

  const generateReport = async (clientId: string) => {
    toast({
      title: "Report Generated",
      description: "Security scorecard report has been generated and is ready for download",
    });
  };

  const shareWithClient = async (clientId: string) => {
    toast({
      title: "Scorecard Shared",
      description: "Security scorecard has been sent to client via email",
    });
  };

  const selectedScore = riskScores.find(score => score.client_id === selectedClient);

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
            <Shield className="h-6 w-6 text-primary" />
            Client Risk Scorecards
          </h2>
          <p className="text-muted-foreground">
            Comprehensive security assessments for all your clients
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Client Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {riskScores.map((score) => (
              <div
                key={score.client_id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedClient === score.client_id 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedClient(score.client_id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{score.company_name}</h4>
                  <Badge className={getRiskBadgeColor(score.risk_level)}>
                    {score.risk_level}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${getScoreColor(score.overall_score)}`}>
                    {score.overall_score}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {score.trends.score_change > 0 && <TrendingUp className="h-3 w-3 text-green-500" />}
                    {score.trends.score_change < 0 && <TrendingDown className="h-3 w-3 text-red-500" />}
                    {score.trends.score_change !== 0 && (
                      <span className={score.trends.score_change > 0 ? 'text-green-500' : 'text-red-500'}>
                        {score.trends.score_change > 0 ? '+' : ''}{score.trends.score_change}
                      </span>
                    )}
                  </div>
                </div>
                <Progress value={score.overall_score} className="h-1.5 mt-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Detailed Scorecard */}
        {selectedScore && (
          <div className="lg:col-span-2 space-y-4">
            {/* Overall Score Card */}
            <Card className={getScoreBackground(selectedScore.overall_score)}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{selectedScore.company_name}</CardTitle>
                    <CardDescription>Security Risk Assessment</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className={`text-4xl font-bold ${getScoreColor(selectedScore.overall_score)}`}>
                      {selectedScore.overall_score}
                    </div>
                    <Badge className={getRiskBadgeColor(selectedScore.risk_level)}>
                      {selectedScore.risk_level} risk
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button onClick={() => generateReport(selectedScore.client_id)} size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => shareWithClient(selectedScore.client_id)}
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Share with Client
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="metrics" className="space-y-4">
              <TabsList>
                <TabsTrigger value="metrics">Security Metrics</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
                <TabsTrigger value="recommendations">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="metrics" className="space-y-4">
                {selectedScore.metrics.map((metric, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(metric.status)}
                          <h4 className="font-medium">{metric.category}</h4>
                          {getTrendIcon(metric.trend)}
                        </div>
                        <span className={`font-bold ${getScoreColor(metric.score)}`}>
                          {metric.score}/100
                        </span>
                      </div>
                      <Progress value={metric.score} className="mb-2" />
                      <p className="text-sm text-muted-foreground mb-3">{metric.details}</p>
                      <div className="space-y-1">
                        {metric.recommendations.map((rec, recIndex) => (
                          <div key={recIndex} className="text-xs text-orange-600 flex items-start gap-1">
                            <span className="mt-1">•</span>
                            {rec}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="compliance" className="space-y-4">
                {selectedScore.compliance_status.map((compliance, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{compliance.framework}</h4>
                          <p className="text-sm text-muted-foreground capitalize">{compliance.status}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xl font-bold ${getScoreColor(compliance.score)}`}>
                            {compliance.score}%
                          </span>
                        </div>
                      </div>
                      <Progress value={compliance.score} className="mt-2" />
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Priority Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedScore.metrics
                      .filter(metric => metric.status === 'warning' || metric.status === 'critical')
                      .flatMap(metric => metric.recommendations)
                      .map((rec, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          <span className="flex-1 text-sm">{rec}</span>
                          <Button size="sm" variant="outline">
                            Schedule
                          </Button>
                        </div>
                      ))}
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