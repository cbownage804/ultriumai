import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BarChart3, Download, FileText, Clock, CheckCircle, XCircle,
  AlertTriangle, Info, LinkIcon, MailWarning, FileWarning
} from "lucide-react";
import { ScanReportExport } from "./ScanReportExport";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

interface ReportsTabProps {
  userId?: string;
}

export function ReportsTab({ userId }: ReportsTabProps) {
  const { toast } = useToast();
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalScans: 0,
    threatsBlocked: 0,
    safeItems: 0,
    riskScore: 0
  });

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load scan history
      const { data: docScans } = await supabase
        .from('document_scans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      const { data: analyticsData } = await supabase
        .from('gpt_analytics')
        .select('*')
        .eq('user_id', userId)
        .eq('interaction_type', 'security_scan')
        .order('created_at', { ascending: false })
        .limit(50);
      
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
      setScanHistory(results);

      // Calculate stats
      const totalScans = results.length;
      const threatsBlocked = results.filter(r => ['high', 'critical'].includes(r.risk_level)).length;
      const safeItems = results.filter(r => r.risk_level === 'safe').length;
      const avgRisk = totalScans > 0 ? Math.round(((totalScans - safeItems) / totalScans) * 100) : 0;
      
      setStats({ totalScans, threatsBlocked, safeItems, riskScore: avgRisk });
    } catch (error) {
      console.error('Error loading reports data:', error);
      toast({
        title: "Error",
        description: "Failed to load reports data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskConfig = (risk: string) => {
    switch (risk) {
      case 'critical': return { color: 'text-red-500', bg: 'bg-red-500/10' };
      case 'high': return { color: 'text-orange-500', bg: 'bg-orange-500/10' };
      case 'medium': return { color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
      case 'low': return { color: 'text-blue-500', bg: 'bg-blue-500/10' };
      case 'safe': return { color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
      default: return { color: 'text-gray-500', bg: 'bg-gray-500/10' };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'url': return LinkIcon;
      case 'email': return MailWarning;
      case 'document': return FileWarning;
      default: return FileText;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Scan Reports</h2>
          <p className="text-gray-500">View and export your security scan history</p>
        </div>
        <ScanReportExport results={scanHistory} scanType="all" />
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#141414] border-red-500/10">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-400">{stats.totalScans}</p>
            <p className="text-xs text-gray-500 mt-1">Total Scans</p>
          </CardContent>
        </Card>
        <Card className="bg-[#141414] border-red-500/10">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-400">{stats.threatsBlocked}</p>
            <p className="text-xs text-gray-500 mt-1">Threats Found</p>
          </CardContent>
        </Card>
        <Card className="bg-[#141414] border-red-500/10">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-emerald-400">{stats.safeItems}</p>
            <p className="text-xs text-gray-500 mt-1">Safe Items</p>
          </CardContent>
        </Card>
        <Card className="bg-[#141414] border-red-500/10">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-400">{stats.riskScore}%</p>
            <p className="text-xs text-gray-500 mt-1">Threat Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Scans Table */}
      <Card className="bg-[#141414] border-red-500/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-red-400" />
            Scan History
          </CardTitle>
          <CardDescription>Your recent security scans and their results</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {scanHistory.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-500">No scan history available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scanHistory.map((scan, index) => {
                  const config = getRiskConfig(scan.risk_level);
                  const TypeIcon = getTypeIcon(scan.type);
                  return (
                    <div 
                      key={index} 
                      className="flex items-center gap-4 p-4 rounded-lg bg-[#0f0f0f] border border-gray-800 hover:border-gray-700 transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${config.bg}`}>
                        <TypeIcon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {scan.content}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {new Date(scan.scan_date).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${config.bg} ${config.color} border-0`}>
                          {scan.risk_level}
                        </Badge>
                        {scan.safe ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
