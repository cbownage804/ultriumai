import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, Mail, FileText, Link, AlertTriangle, CheckCircle, XCircle,
  Loader2, Upload, Zap, BarChart3, TrendingUp, Clock, Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ScanResult {
  type: 'email' | 'document' | 'url';
  content: string;
  safe: boolean;
  risk_level: 'safe' | 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  threats_detected: string[];
  reputation_score: number;
  scan_details: any;
  scan_date: string;
  recommendations: string[];
}

const VanguardSafeScan = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('email');
  const [emailContent, setEmailContent] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [stats, setStats] = useState({
    totalScans: 0,
    threatsBlocked: 0,
    safeItems: 0,
    riskScore: 0
  });

  useEffect(() => {
    if (user) loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      const { data } = await supabase
        .from('gpt_analytics')
        .select('*')
        .eq('user_id', user?.id)
        .eq('interaction_type', 'security_scan');
      
      if (data) {
        const totalScans = data.length;
        const threatsBlocked = data.filter(item => {
          const metadata = item.metadata as any;
          return metadata?.risk_level && ['high', 'critical'].includes(metadata.risk_level);
        }).length;
        const safeItems = data.filter(item => {
          const metadata = item.metadata as any;
          return metadata?.risk_level === 'safe';
        }).length;
        const avgRisk = totalScans > 0 ? Math.round(((totalScans - safeItems) / totalScans) * 100) : 0;
        
        setStats({ totalScans, threatsBlocked, safeItems, riskScore: avgRisk });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const performScan = async (type: 'email' | 'document' | 'url', content: string | File) => {
    setIsScanning(true);
    try {
      let functionName = '';
      let body: any = { user_id: user?.id };

      switch (type) {
        case 'email':
          functionName = 'safemail-scanner';
          body.action = 'scan_email';
          body.email = {
            subject: 'Email Scan',
            sender: 'unknown@example.com',
            content: content,
            timestamp: new Date().toISOString()
          };
          break;
        case 'url':
          functionName = 'ultrium-safelink-scanner';
          body.url = content;
          break;
        case 'document':
          functionName = 'safedoc-scanner';
          body.file_name = (content as File).name;
          body.file_size = (content as File).size;
          break;
      }

      const { data, error } = await supabase.functions.invoke(functionName, { body });

      if (error) throw error;

      const result = {
        type: type,
        content: typeof content === 'string' ? content.substring(0, 100) : (content as File).name,
        safe: data?.safe ?? false,
        risk_level: data?.risk_level || 'unknown',
        threats_detected: data?.threats_detected || [],
        reputation_score: data?.reputation_score || 0,
        scan_details: data?.scan_details || {},
        scan_date: new Date().toISOString(),
        recommendations: data?.recommendations || ['Scan completed']
      };

      setScanResult(result);
      await loadStats();
      
      toast({
        title: "Scan Complete",
        description: `${type} analyzed - Risk level: ${result.risk_level}`,
        variant: result.safe ? "default" : "destructive"
      });
    } catch (error: any) {
      console.error('Scan error:', error);
      toast({
        title: "Scan Failed",
        description: error.message || `Failed to scan ${type}`,
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      case 'safe': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskBg = (risk: string) => {
    switch (risk) {
      case 'critical': return 'bg-red-500/10 border-red-500/30';
      case 'high': return 'bg-orange-500/10 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/10 border-yellow-500/30';
      case 'low': return 'bg-blue-500/10 border-blue-500/30';
      case 'safe': return 'bg-green-500/10 border-green-500/30';
      default: return 'bg-white/5 border-white/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="h-7 w-7 text-cyan-400" />
            SafeScan™
          </h1>
          <p className="text-white/60">
            AI-powered email, link, and document threat detection
          </p>
        </div>
        <Badge className="bg-gradient-to-r from-cyan-500 to-purple-600 border-0">
          <Zap className="h-3 w-3 mr-1" />
          Real-time Protection
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Items Scanned</CardTitle>
            <Shield className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalScans}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Threats Blocked</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{stats.threatsBlocked}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Safe Items</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{stats.safeItems}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Risk Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{stats.riskScore}%</div>
            <Progress value={stats.riskScore} className="mt-2 h-1" />
          </CardContent>
        </Card>
      </div>

      {/* Scanner Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="email" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="url" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Link className="h-4 w-4 mr-2" />
            URL
          </TabsTrigger>
          <TabsTrigger value="document" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <FileText className="h-4 w-4 mr-2" />
            Document
          </TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Input Section */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">
                {activeTab === 'email' && 'Email Content'}
                {activeTab === 'url' && 'URL Analysis'}
                {activeTab === 'document' && 'Document Upload'}
              </CardTitle>
              <CardDescription className="text-white/60">
                {activeTab === 'email' && 'Paste suspicious email content to analyze'}
                {activeTab === 'url' && 'Enter a URL to check for threats'}
                {activeTab === 'document' && 'Upload a file to scan for malware'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TabsContent value="email" className="m-0">
                <Textarea
                  placeholder="Paste email content here (headers, body, links)..."
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  className="min-h-[200px] bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
                <Button 
                  onClick={() => performScan('email', emailContent)}
                  disabled={isScanning || !emailContent.trim()}
                  className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-purple-600"
                >
                  {isScanning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                  Scan Email
                </Button>
              </TabsContent>

              <TabsContent value="url" className="m-0">
                <Input
                  placeholder="https://example.com"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
                <Button 
                  onClick={() => performScan('url', urlInput)}
                  disabled={isScanning || !urlInput.trim()}
                  className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-purple-600"
                >
                  {isScanning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link className="h-4 w-4 mr-2" />}
                  Scan URL
                </Button>
              </TabsContent>

              <TabsContent value="document" className="m-0">
                <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center">
                  <Upload className="h-10 w-10 mx-auto mb-4 text-white/40" />
                  <input
                    type="file"
                    onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <p className="text-white/60 mb-2">
                      {documentFile ? documentFile.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-white/40">PDF, DOC, DOCX, XLS, XLSX up to 10MB</p>
                  </label>
                </div>
                <Button 
                  onClick={() => documentFile && performScan('document', documentFile)}
                  disabled={isScanning || !documentFile}
                  className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-purple-600"
                >
                  {isScanning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                  Scan Document
                </Button>
              </TabsContent>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className={`border ${scanResult ? getRiskBg(scanResult.risk_level) : 'bg-white/5 border-white/10'}`}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Scan Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!scanResult ? (
                <div className="text-center py-12">
                  <Shield className="h-16 w-16 mx-auto mb-4 text-white/20" />
                  <p className="text-white/40">No scan results yet</p>
                  <p className="text-sm text-white/30">Scan an email, URL, or document to see results</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Risk Level */}
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Risk Level</span>
                    <Badge className={`${getRiskColor(scanResult.risk_level)} border-current bg-current/10`}>
                      {scanResult.risk_level.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Safety Status */}
                  <Alert className={scanResult.safe ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}>
                    {scanResult.safe ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <AlertDescription className={scanResult.safe ? 'text-green-400' : 'text-red-400'}>
                      {scanResult.safe ? 'No threats detected' : `${scanResult.threats_detected.length} threat(s) detected`}
                    </AlertDescription>
                  </Alert>

                  {/* Reputation Score */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/70 text-sm">Reputation Score</span>
                      <span className="text-white font-bold">{scanResult.reputation_score}/100</span>
                    </div>
                    <Progress value={scanResult.reputation_score} className="h-2" />
                  </div>

                  {/* Threats */}
                  {scanResult.threats_detected.length > 0 && (
                    <div>
                      <h4 className="text-white/70 text-sm mb-2">Detected Threats</h4>
                      <div className="space-y-1">
                        {scanResult.threats_detected.map((threat, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-red-400">
                            <XCircle className="h-3 w-3" />
                            {threat}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div>
                    <h4 className="text-white/70 text-sm mb-2">Recommendations</h4>
                    <div className="space-y-1">
                      {scanResult.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-white/60">
                          <CheckCircle className="h-3 w-3 text-cyan-400" />
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-center gap-2 text-xs text-white/40 pt-4 border-t border-white/10">
                    <Clock className="h-3 w-3" />
                    Scanned {new Date(scanResult.scan_date).toLocaleString()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  );
};

export default VanguardSafeScan;
