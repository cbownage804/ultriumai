import { useState } from 'react';
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

const DEMO_SUMMARIES: TicketSummary[] = [
  {
    id: '1',
    ticketTitle: 'Email not syncing on Outlook - Multiple users affected',
    originalLength: 2847,
    summary: 'Multiple users at Acme Corp experiencing Outlook sync issues since 9 AM. Affects O365 mailboxes on Windows devices. Autodiscover appears misconfigured after recent DNS changes.',
    keyPoints: [
      'Issue started after DNS migration on 01/28',
      '15 users affected across 3 departments',
      'Mobile devices working normally',
      'Autodiscover DNS record pointing to old server'
    ],
    suggestedActions: [
      'Update Autodiscover CNAME record to point to outlook.office365.com',
      'Clear Outlook profile cache on affected machines',
      'Verify MX records are correctly configured'
    ],
    relatedArticles: [
      { title: 'Outlook Autodiscover Troubleshooting Guide', relevance: 95 },
      { title: 'O365 DNS Configuration Best Practices', relevance: 88 }
    ],
    generatedAt: '2 min ago',
    confidence: 94
  },
  {
    id: '2',
    ticketTitle: 'VPN connection drops intermittently',
    originalLength: 1523,
    summary: 'Remote worker experiencing VPN disconnections every 30-45 minutes. Using FortiClient on Windows 11. Issue correlates with ISP-provided router firmware update.',
    keyPoints: [
      'Disconnections occur at regular intervals',
      'No issues when connected via mobile hotspot',
      'Router firmware updated 3 days ago',
      'MTU size may be causing fragmentation'
    ],
    suggestedActions: [
      'Adjust VPN MTU settings to 1400',
      'Contact ISP about UDP port blocking',
      'Test with previous router firmware if available'
    ],
    relatedArticles: [
      { title: 'FortiClient VPN Stability Issues', relevance: 91 },
      { title: 'MTU Configuration for VPN Tunnels', relevance: 85 }
    ],
    generatedAt: '5 min ago',
    confidence: 87
  }
];

export function AITicketSummarizer() {
  const [summaries] = useState<TicketSummary[]>(DEMO_SUMMARIES);
  const [selectedSummary, setSelectedSummary] = useState<TicketSummary | null>(DEMO_SUMMARIES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ticketContent, setTicketContent] = useState('');

  const handleGenerateSummary = async () => {
    if (!ticketContent.trim()) {
      toast.error('Please paste ticket content first');
      return;
    }
    setIsGenerating(true);
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast.success('Summary generated successfully');
    setIsGenerating(false);
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
              className="min-h-[200px] bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
              value={ticketContent}
              onChange={(e) => setTicketContent(e.target.value)}
            />
            <Button
              onClick={handleGenerateSummary}
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

        {/* Recent Summaries */}
        <Card className="bg-black/80 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-purple-400 text-sm">Recent Summaries</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              <div className="space-y-3">
                {summaries.map((summary) => (
                  <div
                    key={summary.id}
                    onClick={() => setSelectedSummary(summary)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedSummary?.id === summary.id
                        ? 'bg-cyan-500/10 border-cyan-500/40'
                        : 'bg-slate-900/50 border-slate-700 hover:border-cyan-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-white font-medium line-clamp-1">
                        {summary.ticketTitle}
                      </p>
                      <Badge variant="outline" className="border-green-500/40 text-green-400 text-xs shrink-0">
                        {summary.confidence}%
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {summary.originalLength} chars → {summary.summary.length} chars • {summary.generatedAt}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Selected Summary Details */}
      {selectedSummary && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Summary */}
          <Card className="bg-black/80 border-cyan-500/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-cyan-400 text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Summary
              </CardTitle>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-slate-400 hover:text-cyan-400"
                onClick={() => copyToClipboard(selectedSummary.summary)}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300 leading-relaxed">
                {selectedSummary.summary}
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-xs text-slate-500 font-medium">Key Points:</p>
                {selectedSummary.keyPoints.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-slate-400">{point}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Suggested Actions */}
          <Card className="bg-black/80 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-amber-400 text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Suggested Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedSummary.suggestedActions.map((action, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
                >
                  <div className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-slate-300">{action}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Related KB Articles */}
          <Card className="bg-black/80 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-purple-400 text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Related Articles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedSummary.relatedArticles.map((article, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 cursor-pointer hover:bg-purple-500/20 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">{article.title}</span>
                    <Badge variant="outline" className="border-purple-500/40 text-purple-400 text-xs">
                      {article.relevance}% match
                    </Badge>
                  </div>
                </div>
              ))}
              <Button variant="ghost" className="w-full text-purple-400 hover:text-purple-300 hover:bg-purple-500/10">
                <RefreshCw className="h-4 w-4 mr-2" />
                Find More Articles
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
