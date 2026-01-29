import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, Sparkles, ArrowRight, CheckCircle2, 
  Lightbulb, BookOpen, RefreshCw, Copy, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TicketSummary {
  id: string;
  ticketTitle: string;
  originalLength: number;
  summary: string;
  keyPoints: string[];
  suggestedActions: string[];
  relatedArticles: { title: string; relevance: number }[];
  generatedAt: string;
  confidence: number;
}

interface RecentTicket {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

export function AITicketSummarizer() {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<TicketSummary[]>([]);
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<TicketSummary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ticketContent, setTicketContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRecentTickets();
    }
  }, [user]);

  const fetchRecentTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('id, title, description, status, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async (ticketId?: string, content?: string) => {
    const textToAnalyze = content || ticketContent;
    if (!textToAnalyze.trim()) {
      toast.error('Please paste ticket content or select a ticket');
      return;
    }
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('vanguard-ai-ticket-processor', {
        body: {
          action: 'process_ticket',
          ticketId: ticketId || 'manual',
          ticketData: {
            title: 'Manual Analysis',
            description: textToAnalyze,
            category: 'General',
            priority: 'medium'
          }
        }
      });

      if (error) throw error;

      const newSummary: TicketSummary = {
        id: Date.now().toString(),
        ticketTitle: ticketId ? recentTickets.find(t => t.id === ticketId)?.title || 'Analyzed Ticket' : 'Manual Analysis',
        originalLength: textToAnalyze.length,
        summary: data.solution || data.analysis || 'Summary generated',
        keyPoints: data.keyPoints || extractKeyPoints(data.solution || data.analysis || ''),
        suggestedActions: data.suggestedActions || extractActions(data.solution || data.analysis || ''),
        relatedArticles: data.relatedArticles || [],
        generatedAt: 'Just now',
        confidence: data.confidence || 85
      };

      setSummaries(prev => [newSummary, ...prev]);
      setSelectedSummary(newSummary);
      toast.success('Summary generated successfully');
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate summary');
    } finally {
      setIsGenerating(false);
    }
  };

  const extractKeyPoints = (text: string): string[] => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 4).map(s => s.trim());
  };

  const extractActions = (text: string): string[] => {
    const actionWords = ['should', 'need to', 'recommend', 'suggest', 'must', 'consider'];
    const sentences = text.split(/[.!?]+/);
    return sentences
      .filter(s => actionWords.some(w => s.toLowerCase().includes(w)))
      .slice(0, 3)
      .map(s => s.trim());
  };

  const handleSelectTicket = (ticket: RecentTicket) => {
    setTicketContent(`Title: ${ticket.title}\n\nDescription: ${ticket.description}`);
    handleGenerateSummary(ticket.id, `Title: ${ticket.title}\n\nDescription: ${ticket.description}`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
            <FileText className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">AI Ticket Summarizer</h2>
            <p className="text-sm text-slate-400">Auto-generate summaries from ticket conversations</p>
          </div>
        </div>
        <Badge className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-white">
          <Sparkles className="h-3 w-3 mr-1" />
          AI Powered
        </Badge>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <Card className="bg-black/80 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-400 text-sm">Paste Ticket Content</CardTitle>
              <CardDescription className="text-slate-400">
                Paste the ticket thread or conversation to generate a summary
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste ticket content, emails, or chat transcripts here..."
                className="min-h-[150px] bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                value={ticketContent}
                onChange={(e) => setTicketContent(e.target.value)}
              />
              <Button
                onClick={() => handleGenerateSummary()}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Summary
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Tickets */}
          <Card className="bg-black/80 border-cyan-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-cyan-400 text-sm">Or Select Recent Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                  </div>
                ) : recentTickets.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">No recent tickets found</p>
                ) : (
                  <div className="space-y-2">
                    {recentTickets.map(ticket => (
                      <button
                        key={ticket.id}
                        onClick={() => handleSelectTicket(ticket)}
                        className="w-full p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-left transition-colors border border-slate-700 hover:border-cyan-500/30"
                      >
                        <p className="text-white text-sm font-medium truncate">{ticket.title}</p>
                        <p className="text-slate-500 text-xs truncate">{ticket.description?.slice(0, 80)}...</p>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Summary Output */}
        <Card className="bg-black/80 border-purple-500/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-purple-400 text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI Summary
              </CardTitle>
              {selectedSummary && (
                <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {selectedSummary.confidence}% confidence
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedSummary ? (
              <div className="text-center py-12">
                <Sparkles className="h-12 w-12 text-purple-400/30 mx-auto mb-4" />
                <p className="text-slate-500">Select a ticket or paste content to generate a summary</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {/* Summary */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white text-sm font-medium">Summary</h4>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs text-slate-400"
                        onClick={() => copyToClipboard(selectedSummary.summary)}
                      >
                        <Copy className="h-3 w-3 mr-1" />Copy
                      </Button>
                    </div>
                    <p className="text-slate-300 text-sm bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      {selectedSummary.summary}
                    </p>
                  </div>

                  {/* Key Points */}
                  {selectedSummary.keyPoints.length > 0 && (
                    <div>
                      <h4 className="text-white text-sm font-medium mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                        Key Points
                      </h4>
                      <ul className="space-y-1.5">
                        {selectedSummary.keyPoints.map((point, i) => (
                          <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                            <ArrowRight className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggested Actions */}
                  {selectedSummary.suggestedActions.length > 0 && (
                    <div>
                      <h4 className="text-white text-sm font-medium mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-400" />
                        Suggested Actions
                      </h4>
                      <ul className="space-y-1.5">
                        {selectedSummary.suggestedActions.map((action, i) => (
                          <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                            <span className="text-yellow-400 font-medium">{i + 1}.</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Related Articles */}
                  {selectedSummary.relatedArticles.length > 0 && (
                    <div>
                      <h4 className="text-white text-sm font-medium mb-2 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-400" />
                        Related KB Articles
                      </h4>
                      <div className="space-y-2">
                        {selectedSummary.relatedArticles.map((article, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-800/50 border border-slate-700">
                            <span className="text-cyan-400 text-sm">{article.title}</span>
                            <Badge variant="outline" className="text-xs">{article.relevance}%</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Previous Summaries */}
      {summaries.length > 1 && (
        <Card className="bg-black/80 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">Previous Summaries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {summaries.slice(1).map(summary => (
                <Button
                  key={summary.id}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300"
                  onClick={() => setSelectedSummary(summary)}
                >
                  {summary.ticketTitle.slice(0, 30)}...
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
