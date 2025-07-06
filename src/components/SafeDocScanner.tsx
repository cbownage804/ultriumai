import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileText, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  Eye,
  Download
} from 'lucide-react';
import { useSafeDoc } from '@/hooks/useSafeDoc';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';

interface SafeDocScannerProps {
  mspId: string;
  clientId: string;
  userEmail: string;
  className?: string;
}

const SafeDocScanner = ({ mspId, clientId, userEmail, className }: SafeDocScannerProps) => {
  const { scans, scanDocument, getScansByClient, getThreatSummary } = useSafeDoc();
  const [isUploading, setIsUploading] = useState(false);

  const clientScans = getScansByClient(clientId);
  const summary = getThreatSummary();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    
    try {
      for (const file of acceptedFiles) {
        await scanDocument(file, mspId, clientId, userEmail);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  }, [scanDocument, mspId, clientId, userEmail]);

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
      'text/plain': ['.txt'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: isUploading
  });

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'clean': return 'bg-green-500';
      case 'low': return 'bg-yellow-500';
      case 'medium': return 'bg-orange-500';
      case 'high': return 'bg-red-500';
      case 'critical': return 'bg-red-700';
      default: return 'bg-gray-500';
    }
  };

  const getThreatLevelIcon = (level: string, status: string) => {
    if (status === 'failed') return <XCircle className="h-4 w-4 text-red-500" />;
    if (status === 'pending' || status === 'scanning') return <Clock className="h-4 w-4 text-blue-500" />;
    
    switch (level) {
      case 'clean': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'low': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-700" />;
      default: return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            SafeDoc Scanner
          </CardTitle>
          <CardDescription>
            Upload documents to scan for malware, viruses, and security threats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              isUploading && "opacity-50 cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg font-medium">Drop documents here to scan...</p>
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {isUploading ? 'Uploading...' : 'Drag & drop documents or click to browse'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports PDF, DOC, XLS, PPT, TXT, ZIP, RAR files up to 50MB
                </p>
              </div>
            )}
          </div>
          
          {isUploading && (
            <div className="mt-4">
              <Progress value={undefined} className="w-full" />
              <p className="text-sm text-muted-foreground mt-2">Processing documents...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{summary.total}</div>
                <div className="text-xs text-muted-foreground">Total Scans</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{summary.clean}</div>
                <div className="text-xs text-muted-foreground">Clean Files</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{summary.threats}</div>
                <div className="text-xs text-muted-foreground">Threats Found</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{summary.pending}</div>
                <div className="text-xs text-muted-foreground">Scanning</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scan Results */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Scans</CardTitle>
          <CardDescription>
            Document security scan results for this client
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clientScans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents scanned yet</p>
              <p className="text-sm">Upload documents above to start scanning</p>
            </div>
          ) : (
            <div className="space-y-4">
              {clientScans.slice(0, 10).map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getThreatLevelIcon(scan.threat_level, scan.scan_status)}
                    <div>
                      <div className="font-medium">{scan.file_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatFileSize(scan.file_size)} • {new Date(scan.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-white",
                        getThreatLevelColor(scan.threat_level)
                      )}
                    >
                      {scan.scan_status === 'completed' ? (
                        scan.threat_level === 'clean' ? 'Clean' : `${scan.threats_found} threats`
                      ) : (
                        scan.scan_status
                      )}
                    </Badge>
                    
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SafeDocScanner;