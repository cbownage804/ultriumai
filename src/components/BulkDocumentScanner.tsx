import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  FileText, 
  Trash2, 
  Shield, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Loader2,
  Download,
  Eye
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useToast } from "@/hooks/use-toast";
import { useSafeDoc } from "@/hooks/useSafeDoc";

interface BulkScanFile {
  file: File;
  id: string;
  status: 'pending' | 'scanning' | 'completed' | 'error';
  result?: any;
  progress?: number;
}

interface BulkDocumentScannerProps {
  onScanComplete?: (results: any[]) => void;
  maxFiles?: number;
  isMSPContext?: boolean;
}

export const BulkDocumentScanner = ({ 
  onScanComplete, 
  maxFiles = 10,
  isMSPContext = false 
}: BulkDocumentScannerProps) => {
  const { toast } = useToast();
  const { scanDocument } = useSafeDoc();
  
  const [files, setFiles] = useState<BulkScanFile[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [currentScanIndex, setCurrentScanIndex] = useState(0);
  const [scanResults, setScanResults] = useState<any[]>([]);

  // Enhanced file type support
  const acceptedFileTypes = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-powerpoint': ['.ppt'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'text/plain': ['.txt'],
    'text/csv': ['.csv'],
    'application/rtf': ['.rtf'],
    'text/html': ['.html', '.htm'],
    'application/xml': ['.xml'],
    'text/xml': ['.xml'],
    'application/json': ['.json'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/bmp': ['.bmp'],
    'image/tiff': ['.tiff', '.tif'],
    'application/zip': ['.zip'],
    'application/x-rar-compressed': ['.rar'],
    'application/x-7z-compressed': ['.7z'],
    'application/x-tar': ['.tar'],
    'application/gzip': ['.gz']
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const totalFiles = files.length + acceptedFiles.length;
    
    if (totalFiles > maxFiles) {
      toast({
        title: "Too Many Files",
        description: `Maximum ${maxFiles} files allowed. Please remove some files first.`,
        variant: "destructive"
      });
      return;
    }

    const newFiles: BulkScanFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, [files.length, maxFiles, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    multiple: true,
    maxFiles: maxFiles - files.length
  });

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearAllFiles = () => {
    setFiles([]);
    setScanResults([]);
    setCurrentScanIndex(0);
  };

  const startBulkScan = async () => {
    if (files.length === 0) return;

    setIsScanning(true);
    setCurrentScanIndex(0);
    const results: any[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        setCurrentScanIndex(i);
        const fileData = files[i];
        
        // Update file status to scanning
        setFiles(prev => prev.map(f => 
          f.id === fileData.id 
            ? { ...f, status: 'scanning', progress: 0 }
            : f
        ));

        try {
          // For MSP context, we'd need actual MSP and client IDs
          // For now, using defaults for demo
          const result = await scanDocument(
            fileData.file,
            isMSPContext ? 'demo-msp-id' : 'individual',
            isMSPContext ? 'demo-client-id' : 'individual', 
            'user@example.com'
          );

          // Update file status to completed
          setFiles(prev => prev.map(f => 
            f.id === fileData.id 
              ? { ...f, status: 'completed', result, progress: 100 }
              : f
          ));

          results.push({ file: fileData.file, result });

        } catch (error) {
          console.error(`Error scanning file ${fileData.file.name}:`, error);
          
          // Update file status to error
          setFiles(prev => prev.map(f => 
            f.id === fileData.id 
              ? { ...f, status: 'error', progress: 0 }
              : f
          ));

          results.push({ file: fileData.file, error });
        }
      }

      setScanResults(results);
      onScanComplete?.(results);

      const successCount = results.filter(r => !r.error).length;
      const errorCount = results.filter(r => r.error).length;

      toast({
        title: "Bulk Scan Complete",
        description: `${successCount} files scanned successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        variant: errorCount > 0 ? "destructive" : "default"
      });

    } finally {
      setIsScanning(false);
      setCurrentScanIndex(0);
    }
  };

  const exportResults = () => {
    const report = {
      scanDate: new Date().toISOString(),
      totalFiles: files.length,
      results: scanResults.map(r => ({
        fileName: r.file.name,
        fileSize: r.file.size,
        safe: r.result?.safe ?? false,
        riskLevel: r.result?.risk_level ?? 'unknown',
        threatsDetected: r.result?.threats_detected?.length ?? 0,
        error: r.error?.message
      }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-scan-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('word') || file.type.includes('doc')) return '📝';
    if (file.type.includes('excel') || file.type.includes('sheet')) return '📊';
    if (file.type.includes('powerpoint') || file.type.includes('presentation')) return '📽️';
    if (file.type.includes('zip') || file.type.includes('rar') || file.type.includes('7z')) return '🗜️';
    return '📎';
  };

  const getScanStatusIcon = (status: string, result?: any) => {
    switch (status) {
      case 'pending':
        return <FileText className="h-4 w-4 text-muted-foreground" />;
      case 'scanning':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return result?.safe ? 
          <CheckCircle className="h-4 w-4 text-green-500" /> : 
          <XCircle className="h-4 w-4 text-red-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const overallProgress = files.length > 0 ? (currentScanIndex / files.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Document Scanner
          </CardTitle>
          <CardDescription>
            Upload multiple documents for batch security scanning. Supports {Object.values(acceptedFileTypes).flat().length}+ file types.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Drop Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-lg mb-2">Drag & drop files here, or click to select</p>
                <p className="text-sm text-muted-foreground">
                  Support for PDF, Office docs, images, archives, and more • Max {maxFiles} files
                </p>
              </div>
            )}
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Files to Scan ({files.length})</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllFiles}
                    disabled={isScanning}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                  <Button
                    onClick={startBulkScan}
                    disabled={files.length === 0 || isScanning}
                    variant="hero"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scanning... ({currentScanIndex + 1}/{files.length})
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Start Bulk Scan
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Overall Progress */}
              {isScanning && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Overall Progress</span>
                    <span>{Math.round(overallProgress)}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-2" />
                </div>
              )}

              {/* File Items */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {files.map((fileData) => (
                  <div
                    key={fileData.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="text-2xl">{getFileIcon(fileData.file)}</div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{fileData.file.name}</p>
                        {fileData.result && (
                          <Badge variant={fileData.result.safe ? "default" : "destructive"} className="text-xs">
                            {fileData.result.safe ? 'Clean' : `${fileData.result.threats_detected?.length || 0} threats`}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {getScanStatusIcon(fileData.status, fileData.result)}
                      {!isScanning && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(fileData.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results Summary */}
          {scanResults.length > 0 && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>
                    Scan complete: {scanResults.filter(r => !r.error).length} files processed
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportResults}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};