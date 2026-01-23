import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, Upload, CheckCircle, XCircle, AlertTriangle, 
  LinkIcon, MailWarning, FileWarning, Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface BulkScanResult {
  item: string;
  safe: boolean;
  risk_level: string;
  threats_detected: string[];
  reputation_score: number;
}

interface BulkScannerProps {
  userId?: string;
  scanType: 'url' | 'email' | 'document';
  onComplete?: (results: BulkScanResult[]) => void;
}

export function BulkScanner({ userId, scanType, onComplete }: BulkScannerProps) {
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BulkScanResult[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const scanTypeConfig = {
    url: { 
      icon: LinkIcon, 
      label: 'URLs', 
      placeholder: 'Enter URLs (one per line)\n\nhttps://example.com\nhttps://suspicious-site.com\nhttps://another-url.com',
      color: 'blue'
    },
    email: { 
      icon: MailWarning, 
      label: 'Email Addresses', 
      placeholder: 'Enter email addresses to check (one per line)\n\nuser@example.com\nsuspicious@fake-bank.com',
      color: 'purple'
    },
    document: { 
      icon: FileWarning, 
      label: 'Filenames', 
      placeholder: 'Enter filenames to check (one per line)\n\nreport.pdf\nInvoice_URGENT.docx\nmalware.exe',
      color: 'amber'
    }
  };

  const config = scanTypeConfig[scanType];
  const Icon = config.icon;

  const handleBulkScan = async () => {
    const items = input
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (items.length === 0) {
      toast({
        title: "No items to scan",
        description: `Please enter at least one ${config.label.toLowerCase()}`,
        variant: "destructive"
      });
      return;
    }

    if (items.length > 50) {
      toast({
        title: "Too many items",
        description: "Maximum 50 items per bulk scan",
        variant: "destructive"
      });
      return;
    }

    setIsScanning(true);
    setProgress(0);
    setResults([]);
    setSummary(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 200);

      const { data, error } = await supabase.functions.invoke('safescan-bulk', {
        body: {
          user_id: userId || 'guest',
          scan_type: scanType,
          items
        }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) throw error;

      setResults(data.results || []);
      setSummary(data.summary);
      onComplete?.(data.results);

      toast({
        title: "Bulk scan complete",
        description: `Scanned ${data.results.length} items - ${data.summary.threats} threats detected`
      });
    } catch (error: any) {
      console.error('Bulk scan error:', error);
      toast({
        title: "Scan failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-500 bg-red-500/10';
      case 'high': return 'text-orange-500 bg-orange-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'low': return 'text-blue-500 bg-blue-500/10';
      case 'safe': return 'text-emerald-500 bg-emerald-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-[#141414] border-red-500/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Zap className="h-4 w-4 text-red-400" />
            Bulk {config.label} Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={config.placeholder}
            rows={8}
            className="bg-[#0f0f0f] border-red-500/20 text-white placeholder:text-gray-600 font-mono text-sm"
          />
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {input.split('\n').filter(l => l.trim()).length} items • Max 50
            </p>
            <Button
              onClick={handleBulkScan}
              disabled={isScanning || !input.trim()}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Icon className="mr-2 h-4 w-4" />
                  Scan All
                </>
              )}
            </Button>
          </div>

          {isScanning && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-gray-500 text-center">
                Scanning {input.split('\n').filter(l => l.trim()).length} items...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <AnimatePresence>
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className="bg-[#141414] border-red-500/10">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-[#0f0f0f]">
                    <p className="text-2xl font-bold text-white">{summary.total}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-500/10">
                    <p className="text-2xl font-bold text-emerald-400">{summary.safe}</p>
                    <p className="text-xs text-gray-500">Safe</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/10">
                    <p className="text-2xl font-bold text-red-400">{summary.critical}</p>
                    <p className="text-xs text-gray-500">Critical</p>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-500/10">
                    <p className="text-2xl font-bold text-orange-400">{summary.high}</p>
                    <p className="text-xs text-gray-500">High</p>
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-500/10">
                    <p className="text-2xl font-bold text-yellow-400">{summary.medium + summary.low}</p>
                    <p className="text-xs text-gray-500">Med/Low</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {results.length > 0 && (
        <Card className="bg-[#141414] border-red-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Scan Results ({results.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {results.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#0f0f0f] border border-gray-800"
                  >
                    {result.safe ? (
                      <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                    ) : result.risk_level === 'critical' || result.risk_level === 'high' ? (
                      <XCircle className="h-5 w-5 text-red-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate font-mono">{result.item}</p>
                      {result.threats_detected.length > 0 && (
                        <p className="text-xs text-gray-500 truncate">
                          {result.threats_detected[0]}
                        </p>
                      )}
                    </div>

                    <Badge className={`shrink-0 text-xs ${getRiskColor(result.risk_level)}`}>
                      {result.risk_level}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
