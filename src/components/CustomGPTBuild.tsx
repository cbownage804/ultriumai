import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Brain, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCustomGPTs } from "@/hooks/useCustomGPTs";
import { useAuth } from "@/hooks/useAuth";
import { WebCrawler } from "@/components/knowledge/WebCrawler";
import { DocumentProcessor } from "@/components/knowledge/DocumentProcessor";


const CustomGPTBuild = () => {
  const { user } = useAuth();
  const { gpts } = useCustomGPTs();
  const { toast } = useToast();
  
  const [selectedGPTId, setSelectedGPTId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStats, setProcessingStats] = useState({
    documents: 0,
    webPages: 0,
    totalChunks: 0
  });
  
  const selectedGPT = gpts.find(gpt => gpt.id === selectedGPTId);

  // Auto-select first GPT if none selected and GPTs are available
  useEffect(() => {
    if (!selectedGPTId && gpts.length > 0) {
      setSelectedGPTId(gpts[0].id);
    }
  }, [gpts, selectedGPTId]);

  const handleDocumentsProcessed = (documents: any[]) => {
    const totalChunks = documents.reduce((sum, doc) => sum + (doc.chunks || 0), 0);
    setProcessingStats(prev => ({
      ...prev,
      documents: documents.length,
      totalChunks: prev.totalChunks + totalChunks
    }));
    
    toast({
      title: "Documents processed",
      description: `${documents.length} document(s) processed into ${totalChunks} knowledge chunks`,
    });
  };

  const handleCrawlComplete = (results: any[]) => {
    setProcessingStats(prev => ({
      ...prev,
      webPages: results.length,
      totalChunks: prev.totalChunks + results.length
    }));
    
    toast({
      title: "Website crawled",
      description: `${results.length} page(s) crawled and processed`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Brain className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Build Knowledge Base</h1>
          <p className="text-muted-foreground mt-1">
            Add documents and crawl websites to train your Custom GPT with specialized knowledge
          </p>
        </div>
      </div>

      {/* GPT Selection */}
      {gpts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Custom GPT</CardTitle>
            <CardDescription>
              Choose which GPT to add knowledge base to
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="gpt-select">Custom GPT</Label>
              <Select value={selectedGPTId} onValueChange={setSelectedGPTId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a Custom GPT" />
                </SelectTrigger>
                <SelectContent>
                  {gpts.map((gpt) => (
                    <SelectItem key={gpt.id} value={gpt.id}>
                      {gpt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {gpts.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium mb-2">No Custom GPTs found</h3>
            <p className="text-muted-foreground mb-4">
              Create a Custom GPT first before adding documents to it.
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/dashboard/custom-gpts/personalize'}>
              Go to Personalize Section
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedGPT && (
        <>
          {/* Processing Stats */}
          {(processingStats.documents > 0 || processingStats.webPages > 0) && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Knowledge Base Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{processingStats.documents}</div>
                    <div className="text-sm text-muted-foreground">Documents</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{processingStats.webPages}</div>
                    <div className="text-sm text-muted-foreground">Web Pages</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{processingStats.totalChunks}</div>
                    <div className="text-sm text-muted-foreground">Total Chunks</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Knowledge Sources */}
          <div className="grid gap-6 lg:grid-cols-2">
            <DocumentProcessor 
              gptId={selectedGPT.id}
              onDocumentsProcessed={handleDocumentsProcessed}
            />
            <WebCrawler 
              gptId={selectedGPT.id}
              onCrawlComplete={handleCrawlComplete}
            />
          </div>
        </>
      )}

    </div>
  );
};

export default CustomGPTBuild;