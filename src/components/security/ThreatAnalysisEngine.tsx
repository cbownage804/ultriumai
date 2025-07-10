import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Brain, 
  Zap, 
  Eye,
  Target,
  Activity,
  Clock,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ThreatAnalysis {
  id: string;
  threatType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  mitreIds: string[];
  affectedAssets: string[];
  timeline: string;
  status: 'detecting' | 'analyzing' | 'confirmed' | 'mitigated';
  aiRecommendations: string[];
}

interface ThreatAnalysisEngineProps {
  securityContext?: {
    activeAlerts: number;
    criticalThreats: number;
    openIncidents: number;
    complianceScore: number;
  };
}

export const ThreatAnalysisEngine = ({ securityContext }: ThreatAnalysisEngineProps) => {
  const [threats, setThreats] = useState<ThreatAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  useEffect(() => {
    loadThreats();
    // Simulate real-time threat detection
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        generateSimulatedThreat();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadThreats = async () => {
    // In a real implementation, this would fetch from your security data
    const simulatedThreats: ThreatAnalysis[] = [
      {
        id: '1',
        threatType: 'Advanced Persistent Threat',
        severity: 'critical',
        confidence: 92,
        description: 'Suspicious lateral movement detected across multiple endpoints with credential harvesting indicators',
        mitreIds: ['T1021', 'T1078', 'T1003'],
        affectedAssets: ['DC-01', 'FS-MAIN', 'WS-DEV-15'],
        timeline: '2 hours ago',
        status: 'analyzing',
        aiRecommendations: [
          'Isolate affected endpoints immediately',
          'Reset credentials for compromised accounts',
          'Deploy additional monitoring on critical systems'
        ]
      },
      {
        id: '2',
        threatType: 'Malware C2 Communication',
        severity: 'high',
        confidence: 87,
        description: 'Encrypted communication to known malicious domains detected from endpoint WS-USER-42',
        mitreIds: ['T1071', 'T1090'],
        affectedAssets: ['WS-USER-42'],
        timeline: '45 minutes ago',
        status: 'confirmed',
        aiRecommendations: [
          'Block C2 domains at firewall level',
          'Quarantine infected endpoint',
          'Scan for additional indicators of compromise'
        ]
      }
    ];
    setThreats(simulatedThreats);
  };

  const generateSimulatedThreat = () => {
    const threatTypes = [
      'Phishing Campaign',
      'Ransomware Activity', 
      'Data Exfiltration',
      'Privilege Escalation',
      'Network Reconnaissance'
    ];
    
    const severities: ('low' | 'medium' | 'high' | 'critical')[] = ['low', 'medium', 'high', 'critical'];
    
    const newThreat: ThreatAnalysis = {
      id: Date.now().toString(),
      threatType: threatTypes[Math.floor(Math.random() * threatTypes.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      confidence: Math.floor(Math.random() * 30) + 70,
      description: 'AI-detected anomalous behavior requiring immediate attention',
      mitreIds: ['T1059', 'T1055'],
      affectedAssets: [`WS-${Math.floor(Math.random() * 100)}`],
      timeline: 'Just now',
      status: 'detecting',
      aiRecommendations: ['Investigate immediately', 'Monitor for escalation']
    };

    setThreats(prev => [newThreat, ...prev].slice(0, 10)); // Keep latest 10
  };

  const runDeepAnalysis = async (threatId: string) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simulate AI analysis progress
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsAnalyzing(false);
          
          // Update threat with enhanced analysis
          setThreats(prev => prev.map(threat => 
            threat.id === threatId 
              ? {
                  ...threat,
                  status: 'confirmed',
                  confidence: Math.min(threat.confidence + 15, 99),
                  aiRecommendations: [
                    ...threat.aiRecommendations,
                    'Enhanced analysis complete - High confidence threat',
                    'Automated response protocols activated'
                  ]
                }
              : threat
          ));
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-500/20';
      case 'high': return 'text-orange-500 bg-orange-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/20';
      case 'low': return 'text-blue-500 bg-blue-500/20';
      default: return 'text-gray-500 bg-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'detecting': return <Eye className="h-4 w-4 text-blue-500" />;
      case 'analyzing': return <Brain className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case 'confirmed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'mitigated': return <Shield className="h-4 w-4 text-green-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <Card className="border-orange-800/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-orange-500" />
          AI Threat Analysis Engine
          <Badge variant="outline" className="ml-auto">
            {threats.length} Active Threats
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Analysis Progress */}
        {isAnalyzing && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Brain className="h-4 w-4 animate-pulse text-orange-500" />
              Running AI deep analysis...
            </div>
            <Progress value={analysisProgress} className="h-2" />
          </div>
        )}

        {/* Threat List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {threats.map((threat) => (
            <div key={threat.id} className="p-4 rounded-lg border bg-muted/30 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(threat.status)}
                    <span className="font-medium">{threat.threatType}</span>
                    <Badge className={getSeverityColor(threat.severity)}>
                      {threat.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{threat.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      Confidence: {threat.confidence}%
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {threat.timeline}
                    </span>
                  </div>
                </div>
                
                <Button
                  onClick={() => runDeepAnalysis(threat.id)}
                  variant="outline"
                  size="sm"
                  disabled={isAnalyzing || threat.status === 'confirmed'}
                  className="ml-2"
                >
                  <Brain className="h-4 w-4 mr-1" />
                  Analyze
                </Button>
              </div>

              {/* MITRE ATT&CK Techniques */}
              {threat.mitreIds.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">MITRE ATT&CK:</span>
                  <div className="flex flex-wrap gap-1">
                    {threat.mitreIds.map((mitreId) => (
                      <Badge key={mitreId} variant="secondary" className="text-xs">
                        {mitreId}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Recommendations */}
              {threat.aiRecommendations.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">AI Recommendations:</span>
                  <div className="space-y-1">
                    {threat.aiRecommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        <ChevronRight className="h-3 w-3 mt-0.5 text-orange-500" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {threats.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p>No active threats detected</p>
            <p className="text-sm">AI monitoring is active</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};