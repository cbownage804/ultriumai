import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Globe, Loader2, Upload, Clock, FileText,
  LinkIcon, FileWarning, MailWarning, Shield,
  CheckCircle, XCircle, AlertTriangle, Info, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

interface ScannerTabProps {
  userId?: string;
  isGuestMode: boolean;
  guestScanCount: number;
  guestScanLimit: number;
  onGuestScanCountUpdate: (count: number) => void;
  onScanComplete?: (result: ScanResult) => void;
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

export function ScannerTab({ 
  userId, 
  isGuestMode, 
  guestScanCount, 
  guestScanLimit,
  onGuestScanCountUpdate,
  onScanComplete 
}: ScannerTabProps) {
  const { toast } = useToast();
  const [activeMode, setActiveMode] = useState<'url' | 'email' | 'document'>('url');
  const [emailContent, setEmailContent] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const performScan = async (type: 'email' | 'document' | 'url', content: string | File) => {
    if (isGuestMode && guestScanCount >= guestScanLimit) {
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
      let body: any = { user_id: userId || 'guest' };

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
      onScanComplete?.(result);
      
      if (isGuestMode) {
        onGuestScanCountUpdate(guestScanCount + 1);
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

  const clearInput = () => {
    setEmailContent('');
    setUrlInput('');
    setDocumentFile(null);
    setScanResult(null);
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

  return (
    <div className="space-y-6">
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
  );
}
