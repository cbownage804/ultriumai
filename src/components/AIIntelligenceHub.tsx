import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Brain,
  Zap,
  Shield,
  MessageCircle,
  Mic,
  MicOff,
  FileText,
  TrendingUp,
  Bot,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Search,
  Wand2,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AIAnalysis {
  id: string;
  type: 'security' | 'document' | 'predictive' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  confidence: number;
  recommendations: string[];
  timestamp: string;
  status: 'analyzing' | 'completed' | 'actionable';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const mockAnalyses: AIAnalysis[] = [
  {
    id: '1',
    type: 'security',
    severity: 'high',
    title: 'Suspicious Network Activity Detected',
    description: 'AI detected unusual outbound traffic patterns from workstation WS-042. Multiple connections to unknown IPs.',
    confidence: 94,
    recommendations: [
      'Isolate affected workstation immediately',
      'Run comprehensive malware scan',
      'Review network logs for data exfiltration'
    ],
    timestamp: '2024-01-15 14:30:00',
    status: 'actionable'
  },
  {
    id: '2',
    type: 'predictive',
    severity: 'medium',
    title: 'Server Hardware Failure Prediction',
    description: 'ML models predict 85% probability of disk failure in SRV-003 within next 7 days based on SMART data trends.',
    confidence: 85,
    recommendations: [
      'Schedule immediate disk replacement',
      'Backup critical data',
      'Prepare failover procedures'
    ],
    timestamp: '2024-01-15 13:15:00',
    status: 'actionable'
  },
  {
    id: '3',
    type: 'document',
    severity: 'low',
    title: 'Contract Analysis Complete',
    description: 'AI extracted key terms from 15 client contracts. Identified 3 non-standard clauses requiring legal review.',
    confidence: 92,
    recommendations: [
      'Review flagged contract clauses',
      'Standardize terms across agreements',
      'Update contract templates'
    ],
    timestamp: '2024-01-15 12:00:00',
    status: 'completed'
  }
];

export function AIIntelligenceHub() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [analyses, setAnalyses] = useState<AIAnalysis[]>(mockAnalyses);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [documentInput, setDocumentInput] = useState('');
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[severity as keyof typeof colors] || colors.low;
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      security: Shield,
      document: FileText,
      predictive: TrendingUp,
      anomaly: AlertTriangle
    };
    const Icon = icons[type as keyof typeof icons] || Brain;
    return <Icon className="h-4 w-4" />;
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I can help you with that. Based on your request "${chatInput}", I recommend checking the security dashboard for recent alerts and reviewing the predictive maintenance schedules. Would you like me to generate a detailed report?`,
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleVoiceToggle = () => {
    setIsListening(!isListening);
    if (!isListening) {
      toast({
        title: "Voice Assistant Activated",
        description: "Listening for your voice commands...",
      });
      // Simulate voice recognition
      setTimeout(() => {
        setIsListening(false);
        setChatInput("Show me security alerts from the last 24 hours");
      }, 3000);
    }
  };

  const analyzeDocument = async () => {
    if (!documentInput.trim()) return;

    setIsAnalyzing(true);
    
    // Simulate AI document analysis
    setTimeout(() => {
      setAnalysisResults({
        summary: "Document contains 3 key sections: security policies, access controls, and compliance requirements.",
        sentiment: "Professional, technical tone with high confidence in security measures.",
        keyTopics: ["Network Security", "Access Management", "Compliance", "Risk Assessment"],
        risks: ["Outdated encryption standards mentioned", "No mention of zero-trust architecture"],
        compliance: {
          gdpr: 85,
          hipaa: 92,
          soc2: 78
        }
      });
      setIsAnalyzing(false);
      
      toast({
        title: "Document Analysis Complete",
        description: "AI has processed and analyzed your document",
      });
    }, 2000);
  };

  const triggerPredictiveAnalysis = () => {
    toast({
      title: "Predictive Analysis Started",
      description: "AI is analyzing system patterns to predict potential issues",
    });

    // Add new predictive analysis
    const newAnalysis: AIAnalysis = {
      id: Date.now().toString(),
      type: 'predictive',
      severity: 'medium',
      title: 'Bandwidth Utilization Forecast',
      description: 'AI predicts 90% bandwidth utilization by month end. Recommend capacity upgrade.',
      confidence: 87,
      recommendations: [
        'Plan bandwidth upgrade',
        'Optimize current usage',
        'Implement traffic shaping'
      ],
      timestamp: new Date().toISOString(),
      status: 'analyzing'
    };

    setAnalyses(prev => [newAnalysis, ...prev]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI Intelligence Hub
          </h2>
          <p className="text-muted-foreground">
            Advanced AI-powered analysis, automation, and insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Active
          </Badge>
        </div>
      </div>

      {/* AI Status Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active AI Models</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">
              Security, Predictive, NLP models
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predictions Made</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              94% accuracy rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threats Detected</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              12 auto-resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Confidence</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">91%</div>
            <p className="text-xs text-muted-foreground">
              Average across all models
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main AI Features */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">AI Dashboard</TabsTrigger>
          <TabsTrigger value="chat">AI Assistant</TabsTrigger>
          <TabsTrigger value="document">Document AI</TabsTrigger>
          <TabsTrigger value="predictive">Predictive AI</TabsTrigger>
          <TabsTrigger value="automation">AI Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent AI Analysis</CardTitle>
                <CardDescription>
                  Latest insights and recommendations from AI models
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyses.map((analysis) => (
                  <div key={analysis.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(analysis.type)}
                        <h4 className="font-semibold">{analysis.title}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(analysis.severity)}>
                          {analysis.severity.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {analysis.confidence}% confidence
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {analysis.description}
                    </p>
                    
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">AI Recommendations:</h5>
                      <ul className="space-y-1">
                        {analysis.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        {analysis.timestamp}
                      </span>
                      <Button size="sm" variant="outline">
                        Take Action
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="flex flex-col h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI Assistant
                </CardTitle>
                <CardDescription>
                  Ask questions about your MSP operations
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 space-y-4 overflow-y-auto mb-4">
                  {chatMessages.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Ask me anything about your MSP operations!</p>
                    </div>
                  )}
                  {chatMessages.map((message) => (
                    <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask AI assistant..."
                    onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                  />
                  <Button
                    variant={isListening ? "destructive" : "outline"}
                    size="icon"
                    onClick={handleVoiceToggle}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Button onClick={handleChatSubmit}>Send</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick AI Actions</CardTitle>
                <CardDescription>
                  Common AI-powered tasks and automations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={triggerPredictiveAnalysis}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Run Predictive Analysis
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Security Threat Scan
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Document Intelligence
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Zap className="h-4 w-4 mr-2" />
                  Auto-Generate Reports
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Search className="h-4 w-4 mr-2" />
                  Knowledge Base Search
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="document" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Document AI Analyzer</CardTitle>
                <CardDescription>
                  Upload or paste documents for AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={documentInput}
                  onChange={(e) => setDocumentInput(e.target.value)}
                  placeholder="Paste document content here or drag and drop files..."
                  className="min-h-[200px]"
                />
                <Button 
                  onClick={analyzeDocument} 
                  disabled={isAnalyzing || !documentInput.trim()}
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Analyze Document
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {analysisResults && (
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Results</CardTitle>
                  <CardDescription>
                    AI-powered insights from your document
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Summary</h4>
                    <p className="text-sm text-muted-foreground">
                      {analysisResults.summary}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Key Topics</h4>
                    <div className="flex flex-wrap gap-1">
                      {analysisResults.keyTopics.map((topic: string, idx: number) => (
                        <Badge key={idx} variant="secondary">{topic}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Compliance Scores</h4>
                    <div className="space-y-2">
                      {Object.entries(analysisResults.compliance).map(([framework, score]) => (
                        <div key={framework}>
                          <div className="flex justify-between text-sm">
                            <span>{framework.toUpperCase()}</span>
                            <span>{score}%</span>
                          </div>
                          <Progress value={score as number} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {analysisResults.risks.length > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Identified Risks:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {analysisResults.risks.map((risk: string, idx: number) => (
                            <li key={idx} className="text-sm">{risk}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Predictive AI Models</CardTitle>
                <CardDescription>
                  Machine learning models predicting system behavior and issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Hardware Failure</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">7 days</div>
                      <p className="text-sm text-muted-foreground">
                        Next predicted failure
                      </p>
                      <Progress value={85} className="mt-2" />
                      <p className="text-xs mt-1">85% confidence</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Security Incidents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">3</div>
                      <p className="text-sm text-muted-foreground">
                        Predicted this week
                      </p>
                      <Progress value={72} className="mt-2" />
                      <p className="text-xs mt-1">72% confidence</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Capacity Issues</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-600">14 days</div>
                      <p className="text-sm text-muted-foreground">
                        Until storage full
                      </p>
                      <Progress value={91} className="mt-2" />
                      <p className="text-xs mt-1">91% confidence</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Anomaly Detection</CardTitle>
                <CardDescription>
                  Real-time monitoring for unusual patterns and behaviors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Activity className="h-5 w-5 text-orange-500" />
                      <div>
                        <h4 className="font-medium">Network Traffic Anomaly</h4>
                        <p className="text-sm text-muted-foreground">
                          Unusual traffic spike detected on subnet 192.168.1.0/24
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">Investigating</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <div>
                        <h4 className="font-medium">Login Pattern Change</h4>
                        <p className="text-sm text-muted-foreground">
                          User login times shifted significantly from normal pattern
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">Monitoring</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <h4 className="font-medium">Resource Consumption Spike</h4>
                        <p className="text-sm text-muted-foreground">
                          CPU usage exceeded normal thresholds on multiple servers
                        </p>
                      </div>
                    </div>
                    <Badge variant="destructive">Critical</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>AI Automation Rules</CardTitle>
                <CardDescription>
                  Intelligent automation based on AI predictions and patterns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <h4 className="font-medium">Auto-Ticket Creation</h4>
                        <p className="text-sm text-muted-foreground">
                          Create tickets when AI detects anomalies
                        </p>
                      </div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <h4 className="font-medium">Predictive Maintenance</h4>
                        <p className="text-sm text-muted-foreground">
                          Schedule maintenance before predicted failures
                        </p>
                      </div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div>
                        <h4 className="font-medium">Smart Escalation</h4>
                        <p className="text-sm text-muted-foreground">
                          Auto-escalate based on severity and patterns
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">Learning</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div>
                        <h4 className="font-medium">Security Auto-Response</h4>
                        <p className="text-sm text-muted-foreground">
                          Isolate threats automatically when detected
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">Paused</Badge>
                  </div>
                </div>

                <Button className="w-full">
                  <Zap className="h-4 w-4 mr-2" />
                  Create New Automation
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Performance Metrics</CardTitle>
                <CardDescription>
                  Track AI model accuracy and automation effectiveness
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Prediction Accuracy</span>
                      <span>94%</span>
                    </div>
                    <Progress value={94} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm">
                      <span>False Positive Rate</span>
                      <span>6%</span>
                    </div>
                    <Progress value={6} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Automation Success</span>
                      <span>89%</span>
                    </div>
                    <Progress value={89} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Response Time</span>
                      <span>1.2s avg</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                </div>

                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    AI models are continuously learning and improving based on your MSP data patterns.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}