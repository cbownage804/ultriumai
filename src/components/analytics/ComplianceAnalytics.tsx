import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  FileText,
  Shield,
  Target,
  TrendingUp,
  Calendar
} from "lucide-react";

interface ComplianceAnalyticsProps {
  timeRange: string;
}

export const ComplianceAnalytics = ({ timeRange }: ComplianceAnalyticsProps) => {
  // TODO: Replace with real compliance analytics data from Supabase
  const complianceData = {
    frameworkScores: [],
    auditReadiness: {
      lastAudit: '',
      nextAudit: '',
      daysUntilAudit: 0,
      readinessScore: 0
    },
    evidenceCollection: {
      total: 0,
      collected: 0,
      pending: 0,
      missing: 0
    },
    riskAssessment: [],
    recentActivity: []
  };

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'evidence_collected': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'gap_identified': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'control_passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'audit_scheduled': return <Calendar className="h-4 w-4 text-purple-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Framework Scores Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {complianceData.frameworkScores.map((framework, index) => (
          <Card key={index} className="hover-scale">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Shield className="h-5 w-5 text-primary" />
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">{framework.trend}</span>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">{framework.name}</h4>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${getScoreColor(framework.score)}`}>
                    {framework.score}%
                  </span>
                </div>
                <Progress value={framework.score} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {framework.compliant}/{framework.controls} controls compliant
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audit Readiness */}
        <Card>
          <CardHeader>
            <CardTitle>Audit Readiness</CardTitle>
            <CardDescription>Preparation status for upcoming audits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold text-primary mb-2">
                {complianceData.auditReadiness.readinessScore}%
              </div>
              <div className="text-sm text-muted-foreground mb-4">Audit Readiness Score</div>
              <Progress value={complianceData.auditReadiness.readinessScore} className="h-3" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Last Audit</span>
                </div>
                <p className="text-lg font-bold">
                  {new Date(complianceData.auditReadiness.lastAudit).toLocaleDateString()}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Next Audit</span>
                </div>
                <p className="text-lg font-bold">{complianceData.auditReadiness.daysUntilAudit} days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evidence Collection */}
        <Card>
          <CardHeader>
            <CardTitle>Evidence Collection</CardTitle>
            <CardDescription>Documentation and evidence gathering progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {complianceData.evidenceCollection.collected}
                </div>
                <div className="text-sm text-green-700">Collected</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {complianceData.evidenceCollection.pending}
                </div>
                <div className="text-sm text-yellow-700">Pending</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Collection Progress</span>
                <span className="font-medium">
                  {Math.round((complianceData.evidenceCollection.collected / complianceData.evidenceCollection.total) * 100)}%
                </span>
              </div>
              <Progress 
                value={(complianceData.evidenceCollection.collected / complianceData.evidenceCollection.total) * 100} 
                className="h-2" 
              />
              <div className="text-xs text-muted-foreground">
                {complianceData.evidenceCollection.total} total evidence items required
              </div>
            </div>

            {complianceData.evidenceCollection.missing > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-700">
                    {complianceData.evidenceCollection.missing} missing evidence items
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Assessment Overview</CardTitle>
          <CardDescription>Current risk levels across compliance categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {complianceData.riskAssessment.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Target className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-semibold">{item.category}</h4>
                    <p className="text-sm text-muted-foreground">
                      Last assessed: {new Date(item.lastAssessed).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getScoreColor(item.score)}`}>
                      {item.score}%
                    </div>
                    <div className="text-xs text-muted-foreground">Score</div>
                  </div>
                  <Badge className={getRiskColor(item.risk)}>
                    {item.risk} risk
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Compliance Activity</CardTitle>
          <CardDescription>Latest updates and changes in compliance status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {complianceData.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                {getActivityIcon(activity.type)}
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};