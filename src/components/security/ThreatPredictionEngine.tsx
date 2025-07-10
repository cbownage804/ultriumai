import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Shield,
  Zap,
  Clock,
  Target
} from "lucide-react";

interface ThreatPrediction {
  id: string;
  threatType: string;
  probability: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  estimatedTime: string;
  confidence: number;
  indicators: string[];
  preventionSteps: string[];
}

interface ThreatPredictionEngineProps {
  securityContext?: {
    activeAlerts: number;
    criticalThreats: number;
    openIncidents: number;
    complianceScore: number;
  };
}

export const ThreatPredictionEngine = ({ securityContext }: ThreatPredictionEngineProps) => {
  const [predictions, setPredictions] = useState<ThreatPrediction[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Simulate ML threat prediction based on current security state
  useEffect(() => {
    const generatePredictions = () => {
      setIsAnalyzing(true);
      
      const mockPredictions: ThreatPrediction[] = [];
      
      // Generate predictions based on current security context
      if (securityContext) {
        if (securityContext.criticalThreats > 0) {
          mockPredictions.push({
            id: 'pred-1',
            threatType: 'Lateral Movement Attack',
            probability: 85,
            severity: 'critical',
            estimatedTime: '4-6 hours',
            confidence: 92,
            indicators: [
              'Unusual network traffic patterns',
              'Multiple failed authentication attempts',
              'Privilege escalation attempts detected'
            ],
            preventionSteps: [
              'Implement network segmentation',
              'Enable MFA for all privileged accounts',
              'Monitor lateral movement indicators'
            ]
          });
        }

        if (securityContext.activeAlerts > 5) {
          mockPredictions.push({
            id: 'pred-2',
            threatType: 'Ransomware Attack',
            probability: 67,
            severity: 'high',
            estimatedTime: '12-24 hours',
            confidence: 78,
            indicators: [
              'Suspicious file encryption activity',
              'Backup system access attempts',
              'Unusual process execution patterns'
            ],
            preventionSteps: [
              'Backup critical data immediately',
              'Isolate affected systems',
              'Deploy endpoint protection updates'
            ]
          });
        }

        if (securityContext.complianceScore < 85) {
          mockPredictions.push({
            id: 'pred-3',
            threatType: 'Compliance Violation',
            probability: 73,
            severity: 'medium',
            estimatedTime: '24-48 hours',
            confidence: 85,
            indicators: [
              'Unpatched vulnerabilities detected',
              'Non-compliant access controls',
              'Missing security documentation'
            ],
            preventionSteps: [
              'Update security policies',
              'Patch critical vulnerabilities',
              'Conduct compliance audit'
            ]
          });
        }
      }

      // Always include some emerging threat predictions
      mockPredictions.push({
        id: 'pred-4',
        threatType: 'Supply Chain Attack',
        probability: 34,
        severity: 'medium',
        estimatedTime: '7-14 days',
        confidence: 65,
        indicators: [
          'Third-party vendor security alerts',
          'Unusual software update requests',
          'Anomalous network connections'
        ],
        preventionSteps: [
          'Verify vendor security postures',
          'Implement software integrity checks',
          'Monitor third-party connections'
        ]
      });

      setTimeout(() => {
        setPredictions(mockPredictions);
        setIsAnalyzing(false);
        setLastUpdate(new Date());
      }, 2000);
    };

    generatePredictions();
    const interval = setInterval(generatePredictions, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [securityContext]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-900/30 border-red-600';
      case 'high': return 'text-orange-400 bg-orange-900/30 border-orange-600';
      case 'medium': return 'text-yellow-400 bg-yellow-900/30 border-yellow-600';
      case 'low': return 'text-green-400 bg-green-900/30 border-green-600';
      default: return 'text-gray-400 bg-gray-900/30 border-gray-600';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'high': return <TrendingUp className="h-4 w-4 text-orange-400" />;
      case 'medium': return <Shield className="h-4 w-4 text-yellow-400" />;
      case 'low': return <Shield className="h-4 w-4 text-green-400" />;
      default: return <Shield className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-950/50 to-gray-900/50 border-purple-800/30 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Brain className="h-5 w-5 text-purple-400" />
              {isAnalyzing && (
                <div className="absolute inset-0 animate-ping">
                  <Brain className="h-5 w-5 text-purple-400/50" />
                </div>
              )}
            </div>
            <CardTitle className="text-lg text-white">Threat Prediction Engine</CardTitle>
            <Badge className="text-xs bg-purple-600/80 text-purple-100">
              <Zap className="h-3 w-3 mr-1" />
              ML-Powered
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            <span>Updated {lastUpdate.toLocaleTimeString()}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isAnalyzing ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 animate-spin text-purple-400" />
              <span className="text-gray-300">Analyzing threat patterns...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {predictions.map((prediction) => (
              <Card key={prediction.id} className={`p-4 border ${getSeverityColor(prediction.severity)}`}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(prediction.severity)}
                      <div>
                        <h4 className="font-medium text-white">{prediction.threatType}</h4>
                        <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                          <span>ETA: {prediction.estimatedTime}</span>
                          <span>Confidence: {prediction.confidence}%</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={getSeverityColor(prediction.severity)}>
                      {prediction.severity.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-3 w-3 text-purple-400" />
                      <span className="text-sm text-gray-300">Threat Probability</span>
                    </div>
                    <Progress 
                      value={prediction.probability} 
                      className="h-2"
                    />
                    <div className="text-xs text-gray-400">{prediction.probability}% likelihood</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="font-medium text-gray-300 mb-1">Risk Indicators:</div>
                      <ul className="space-y-1">
                        {prediction.indicators.slice(0, 2).map((indicator, idx) => (
                          <li key={idx} className="text-gray-400">• {indicator}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="font-medium text-gray-300 mb-1">Prevention Steps:</div>
                      <ul className="space-y-1">
                        {prediction.preventionSteps.slice(0, 2).map((step, idx) => (
                          <li key={idx} className="text-gray-400">• {step}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};