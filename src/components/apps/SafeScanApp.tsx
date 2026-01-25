import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, ArrowLeft, History, Bot, Search,
  Clock, ShieldCheck, ShieldAlert, TrendingUp,
  Sparkles, LinkIcon, MailWarning, FileWarning,
  Layers, Calendar, BarChart3, CheckCircle, XCircle,
  AlertTriangle, Info
} from "lucide-react";
import { SecurityAIChatEnhanced } from "./safescan/SecurityAIChatEnhanced";
import { ScannerTab } from "./safescan/ScannerTab";
import { BulkScanner } from "./safescan/BulkScanner";
import { ScheduledScans } from "@/components/ScheduledScans";
import { ReportsTab } from "./safescan/ReportsTab";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

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
  hideHeader?: boolean;
}

const GUEST_SCAN_LIMIT = 3;

export const SafeScanApp = ({ isWhiteLabeled = false, brandColor = '#ef4444', brandName = 'SafeScan', hideHeader = false }: SafeScanAppProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isMSPContext = location.pathname.includes('/msp/') || window.location.hostname.includes('msp');
  const isGuestMode = !user;
  const [guestScanCount, setGuestScanCount] = useState(0);
  const [activeTab, setActiveTab] = useState('scanner');
  const [showAIChat, setShowAIChat] = useState(true); // Show AI chat by default
  const [aiChatExpanded, setAIChatExpanded] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
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

  const handleScanComplete = (result: ScanResult) => {
    setScanResult(result);
    if (user) {
      loadScanHistory();
      loadStats();
    } else {
      setScanHistory(prev => [result, ...prev.slice(0, 4)]);
    }
  };

  const getRiskConfig = (risk: string) => {
    switch (risk) {
      case 'critical': return { color: 'text-red-500', bg: 'bg-red-500/10', icon: XCircle };
      case 'high': return { color: 'text-orange-500', bg: 'bg-orange-500/10', icon: AlertTriangle };
      case 'medium': return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: AlertTriangle };
      case 'low': return { color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Info };
      case 'safe': return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle };
      default: return { color: 'text-gray-500', bg: 'bg-gray-500/10', icon: Info };
    }
  };

  return (
    <div className={hideHeader ? "" : "min-h-screen bg-[#0a0a0a]"}>
      {/* Header - conditionally rendered */}
      {!hideHeader && (
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
      )}

      {/* Inline controls when header is hidden */}
      {hideHeader && !isGuestMode && (
        <div className="flex items-center justify-end gap-2 mb-4">
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
        </div>
      )}

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

        {/* Main Tabs Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-[#141414] border border-red-500/10 p-1 w-full justify-start">
            <TabsTrigger 
              value="scanner" 
              className="data-[state=active]:bg-red-500 data-[state=active]:text-white text-gray-400"
            >
              <Shield className="h-4 w-4 mr-2" />
              Scanner
            </TabsTrigger>
            <TabsTrigger 
              value="bulk" 
              className="data-[state=active]:bg-red-500 data-[state=active]:text-white text-gray-400"
              disabled={isGuestMode}
            >
              <Layers className="h-4 w-4 mr-2" />
              Bulk Scan
            </TabsTrigger>
            <TabsTrigger 
              value="scheduled" 
              className="data-[state=active]:bg-red-500 data-[state=active]:text-white text-gray-400"
              disabled={isGuestMode}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Scheduled
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="data-[state=active]:bg-red-500 data-[state=active]:text-white text-gray-400"
              disabled={isGuestMode}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TabsContent value="scanner" className="mt-0">
                <ScannerTab
                  userId={user?.id}
                  isGuestMode={isGuestMode}
                  guestScanCount={guestScanCount}
                  guestScanLimit={GUEST_SCAN_LIMIT}
                  onGuestScanCountUpdate={setGuestScanCount}
                  onScanComplete={handleScanComplete}
                />
              </TabsContent>

              <TabsContent value="bulk" className="mt-0">
                <BulkScanner
                  userId={user?.id}
                  scanType="url"
                  onComplete={(results) => {
                    toast({
                      title: "Bulk Scan Complete",
                      description: `Scanned ${results.length} items`
                    });
                    loadStats();
                  }}
                />
              </TabsContent>

              <TabsContent value="scheduled" className="mt-0">
                <ScheduledScans />
              </TabsContent>

              <TabsContent value="reports" className="mt-0">
                <ReportsTab userId={user?.id} />
              </TabsContent>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* AI Chat Panel - Now more prominent */}
              {showAIChat && !isGuestMode && (
                <SecurityAIChatEnhanced 
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
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-gray-400 hover:text-white hover:bg-red-500/10" 
                      onClick={() => setActiveTab('scanner')}
                    >
                      <LinkIcon className="h-4 w-4 mr-3" />
                      Quick Scan
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-gray-400 hover:text-white hover:bg-red-500/10" 
                      onClick={() => setActiveTab('bulk')}
                      disabled={isGuestMode}
                    >
                      <Layers className="h-4 w-4 mr-3" />
                      Bulk Scan
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-gray-400 hover:text-white hover:bg-red-500/10" 
                      onClick={() => setActiveTab('scheduled')}
                      disabled={isGuestMode}
                    >
                      <Calendar className="h-4 w-4 mr-3" />
                      Schedule Scan
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
                                  {scan.type === 'email' && <MailWarning className={`h-3 w-3 ${config.color}`} />}
                                  {scan.type === 'document' && <FileWarning className={`h-3 w-3 ${config.color}`} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-300 truncate">{scan.content}</p>
                                  <p className="text-xs text-gray-600 flex items-center gap-1">
                                    <Clock className="h-2.5 w-2.5" />
                                    {new Date(scan.scan_date).toLocaleDateString()}
                                  </p>
                                </div>
                                <IconComponent className={`h-4 w-4 ${config.color}`} />
                              </div>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </Tabs>
      </main>
    </div>
  );
};
