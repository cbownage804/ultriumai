import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Cpu, HardDrive, Thermometer, AlertTriangle, TrendingUp,
  Clock, Monitor, RefreshCw, Zap, CheckCircle2, Activity, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface RiskScore {
  id: string;
  asset_identifier: string;
  asset_type: string;
  overall_risk_score: number;
  vulnerability_score: number | null;
  patch_score: number | null;
  configuration_score: number | null;
  behavioral_score: number | null;
  exposure_score: number | null;
  risk_factors: any;
  recommendations: any;
  last_assessed_at: string | null;
}

export function PredictiveMaintenancePanel() {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [riskScores, setRiskScores] = useState<RiskScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchRiskScores();
  }, [user?.id]);

  const fetchRiskScores = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('asset_risk_scores')
      .select('*')
      .eq('user_id', user.id)
      .order('overall_risk_score', { ascending: false });
    setRiskScores(data || []);
    setLoading(false);
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    toast.info('Running predictive analysis across fleet...');
    setTimeout(() => {
      setIsAnalyzing(false);
      fetchRiskScores();
      toast.success('Analysis complete.');
    }, 3000);
  };

  const predictions = useMemo(() => riskScores.map(rs => {
    const factors = Array.isArray(rs.risk_factors) ? rs.risk_factors : [];
    const recs = Array.isArray(rs.recommendations) ? rs.recommendations : [];
    const daysUntilFailure = Math.max(7, Math.round((100 - rs.overall_risk_score) * 1.5));

    return {
      id: rs.id,
      deviceName: rs.asset_identifier,
      clientName: rs.asset_type,
      failureRisk: rs.overall_risk_score,
      predictedFailureDate: new Date(Date.now() + daysUntilFailure * 86400000).toISOString(),
      riskFactors: [
        ...(rs.vulnerability_score != null ? [{ factor: 'Vulnerability Score', severity: rs.vulnerability_score >= 75 ? 'critical' as const : rs.vulnerability_score >= 50 ? 'high' as const : 'medium' as const, value: `${rs.vulnerability_score}%`, threshold: '< 25%', icon: AlertTriangle }] : []),
        ...(rs.patch_score != null ? [{ factor: 'Patch Compliance', severity: rs.patch_score >= 75 ? 'critical' as const : rs.patch_score >= 50 ? 'high' as const : 'medium' as const, value: `${rs.patch_score}%`, threshold: '< 25%', icon: HardDrive }] : []),
        ...(rs.configuration_score != null ? [{ factor: 'Configuration Risk', severity: rs.configuration_score >= 75 ? 'critical' as const : rs.configuration_score >= 50 ? 'high' as const : 'medium' as const, value: `${rs.configuration_score}%`, threshold: '< 25%', icon: Cpu }] : []),
        ...factors.map((f: any) => ({
          factor: f.factor || f.name || 'Unknown',
          severity: (f.severity || 'medium') as 'critical' | 'high' | 'medium' | 'low',
          value: f.value || '',
          threshold: f.threshold || '',
          icon: Thermometer,
        })),
      ],
      recommendation: recs.length > 0 ? recs.join('. ') : 'Monitor device metrics and review risk factors.',
      lastAssessed: rs.last_assessed_at || new Date().toISOString(),
    };
  }), [riskScores]);

  const getRiskColor = (risk: number) => {
    if (risk >= 75) return 'text-red-500';
    if (risk >= 50) return 'text-amber-500';
    return 'text-green-500';
  };

  const highRiskCount = predictions.filter(p => p.failureRisk >= 75).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Predictive Maintenance
          </h2>
          <p className="text-muted-foreground">AI-powered hardware failure prediction based on telemetry trends</p>
        </div>
        <Button onClick={handleAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-red-500">{highRiskCount}</p>
            <p className="text-xs text-muted-foreground">High Risk Devices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{predictions.length}</p>
            <p className="text-xs text-muted-foreground">Devices Monitored</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-amber-500">
              {predictions.filter(p => p.failureRisk >= 50 && p.failureRisk < 75).length}
            </p>
            <p className="text-xs text-muted-foreground">Medium Risk</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-green-500">
              {predictions.filter(p => p.failureRisk < 50).length}
            </p>
            <p className="text-xs text-muted-foreground">Low Risk</p>
          </CardContent>
        </Card>
      </div>

      {predictions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No risk assessments yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Run a predictive analysis to assess device failure risks.
            </p>
            <Button onClick={handleAnalyze}>Run Analysis</Button>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="space-y-4">
            {predictions.sort((a, b) => b.failureRisk - a.failureRisk).map((device) => (
              <Card key={device.id} className={`border-l-4 ${device.failureRisk >= 75 ? 'border-l-red-500' : device.failureRisk >= 50 ? 'border-l-amber-500' : 'border-l-green-500'}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Monitor className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">{device.deviceName}</h4>
                        <p className="text-sm text-muted-foreground">{device.clientName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${getRiskColor(device.failureRisk)}`}>
                        {device.failureRisk}%
                      </p>
                      <p className="text-xs text-muted-foreground">Failure Risk</p>
                    </div>
                  </div>

                  <Progress value={device.failureRisk} className="h-2 mb-3" />

                  <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Predicted failure: {new Date(device.predictedFailureDate).toLocaleDateString()}</span>
                    <span>({Math.ceil((new Date(device.predictedFailureDate).getTime() - Date.now()) / 86400000)} days)</span>
                  </div>

                  {device.riskFactors.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                      {device.riskFactors.slice(0, 3).map((rf, i) => {
                        const FactorIcon = rf.icon;
                        return (
                          <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded-lg text-sm">
                            <FactorIcon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs font-medium">{rf.factor}</p>
                              <p className="text-xs text-muted-foreground">{rf.value}</p>
                            </div>
                            <Badge className={`ml-auto text-xs ${
                              rf.severity === 'critical' ? 'bg-red-500/10 text-red-500' :
                              rf.severity === 'high' ? 'bg-orange-500/10 text-orange-500' :
                              rf.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                              'bg-blue-500/10 text-blue-500'
                            }`}>{rf.severity}</Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="bg-muted p-3 rounded-lg text-sm">
                    <p className="font-medium text-xs mb-1">Recommendation</p>
                    <p className="text-muted-foreground">{device.recommendation}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
