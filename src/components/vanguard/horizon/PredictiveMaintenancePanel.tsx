import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Cpu, HardDrive, Thermometer, AlertTriangle, TrendingUp,
  Clock, Monitor, RefreshCw, Zap, CheckCircle2, Activity
} from 'lucide-react';
import { toast } from 'sonner';

interface DevicePrediction {
  id: string;
  deviceName: string;
  clientName: string;
  failureRisk: number; // 0-100
  predictedFailureDate: string;
  riskFactors: {
    factor: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    value: string;
    threshold: string;
    icon: React.ElementType;
  }[];
  recommendation: string;
  lastAssessed: string;
}

export function PredictiveMaintenancePanel() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [predictions] = useState<DevicePrediction[]>([
    {
      id: '1', deviceName: 'SERVER-DB-01', clientName: 'Acme Corp', failureRisk: 87,
      predictedFailureDate: new Date(Date.now() + 86400000 * 12).toISOString(),
      riskFactors: [
        { factor: 'Disk Health (SMART)', severity: 'critical', value: '12 bad sectors', threshold: '0 bad sectors', icon: HardDrive },
        { factor: 'CPU Temperature', severity: 'high', value: '82°C avg', threshold: '< 75°C', icon: Thermometer },
        { factor: 'Disk Usage', severity: 'high', value: '94%', threshold: '< 85%', icon: HardDrive },
      ],
      recommendation: 'Replace primary disk immediately. Schedule maintenance window for hardware inspection.',
      lastAssessed: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '2', deviceName: 'WORKSTATION-15', clientName: 'TechFlow', failureRisk: 65,
      predictedFailureDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      riskFactors: [
        { factor: 'Memory Errors', severity: 'high', value: '3 ECC errors/day', threshold: '0 errors', icon: Cpu },
        { factor: 'System Age', severity: 'medium', value: '4.2 years', threshold: '< 3 years', icon: Clock },
      ],
      recommendation: 'Plan RAM replacement. Consider device refresh during next budget cycle.',
      lastAssessed: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: '3', deviceName: 'LAPTOP-EXEC-08', clientName: 'DataSync', failureRisk: 42,
      predictedFailureDate: new Date(Date.now() + 86400000 * 60).toISOString(),
      riskFactors: [
        { factor: 'Battery Health', severity: 'medium', value: '68% capacity', threshold: '> 80%', icon: Zap },
        { factor: 'CPU Temperature', severity: 'low', value: '71°C avg', threshold: '< 75°C', icon: Thermometer },
      ],
      recommendation: 'Schedule battery replacement. Monitor temperature trends.',
      lastAssessed: new Date(Date.now() - 14400000).toISOString(),
    },
  ]);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    toast.info('Running predictive analysis across fleet...');
    setTimeout(() => {
      setIsAnalyzing(false);
      toast.success('Analysis complete. 3 devices flagged for potential failure.');
    }, 3000);
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 75) return 'text-red-500';
    if (risk >= 50) return 'text-amber-500';
    return 'text-green-500';
  };

  const getRiskBg = (risk: number) => {
    if (risk >= 75) return 'bg-red-500';
    if (risk >= 50) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const highRiskCount = predictions.filter(p => p.failureRisk >= 75).length;

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

      {/* Stats */}
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

      {/* Predictions List */}
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                  {device.riskFactors.map((rf, i) => {
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

                <div className="bg-muted p-3 rounded-lg text-sm">
                  <p className="font-medium text-xs mb-1">Recommendation</p>
                  <p className="text-muted-foreground">{device.recommendation}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
