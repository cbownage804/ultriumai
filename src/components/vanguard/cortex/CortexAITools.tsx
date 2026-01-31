import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Mail, Shield, HardDrive, Mic, Sparkles, Loader2, 
  FileText, AlertTriangle, CheckCircle2, Upload, Play,
  Download, Eye, Copy, Bot, Activity, Terminal, Heart,
  Send, Code, BarChart3, Zap, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function CortexAITools() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('copilot');
  const [isProcessing, setIsProcessing] = useState(false);

  // Email Parser State
  const [emailContent, setEmailContent] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [parsedTicket, setParsedTicket] = useState<any>(null);

  // Security Report State
  const [scanResults, setScanResults] = useState('');
  const [reportType, setReportType] = useState('technical');
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  // Asset Analyzer State
  const [assetImages, setAssetImages] = useState<string[]>([]);
  const [analysisType, setAnalysisType] = useState('screenshot');
  const [assetAnalysis, setAssetAnalysis] = useState<any>(null);

  // Voice Transcription State
  const [transcription, setTranscription] = useState('');
  const [outputType, setOutputType] = useState('ticket');
  const [voiceResult, setVoiceResult] = useState<any>(null);

  // Copilot State
  const [copilotQuery, setCopilotQuery] = useState('');
  const [ticketContext, setTicketContext] = useState('');
  const [copilotResponse, setCopilotResponse] = useState<any>(null);

  // Anomaly Detection State
  const [anomalyDataType, setAnomalyDataType] = useState('metrics');
  const [anomalyData, setAnomalyData] = useState('');
  const [anomalyResult, setAnomalyResult] = useState<any>(null);

  // Script Generator State
  const [scriptDescription, setScriptDescription] = useState('');
  const [scriptLanguage, setScriptLanguage] = useState('powershell');
  const [targetOS, setTargetOS] = useState('windows');
  const [includeErrorHandling, setIncludeErrorHandling] = useState(true);
  const [includeLogging, setIncludeLogging] = useState(true);
  const [generatedScript, setGeneratedScript] = useState<any>(null);

  // Sentiment Analyzer State
  const [sentimentText, setSentimentText] = useState('');
  const [sentimentResult, setSentimentResult] = useState<any>(null);

  const handleCopilotQuery = async () => {
    if (!copilotQuery) {
      toast.error('Please enter a question');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-technician-copilot', {
        body: {
          query: copilotQuery,
          ticketContext: ticketContext ? JSON.parse(ticketContext) : undefined,
          userId: user?.id
        }
      });

      if (error) throw error;
      setCopilotResponse(data.guidance);
      toast.success('Analysis complete!');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to get response');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnomalyDetection = async () => {
    let parsedData;
    try {
      parsedData = JSON.parse(anomalyData);
    } catch {
      toast.error('Please enter valid JSON data');
      return;
    }

    setIsProcessing(true);
    try {
      const body: any = {
        dataType: anomalyDataType,
        userId: user?.id
      };
      
      if (anomalyDataType === 'metrics') body.metrics = parsedData;
      else if (anomalyDataType === 'security') body.securityEvents = parsedData;
      else if (anomalyDataType === 'network') body.networkTraffic = parsedData;

      const { data, error } = await supabase.functions.invoke('ai-anomaly-detection', { body });

      if (error) throw error;
      setAnomalyResult(data.analysis);
      toast.success('Anomaly analysis complete!');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to analyze');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScriptGeneration = async () => {
    if (!scriptDescription) {
      toast.error('Please describe what the script should do');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-script-generator', {
        body: {
          description: scriptDescription,
          language: scriptLanguage,
          targetOS,
          includeErrorHandling,
          includeLogging,
          userId: user?.id
        }
      });

      if (error) throw error;
      setGeneratedScript(data);
      toast.success('Script generated!');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to generate script');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSentimentAnalysis = async () => {
    if (!sentimentText) {
      toast.error('Please enter text to analyze');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-sentiment-analyzer', {
        body: {
          texts: sentimentText,
          conversationType: 'support',
          includeRecommendations: true,
          userId: user?.id
        }
      });

      if (error) throw error;
      setSentimentResult(data.analysis);
      toast.success('Sentiment analyzed!');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to analyze sentiment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEmailParse = async () => {
    if (!emailContent) {
      toast.error('Please enter email content');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-email-parser', {
        body: { emailContent, emailSubject, senderEmail, userId: user?.id }
      });

      if (error) throw error;
      setParsedTicket(data.ticket);
      toast.success('Email parsed successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to parse email');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSecurityReport = async () => {
    let parsedResults;
    try {
      parsedResults = JSON.parse(scanResults);
    } catch {
      toast.error('Please enter valid JSON scan results');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-security-report', {
        body: { scanResults: parsedResults, reportType, userId: user?.id, frameworks: ['SOC2', 'ISO27001', 'HIPAA'] }
      });

      if (error) throw error;
      setGeneratedReport(data.report);
      toast.success('Security report generated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate report');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAssetImages(prev => [...prev, event.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAssetAnalysis = async () => {
    if (assetImages.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-asset-analyzer', {
        body: { images: assetImages, analysisType, userId: user?.id }
      });

      if (error) throw error;
      setAssetAnalysis(data.analysis);
      toast.success(`Analyzed ${data.imagesAnalyzed} image(s)!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to analyze assets');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceProcess = async () => {
    if (!transcription) {
      toast.error('Please enter transcription text');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-voice-to-ticket', {
        body: { transcription, outputType, userId: user?.id }
      });

      if (error) throw error;
      setVoiceResult(data.result);
      toast.success(`Generated ${outputType}!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to process transcription');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-500/20 text-green-400';
      case 'negative': return 'bg-red-500/20 text-red-400';
      case 'mixed': return 'bg-amber-500/20 text-amber-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30">
            <Sparkles className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Cortex AI Tools</h2>
            <p className="text-sm text-slate-400">AI-powered automation for MSP operations</p>
          </div>
        </div>
        <Badge className="bg-gradient-to-r from-purple-400 to-cyan-500 text-white">
          <Zap className="h-3 w-3 mr-1" />
          8 AI Tools
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="copilot" className="data-[state=active]:bg-purple-500/20">
            <Bot className="h-4 w-4 mr-1 hidden sm:inline" />
            Copilot
          </TabsTrigger>
          <TabsTrigger value="anomaly" className="data-[state=active]:bg-orange-500/20">
            <Activity className="h-4 w-4 mr-1 hidden sm:inline" />
            Anomaly
          </TabsTrigger>
          <TabsTrigger value="script" className="data-[state=active]:bg-emerald-500/20">
            <Terminal className="h-4 w-4 mr-1 hidden sm:inline" />
            Scripts
          </TabsTrigger>
          <TabsTrigger value="sentiment" className="data-[state=active]:bg-pink-500/20">
            <Heart className="h-4 w-4 mr-1 hidden sm:inline" />
            Sentiment
          </TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-blue-500/20">
            <Mail className="h-4 w-4 mr-1 hidden sm:inline" />
            Email
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-red-500/20">
            <Shield className="h-4 w-4 mr-1 hidden sm:inline" />
            Security
          </TabsTrigger>
          <TabsTrigger value="assets" className="data-[state=active]:bg-green-500/20">
            <HardDrive className="h-4 w-4 mr-1 hidden sm:inline" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="voice" className="data-[state=active]:bg-amber-500/20">
            <Mic className="h-4 w-4 mr-1 hidden sm:inline" />
            Voice
          </TabsTrigger>
        </TabsList>

        {/* AI Technician Copilot Tab */}
        <TabsContent value="copilot" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-black/60 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-400" />
                  AI Technician Copilot
                </CardTitle>
                <CardDescription>Ask questions about troubleshooting IT issues</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Your Question</Label>
                  <Textarea 
                    value={copilotQuery}
                    onChange={(e) => setCopilotQuery(e.target.value)}
                    placeholder="e.g., User reports Outlook keeps crashing on startup. Windows 11, Office 365. What should I check first?"
                    className="bg-slate-900/50 border-slate-700 min-h-[100px]"
                  />
                </div>
                <div>
                  <Label>Ticket Context (Optional JSON)</Label>
                  <Textarea 
                    value={ticketContext}
                    onChange={(e) => setTicketContext(e.target.value)}
                    placeholder='{"title": "Outlook crash", "priority": "high", "device": "LAPTOP-001"}'
                    className="bg-slate-900/50 border-slate-700 min-h-[80px] font-mono text-sm"
                  />
                </div>
                <Button 
                  onClick={handleCopilotQuery} 
                  disabled={isProcessing}
                  className="w-full bg-purple-500 hover:bg-purple-600"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Ask Copilot
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-black/60 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Copilot Response</CardTitle>
              </CardHeader>
              <CardContent>
                {copilotResponse ? (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge className={`${copilotResponse.confidenceLevel === 'high' ? 'bg-green-500' : copilotResponse.confidenceLevel === 'medium' ? 'bg-amber-500' : 'bg-red-500'}`}>
                          {copilotResponse.confidenceLevel} confidence
                        </Badge>
                        <Badge variant="outline">{copilotResponse.estimatedTimeMinutes || 15} min</Badge>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-800/50">
                        <Label className="text-slate-400 text-xs">Analysis</Label>
                        <p className="text-slate-300 text-sm">{copilotResponse.analysis}</p>
                      </div>
                      {copilotResponse.rootCauses?.length > 0 && (
                        <div className="p-3 rounded-lg bg-slate-800/50">
                          <Label className="text-slate-400 text-xs">Possible Root Causes</Label>
                          <ul className="text-sm text-slate-300 list-disc list-inside">
                            {copilotResponse.rootCauses.map((cause: string, i: number) => (
                              <li key={i}>{cause}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {copilotResponse.troubleshootingSteps?.length > 0 && (
                        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                          <Label className="text-purple-400 text-xs">Troubleshooting Steps</Label>
                          <ol className="text-sm text-slate-300 list-decimal list-inside space-y-1 mt-2">
                            {copilotResponse.troubleshootingSteps.map((step: any, i: number) => (
                              <li key={i}>
                                {step.action}
                                {step.commands?.length > 0 && (
                                  <code className="block ml-4 mt-1 p-2 bg-slate-900 rounded text-xs text-green-400">
                                    {step.commands.join('\n')}
                                  </code>
                                )}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                      {copilotResponse.suggestedResolution && (
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                          <Label className="text-green-400 text-xs">Suggested Resolution</Label>
                          <p className="text-sm text-slate-300">{copilotResponse.suggestedResolution}</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-slate-500">
                    <div className="text-center">
                      <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Ask a question to get troubleshooting guidance</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Anomaly Detection Tab */}
        <TabsContent value="anomaly" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-black/60 border-orange-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-orange-400" />
                  Anomaly Detection
                </CardTitle>
                <CardDescription>Detect unusual patterns in your data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Data Type</Label>
                  <Select value={anomalyDataType} onValueChange={setAnomalyDataType}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metrics">Device/System Metrics</SelectItem>
                      <SelectItem value="security">Security Events</SelectItem>
                      <SelectItem value="network">Network Traffic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data (JSON)</Label>
                  <Textarea 
                    value={anomalyData}
                    onChange={(e) => setAnomalyData(e.target.value)}
                    placeholder='[{"timestamp": "...", "cpu": 95, "memory": 88, "disk": 75}]'
                    className="bg-slate-900/50 border-slate-700 min-h-[200px] font-mono text-sm"
                  />
                </div>
                <Button 
                  onClick={handleAnomalyDetection} 
                  disabled={isProcessing}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <BarChart3 className="h-4 w-4 mr-2" />}
                  Detect Anomalies
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-black/60 border-orange-500/30">
              <CardHeader>
                <CardTitle className="text-white">Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                {anomalyResult ? (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge className={anomalyResult.anomaliesDetected ? 'bg-red-500' : 'bg-green-500'}>
                          {anomalyResult.anomaliesDetected ? 'Anomalies Found' : 'No Anomalies'}
                        </Badge>
                        <Badge variant="outline">Risk: {anomalyResult.overallRiskScore}/100</Badge>
                      </div>
                      <p className="text-slate-300 text-sm">{anomalyResult.summary}</p>
                      {anomalyResult.anomalies?.map((anomaly: any, i: number) => (
                        <div key={i} className={`p-3 rounded-lg border-l-2 ${
                          anomaly.severity === 'critical' ? 'bg-red-500/10 border-red-500' :
                          anomaly.severity === 'high' ? 'bg-orange-500/10 border-orange-500' :
                          anomaly.severity === 'medium' ? 'bg-amber-500/10 border-amber-500' :
                          'bg-slate-800/50 border-slate-500'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-white">{anomaly.title}</span>
                            <Badge variant="outline" className="text-xs">{anomaly.confidence}%</Badge>
                          </div>
                          <p className="text-sm text-slate-400">{anomaly.description}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-slate-500">
                    <div className="text-center">
                      <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Submit data to detect anomalies</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Script Generator Tab */}
        <TabsContent value="script" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-black/60 border-emerald-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-emerald-400" />
                  AI Script Generator
                </CardTitle>
                <CardDescription>Generate scripts from natural language</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Language</Label>
                    <Select value={scriptLanguage} onValueChange={setScriptLanguage}>
                      <SelectTrigger className="bg-slate-900/50 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="powershell">PowerShell</SelectItem>
                        <SelectItem value="bash">Bash</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="batch">Batch/CMD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Target OS</Label>
                    <Select value={targetOS} onValueChange={setTargetOS}>
                      <SelectTrigger className="bg-slate-900/50 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="windows">Windows</SelectItem>
                        <SelectItem value="linux">Linux</SelectItem>
                        <SelectItem value="macos">macOS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Describe what the script should do</Label>
                  <Textarea 
                    value={scriptDescription}
                    onChange={(e) => setScriptDescription(e.target.value)}
                    placeholder="e.g., Clear all temp files, empty recycle bin, and log the freed space to a file"
                    className="bg-slate-900/50 border-slate-700 min-h-[100px]"
                  />
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch checked={includeErrorHandling} onCheckedChange={setIncludeErrorHandling} />
                    <Label className="text-sm">Error Handling</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={includeLogging} onCheckedChange={setIncludeLogging} />
                    <Label className="text-sm">Logging</Label>
                  </div>
                </div>
                <Button 
                  onClick={handleScriptGeneration} 
                  disabled={isProcessing}
                  className="w-full bg-emerald-500 hover:bg-emerald-600"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Code className="h-4 w-4 mr-2" />}
                  Generate Script
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-black/60 border-emerald-500/30">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Generated Script</CardTitle>
                {generatedScript?.script && (
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedScript.script)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {generatedScript ? (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-500/20 text-emerald-400">{generatedScript.language}</Badge>
                        {generatedScript.estimatedRuntime && (
                          <Badge variant="outline">{generatedScript.estimatedRuntime}</Badge>
                        )}
                      </div>
                      <pre className="p-4 rounded-lg bg-slate-900 text-sm text-green-400 overflow-x-auto font-mono">
                        {generatedScript.script}
                      </pre>
                      {generatedScript.usage && (
                        <div className="p-3 rounded-lg bg-slate-800/50">
                          <Label className="text-slate-400 text-xs">Usage</Label>
                          <p className="text-sm text-slate-300">{generatedScript.usage}</p>
                        </div>
                      )}
                      {generatedScript.warnings?.length > 0 && (
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                          <Label className="text-amber-400 text-xs">Warnings</Label>
                          <ul className="text-sm text-slate-300 list-disc list-inside">
                            {generatedScript.warnings.map((w: string, i: number) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-slate-500">
                    <div className="text-center">
                      <Terminal className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Describe a task to generate a script</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sentiment Analyzer Tab */}
        <TabsContent value="sentiment" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-black/60 border-pink-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-400" />
                  Sentiment Analyzer
                </CardTitle>
                <CardDescription>Analyze customer sentiment from communications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Customer Message/Ticket Content</Label>
                  <Textarea 
                    value={sentimentText}
                    onChange={(e) => setSentimentText(e.target.value)}
                    placeholder="e.g., I've been waiting for 3 days now and still no response! This is completely unacceptable. I'm seriously considering canceling our contract if this isn't resolved today."
                    className="bg-slate-900/50 border-slate-700 min-h-[200px]"
                  />
                </div>
                <Button 
                  onClick={handleSentimentAnalysis} 
                  disabled={isProcessing}
                  className="w-full bg-pink-500 hover:bg-pink-600"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageSquare className="h-4 w-4 mr-2" />}
                  Analyze Sentiment
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-black/60 border-pink-500/30">
              <CardHeader>
                <CardTitle className="text-white">Sentiment Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {sentimentResult ? (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getSentimentColor(sentimentResult.overallSentiment)}>
                          {sentimentResult.overallSentiment}
                        </Badge>
                        <Badge variant="outline">Score: {sentimentResult.sentimentScore}</Badge>
                        <Badge className={`${
                          sentimentResult.escalationRisk === 'high' ? 'bg-red-500' :
                          sentimentResult.escalationRisk === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                        }`}>
                          Escalation Risk: {sentimentResult.escalationRisk}
                        </Badge>
                      </div>
                      <p className="text-slate-300 text-sm">{sentimentResult.summary}</p>
                      
                      {sentimentResult.emotionalIndicators?.length > 0 && (
                        <div className="p-3 rounded-lg bg-slate-800/50">
                          <Label className="text-slate-400 text-xs">Emotional Indicators</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {sentimentResult.emotionalIndicators.map((ei: any, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {ei.emotion} ({ei.intensity})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {sentimentResult.recommendations?.length > 0 && (
                        <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/30">
                          <Label className="text-pink-400 text-xs">Recommendations</Label>
                          <ul className="text-sm text-slate-300 list-disc list-inside mt-2">
                            {sentimentResult.recommendations.map((rec: any, i: number) => (
                              <li key={i}>{rec.action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {sentimentResult.satisfactionIndicators && (
                        <div className="p-3 rounded-lg bg-slate-800/50">
                          <Label className="text-slate-400 text-xs">Satisfaction Prediction</Label>
                          <p className="text-sm text-slate-300">
                            CSAT Prediction: {sentimentResult.satisfactionIndicators.csatPrediction}/5 
                            ({sentimentResult.satisfactionIndicators.satisfactionTrend})
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-slate-500">
                    <div className="text-center">
                      <Heart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Enter text to analyze sentiment</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Email Parser Tab */}
        <TabsContent value="email" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-black/60 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-400" />
                  Email Input
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Subject" className="bg-slate-900/50 border-slate-700" />
                <Input value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} placeholder="sender@example.com" className="bg-slate-900/50 border-slate-700" />
                <Textarea value={emailContent} onChange={(e) => setEmailContent(e.target.value)} placeholder="Email body..." className="bg-slate-900/50 border-slate-700 min-h-[150px]" />
                <Button onClick={handleEmailParse} disabled={isProcessing} className="w-full bg-blue-500 hover:bg-blue-600">
                  {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Parse Email
                </Button>
              </CardContent>
            </Card>
            <Card className="bg-black/60 border-blue-500/30">
              <CardHeader><CardTitle className="text-white">Extracted Ticket</CardTitle></CardHeader>
              <CardContent>
                {parsedTicket ? (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-slate-800/50">
                        <Label className="text-slate-400 text-xs">Title</Label>
                        <p className="text-white font-medium">{parsedTicket.title}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={parsedTicket.priority === 'critical' ? 'bg-red-500/20 text-red-400' : parsedTicket.priority === 'high' ? 'bg-orange-500/20 text-orange-400' : 'bg-amber-500/20 text-amber-400'}>{parsedTicket.priority}</Badge>
                        <Badge className="bg-blue-500/20 text-blue-400">{parsedTicket.category}</Badge>
                      </div>
                      <p className="text-sm text-slate-300">{parsedTicket.description}</p>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-slate-500"><p>Parsed ticket will appear here</p></div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Report Tab */}
        <TabsContent value="security" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-black/60 border-red-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-400" />
                  Scan Results Input
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="executive">Executive Summary</SelectItem>
                    <SelectItem value="technical">Technical Report</SelectItem>
                    <SelectItem value="compliance">Compliance Report</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea value={scanResults} onChange={(e) => setScanResults(e.target.value)} placeholder='[{"finding": "...", "severity": "..."}]' className="bg-slate-900/50 border-slate-700 min-h-[200px] font-mono text-sm" />
                <Button onClick={handleSecurityReport} disabled={isProcessing} className="w-full bg-red-500 hover:bg-red-600">
                  {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                  Generate Report
                </Button>
              </CardContent>
            </Card>
            <Card className="bg-black/60 border-red-500/30">
              <CardHeader><CardTitle className="text-white">Generated Report</CardTitle></CardHeader>
              <CardContent>
                {generatedReport ? (
                  <ScrollArea className="h-[350px]">
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-white">{generatedReport.reportTitle}</h3>
                      <Badge className={generatedReport.riskLevel === 'Critical' ? 'bg-red-500' : 'bg-amber-500'}>Risk: {generatedReport.riskScore}/100</Badge>
                      <p className="text-sm text-slate-300">{generatedReport.executiveSummary}</p>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-slate-500"><p>Report will appear here</p></div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Asset Analyzer Tab */}
        <TabsContent value="assets" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-black/60 border-green-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-green-400" />
                  Upload Images
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={analysisType} onValueChange={setAnalysisType}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="screenshot">System Screenshot</SelectItem>
                    <SelectItem value="network_diagram">Network Diagram</SelectItem>
                    <SelectItem value="hardware">Hardware Photo</SelectItem>
                  </SelectContent>
                </Select>
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center">
                  <Input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" id="asset-images" />
                  <Label htmlFor="asset-images" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-slate-500 mb-2" />
                    <p className="text-slate-400">Click to upload images</p>
                  </Label>
                </div>
                {assetImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {assetImages.map((img, i) => (
                      <img key={i} src={img} alt={`Asset ${i}`} className="w-16 h-16 object-cover rounded" />
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setAssetImages([])}>Clear</Button>
                  </div>
                )}
                <Button onClick={handleAssetAnalysis} disabled={isProcessing || assetImages.length === 0} className="w-full bg-green-500 hover:bg-green-600">
                  {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
                  Analyze
                </Button>
              </CardContent>
            </Card>
            <Card className="bg-black/60 border-green-500/30">
              <CardHeader><CardTitle className="text-white">Discovered Assets</CardTitle></CardHeader>
              <CardContent>
                {assetAnalysis ? (
                  <ScrollArea className="h-[350px]">
                    <div className="space-y-3">
                      <p className="text-slate-300 text-sm">{assetAnalysis.summary}</p>
                      {assetAnalysis.assets?.map((asset: any, i: number) => (
                        <div key={i} className="p-3 rounded-lg bg-slate-800/50">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-white">{asset.name}</p>
                            <Badge variant="outline">{asset.type}</Badge>
                          </div>
                          <p className="text-sm text-slate-300">{asset.notes}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-slate-500"><p>Assets will appear here</p></div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Voice to Ticket Tab */}
        <TabsContent value="voice" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-black/60 border-amber-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Mic className="h-5 w-5 text-amber-400" />
                  Transcription Input
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={outputType} onValueChange={setOutputType}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ticket">Support Ticket</SelectItem>
                    <SelectItem value="kb_article">KB Article</SelectItem>
                    <SelectItem value="notes">Meeting Notes</SelectItem>
                    <SelectItem value="task_list">Task List</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea value={transcription} onChange={(e) => setTranscription(e.target.value)} placeholder="Paste voice transcription here..." className="bg-slate-900/50 border-slate-700 min-h-[200px]" />
                <Button onClick={handleVoiceProcess} disabled={isProcessing} className="w-full bg-amber-500 hover:bg-amber-600 text-black">
                  {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                  Process
                </Button>
              </CardContent>
            </Card>
            <Card className="bg-black/60 border-amber-500/30">
              <CardHeader><CardTitle className="text-white">Generated Output</CardTitle></CardHeader>
              <CardContent>
                {voiceResult ? (
                  <ScrollArea className="h-[350px]">
                    <pre className="text-sm text-slate-300 whitespace-pre-wrap">{JSON.stringify(voiceResult, null, 2)}</pre>
                  </ScrollArea>
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-slate-500"><p>Output will appear here</p></div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
