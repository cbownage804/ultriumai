import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Shield, AlertTriangle, CheckCircle, Zap, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AIAnalysis {
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  threat_score: number;
  key_findings: string[];
  recommendations: string[];
  summary: string;
  confidence: number;
}

export const SafeScanAI = () => {
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [scanHistory, setScanHistory] = useState<any[]>([]);

  const analyzeSecurityPosture = async () => {
    try {
      setAnalyzing(true);
      
      // Get recent scan data
      const { data: emailScans } = await supabase
        .from('email_scans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      const { data: docScans } = await supabase
        .from('document_scans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      // Get general analytics data for URL scans
      const { data: urlScans } = await supabase
        .from('gpt_analytics')
        .select('*')
        .eq('interaction_type', 'security_scan')
        .order('created_at', { ascending: false })
        .limit(20);

      // Analyze with AI
      const { data, error } = await supabase.functions.invoke('safescan-ai-analyzer', {
        body: {
          email_scans: emailScans || [],
          url_scans: urlScans || [],
          document_scans: docScans || [],
          custom_prompt: customPrompt || "Provide a comprehensive security analysis"
        }
      });

      if (error) throw error;

      setAnalysis(data.analysis);
      setScanHistory([...scanHistory, data.analysis]);
      
      toast({
        title: "AI Analysis Complete",
        description: "Security posture analysis has been generated",
      });
    } catch (error) {
      console.error('AI analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to generate AI analysis",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const runAutomatedScan = async () => {
    try {
      setAnalyzing(true);
      
      const { data, error } = await supabase.functions.invoke('safescan-ai-analyzer', {
        body: {
          action: 'automated_scan',
          scan_targets: ['email', 'web', 'documents']
        }
      });

      if (error) throw error;

      toast({
        title: "Automated Scan Started",
        description: "AI is conducting comprehensive security scans",
      });
    } catch (error) {
      console.error('Automated scan error:', error);
      toast({
        title: "Scan Failed",
        description: "Failed to start automated scan",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getThreatIcon = (level: string) => {
    switch (level) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Shield className="h-4 w-4" />;
      case 'low':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="h-6 w-6 text-blue-600" />
          AI Security Assistant
        </h2>
        <p className="text-muted-foreground">
          Advanced AI-powered threat analysis and security recommendations
        </p>
      </div>

      {/* AI Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Analysis
            </CardTitle>
            <CardDescription>
              Let AI analyze your security posture and provide insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Custom analysis prompt (optional)"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
            />
            <Button 
              onClick={analyzeSecurityPosture}
              disabled={analyzing}
              className="w-full"
            >
              <Brain className="h-4 w-4 mr-2" />
              {analyzing ? 'Analyzing...' : 'Analyze Security Posture'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Automated Scanning
            </CardTitle>
            <CardDescription>
              AI-driven comprehensive security scanning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Let AI automatically scan and analyze your environment for threats
            </p>
            <Button 
              onClick={runAutomatedScan}
              disabled={analyzing}
              className="w-full"
              variant="outline"
            >
              <Zap className="h-4 w-4 mr-2" />
              {analyzing ? 'Scanning...' : 'Run AI Automated Scan'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis Results */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                AI Security Analysis
              </span>
              <Badge className={getThreatLevelColor(analysis.threat_level)}>
                {getThreatIcon(analysis.threat_level)}
                {analysis.threat_level.toUpperCase()}
              </Badge>
            </CardTitle>
            <CardDescription>
              Confidence: {analysis.confidence}% | Threat Score: {analysis.threat_score}/100
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div>
              <h4 className="font-semibold mb-2">Executive Summary</h4>
              <p className="text-sm text-muted-foreground">{analysis.summary}</p>
            </div>

            {/* Key Findings */}
            <div>
              <h4 className="font-semibold mb-2">Key Findings</h4>
              <ul className="space-y-2">
                {analysis.key_findings.map((finding, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{finding}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="font-semibold mb-2">AI Recommendations</h4>
              <ul className="space-y-2">
                {analysis.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent AI Analyses */}
      {scanHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent AI Analyses</CardTitle>
            <CardDescription>
              History of AI security assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scanHistory.slice(-5).reverse().map((hist, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={getThreatLevelColor(hist.threat_level)} variant="outline">
                      {hist.threat_level}
                    </Badge>
                    <span className="text-sm">Score: {hist.threat_score}/100</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date().toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};