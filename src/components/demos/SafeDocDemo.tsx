import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText, 
  Upload, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  File,
  Loader2,
  Download
} from "lucide-react";

interface DocumentAnalysis {
  fileName: string;
  fileSize: string;
  fileType: string;
  overallRisk: 'safe' | 'low' | 'medium' | 'high' | 'dangerous';
  riskScore: number;
  threats: {
    macros: boolean;
    embeddedFiles: boolean;
    suspiciousContent: boolean;
    passwordProtected: boolean;
    executables: boolean;
  };
  details: {
    pageCount?: number;
    wordCount?: number;
    containsMacros: boolean;
    hasExternalLinks: number;
    metadata: {
      author: string;
      created: string;
      modified: string;
      application: string;
    };
  };
  scanTime: string;
  recommendations: string[];
}

const mockDocuments = [
  {
    name: 'Invoice_Q4_2024.pdf',
    type: 'application/pdf',
    analysis: {
      fileName: 'Invoice_Q4_2024.pdf',
      fileSize: '2.4 MB',
      fileType: 'PDF Document',
      overallRisk: 'safe' as const,
      riskScore: 15,
      threats: {
        macros: false,
        embeddedFiles: false,
        suspiciousContent: false,
        passwordProtected: false,
        executables: false
      },
      details: {
        pageCount: 3,
        containsMacros: false,
        hasExternalLinks: 0,
        metadata: {
          author: 'Financial Department',
          created: '2024-03-15',
          modified: '2024-03-15',
          application: 'Adobe Acrobat'
        }
      },
      scanTime: new Date().toLocaleTimeString(),
      recommendations: [
        'Document appears safe to open',
        'No malicious content detected',
        'Standard PDF with expected metadata'
      ]
    }
  },
  {
    name: 'urgent_payment_details.docx',
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    analysis: {
      fileName: 'urgent_payment_details.docx',
      fileSize: '1.8 MB',
      fileType: 'Word Document',
      overallRisk: 'dangerous' as const,
      riskScore: 95,
      threats: {
        macros: true,
        embeddedFiles: true,
        suspiciousContent: true,
        passwordProtected: false,
        executables: true
      },
      details: {
        pageCount: 2,
        wordCount: 450,
        containsMacros: true,
        hasExternalLinks: 5,
        metadata: {
          author: 'Unknown User',
          created: '2024-03-20',
          modified: '2024-03-20',
          application: 'Microsoft Word (Modified)'
        }
      },
      scanTime: new Date().toLocaleTimeString(),
      recommendations: [
        'DO NOT OPEN - Contains malicious macros',
        'Quarantine this file immediately',
        'Report to security team',
        'Contains embedded executable content'
      ]
    }
  }
];

export const SafeDocDemo = () => {
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      scanFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      scanFile(e.target.files[0]);
    }
  };

  const scanFile = async (file: File) => {
    setIsScanning(true);
    
    // Simulate scan delay
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // Mock analysis based on file characteristics
    const fileName = file.name.toLowerCase();
    const fileType = file.type || 'unknown';
    
    let riskScore = 0;
    const threats = {
      macros: false,
      embeddedFiles: false,
      suspiciousContent: false,
      passwordProtected: false,
      executables: false
    };
    
    // Risk assessment based on filename and type
    if (fileName.includes('urgent') || fileName.includes('payment') || fileName.includes('invoice') && fileName.includes('.exe')) {
      threats.suspiciousContent = true;
      riskScore += 40;
    }
    
    if (fileType.includes('macro') || fileName.includes('.docm') || fileName.includes('.xlsm')) {
      threats.macros = true;
      riskScore += 60;
    }
    
    if (fileName.includes('setup') || fileName.includes('install') || fileType.includes('application')) {
      threats.executables = true;
      riskScore += 70;
    }
    
    if (fileName.includes('password') || fileName.includes('protected')) {
      threats.passwordProtected = true;
      riskScore += 30;
    }
    
    // Safe file types
    if (fileType.includes('pdf') && !fileName.includes('suspicious')) {
      riskScore = Math.max(0, riskScore - 20);
    }
    
    const getRiskLevel = (score: number): DocumentAnalysis['overallRisk'] => {
      if (score >= 80) return 'dangerous';
      if (score >= 60) return 'high';
      if (score >= 40) return 'medium';
      if (score >= 20) return 'low';
      return 'safe';
    };
    
    const riskLevel = getRiskLevel(riskScore);
    
    setAnalysis({
      fileName: file.name,
      fileSize: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      fileType: fileType.includes('pdf') ? 'PDF Document' : 
                fileType.includes('word') ? 'Word Document' :
                fileType.includes('excel') ? 'Excel Spreadsheet' : 'Unknown Document',
      overallRisk: riskLevel,
      riskScore: Math.min(riskScore, 100),
      threats,
      details: {
        pageCount: Math.floor(Math.random() * 10) + 1,
        wordCount: Math.floor(Math.random() * 1000) + 100,
        containsMacros: threats.macros,
        hasExternalLinks: threats.suspiciousContent ? Math.floor(Math.random() * 5) + 1 : 0,
        metadata: {
          author: riskLevel === 'dangerous' ? 'Unknown User' : 'Corporate User',
          created: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          modified: new Date().toLocaleDateString(),
          application: fileType.includes('pdf') ? 'Adobe Acrobat' : 'Microsoft Office'
        }
      },
      scanTime: new Date().toLocaleTimeString(),
      recommendations: riskLevel === 'dangerous' ? [
        'DO NOT OPEN - High risk of malware',
        'Quarantine file immediately',
        'Scan with additional security tools',
        'Report to cybersecurity team'
      ] : riskLevel === 'high' ? [
        'Open in sandboxed environment only',
        'Disable macros before opening',
        'Verify sender authenticity'
      ] : riskLevel === 'medium' ? [
        'Exercise caution when opening',
        'Ensure antivirus is up to date',
        'Save to secure location'
      ] : [
        'File appears safe to open',
        'Still verify source if unexpected',
        'Follow standard document handling procedures'
      ]
    });
    
    setIsScanning(false);
  };

  const loadSampleDocument = (index: number) => {
    setAnalysis(mockDocuments[index].analysis);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'dangerous': return 'text-red-600';
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      case 'safe': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'dangerous': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      case 'safe': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Ultrium SafeDoc Demo</h1>
          </div>
          <p className="text-muted-foreground">
            Advanced document scanner for malicious content, macros, and embedded threats
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Document Scanner
              </CardTitle>
              <CardDescription>
                Upload a document to analyze for security threats and malicious content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sample Documents:</label>
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => loadSampleDocument(0)}
                  >
                    📄 Safe PDF Invoice
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => loadSampleDocument(1)}
                  >
                    ⚠️ Malicious Word Document
                  </Button>
                </div>
              </div>
              
              <div
                className={`
                  relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
                  ${dragActive 
                    ? 'border-primary bg-primary/5 scale-105' 
                    : 'border-primary/30 hover:border-primary/60 hover:bg-primary/5'
                  }
                  ${isScanning ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !isScanning && document.getElementById('file-upload')?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isScanning}
                />
                
                {isScanning ? (
                  <div className="space-y-4">
                    <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
                    <p className="text-muted-foreground">Scanning document...</p>
                    <p className="text-xs text-muted-foreground">Analyzing content, macros, and metadata</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto hover:scale-110 transition-transform duration-300">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-foreground font-medium mb-2">
                        {dragActive ? 'Drop your document here' : 'Upload document for analysis'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Drag & drop or click to select
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, Word, Excel, PowerPoint • Max 50MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!analysis ? (
                <div className="text-center py-8 text-muted-foreground">
                  Upload a document to see detailed security analysis
                </div>
              ) : (
                <div className="space-y-6">
                  {/* File Info and Risk Score */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <File className="h-4 w-4" />
                      <span className="font-medium truncate">{analysis.fileName}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">
                      {analysis.fileType} • {analysis.fileSize}
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Risk Level</span>
                      <Badge variant={getRiskBadgeVariant(analysis.overallRisk)}>
                        {analysis.overallRisk.toUpperCase()}
                      </Badge>
                    </div>
                    <Progress value={analysis.riskScore} className="h-3" />
                    <p className={`text-sm mt-1 ${getRiskColor(analysis.overallRisk)}`}>
                      {analysis.riskScore}/100 Risk Score
                    </p>
                  </div>

                  {/* Threat Detection */}
                  <div>
                    <h4 className="font-medium mb-3">Threat Analysis</h4>
                    <div className="space-y-2">
                      {Object.entries(analysis.threats).map(([threat, detected]) => (
                        <div key={threat} className="flex items-center justify-between">
                          <span className="text-sm capitalize">
                            {threat.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </span>
                          <div className="flex items-center gap-1">
                            {detected ? (
                              <XCircle className="h-4 w-4 text-red-500" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {detected ? 'Detected' : 'Clean'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Document Details */}
                  <div>
                    <h4 className="font-medium mb-3">Document Information</h4>
                    <div className="space-y-2 text-sm">
                      {analysis.details.pageCount && (
                        <div className="flex justify-between">
                          <span>Pages:</span>
                          <span>{analysis.details.pageCount}</span>
                        </div>
                      )}
                      {analysis.details.wordCount && (
                        <div className="flex justify-between">
                          <span>Words:</span>
                          <span>{analysis.details.wordCount}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>External Links:</span>
                        <span>{analysis.details.hasExternalLinks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Author:</span>
                        <span>{analysis.details.metadata.author}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span>{analysis.details.metadata.created}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Application:</span>
                        <span>{analysis.details.metadata.application}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        {analysis.recommendations.map((rec, index) => (
                          <div key={index} className="text-sm">• {rec}</div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>

                  <div className="text-xs text-muted-foreground">
                    Scanned at {analysis.scanTime}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};