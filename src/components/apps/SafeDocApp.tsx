import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Globe,
  BarChart3,
  TrendingUp,
  Upload,
  Loader2,
  Download,
  Clock,
  File,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDropzone } from 'react-dropzone';

interface DocumentScanResult {
  file_name: string;
  safe: boolean;
  threat_level: 'clean' | 'suspicious' | 'malicious';
  threats_found: number;
  scan_results: {
    engines_detected: number;
    total_engines: number;
    threats: Array<{
      engine: string;
      threat_name: string;
      threat_type: string;
    }>;
  };
  file_info: {
    size: number;
    type: string;
    hash: string;
  };
  scan_date: string;
  recommendations: string[];
}

interface SafeDocAppProps {
  isWhiteLabeled?: boolean;
  brandColor?: string;
  brandName?: string;
}

export const SafeDocApp = ({ isWhiteLabeled = false, brandColor = '#3b82f6', brandName = 'Ultrium AI' }: SafeDocAppProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<DocumentScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<DocumentScanResult[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [stats, setStats] = useState({
    totalScans: 0,
    threatsFound: 0,
    cleanFiles: 0,
    riskScore: 0
  });

  // Load scan history and stats
  useEffect(() => {
    if (user) {
      loadScanHistory();
      loadStats();
    }
  }, [user]);

  const loadScanHistory = async () => {
    try {
      const { data } = await supabase
        .from('safedoc_scans')
        .select('*')
        .eq('user_email', user?.email)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) {
        const results = data.map(scan => ({
          file_name: scan.file_name,
          safe: scan.threat_level === 'clean',
          threat_level: scan.threat_level,
          threats_found: scan.threats_found || 0,
          scan_results: scan.scan_results || { engines_detected: 0, total_engines: 0, threats: [] },
          file_info: {
            size: scan.file_size,
            type: scan.mime_type,
            hash: scan.file_hash
          },
          scan_date: scan.created_at,
          recommendations: scan.threat_level === 'clean' ? ['File is safe to use'] : ['Quarantine this file', 'Do not open or execute']
        })) as DocumentScanResult[];
        
        setScanHistory(results);
      }
    } catch (error) {
      console.error('Error loading scan history:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { data } = await supabase
        .from('safedoc_scans')
        .select('threat_level, threats_found')
        .eq('user_email', user?.email);
      
      if (data) {
        const totalScans = data.length;
        const threatsFound = data.reduce((acc, scan) => acc + (scan.threats_found || 0), 0);
        const cleanFiles = data.filter(scan => scan.threat_level === 'clean').length;
        const riskScore = totalScans > 0 ? Math.round(((totalScans - cleanFiles) / totalScans) * 100) : 0;
        
        setStats({
          totalScans,
          threatsFound,
          cleanFiles,
          riskScore
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp'],
      'text/*': ['.txt', '.csv'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar']
    },
    maxSize: 10 * 1024 * 1024, // 10MB limit
    multiple: false
  });

  const scanDocument = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please upload a file to scan",
        variant: "destructive"
      });
      return;
    }

    const file = uploadedFiles[0];
    setIsScanning(true);

    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_email', user?.email || '');

      const { data, error } = await supabase.functions.invoke('ultrium-safedoc-scanner', {
        body: formData
      });

      if (error) throw error;
      
      setScanResult(data as DocumentScanResult);
      await loadScanHistory();
      await loadStats();
      
      toast({
        title: "Scan Complete",
        description: `File analyzed - ${data.threats_found > 0 ? `${data.threats_found} threats found` : 'No threats detected'}`,
        variant: data.safe ? "default" : "destructive"
      });
    } catch (error: any) {
      toast({
        title: "Scan Failed",
        description: error.message || "Failed to scan document",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'malicious': return 'text-red-500';
      case 'suspicious': return 'text-yellow-500';
      case 'clean': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  const getThreatBadgeVariant = (level: string) => {
    switch (level) {
      case 'malicious': return 'destructive';
      case 'suspicious': return 'secondary';
      case 'clean': return 'default';
      default: return 'outline';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearFiles = () => {
    setUploadedFiles([]);
    setScanResult(null);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" style={{ color: brandColor }} />
            {isWhiteLabeled ? brandName : 'Ultrium'} SafeDoc
          </h1>
          <p className="text-muted-foreground">
            Advanced document malware scanning and threat detection
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary"
            onClick={() => window.open('/safedoc-embed-demo', '_blank')}
          >
            <Globe className="h-4 w-4 mr-2" />
            Embeddable Widget Demo
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Files Scanned</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalScans}</div>
            <p className="text-xs text-muted-foreground">
              Documents analyzed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threats Found</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.threatsFound}</div>
            <p className="text-xs text-muted-foreground">
              Malicious files detected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clean Files</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.cleanFiles}</div>
            <p className="text-xs text-muted-foreground">
              Verified safe documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.riskScore}%</div>
            <Progress value={stats.riskScore} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="scanner" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scanner">Document Scanner</TabsTrigger>
          <TabsTrigger value="history">Scan History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Document
                </CardTitle>
                <CardDescription>
                  Upload files to scan for malware and security threats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  {isDragActive ? (
                    <p className="text-primary">Drop the file here...</p>
                  ) : (
                    <div>
                      <p className="text-lg font-medium mb-2">
                        Drag & drop a file here, or click to select
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Supports: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, Images, ZIP (max 10MB)
                      </p>
                    </div>
                  )}
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Uploaded File:</h4>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <File className="h-4 w-4" />
                          <span className="text-sm font-medium">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({formatFileSize(file.size)})
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFiles}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <Button 
                  onClick={scanDocument}
                  disabled={uploadedFiles.length === 0 || isScanning}
                  className="w-full"
                  variant="hero"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scanning Document...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Scan for Malware
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Scan Results */}
            <Card>
              <CardHeader>
                <CardTitle>Scan Results</CardTitle>
              </CardHeader>
              <CardContent>
                {!scanResult ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Upload and scan a document to see detailed security analysis
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{scanResult.file_name}</span>
                      <Badge variant={getThreatBadgeVariant(scanResult.threat_level)}>
                        {scanResult.threat_level.toUpperCase()}
                      </Badge>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Threat Detection</span>
                        <div className="flex items-center gap-2">
                          {scanResult.safe ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className={`text-sm ${getThreatColor(scanResult.threat_level)}`}>
                            {scanResult.threats_found} threats found
                          </span>
                        </div>
                      </div>
                      
                      {scanResult.scan_results.engines_detected > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {scanResult.scan_results.engines_detected} of {scanResult.scan_results.total_engines} engines detected threats
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">File Information</h4>
                      <div className="space-y-1 text-sm">
                        <div><strong>Size:</strong> {formatFileSize(scanResult.file_info.size)}</div>
                        <div><strong>Type:</strong> {scanResult.file_info.type}</div>
                        <div><strong>Hash:</strong> <span className="font-mono text-xs">{scanResult.file_info.hash.substring(0, 16)}...</span></div>
                      </div>
                    </div>

                    {scanResult.scan_results.threats.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Detected Threats</h4>
                        <div className="space-y-2">
                          {scanResult.scan_results.threats.map((threat, index) => (
                            <Alert key={index} variant="destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                <div className="text-sm">
                                  <strong>{threat.engine}:</strong> {threat.threat_name}
                                  <br />
                                  <span className="text-xs">Type: {threat.threat_type}</span>
                                </div>
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      </div>
                    )}

                    {scanResult.recommendations.length > 0 && (
                      <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertDescription>
                          <ul className="list-disc pl-4 space-y-1">
                            {scanResult.recommendations.map((rec, index) => (
                              <li key={index} className="text-sm">{rec}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Document Scans
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scanHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No scan history yet. Upload and scan your first document!
                </div>
              ) : (
                <div className="space-y-3">
                  {scanHistory.map((scan, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${scan.safe ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <div className="font-medium">{scan.file_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatFileSize(scan.file_info.size)} • {new Date(scan.scan_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getThreatBadgeVariant(scan.threat_level)}>
                          {scan.threat_level}
                        </Badge>
                        {scan.threats_found > 0 && (
                          <Badge variant="destructive">
                            {scan.threats_found} threats
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Threat Detection Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Clean Files</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${stats.totalScans > 0 ? (stats.cleanFiles / stats.totalScans) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{stats.cleanFiles}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Malicious Files</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${stats.totalScans > 0 ? ((stats.totalScans - stats.cleanFiles) / stats.totalScans) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{stats.totalScans - stats.cleanFiles}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Always scan documents from untrusted sources before opening them.
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Enable real-time document scanning in your email gateway to catch threats early.
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Implement network segmentation to limit damage from infected documents.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};