import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Mail, FileText, Link, Shield, AlertTriangle, CheckCircle, XCircle,
  Globe, TrendingUp, Loader2, Upload, ArrowLeft, Info, Search,
  Clock, History, Zap, Settings, BookOpen, FileSearch, BarChart3,
  LinkIcon, FileWarning, MailWarning, ShieldCheck, ShieldAlert,
  Sparkles, Eye, RefreshCw, Download, Bot, MessageSquare
} from "lucide-react";
import { SecurityAIChat } from "./safescan/SecurityAIChat";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

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

interface SafeScanAppProps {
  isWhiteLabeled?: boolean;
  brandColor?: string;
  brandName?: string;
}

const scanModes = [
  { 
    id: 'url', 
    label: 'URL Scanner', 
    icon: LinkIcon, 
    description: 'Analyze URLs for phishing & malware',
    color: 'from-blue-500 to-cyan-500'
  },
  { 
    id: 'email', 
    label: 'Email Scanner', 
    icon: MailWarning, 
    description: 'Detect phishing & malicious content',
    color: 'from-purple-500 to-pink-500'
  },
  { 
    id: 'document', 
    label: 'Document Scanner', 
    icon: FileWarning, 
    description: 'Scan files for malware & threats',
    color: 'from-amber-500 to-orange-500'
  },
];

export const SafeScanApp = ({ isWhiteLabeled = false, brandColor = '#ef4444', brandName = 'SafeScan' }: SafeScanAppProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isMSPContext = location.pathname.includes('/msp/') || window.location.hostname.includes('msp');
  const isGuestMode = !user;
  const [guestScanCount, setGuestScanCount] = useState(0);
  const GUEST_SCAN_LIMIT = 3;
  
  const [activeMode, setActiveMode] = useState<'url' | 'email' | 'document'>('url');
  const [emailContent, setEmailContent] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiChatExpanded, setAIChatExpanded] = useState(false);
  const [stats, setStats] = useState({
    totalScans: 0,
    threatsBlocked: 0,
    safeItems: 0,
    riskScore: 0
  });

  useEffect(() => {
    if (user) {
      loadScanHistory();
      loadStats();
    }
  }, [user]);

  const loadScanHistory = async () => {
    try {
      const { data: docScans } = await supabase
        .from('document_scans')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      const { data: analyticsData } = await supabase
        .from('gpt_analytics')
        .select('*')
        .eq('user_id', user?.id)
        .eq('interaction_type', 'security_scan')
        .order('created_at', { ascending: false })
        .limit(10);
      
      const results: ScanResult[] = [];
      
      if (docScans) {
        docScans.forEach(scan => {
          const scanResult = scan.scan_result as any;
          results.push({
            type: 'document',
            content: scan.file_name,
            safe: scan.threat_level === 'safe',
            risk_level: scan.threat_level as any,
            threats_detected: scanResult?.threats || [],
            reputation_score: scanResult?.reputation_score || 50,
            scan_details: {
              file_type: scan.file_name.split('.').pop() || 'unknown',
              file_size: scan.file_size,
              scan_date: scan.created_at
            },
            scan_date: scan.created_at,
            recommendations: scanResult?.recommendations || []
          });
        });
      }
      
      if (analyticsData) {
        analyticsData.forEach(item => {
          const metadata = item.metadata as any;
          results.push({
            type: metadata?.scan_type || 'unknown',
            content: metadata?.content || 'Security scan',
            safe: metadata?.risk_level === 'safe',
            risk_level: metadata?.risk_level || 'unknown',
            threats_detected: metadata?.threats_detected || [],
            reputation_score: metadata?.reputation_score || 50,
            scan_details: metadata?.scan_details || {},
            scan_date: item.created_at,
            recommendations: metadata?.recommendations || []
          });
        });
      }
      
      results.sort((a, b) => new Date(b.scan_date).getTime() - new Date(a.scan_date).getTime());
      setScanHistory(results.slice(0, 15));
    } catch (error) {
      console.error('Error loading scan history:', error);
    }
  };

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
    if (isGuestMode && guestScanCount >= GUEST_SCAN_LIMIT) {
      toast({
        title: "Guest Limit Reached",
        description: "Sign in to unlock unlimited scans",
        variant: "destructive"
      });
      return;
    }
    
    setIsScanning(true);
    setScanResult(null);
    
    try {
      let functionName = '';
      let body: any = { user_id: user?.id || 'guest' };

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

      const result: ScanResult = {
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
      
      if (user) {
        await loadScanHistory();
        await loadStats();
      } else {
        setGuestScanCount(prev => prev + 1);
        setScanHistory(prev => [result, ...prev.slice(0, 4)]);
      }
      
      toast({
        title: "Scan Complete",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} analyzed - ${result.safe ? 'Safe' : 'Threats detected'}`,
        variant: result.safe ? "default" : "destructive"
      });
    } catch (error: any) {
      console.error('Scan error:', error);
      
      const errorResult: ScanResult = {
        type: type,
        content: typeof content === 'string' ? content.substring(0, 100) : (content as File).name,
        safe: false,
        risk_level: 'unknown',
        threats_detected: ['Scan failed - unable to analyze'],
        reputation_score: 0,
        scan_details: { error: error.message },
        scan_date: new Date().toISOString(),
        recommendations: ['Please try again', 'Contact support if issue persists']
      };
      
      setScanResult(errorResult);
      toast({
        title: "Scan Failed",
        description: error.message || `Failed to scan ${type}`,
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleScan = () => {
    switch (activeMode) {
      case 'email':
        if (!emailContent.trim()) {
          toast({ title: "Error", description: "Please enter email content", variant: "destructive" });
          return;
        }
        performScan('email', emailContent);
        break;
      case 'url':
        if (!urlInput.trim()) {
          toast({ title: "Error", description: "Please enter a URL", variant: "destructive" });
          return;
        }
        performScan('url', urlInput);
        break;
      case 'document':
        if (!documentFile) {
          toast({ title: "Error", description: "Please select a file", variant: "destructive" });
          return;
        }
        performScan('document', documentFile);
        break;
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setDocumentFile(file);
  };

  const getRiskConfig = (risk: string) => {
    switch (risk) {
      case 'critical': return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: XCircle };
      case 'high': return { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: AlertTriangle };
      case 'medium': return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: AlertTriangle };
      case 'low': return { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: Info };
      case 'safe': return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: CheckCircle };
      default: return { color: 'text-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-500/30', icon: Info };
    }
  };

  const clearInput = () => {
    setEmailContent('');
    setUrlInput('');
    setDocumentFile(null);
    setScanResult(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-red-500/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/20">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    SafeScan™
                    {isMSPContext && <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">MSP</Badge>}
                  </h1>
                  <p className="text-xs text-gray-500">AI-Powered Security Scanner</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!isGuestMode && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAIChat(!showAIChat)}
                    className={`text-gray-400 hover:text-red-400 ${showAIChat ? 'bg-red-500/10 text-red-400' : ''}`}
                  >
                    <Bot className="h-4 w-4 mr-2" />
                    AI Assistant
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                    className={`text-gray-400 hover:text-red-400 ${showHistory ? 'bg-red-500/10 text-red-400' : ''}`}
                  >
                    <History className="h-4 w-4 mr-2" />
                    History
                  </Button>
                </>
              )}
              {isGuestMode && (
                <Button 
                  onClick={() => navigate('/safesuite/auth')}
                  className="bg-red-500 hover:bg-red-600 text-white"
                  size="sm"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Guest Mode Banner */}
        {isGuestMode && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30">
              <Sparkles className="h-4 w-4 text-red-400" />
              <AlertDescription className="flex items-center justify-between">
                <span className="text-gray-300">
                  <strong className="text-red-400">Demo Mode:</strong> {GUEST_SCAN_LIMIT - guestScanCount} scans remaining
                </span>
                <Button size="sm" onClick={() => navigate('/safesuite/auth')} className="bg-red-500 hover:bg-red-600 text-white ml-4">
                  Unlock Unlimited
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Stats Bar */}
        {!isGuestMode && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-[#141414] border-red-500/10 hover:border-red-500/30 transition-all">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Search className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.totalScans}</p>
                  <p className="text-xs text-gray-500">Total Scans</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#141414] border-red-500/10 hover:border-red-500/30 transition-all">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <ShieldAlert className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-400">{stats.threatsBlocked}</p>
                  <p className="text-xs text-gray-500">Threats Found</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#141414] border-red-500/10 hover:border-red-500/30 transition-all">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-400">{stats.safeItems}</p>
                  <p className="text-xs text-gray-500">Safe Items</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#141414] border-red-500/10 hover:border-red-500/30 transition-all">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <TrendingUp className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-400">{stats.riskScore}%</p>
                  <p className="text-xs text-gray-500">Threat Rate</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scanner Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Scan Mode Selector */}
            <div className="grid grid-cols-3 gap-3">
              {scanModes.map((mode) => (
                <motion.button
                  key={mode.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setActiveMode(mode.id as any); clearInput(); }}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    activeMode === mode.id
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-gray-800 bg-[#141414] hover:border-gray-700'
                  }`}
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${mode.color} w-fit mb-3`}>
                    <mode.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">{mode.label}</h3>
                  <p className="text-xs text-gray-500">{mode.description}</p>
                </motion.button>
              ))}
            </div>

            {/* Input Area */}
            <Card className="bg-[#141414] border-red-500/10">
              <CardContent className="p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeMode}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeMode === 'url' && (
                      <div className="space-y-4">
                        <Label className="text-gray-300 text-sm font-medium">Enter URL to Scan</Label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                          <Input
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder="https://example.com"
                            className="pl-10 h-12 bg-[#0f0f0f] border-red-500/20 text-white placeholder:text-gray-600 focus:border-red-500/50"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUrlInput('https://suspicious-site-example.com/login')}
                            className="border-gray-700 text-gray-400 hover:bg-gray-800 text-xs"
                          >
                            Load Example
                          </Button>
                        </div>
                      </div>
                    )}

                    {activeMode === 'email' && (
                      <div className="space-y-4">
                        <Label className="text-gray-300 text-sm font-medium">Paste Email Content</Label>
                        <Textarea
                          value={emailContent}
                          onChange={(e) => setEmailContent(e.target.value)}
                          placeholder="Paste email headers and content here..."
                          rows={8}
                          className="bg-[#0f0f0f] border-red-500/20 text-white placeholder:text-gray-600 focus:border-red-500/50 resize-none"
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEmailContent(`From: security@your-bank-verify.com
Subject: URGENT: Your account will be suspended

Dear Customer,

We detected unusual activity on your account. Click below to verify immediately:
https://secure-verification.fake-site.com/login

Your account will be suspended in 24 hours if not verified.

Security Team`)}
                            className="border-gray-700 text-gray-400 hover:bg-gray-800 text-xs"
                          >
                            Load Phishing Example
                          </Button>
                        </div>
                      </div>
                    )}

                    {activeMode === 'document' && (
                      <div className="space-y-4">
                        <Label className="text-gray-300 text-sm font-medium">Upload Document</Label>
                        <label 
                          htmlFor="file-upload"
                          className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-red-500/20 rounded-xl cursor-pointer hover:border-red-500/40 transition-colors bg-[#0f0f0f] group"
                        >
                          <input
                            id="file-upload"
                            type="file"
                            onChange={handleFileSelect}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.html,.htm,.xml,.json,.jpg,.jpeg,.png,.gif,.zip,.rar,.7z"
                            className="hidden"
                          />
                          {documentFile ? (
                            <div className="text-center">
                              <FileText className="h-10 w-10 mx-auto mb-3 text-red-400" />
                              <p className="font-medium text-white">{documentFile.name}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {(documentFile.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <Upload className="h-10 w-10 mx-auto mb-3 text-gray-500 group-hover:text-red-400 transition-colors" />
                              <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                                Click to upload or drag & drop
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                PDF, Office docs, images, archives
                              </p>
                            </div>
                          )}
                        </label>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                <Separator className="my-6 bg-gray-800" />

                <Button
                  onClick={handleScan}
                  disabled={isScanning || (activeMode === 'url' && !urlInput) || (activeMode === 'email' && !emailContent) || (activeMode === 'document' && !documentFile)}
                  className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-lg shadow-red-500/20"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-5 w-5" />
                      Scan {activeMode === 'url' ? 'URL' : activeMode === 'email' ? 'Email' : 'Document'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results Panel */}
            <AnimatePresence>
              {scanResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className={`overflow-hidden border-2 ${getRiskConfig(scanResult.risk_level).border} bg-[#141414]`}>
                    {/* Result Header */}
                    <div className={`p-6 ${scanResult.safe ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10' : 'bg-gradient-to-r from-red-500/10 to-orange-500/10'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-4 rounded-2xl ${scanResult.safe ? 'bg-emerald-500' : 'bg-red-500'} shadow-lg`}>
                            {scanResult.safe ? (
                              <CheckCircle className="h-8 w-8 text-white" />
                            ) : (
                              <XCircle className="h-8 w-8 text-white" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-white">
                              {scanResult.safe ? 'No Threats Detected' : 'Threats Detected'}
                            </h3>
                            <p className="text-gray-400">
                              {scanResult.type.charAt(0).toUpperCase() + scanResult.type.slice(1)} scan completed
                            </p>
                          </div>
                        </div>
                        <Badge className={`text-lg px-4 py-2 ${getRiskConfig(scanResult.risk_level).bg} ${getRiskConfig(scanResult.risk_level).color} border-0`}>
                          {scanResult.risk_level?.toUpperCase()}
                        </Badge>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="p-4 rounded-xl bg-black/20 backdrop-blur-sm text-center">
                          <p className="text-3xl font-bold text-blue-400">{scanResult.reputation_score}</p>
                          <p className="text-xs text-gray-500 mt-1">Reputation Score</p>
                        </div>
                        <div className="p-4 rounded-xl bg-black/20 backdrop-blur-sm text-center">
                          <p className="text-3xl font-bold text-orange-400">{scanResult.threats_detected?.length || 0}</p>
                          <p className="text-xs text-gray-500 mt-1">Issues Found</p>
                        </div>
                        <div className="p-4 rounded-xl bg-black/20 backdrop-blur-sm text-center">
                          <p className="text-3xl font-bold text-purple-400">{scanResult.type.toUpperCase()}</p>
                          <p className="text-xs text-gray-500 mt-1">Scan Type</p>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-6 space-y-6">
                      {/* Scanned Content */}
                      <div>
                        <h4 className="font-semibold text-gray-300 mb-2 flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Analyzed Content
                        </h4>
                        <div className="p-3 rounded-lg bg-[#0f0f0f] border border-gray-800">
                          <code className="text-sm text-gray-400 break-all">{scanResult.content}</code>
                        </div>
                      </div>

                      {/* Threats */}
                      {scanResult.threats_detected && scanResult.threats_detected.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Security Issues ({scanResult.threats_detected.length})
                          </h4>
                          <div className="space-y-2">
                            {scanResult.threats_detected.map((threat, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                                <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                                <span className="text-sm text-red-200">{threat}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {scanResult.recommendations && scanResult.recommendations.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Recommendations
                          </h4>
                          <div className="space-y-2">
                            {scanResult.recommendations.map((rec, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                                <span className="text-sm text-emerald-200">{rec}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="pt-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(scanResult.scan_date).toLocaleString()}
                        </span>
                        <span>Powered by SafeScan™ AI</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Chat Panel */}
            {showAIChat && !isGuestMode && (
              <SecurityAIChat 
                scanContext={scanResult}
                onClose={() => setShowAIChat(false)}
                isExpanded={aiChatExpanded}
                onToggleExpand={() => setAIChatExpanded(!aiChatExpanded)}
              />
            )}
            
            {/* Quick Actions */}
            {!showAIChat && (
              <Card className="bg-[#141414] border-red-500/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-300">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-gray-400 hover:text-white hover:bg-red-500/10" 
                    onClick={() => { setShowAIChat(true); }}
                  >
                    <Bot className="h-4 w-4 mr-3 text-red-400" />
                    Ask AI Assistant
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-white hover:bg-red-500/10" onClick={() => setActiveMode('url')}>
                    <LinkIcon className="h-4 w-4 mr-3" />
                    Scan a URL
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-white hover:bg-red-500/10" onClick={() => setActiveMode('email')}>
                    <MailWarning className="h-4 w-4 mr-3" />
                    Check Email
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-white hover:bg-red-500/10" onClick={() => setActiveMode('document')}>
                    <FileWarning className="h-4 w-4 mr-3" />
                    Scan File
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Scan History */}
            {(showHistory || scanHistory.length > 0) && (
              <Card className="bg-[#141414] border-red-500/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Recent Scans
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {scanHistory.length === 0 ? (
                        <p className="text-center text-gray-500 text-sm py-4">No scan history</p>
                      ) : (
                        scanHistory.slice(0, 10).map((scan, index) => {
                          const config = getRiskConfig(scan.risk_level);
                          const IconComponent = config.icon;
                          return (
                            <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-[#0f0f0f] border border-gray-800 hover:border-gray-700 transition-colors">
                              <div className={`p-1.5 rounded-lg ${config.bg}`}>
                                {scan.type === 'url' && <LinkIcon className={`h-3 w-3 ${config.color}`} />}
                                {scan.type === 'email' && <Mail className={`h-3 w-3 ${config.color}`} />}
                                {scan.type === 'document' && <FileText className={`h-3 w-3 ${config.color}`} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-300 truncate">{scan.content}</p>
                                <p className="text-xs text-gray-500">{new Date(scan.scan_date).toLocaleDateString()}</p>
                              </div>
                              <Badge variant="outline" className={`text-xs ${config.color} ${config.border}`}>
                                {scan.risk_level}
                              </Badge>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Feature Highlights */}
            <Card className="bg-gradient-to-br from-red-500/5 to-orange-500/5 border-red-500/20">
              <CardContent className="p-4">
                <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-red-400" />
                  SafeScan Features
                </h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-emerald-400" />
                    VirusTotal Integration
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-emerald-400" />
                    AI Phishing Detection
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-emerald-400" />
                    Document Malware Scan
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-emerald-400" />
                    Real-time Threat Intel
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-emerald-400" />
                    Scan History & Reports
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SafeScanApp;
