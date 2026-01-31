/**
 * KB Suggestions Panel - AI-powered knowledge base suggestions for tickets
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, 
  BookOpen, 
  ThumbsUp, 
  ThumbsDown, 
  ExternalLink,
  Sparkles,
  RefreshCw,
  CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface KBSuggestion {
  id: string;
  title: string;
  excerpt: string;
  confidence: number;
  category: string;
  wasUsed?: boolean;
}

interface KBSuggestionsPanelProps {
  ticketId: string;
  ticketSubject?: string;
  ticketDescription?: string;
}

export const KBSuggestionsPanel = ({ ticketId, ticketSubject, ticketDescription }: KBSuggestionsPanelProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<KBSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    generateSuggestions();
  }, [ticketId, ticketSubject]);

  const generateSuggestions = async () => {
    setGenerating(true);
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock KB suggestions based on ticket content
    const mockSuggestions: KBSuggestion[] = [
      {
        id: '1',
        title: 'Password Reset Procedures',
        excerpt: 'Step-by-step guide for resetting user passwords across different systems including Active Directory, O365, and local accounts.',
        confidence: 94,
        category: 'Authentication'
      },
      {
        id: '2',
        title: 'VPN Connection Troubleshooting',
        excerpt: 'Common issues and solutions for VPN connectivity problems including certificate errors and network configuration.',
        confidence: 87,
        category: 'Network'
      },
      {
        id: '3',
        title: 'Outlook Email Configuration',
        excerpt: 'How to configure Outlook for Exchange Online and troubleshoot common sync issues.',
        confidence: 72,
        category: 'Email'
      }
    ];

    setSuggestions(mockSuggestions);
    setLoading(false);
    setGenerating(false);
  };

  const handleUseSuggestion = async (suggestion: KBSuggestion) => {
    if (!user?.id) return;

    await (supabase as any)
      .from('vanguard_kb_suggestions')
      .insert({
        user_id: user.id,
        ticket_id: ticketId,
        suggestion_text: suggestion.title,
        confidence_score: suggestion.confidence,
        was_used: true
      });

    setSuggestions(prev => 
      prev.map(s => s.id === suggestion.id ? { ...s, wasUsed: true } : s)
    );

    toast({
      title: "Article Applied",
      description: "KB article solution applied to ticket."
    });
  };

  const handleFeedback = async (suggestion: KBSuggestion, helpful: boolean) => {
    if (!user?.id) return;

    await (supabase as any)
      .from('vanguard_kb_suggestions')
      .insert({
        user_id: user.id,
        ticket_id: ticketId,
        suggestion_text: suggestion.title,
        confidence_score: suggestion.confidence,
        was_helpful: helpful
      });

    toast({
      title: "Feedback Recorded",
      description: "Thank you for improving AI suggestions."
    });
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (score >= 75) return 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30';
    if (score >= 60) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-white/60 bg-white/10 border-white/20';
  };

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Brain className="h-5 w-5 text-cyan-400" />
            KB Suggestions
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateSuggestions}
            disabled={generating}
          >
            <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-white/60">
                <Sparkles className="h-5 w-5 mr-2 animate-pulse" />
                Analyzing ticket...
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-8 text-white/60">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No relevant articles found</p>
              </div>
            ) : (
              suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={`p-3 rounded-lg border ${
                    suggestion.wasUsed 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                      <span className="text-white font-medium text-sm">{suggestion.title}</span>
                    </div>
                    <Badge className={getConfidenceColor(suggestion.confidence)}>
                      {suggestion.confidence}%
                    </Badge>
                  </div>
                  <p className="text-sm text-white/60 mb-3 line-clamp-2">{suggestion.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-white/20 text-white/60 text-xs">
                      {suggestion.category}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {suggestion.wasUsed ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Applied
                        </Badge>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleUseSuggestion(suggestion)}
                          >
                            Use Solution
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-white/40 hover:text-green-400"
                            onClick={() => handleFeedback(suggestion, true)}
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-white/40 hover:text-red-400"
                            onClick={() => handleFeedback(suggestion, false)}
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default KBSuggestionsPanel;
