import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Link, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCustomGPTs } from "@/hooks/useCustomGPTs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const CustomGPTBuild = () => {
  const { user } = useAuth();
  const { gpts } = useCustomGPTs();
  const { toast } = useToast();
  
  const [documents, setDocuments] = useState<Array<{ id: string; name: string; type: string; size: string; file: File }>>([]);
  const [urls, setUrls] = useState<Array<{ id: string; url: string; title?: string }>>([]);
  const [newUrl, setNewUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const currentGPT = gpts[0]; // Use the first/latest GPT

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const newDoc = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          size: (file.size / 1024 / 1024).toFixed(2) + " MB",
          file: file
        };
        setDocuments(prev => [...prev, newDoc]);
      });
      toast({
        title: "Files uploaded",
        description: `${files.length} file(s) added to knowledge base`,
      });
    }
  };

  const addUrl = () => {
    if (newUrl.trim()) {
      const newUrlEntry = {
        id: Math.random().toString(36).substr(2, 9),
        url: newUrl.trim(),
        title: new URL(newUrl).hostname
      };
      setUrls(prev => [...prev, newUrlEntry]);
      setNewUrl("");
      toast({
        title: "URL added",
        description: "Website will be crawled and added to knowledge base",
      });
    }
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const removeUrl = (id: string) => {
    setUrls(prev => prev.filter(url => url.id !== id));
  };

  const processKnowledgeBase = async () => {
    if (!currentGPT || !user) {
      toast({
        title: "Error",
        description: "Please create a Custom GPT first in the Personalize section.",
        variant: "destructive",
      });
      return;
    }

    if (documents.length === 0 && urls.length === 0) {
      toast({
        title: "No sources",
        description: "Please add documents or URLs before processing.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Process documents
      for (const doc of documents) {
        // Upload file to Supabase storage
        const fileName = `${currentGPT.id}/${doc.id}-${doc.file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('gpt-documents')
          .upload(fileName, doc.file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        // Get file content for processing
        let processedContent = '';
        if (doc.file.type === 'text/plain' || doc.file.name.endsWith('.md')) {
          processedContent = await doc.file.text();
        } else {
          // For other file types, store a placeholder
          processedContent = `Document: ${doc.file.name} (${doc.file.type})`;
        }

        // Save document record to database
        const { error: dbError } = await supabase
          .from('gpt_documents')
          .insert({
            gpt_id: currentGPT.id,
            user_id: user.id,
            file_name: doc.file.name,
            file_path: uploadData.path,
            file_size: doc.file.size,
            mime_type: doc.file.type,
            processed_content: processedContent
          });

        if (dbError) {
          console.error('Database error:', dbError);
        }
      }

      // Process URLs (basic implementation)
      for (const url of urls) {
        try {
          // Save URL reference to database
          const { error: dbError } = await supabase
            .from('gpt_documents')
            .insert({
              gpt_id: currentGPT.id,
              user_id: user.id,
              file_name: url.title || url.url,
              file_path: url.url,
              file_size: 0,
              mime_type: 'text/html',
              processed_content: `Website: ${url.url}`
            });

          if (dbError) {
            console.error('Database error:', dbError);
          }
        } catch (error) {
          console.error('URL processing error:', error);
        }
      }

      toast({
        title: "Knowledge base processed",
        description: `Successfully processed ${documents.length} document(s) and ${urls.length} URL(s).`,
      });

      // Clear the local arrays after successful processing
      setDocuments([]);
      setUrls([]);
      
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Processing failed",
        description: "There was an error processing your knowledge base. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Build Knowledge Base</h1>
        <p className="text-muted-foreground mt-2">
          Add documents and sources to train your Custom GPT
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Document Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents
            </CardTitle>
            <CardDescription>
              Upload PDFs, text files, and other documents
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
                accept=".pdf,.txt,.docx,.md"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {documents.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Uploaded Documents</h4>
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.size}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Website URLs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Website Sources
            </CardTitle>
            <CardDescription>
              Add websites to crawl and include in knowledge base
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addUrl()}
              />
              <Button onClick={addUrl} disabled={!newUrl.trim()}>
                Add
              </Button>
            </div>

            {urls.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Added URLs</h4>
                {urls.map(url => (
                  <div key={url.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{url.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{url.url}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUrl(url.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Processing Status</CardTitle>
          <CardDescription>
            Track the processing of your uploaded sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {documents.length + urls.length === 0 
                ? "No sources added yet" 
                : `${documents.length + urls.length} source(s) ready for processing`
              }
            </p>
            {documents.length + urls.length > 0 && (
              <Button 
                className="mt-4" 
                onClick={processKnowledgeBase}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Process Knowledge Base'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomGPTBuild;