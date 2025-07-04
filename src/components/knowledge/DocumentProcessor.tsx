import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Trash2, Loader2, File, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProcessedDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  file: File;
  processed?: boolean;
  chunks?: number;
  error?: string;
}

interface DocumentProcessorProps {
  gptId: string;
  onDocumentsProcessed: (documents: ProcessedDocument[]) => void;
}

export const DocumentProcessor = ({ gptId, onDocumentsProcessed }: DocumentProcessorProps) => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newDocs: ProcessedDocument[] = Array.from(files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: (file.size / 1024 / 1024).toFixed(2) + " MB",
        file: file,
        processed: false
      }));
      
      setDocuments(prev => [...prev, ...newDocs]);
      toast({
        title: "Files added",
        description: `${files.length} file(s) ready for processing`,
      });
    }
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const processDocument = async (doc: ProcessedDocument): Promise<ProcessedDocument> => {
    try {
      let processedContent = '';
      let chunks = 0;

      if (doc.file.type === 'text/plain' || doc.file.name.endsWith('.md')) {
        processedContent = await doc.file.text();
        // Simple chunking: split by paragraphs and group into ~500 word chunks
        const paragraphs = processedContent.split('\n\n');
        const chunkSize = 500;
        chunks = Math.ceil(processedContent.split(' ').length / chunkSize);
      } else if (doc.file.type === 'application/pdf') {
        // For PDF files, we'd need a PDF parsing library
        processedContent = `PDF Document: ${doc.file.name} (${doc.file.size})`;
        chunks = 1; // Placeholder
      } else if (doc.file.type.includes('text/') || doc.file.name.endsWith('.txt')) {
        processedContent = await doc.file.text();
        chunks = Math.ceil(processedContent.split(' ').length / 500);
      } else {
        // For other file types, store metadata
        processedContent = `Document: ${doc.file.name} (${doc.file.type})`;
        chunks = 1;
      }

      return {
        ...doc,
        processed: true,
        chunks,
        error: undefined
      };
    } catch (error) {
      console.error('Error processing document:', error);
      return {
        ...doc,
        processed: false,
        error: error instanceof Error ? error.message : 'Processing failed'
      };
    }
  };

  const processAllDocuments = async () => {
    if (documents.length === 0) {
      toast({
        title: "No documents",
        description: "Please add documents before processing",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const processedDocs: ProcessedDocument[] = [];
      
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        setProcessingProgress((i / documents.length) * 90);
        
        const processed = await processDocument(doc);
        processedDocs.push(processed);
        
        // Update the documents state to show progress
        setDocuments(prev => prev.map(d => 
          d.id === doc.id ? processed : d
        ));
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setProcessingProgress(100);
      onDocumentsProcessed(processedDocs);

      const successCount = processedDocs.filter(d => d.processed).length;
      const errorCount = processedDocs.filter(d => d.error).length;

      toast({
        title: "Processing complete",
        description: `${successCount} document(s) processed successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      });

    } catch (error) {
      console.error('Error processing documents:', error);
      toast({
        title: "Processing failed",
        description: "There was an error processing your documents",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return File;
    if (type.includes('text') || type.includes('markdown')) return FileText;
    return File;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document Processor
        </CardTitle>
        <CardDescription>
          Upload and process documents for your knowledge base
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <Label htmlFor="file-upload" className="cursor-pointer">
            <span className="text-sm font-medium">Click to upload files</span>
            <span className="text-xs text-muted-foreground block mt-1">
              PDF, TXT, DOCX, MD (Max 10MB each)
            </span>
          </Label>
          <Input
            id="file-upload"
            type="file"
            multiple
            accept=".pdf,.txt,.docx,.md,.doc"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isProcessing}
          />
        </div>

        {documents.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Documents ({documents.length})</h4>
              <Button 
                onClick={processAllDocuments}
                disabled={isProcessing || documents.every(d => d.processed)}
                size="sm"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Process All'
                )}
              </Button>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <Progress value={processingProgress} className="w-full" />
                <p className="text-sm text-muted-foreground text-center">
                  Processing documents and creating knowledge chunks...
                </p>
              </div>
            )}

            <div className="space-y-2 max-h-60 overflow-auto">
              {documents.map(doc => {
                const IconComponent = getFileIcon(doc.type);
                return (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <IconComponent className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{doc.size}</span>
                          {doc.processed && (
                            <>
                              <Badge variant="outline" className="text-xs">
                                {doc.chunks} chunks
                              </Badge>
                              <Check className="h-3 w-3 text-green-500" />
                            </>
                          )}
                          {doc.error && (
                            <Badge variant="destructive" className="text-xs">
                              Error
                            </Badge>
                          )}
                        </div>
                        {doc.error && (
                          <p className="text-xs text-destructive mt-1">{doc.error}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(doc.id)}
                      disabled={isProcessing}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {documents.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No documents added yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};