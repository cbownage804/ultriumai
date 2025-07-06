import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Brain, 
  Target, 
  Zap,
  AlertTriangle,
  CheckCircle,
  Settings,
  Activity,
  Gauge,
  Eye,
  Play,
  Pause,
  RotateCcw,
  Shield,
  TrendingUp,
  Users,
  Clock,
  Database,
  Network,
  FileText,
  Mail,
  Link,
  Key
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ThreatSignature {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'malware' | 'phishing' | 'ransomware' | 'backdoor' | 'suspicious';
  confidence: number;
  last_updated: string;
  detection_count: number;
  false_positive_rate: number;
  enabled: boolean;
}

interface MLModel {
  id: string;
  name: string;
  type: 'behavioral' | 'anomaly' | 'classification' | 'clustering';
  accuracy: number;
  last_trained: string;
  training_data_size: number;
  status: 'active' | 'training' | 'idle' | 'error';
  metrics: {
    precision: number;
    recall: number;
    f1_score: number;
  };
}

interface DetectionRule {
  id: string;
  name: string;
  description: string;
  rule_type: 'regex' | 'behavioral' | 'statistical' | 'ml';
  target_apps: string[];
  enabled: boolean;
  created_at: string;
  last_triggered: string | null;
  trigger_count: number;
  conditions: Record<string, any>;
}

export const AdvancedThreatDetection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [signatures, setSignatures] = useState<ThreatSignature[]>([
    {
      id: 'sig-001',
      name: 'Advanced Persistent Threat Pattern',
      description: 'Detects sophisticated multi-stage attacks with persistence mechanisms',
      severity: 'critical',
      category: 'backdoor',
      confidence: 94,
      last_updated: '2024-01-20T10:30:00Z',
      detection_count: 23,
      false_positive_rate: 0.02,
      enabled: true
    },
    {
      id: 'sig-002',
      name: 'Ransomware Encryption Behavior',
      description: 'Identifies rapid file encryption patterns typical of ransomware',
      severity: 'critical',
      category: 'ransomware',
      confidence: 98,
      last_updated: '2024-01-20T09:15:00Z',
      detection_count: 7,
      false_positive_rate: 0.001,
      enabled: true
    }
  ]);

  const [mlModels, setMlModels] = useState<MLModel[]>([
    {
      id: 'model-001',
      name: 'Email Anomaly Detector',
      type: 'anomaly',
      accuracy: 94.7,
      last_trained: '2024-01-19T14:22:00Z',
      training_data_size: 2500000,
      status: 'active',
      metrics: {
        precision: 0.947,
        recall: 0.923,
        f1_score: 0.935
      }
    },
    {
      id: 'model-002',
      name: 'Document Malware Classifier',
      type: 'classification',
      accuracy: 97.2,
      last_trained: '2024-01-18T11:45:00Z',
      training_data_size: 1800000,
      status: 'active',
      metrics: {
        precision: 0.972,
        recall: 0.968,
        f1_score: 0.970
      }
    }
  ]);

  const [detectionRules, setDetectionRules] = useState<DetectionRule[]>([
    {
      id: 'rule-001',
      name: 'Suspicious PowerShell Activity',
      description: 'Detects obfuscated PowerShell commands and suspicious cmdlets',
      rule_type: 'regex',
      target_apps: ['safedoc', 'safemail'],
      enabled: true,
      created_at: '2024-01-15T00:00:00Z',
      last_triggered: '2024-01-20T08:30:00Z',
      trigger_count: 45,
      conditions: {
        pattern: '\\b(Invoke-Expression|IEX|DownloadString)\\b',
        case_sensitive: false
      }
    }
  ]);

  const [systemMetrics, setSystemMetrics] = useState({
    processing_speed: 98.5,
    detection_accuracy: 96.3,
    false_positive_rate: 0.7,
    system_load: 34,
    memory_usage: 67,
    queue_size: 142
  });

  const toggleSignature = async (id: string) => {
    setSignatures(prev => prev.map(sig => 
      sig.id === id ? { ...sig, enabled: !sig.enabled } : sig
    ));
    toast({
      title: "Signature Updated",
      description: "Threat signature has been updated successfully",
    });
  };

  const retrainModel = async (modelId: string) => {
    setMlModels(prev => prev.map(model => 
      model.id === modelId ? { ...model, status: 'training' } : model
    ));
    
    toast({
      title: "Model Retraining Started",
      description: "ML model retraining has been initiated",
    });

    // Simulate training completion
    setTimeout(() => {
      setMlModels(prev => prev.map(model => 
        model.id === modelId ? { 
          ...model, 
          status: 'active',
          last_trained: new Date().toISOString(),
          accuracy: Math.min(99, model.accuracy + Math.random() * 2)
        } : model
      ));
      
      toast({
        title: "Model Retraining Complete",
        description: "ML model has been successfully retrained",
      });
    }, 5000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-50';
      case 'high': return 'text-orange-500 bg-orange-50';
      case 'medium': return 'text-yellow-500 bg-yellow-50';
      case 'low': return 'text-blue-500 bg-blue-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const getModelStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'training': return 'text-blue-500';
      case 'idle': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Advanced Threat Detection
          </h1>
          <p className="text-muted-foreground">
            AI-powered threat detection with machine learning and behavioral analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
          <Button variant="hero">
            <Zap className="h-4 w-4 mr-2" />
            Optimize Detection
          </Button>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Speed</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{systemMetrics.processing_speed}%</div>
            <Progress value={systemMetrics.processing_speed} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Detection Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{systemMetrics.detection_accuracy}%</div>
            <Progress value={systemMetrics.detection_accuracy} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">False Positive Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{systemMetrics.false_positive_rate}%</div>
            <Progress value={systemMetrics.false_positive_rate} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Load</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.system_load}%</div>
            <Progress value={systemMetrics.system_load} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.memory_usage}%</div>
            <Progress value={systemMetrics.memory_usage} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Size</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.queue_size}</div>
            <p className="text-xs text-muted-foreground">Items pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="signatures" className="space-y-4">
        <TabsList>
          <TabsTrigger value="signatures">Threat Signatures</TabsTrigger>
          <TabsTrigger value="ml-models">ML Models</TabsTrigger>
          <TabsTrigger value="rules">Detection Rules</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="signatures" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Threat Signatures</CardTitle>
              <CardDescription>
                Manage and configure threat detection signatures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {signatures.map((signature) => (
                  <div key={signature.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{signature.name}</h3>
                        <Badge className={getSeverityColor(signature.severity)}>
                          {signature.severity}
                        </Badge>
                        <Badge variant="outline" className="uppercase">
                          {signature.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`sig-${signature.id}`} className="text-sm">
                          Enabled
                        </Label>
                        <Switch
                          id={`sig-${signature.id}`}
                          checked={signature.enabled}
                          onCheckedChange={() => toggleSignature(signature.id)}
                        />
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {signature.description}
                    </p>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Confidence:</span> {signature.confidence}%
                      </div>
                      <div>
                        <span className="font-medium">Detections:</span> {signature.detection_count}
                      </div>
                      <div>
                        <span className="font-medium">False Positive Rate:</span> {(signature.false_positive_rate * 100).toFixed(2)}%
                      </div>
                      <div>
                        <span className="font-medium">Last Updated:</span> {new Date(signature.last_updated).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ml-models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Machine Learning Models</CardTitle>
              <CardDescription>
                AI models for advanced threat detection and analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mlModels.map((model) => (
                  <div key={model.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{model.name}</h3>
                        <Badge variant="outline" className="uppercase">
                          {model.type}
                        </Badge>
                        <Badge className={`${getModelStatusColor(model.status)} bg-opacity-10`}>
                          {model.status}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => retrainModel(model.id)}
                        disabled={model.status === 'training'}
                      >
                        {model.status === 'training' ? (
                          <Pause className="h-4 w-4 mr-1" />
                        ) : (
                          <RotateCcw className="h-4 w-4 mr-1" />
                        )}
                        {model.status === 'training' ? 'Training...' : 'Retrain'}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <span className="text-sm font-medium">Accuracy:</span>
                        <div className="flex items-center gap-2">
                          <Progress value={model.accuracy} className="flex-1 h-2" />
                          <span className="text-sm font-bold">{model.accuracy.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Training Data:</span>
                        <div className="text-sm text-muted-foreground">
                          {(model.training_data_size / 1000000).toFixed(1)}M samples
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Precision:</span> {(model.metrics.precision * 100).toFixed(1)}%
                      </div>
                      <div>
                        <span className="font-medium">Recall:</span> {(model.metrics.recall * 100).toFixed(1)}%
                      </div>
                      <div>
                        <span className="font-medium">F1-Score:</span> {(model.metrics.f1_score * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Detection Rules</CardTitle>
              <CardDescription>
                Create and manage custom detection rules for specific threats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {detectionRules.map((rule) => (
                  <div key={rule.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{rule.name}</h3>
                        <Badge variant="outline" className="uppercase">
                          {rule.rule_type}
                        </Badge>
                        <Switch checked={rule.enabled} />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Triggered {rule.trigger_count} times
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {rule.description}
                    </p>
                    
                    <div className="flex gap-4 text-sm">
                      <div>
                        <span className="font-medium">Target Apps:</span> {rule.target_apps.join(', ')}
                      </div>
                      <div>
                        <span className="font-medium">Last Triggered:</span> {
                          rule.last_triggered 
                            ? new Date(rule.last_triggered).toLocaleString()
                            : 'Never'
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};