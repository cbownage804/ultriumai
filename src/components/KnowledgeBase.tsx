import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  Upload, 
  FileText, 
  Globe, 
  Database, 
  Plus, 
  Search, 
  Trash2, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  HardDrive,
  BookOpen
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface KnowledgeSource {
  id: string;
  name: string;
  source_type: 'upload' | 'url' | 'website' | 'api' | 'database';
  source_url?: string;
  description?: string;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'syncing';
  auto_sync: boolean;
  sync_frequency: 'manual' | 'hourly' | 'daily' | 'weekly';
  file_count: number;
  total_size_bytes: number;
  last_synced_at?: string;
  next_sync_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

interface KnowledgeDocument {
  id: string;
  source_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  chunk_count: number;
  word_count?: number;
  uploaded_at: string;
  processed_at?: string;
}

const KnowledgeBase = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<KnowledgeSource | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [newSource, setNewSource] = useState({
    name: "",
    source_type: "upload" as const,
    source_url: "",
    description: "",
    auto_sync: false,
    sync_frequency: "manual" as const
  });

  useEffect(() => {
    if (user) {
      loadKnowledgeSources();
    }
  }, [user]);

  const loadKnowledgeSources = async () => {
    try {
      // Mock data for now until database types are updated
      const mockSources: KnowledgeSource[] = [
        {
          id: '1',
          name: 'Company Documentation',
          source_type: 'upload',
          description: 'Internal company policies and procedures',
          status: 'completed',
          auto_sync: false,
          sync_frequency: 'manual',
          file_count: 15,
          total_size_bytes: 2500000,
          last_synced_at: new Date().toISOString(),
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Product Website',
          source_type: 'website',
          source_url: 'https://example.com',
          description: 'Automatically crawled product documentation',
          status: 'processing',
          auto_sync: true,
          sync_frequency: 'daily',
          file_count: 25,
          total_size_bytes: 5200000,
          next_sync_at: new Date(Date.now() + 86400000).toISOString(),
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'API Documentation',
          source_type: 'url',
          source_url: 'https://api.example.com/docs',
          description: 'Technical API reference',
          status: 'error',
          auto_sync: false,
          sync_frequency: 'weekly',
          file_count: 0,
          total_size_bytes: 0,
          error_message: 'Unable to access URL - authentication required',
          created_at: new Date(Date.now() - 259200000).toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      setSources(mockSources);
      
      // Load documents for the first source
      if (mockSources.length > 0) {
        loadDocuments(mockSources[0].id);
      }
    } catch (error) {
      console.error('Error loading knowledge sources:', error);
      toast({
        title: "Error",
        description: "Failed to load knowledge sources",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (sourceId: string) => {
    try {
      // Mock documents data
      const mockDocuments: KnowledgeDocument[] = [
        {
          id: '1',
          source_id: sourceId,
          file_name: 'employee-handbook.pdf',
          file_size: 1250000,
          mime_type: 'application/pdf',
          status: 'completed',
          chunk_count: 45,
          word_count: 12500,
          uploaded_at: new Date(Date.now() - 86400000).toISOString(),
          processed_at: new Date(Date.now() - 86000000).toISOString()
        },
        {
          id: '2',
          source_id: sourceId,
          file_name: 'security-policies.docx',
          file_size: 850000,
          mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          status: 'processing',
          chunk_count: 0,
          uploaded_at: new Date(Date.now() - 3600000).toISOString()
        }
      ];
      
      setDocuments(mockDocuments);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const createKnowledgeSource = async () => {
    if (!newSource.name.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a source name",
        variant: "destructive",
      });
      return;
    }

    try {
      const mockNewSource: KnowledgeSource = {
        id: Date.now().toString(),
        ...newSource,
        status: 'pending',
        file_count: 0,
        total_size_bytes: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setSources(prev => [mockNewSource, ...prev]);
      setNewSource({
        name: "",
        source_type: "upload",
        source_url: "",
        description: "",
        auto_sync: false,
        sync_frequency: "manual"
      });
      setShowCreateForm(false);
      
      toast({
        title: "Knowledge Source Created",
        description: "Your knowledge source has been created successfully",
      });
    } catch (error) {
      console.error('Error creating knowledge source:', error);
      toast({
        title: "Error",
        description: "Failed to create knowledge source",
        variant: "destructive",
      });
    }
  };

  const syncKnowledgeSource = async (sourceId: string) => {
    try {
      setSources(prev => 
        prev.map(source => 
          source.id === sourceId 
            ? { ...source, status: 'syncing' as const }
            : source
        )
      );

      // Mock sync process
      setTimeout(() => {
        setSources(prev => 
          prev.map(source => 
            source.id === sourceId 
              ? { 
                  ...source, 
                  status: 'completed' as const,
                  last_synced_at: new Date().toISOString(),
                  next_sync_at: source.auto_sync 
                    ? new Date(Date.now() + 86400000).toISOString() 
                    : undefined
                }
              : source
          )
        );

        toast({
          title: "Sync Complete",
          description: "Knowledge source has been synchronized",
        });
      }, 3000);
    } catch (error) {
      console.error('Error syncing knowledge source:', error);
      toast({
        title: "Error",
        description: "Failed to sync knowledge source",
        variant: "destructive",
      });
    }
  };

  const deleteKnowledgeSource = async (sourceId: string) => {
    try {
      setSources(prev => prev.filter(source => source.id !== sourceId));
      toast({
        title: "Source Deleted",
        description: "Knowledge source has been deleted",
      });
    } catch (error) {
      console.error('Error deleting knowledge source:', error);
      toast({
        title: "Error",
        description: "Failed to delete knowledge source",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
      case 'syncing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getSourceTypeIcon = (type: string) => {
    switch (type) {
      case 'upload':
        return <Upload className="w-4 h-4" />;
      case 'website':
        return <Globe className="w-4 h-4" />;
      case 'url':
        return <FileText className="w-4 h-4" />;
      case 'api':
      case 'database':
        return <Database className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredSources = sources.filter(source => 
    source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    source.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading knowledge base...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Knowledge Base</h1>
            <p className="text-muted-foreground mt-1">
              Manage documents and data sources for your GPTs
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="btn-gradient">
          <Plus className="w-4 h-4 mr-2" />
          Add Source
        </Button>
      </div>

      <Tabs defaultValue="sources" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-fit grid-cols-3">
            <TabsTrigger value="sources">Knowledge Sources</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="search">Search & Analytics</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search knowledge sources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>

        <TabsContent value="sources" className="space-y-6">
          {/* Create Source Form */}
          {showCreateForm && (
            <Card className="card-glow">
              <CardHeader>
                <CardTitle>Add Knowledge Source</CardTitle>
                <CardDescription>
                  Connect a new data source to enhance your GPT's knowledge
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sourceName">Source Name</Label>
                    <Input
                      id="sourceName"
                      placeholder="e.g., Company Documentation"
                      value={newSource.name}
                      onChange={(e) => setNewSource({...newSource, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sourceType">Source Type</Label>
                    <Select
                      value={newSource.source_type}
                      onValueChange={(value: any) => setNewSource({...newSource, source_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upload">File Upload</SelectItem>
                        <SelectItem value="website">Website Crawl</SelectItem>
                        <SelectItem value="url">Single URL</SelectItem>
                        <SelectItem value="api">API Endpoint</SelectItem>
                        <SelectItem value="database">Database</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(['website', 'url', 'api'].includes(newSource.source_type)) && (
                  <div>
                    <Label htmlFor="sourceUrl">Source URL</Label>
                    <Input
                      id="sourceUrl"
                      placeholder="https://example.com"
                      value={newSource.source_url}
                      onChange={(e) => setNewSource({...newSource, source_url: e.target.value})}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this knowledge source contains..."
                    value={newSource.description}
                    onChange={(e) => setNewSource({...newSource, description: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoSync"
                      checked={newSource.auto_sync}
                      onCheckedChange={(checked) => setNewSource({...newSource, auto_sync: checked})}
                    />
                    <Label htmlFor="autoSync">Enable auto-sync</Label>
                  </div>
                  
                  {newSource.auto_sync && (
                    <Select
                      value={newSource.sync_frequency}
                      onValueChange={(value: any) => setNewSource({...newSource, sync_frequency: value})}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button onClick={createKnowledgeSource} className="btn-gradient">
                    Create Source
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sources List */}
          <div className="grid gap-4">
            {filteredSources.map((source) => (
              <Card key={source.id} className="card-elevated hover-scale">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        {getSourceTypeIcon(source.source_type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{source.name}</CardTitle>
                          {getStatusIcon(source.status)}
                          <Badge 
                            variant={source.status === 'completed' ? 'default' : 
                                   source.status === 'error' ? 'destructive' : 'secondary'}
                          >
                            {source.status}
                          </Badge>
                          {source.auto_sync && (
                            <Badge variant="outline">Auto-sync {source.sync_frequency}</Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1">
                          {source.description || `${source.source_type} source`}
                          {source.source_url && ` • ${source.source_url}`}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => syncKnowledgeSource(source.id)}
                        disabled={source.status === 'processing' || source.status === 'syncing'}
                      >
                        <RefreshCw className={`w-4 h-4 mr-1 ${source.status === 'syncing' ? 'animate-spin' : ''}`} />
                        Sync
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSource(source)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteKnowledgeSource(source.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>{source.file_count}</strong> files
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>{formatFileSize(source.total_size_bytes)}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {source.last_synced_at 
                          ? `Synced ${new Date(source.last_synced_at).toLocaleDateString()}`
                          : 'Never synced'
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {source.next_sync_at 
                          ? `Next: ${new Date(source.next_sync_at).toLocaleDateString()}`
                          : 'Manual sync'
                        }
                      </span>
                    </div>
                  </div>
                  
                  {source.error_message && (
                    <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-destructive" />
                        <span className="text-sm text-destructive font-medium">Error</span>
                      </div>
                      <p className="text-sm text-destructive mt-1">{source.error_message}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {filteredSources.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Knowledge Sources</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your first knowledge source to start building your GPT's knowledge base
                  </p>
                  <Button onClick={() => setShowCreateForm(true)} className="btn-gradient">
                    Add Knowledge Source
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                View and manage individual documents within your knowledge sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{doc.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(doc.file_size)} • {doc.chunk_count} chunks
                          {doc.word_count && ` • ${doc.word_count.toLocaleString()} words`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(doc.status)}
                      <Badge variant={doc.status === 'completed' ? 'default' : 'secondary'}>
                        {doc.status}
                      </Badge>
                    </div>
                  </div>
                ))}

                {documents.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No documents found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Search & Analytics</CardTitle>
              <CardDescription>
                Search across your knowledge base and view usage analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search across all your knowledge sources..."
                    className="pl-10"
                  />
                </div>
                
                <div className="text-center py-8">
                  <Search className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Enter a search query to find relevant content</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KnowledgeBase;