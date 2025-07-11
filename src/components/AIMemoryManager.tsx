import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Search, Trash2, ExternalLink, Calendar, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface KnowledgeDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_url: string;
  processed_content: string;
  word_count: number;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export const AIMemoryManager = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalWords: 0,
    topTopics: [] as string[]
  });

  useEffect(() => {
    if (user) {
      loadKnowledge();
    }
  }, [user]);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchTerm]);

  const loadKnowledge = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('knowledge_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDocuments(data || []);
      
      // Calculate stats
      const totalWords = (data || []).reduce((sum, doc) => sum + (Number(doc.word_count) || 0), 0);
      const allTopics = (data || []).flatMap(doc => {
        try {
          const metadata = typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata;
          return metadata?.topics || [];
        } catch {
          return [];
        }
      });
      const topicCounts = allTopics.reduce((acc, topic) => {
        acc[topic] = (acc[topic] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topTopics = Object.entries(topicCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([topic]) => topic);

      setStats({
        totalDocuments: data?.length || 0,
        totalWords,
        topTopics
      });

    } catch (error) {
      console.error('Error loading knowledge:', error);
      toast({
        title: "Error",
        description: "Failed to load AI memory",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterDocuments = () => {
    if (!searchTerm.trim()) {
      setFilteredDocuments(documents);
      return;
    }

    const filtered = documents.filter(doc =>
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.file_url || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.processed_content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.metadata?.topics || []).some((topic: string) => topic.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    setFilteredDocuments(filtered);
  };

  const deleteDocument = async (docId: string) => {
    try {
      const { error } = await supabase
        .from('knowledge_documents')
        .delete()
        .eq('id', docId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setDocuments(prev => prev.filter(doc => doc.id !== docId));
      
      toast({
        title: "Success",
        description: "Knowledge document deleted",
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const clearAllMemory = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('knowledge_documents')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setDocuments([]);
      setStats({ totalDocuments: 0, totalWords: 0, topTopics: [] });
      
      toast({
        title: "Success",
        description: "All AI memory cleared",
      });
    } catch (error) {
      console.error('Error clearing memory:', error);
      toast({
        title: "Error",
        description: "Failed to clear memory",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Documents</p>
                <p className="text-2xl font-bold">{stats.totalDocuments.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Total Words</p>
                <p className="text-2xl font-bold">{stats.totalWords.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Top Topics</p>
                <p className="text-sm text-muted-foreground">
                  {stats.topTopics.slice(0, 3).join(', ') || 'None yet'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Memory Manager */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Memory Manager
              </CardTitle>
              <CardDescription>
                Manage your AI assistant's learned knowledge from web browsing
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={loadKnowledge}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Refresh
              </Button>
              <Button
                variant="destructive"
                onClick={clearAllMemory}
                disabled={documents.length === 0}
              >
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search knowledge documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Top Topics */}
          {stats.topTopics.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Learned Topics:</p>
              <div className="flex flex-wrap gap-1">
                {stats.topTopics.map(topic => (
                  <Badge 
                    key={topic} 
                    variant="secondary" 
                    className="text-xs cursor-pointer"
                    onClick={() => setSearchTerm(topic)}
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Documents List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading memory...</p>
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {documents.length === 0 ? (
                    <>
                      <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No knowledge learned yet</p>
                      <p className="text-sm mt-2">
                        Use /browse or /learn commands in chat to add knowledge
                      </p>
                    </>
                  ) : (
                    <p>No documents match your search</p>
                  )}
                </div>
              ) : (
                filteredDocuments.map((doc) => {
                  const getTitle = () => {
                    try {
                      const metadata = typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata;
                      return metadata?.title || doc.file_name || 'Untitled Document';
                    } catch {
                      return doc.file_name || 'Untitled Document';
                    }
                  };

                  const getTopics = () => {
                    try {
                      const metadata = typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata;
                      return metadata?.topics || [];
                    } catch {
                      return [];
                    }
                  };

                  const getSummary = () => {
                    try {
                      const metadata = typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata;
                      return metadata?.summary || (doc.processed_content?.slice(0, 200) + '...' || 'No content available');
                    } catch {
                      return doc.processed_content?.slice(0, 200) + '...' || 'No content available';
                    }
                  };

                  const getUrl = () => {
                    try {
                      const metadata = typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata;
                      return metadata?.url || doc.file_url || '#';
                    } catch {
                      return doc.file_url || '#';
                    }
                  };

                  const topics = getTopics();
                  const url = getUrl();

                  return (
                    <Card key={doc.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">{getTitle()}</h4>
                            <Badge variant="outline" className="text-xs">
                              {(Number(doc.word_count) || 0).toLocaleString()} words
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <ExternalLink className="h-3 w-3" />
                            <a 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:underline truncate"
                            >
                              {url !== '#' ? new URL(url).hostname : 'Local file'}
                            </a>
                            <span>•</span>
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(doc.created_at)}</span>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {getSummary()}
                          </p>
                          
                          {topics.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {topics.slice(0, 5).map((topic: string) => (
                                <Badge 
                                  key={topic} 
                                  variant="outline" 
                                  className="text-xs"
                                >
                                  {topic}
                                </Badge>
                              ))}
                              {topics.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{topics.length - 5} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDocument(doc.id)}
                          className="flex-shrink-0 ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};