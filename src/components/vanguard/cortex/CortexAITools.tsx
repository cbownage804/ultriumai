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
import { 
  Mail, Shield, HardDrive, Mic, Sparkles, Loader2, 
  FileText, AlertTriangle, CheckCircle2, Upload, Play,
  Download, Eye, Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function CortexAITools() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('email');
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

  const handleEmailParse = async () => {
    if (!emailContent) {
      toast.error('Please enter email content');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-email-parser', {
        body: {
          emailContent,
          emailSubject,
          senderEmail,
          userId: user?.id
        }
      });

      if (error) throw error;
      setParsedTicket(data.ticket);
      toast.success('Email parsed successfully!');
    } catch (error: any) {
      console.error('Error:', error);
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
        body: {
          scanResults: parsedResults,
          reportType,
          userId: user?.id,
          frameworks: ['SOC2', 'ISO27001', 'HIPAA']
        }
      });

      if (error) throw error;
      setGeneratedReport(data.report);
      toast.success('Security report generated!');
    } catch (error: any) {
      console.error('Error:', error);
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
        const dataUrl = event.target?.result as string;
        setAssetImages(prev => [...prev, dataUrl]);
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
        body: {
          images: assetImages,
          analysisType,
          userId: user?.id
        }
      });

      if (error) throw error;
      setAssetAnalysis(data.analysis);
      toast.success(`Analyzed ${data.imagesAnalyzed} image(s)!`);
    } catch (error: any) {
      console.error('Error:', error);
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
        body: {
          transcription,
          outputType,
          userId: user?.id
        }
      });

      if (error) throw error;
      setVoiceResult(data.result);
      toast.success(`Generated ${outputType}!`);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to process transcription');
    } finally {
      setIsProcessing(false);
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
            <p className="text-sm text-slate-400">AI-powered automation for tickets, reports, assets & voice</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="email" className="data-[state=active]:bg-blue-500/20">
            <Mail className="h-4 w-4 mr-2" />
            Email Parser
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-red-500/20">
            <Shield className="h-4 w-4 mr-2" />
            Security Reports
          </TabsTrigger>
          <TabsTrigger value="assets" className="data-[state=active]:bg-green-500/20">
            <HardDrive className="h-4 w-4 mr-2" />
            Asset Analyzer
          </TabsTrigger>
          <TabsTrigger value="voice" className="data-[state=active]:bg-amber-500/20">
            <Mic className="h-4 w-4 mr-2" />
            Voice to Ticket
          </TabsTrigger>
        </TabsList>

        {/* Email Parser Tab */}
        <TabsContent value="email" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-black/60 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-400" />
                  Email Input
                </CardTitle>
                <CardDescription>Paste an email to extract ticket details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Subject</Label>
                  <Input 
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Email subject line"
                    className="bg-slate-900/50 border-slate-700"
                  />
                </div>
                <div>
                  <Label>Sender Email</Label>
                  <Input 
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="sender@example.com"
                    className="bg-slate-900/50 border-slate-700"
                  />
                </div>
                <div>
                  <Label>Email Body</Label>
                  <Textarea 
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    placeholder="Paste the email content here..."
                    className="bg-slate-900/50 border-slate-700 min-h-[200px]"
                  />
                </div>
                <Button 
                  onClick={handleEmailParse} 
                  disabled={isProcessing}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Parse Email with AI
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-black/60 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-white">Extracted Ticket</CardTitle>
              </CardHeader>
              <CardContent>
                {parsedTicket ? (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-slate-800/50">
                        <Label className="text-slate-400 text-xs">Title</Label>
                        <p className="text-white font-medium">{parsedTicket.title}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={`
                          ${parsedTicket.priority === 'critical' ? 'bg-red-500/20 text-red-400' : ''}
                          ${parsedTicket.priority === 'high' ? 'bg-orange-500/20 text-orange-400' : ''}
                          ${parsedTicket.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' : ''}
                          ${parsedTicket.priority === 'low' ? 'bg-green-500/20 text-green-400' : ''}
                        `}>
                          {parsedTicket.priority}
                        </Badge>
                        <Badge className="bg-blue-500/20 text-blue-400">{parsedTicket.category}</Badge>
                        <Badge className="bg-purple-500/20 text-purple-400">{parsedTicket.sentiment}</Badge>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-800/50">
                        <Label className="text-slate-400 text-xs">Description</Label>
                        <p className="text-slate-300 text-sm whitespace-pre-wrap">{parsedTicket.description}</p>
                      </div>
                      {parsedTicket.affected_systems?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {parsedTicket.affected_systems.map((sys: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">{sys}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-slate-500">
                    <p>Parsed ticket will appear here</p>
                  </div>
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
                <div>
                  <Label>Report Type</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="executive">Executive Summary</SelectItem>
                      <SelectItem value="technical">Technical Report</SelectItem>
                      <SelectItem value="compliance">Compliance Report</SelectItem>
                      <SelectItem value="attackPath">Attack Path Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Scan Results (JSON)</Label>
                  <Textarea 
                    value={scanResults}
                    onChange={(e) => setScanResults(e.target.value)}
                    placeholder='[{"finding": "Open port 22", "severity": "medium", ...}]'
                    className="bg-slate-900/50 border-slate-700 min-h-[250px] font-mono text-sm"
                  />
                </div>
                <Button 
                  onClick={handleSecurityReport} 
                  disabled={isProcessing}
                  className="w-full bg-red-500 hover:bg-red-600"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-black/60 border-red-500/30">
              <CardHeader>
                <CardTitle className="text-white">Generated Report</CardTitle>
              </CardHeader>
              <CardContent>
                {generatedReport ? (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">{generatedReport.reportTitle}</h3>
                        <Badge className={`
                          ${generatedReport.riskLevel === 'Critical' ? 'bg-red-500' : ''}
                          ${generatedReport.riskLevel === 'High' ? 'bg-orange-500' : ''}
                          ${generatedReport.riskLevel === 'Medium' ? 'bg-amber-500' : ''}
                          ${generatedReport.riskLevel === 'Low' ? 'bg-green-500' : ''}
                        `}>
                          Risk: {generatedReport.riskScore}/100
                        </Badge>
                      </div>
                      <p className="text-slate-300 text-sm">{generatedReport.executiveSummary}</p>
                      {generatedReport.keyFindings?.slice(0, 3).map((finding: any, i: number) => (
                        <div key={i} className="p-3 rounded-lg bg-slate-800/50 border-l-2 border-red-500">
                          <p className="font-medium text-white">{finding.title}</p>
                          <p className="text-sm text-slate-400">{finding.description}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-slate-500">
                    <p>Generated report will appear here</p>
                  </div>
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
                <div>
                  <Label>Analysis Type</Label>
                  <Select value={analysisType} onValueChange={setAnalysisType}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="screenshot">System Screenshot</SelectItem>
                      <SelectItem value="network_diagram">Network Diagram</SelectItem>
                      <SelectItem value="hardware">Hardware Photo</SelectItem>
                      <SelectItem value="rack_diagram">Rack/Data Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={handleImageUpload}
                    className="hidden"
                    id="asset-images"
                  />
                  <Label htmlFor="asset-images" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-slate-500 mb-2" />
                    <p className="text-slate-400">Click to upload images</p>
                    <p className="text-xs text-slate-500">Screenshots, diagrams, hardware photos</p>
                  </Label>
                </div>
                {assetImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {assetImages.map((img, i) => (
                      <img key={i} src={img} alt={`Asset ${i}`} className="w-16 h-16 object-cover rounded border border-slate-700" />
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setAssetImages([])}>Clear</Button>
                  </div>
                )}
                <Button 
                  onClick={handleAssetAnalysis} 
                  disabled={isProcessing || assetImages.length === 0}
                  className="w-full bg-green-500 hover:bg-green-600"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
                  Analyze with AI Vision
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-black/60 border-green-500/30">
              <CardHeader>
                <CardTitle className="text-white">Discovered Assets</CardTitle>
              </CardHeader>
              <CardContent>
                {assetAnalysis ? (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      <p className="text-slate-300 text-sm">{assetAnalysis.summary}</p>
                      {assetAnalysis.assets?.map((asset: any, i: number) => (
                        <div key={i} className="p-3 rounded-lg bg-slate-800/50">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-white">{asset.name}</p>
                            <Badge variant="outline">{asset.type}</Badge>
                          </div>
                          {asset.manufacturer && <p className="text-xs text-slate-400">{asset.manufacturer} {asset.model}</p>}
                          <p className="text-sm text-slate-300 mt-1">{asset.notes}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-slate-500">
                    <p>Discovered assets will appear here</p>
                  </div>
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
                <CardDescription>Paste voice transcription or meeting notes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Output Type</Label>
                  <Select value={outputType} onValueChange={setOutputType}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ticket">Support Ticket</SelectItem>
                      <SelectItem value="kb_article">KB Article</SelectItem>
                      <SelectItem value="notes">Meeting Notes</SelectItem>
                      <SelectItem value="task_list">Task List</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Transcription</Label>
                  <Textarea 
                    value={transcription}
                    onChange={(e) => setTranscription(e.target.value)}
                    placeholder="Paste your voice transcription here... e.g., 'Hey so the printer on the third floor isn't working again, it just keeps jamming and showing an error code E45...'"
                    className="bg-slate-900/50 border-slate-700 min-h-[250px]"
                  />
                </div>
                <Button 
                  onClick={handleVoiceProcess} 
                  disabled={isProcessing}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                  Process Transcription
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-black/60 border-amber-500/30">
              <CardHeader>
                <CardTitle className="text-white">Generated Output</CardTitle>
              </CardHeader>
              <CardContent>
                {voiceResult ? (
                  <ScrollArea className="h-[400px]">
                    <pre className="text-sm text-slate-300 whitespace-pre-wrap">
                      {JSON.stringify(voiceResult, null, 2)}
                    </pre>
                  </ScrollArea>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-slate-500">
                    <p>Processed output will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
