import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Sparkles, 
  BookOpen, 
  CheckCircle, 
  Loader2, 
  FileText,
  Plus,
  Wand2,
  Copy,
  Save
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface ResolvedTicket {
  id: string;
  title: string;
  description: string;
  category: string;
  ai_suggested_solution: string | null;
  ai_summary: string | null;
  resolved_at: string | null;
}

const KB_CATEGORIES = [
  'Security Incidents',
  'Network Issues',
  'Access Management',
  'Malware Remediation',
  'Compliance',
  'General IT',
  'Best Practices'
];

export function AIKBGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<ResolvedTicket | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState<{
    title: string;
    content: string;
    category: string;
    tags: string[];
  } | null>(null);
  const [editedArticle, setEditedArticle] = useState({
    title: '',
    content: '',
    category: '',
    tags: ''
  });

  // Fetch resolved tickets that haven't been converted to KB articles
  const { data: resolvedTickets, isLoading: loadingTickets } = useQuery({
    queryKey: ['resolved-tickets-for-kb', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('vanguard_service_tickets')
        .select('id, title, description, category, ai_suggested_solution, ai_summary, resolved_at')
        .eq('user_id', user.id)
        .eq('status', 'resolved')
        .not('ai_suggested_solution', 'is', null)
        .order('resolved_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as ResolvedTicket[];
    },
    enabled: !!user,
  });

  const generateKBArticle = async (ticket: ResolvedTicket) => {
    setIsGenerating(true);
    setSelectedTicket(ticket);
    
    try {
      const { data, error } = await supabase.functions.invoke('vanguard-ai-ticket-processor', {
        body: {
          action: 'generate_kb_article',
          ticketId: ticket.id,
          ticketData: ticket
        }
      });

      if (error) throw error;

      setGeneratedArticle(data.article);
      setEditedArticle({
        title: data.article.title,
        content: data.article.content,
        category: data.article.category,
        tags: data.article.tags.join(', ')
      });

      toast({
        title: "KB Article Generated",
        description: "Review and save the generated article.",
      });
    } catch (error: any) {
      console.error('Error generating KB article:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate KB article",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveArticleMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase.from('helpdesk_kb_articles').insert({
        title: editedArticle.title,
        content: editedArticle.content,
        category: editedArticle.category,
        tags: editedArticle.tags.split(',').map(t => t.trim()).filter(Boolean),
        is_published: true,
        author_id: user.id,
        ai_generated: true,
        source_ticket_id: selectedTicket?.id
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Article Saved",
        description: "KB article has been published successfully.",
      });
      setGeneratedArticle(null);
      setSelectedTicket(null);
      queryClient.invalidateQueries({ queryKey: ['resolved-tickets-for-kb'] });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save KB article",
        variant: "destructive",
      });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wand2 className="h-6 w-6 text-primary" />
            AI Knowledge Base Generator
          </h2>
          <p className="text-muted-foreground">
            Automatically generate KB articles from resolved tickets
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Resolved Tickets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resolved Tickets
            </CardTitle>
            <CardDescription>
              Select a resolved ticket to generate a KB article
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {loadingTickets ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : resolvedTickets?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No resolved tickets with AI solutions</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {resolvedTickets?.map((ticket) => (
                    <div
                      key={ticket.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedTicket?.id === ticket.id ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{ticket.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {ticket.ai_summary || ticket.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {ticket.category}
                            </Badge>
                            {ticket.resolved_at && (
                              <span className="text-xs text-muted-foreground">
                                Resolved {new Date(ticket.resolved_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            generateKBArticle(ticket);
                          }}
                          disabled={isGenerating}
                        >
                          {isGenerating && selectedTicket?.id === ticket.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Generated Article Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Generated Article
            </CardTitle>
            <CardDescription>
              Review and edit before publishing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedArticle ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={editedArticle.title}
                    onChange={(e) => setEditedArticle(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={editedArticle.category}
                    onValueChange={(value) => setEditedArticle(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KB_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tags (comma-separated)</Label>
                  <Input
                    value={editedArticle.tags}
                    onChange={(e) => setEditedArticle(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="troubleshooting, network, security"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    value={editedArticle.content}
                    onChange={(e) => setEditedArticle(prev => ({ ...prev, content: e.target.value }))}
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => saveArticleMutation.mutate()}
                    disabled={saveArticleMutation.isPending}
                    className="flex-1"
                  >
                    {saveArticleMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Publish Article
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(editedArticle.content);
                      toast({ title: "Copied", description: "Article content copied to clipboard" });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Select a ticket and click the sparkle icon to generate a KB article</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
