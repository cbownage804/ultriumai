import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Upload, 
  FileText, 
  Globe, 
  Trash2, 
  Plus,
  Link,
  File,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface GPTKnowledgeBaseProps {
  gptId: string;
  gptName: string;
  themeColor: string;
}

interface KnowledgeItem {
  id: string;
  type: 'file' | 'url' | 'text';
  name: string;
  status: 'processing' | 'ready' | 'error';
  size?: string;
  createdAt: string;
}

export function GPTKnowledgeBase({ gptId, gptName, themeColor }: GPTKnowledgeBaseProps) {
  const { toast } = useToast();
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isAddingUrl, setIsAddingUrl] = useState(false);

  // Load knowledge sources from database
  useEffect(() => {
    const loadKnowledgeSources = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('knowledge_sources')
          .select('id, name, source_type, status, total_size_bytes, created_at')
          .eq('gpt_id', gptId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const items: KnowledgeItem[] = (data || []).map(source => ({
          id: source.id,
          type: source.source_type === 'url' || source.source_type === 'website' ? 'url' : 'file',
          name: source.name,
          status: source.status === 'completed' ? 'ready' : source.status === 'error' ? 'error' : 'processing',
          size: source.total_size_bytes ? `${(source.total_size_bytes / 1024 / 1024).toFixed(2)} MB` : undefined,
          createdAt: source.created_at
        }));

        setKnowledgeItems(items);
      } catch (error) {
        console.error('Error loading knowledge sources:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (gptId) {
      loadKnowledgeSources();
    }
  }, [gptId]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    
    // Simulate file processing
    const newItems: KnowledgeItem[] = Array.from(files).map((file, index) => ({
      id: `new-${Date.now()}-${index}`,
      type: 'file' as const,
      name: file.name,
      status: 'processing' as const,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      createdAt: new Date().toISOString()
    }));

    setKnowledgeItems(prev => [...newItems, ...prev]);

    // Simulate processing delay
    setTimeout(() => {
      setKnowledgeItems(prev => 
        prev.map(item => 
          newItems.find(n => n.id === item.id) 
            ? { ...item, status: 'ready' as const }
            : item
        )
      );
      setIsLoading(false);
      toast({
        title: "Files uploaded",
        description: `${files.length} file(s) added to knowledge base`
      });
    }, 2000);
  };

  const handleAddUrl = async () => {
    if (!urlInput.trim()) return;

    setIsAddingUrl(true);
    
    const newItem: KnowledgeItem = {
      id: `url-${Date.now()}`,
      type: 'url',
      name: urlInput,
      status: 'processing',
      createdAt: new Date().toISOString()
    };

    setKnowledgeItems(prev => [newItem, ...prev]);
    setUrlInput("");

    // Simulate processing
    setTimeout(() => {
      setKnowledgeItems(prev =>
        prev.map(item =>
          item.id === newItem.id ? { ...item, status: 'ready' as const } : item
        )
      );
      setIsAddingUrl(false);
      toast({
        title: "URL added",
        description: "Website content has been indexed"
      });
    }, 2000);
  };

  const handleDelete = (id: string) => {
    setKnowledgeItems(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Item removed",
      description: "Knowledge item has been deleted"
    });
  };

  const getStatusBadge = (status: KnowledgeItem['status']) => {
    switch (status) {
      case 'processing':
        return <Badge variant="outline" className="text-yellow-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      case 'ready':
        return <Badge variant="outline" className="text-green-500"><CheckCircle className="h-3 w-3 mr-1" />Ready</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>;
    }
  };

  const getTypeIcon = (type: KnowledgeItem['type']) => {
    switch (type) {
      case 'file':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'url':
        return <Globe className="h-5 w-5 text-green-500" />;
      case 'text':
        return <File className="h-5 w-5 text-purple-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Add Knowledge Sources
          </CardTitle>
          <CardDescription>
            Upload files or add URLs to enhance your GPT's knowledge
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
            <input
              type="file"
              id="file-upload"
              multiple
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.md,.csv"
              onChange={handleFileUpload}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">Click to upload files</p>
              <p className="text-xs text-muted-foreground">
                PDF, DOC, TXT, MD, CSV up to 10MB each
              </p>
            </label>
          </div>

          {/* URL Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="https://example.com/docs"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
              />
            </div>
            <Button onClick={handleAddUrl} disabled={!urlInput.trim() || isAddingUrl}>
              {isAddingUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Knowledge Items List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Knowledge Sources
          </CardTitle>
          <CardDescription>
            {knowledgeItems.length} source{knowledgeItems.length !== 1 ? 's' : ''} indexed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {knowledgeItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No knowledge sources added yet</p>
              <p className="text-sm">Upload files or add URLs above</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {knowledgeItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getTypeIcon(item.type)}
                      <div>
                        <p className="font-medium text-sm truncate max-w-[300px]">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.size || 'Website'} • Added {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(item.status)}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Storage Info */}
      {knowledgeItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Storage Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(() => {
                const totalBytes = knowledgeItems.reduce((sum, item) => {
                  const sizeMatch = item.size?.match(/^([\d.]+)\s*MB$/i);
                  return sum + (sizeMatch ? parseFloat(sizeMatch[1]) * 1024 * 1024 : 0);
                }, 0);
                const usedMB = (totalBytes / 1024 / 1024).toFixed(1);
                const limitMB = 50;
                const remaining = (limitMB - parseFloat(usedMB)).toFixed(1);
                const percentage = (parseFloat(usedMB) / limitMB) * 100;

                return (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Used: {usedMB} MB</span>
                      <span>Limit: {limitMB} MB</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {remaining} MB remaining
                    </p>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
