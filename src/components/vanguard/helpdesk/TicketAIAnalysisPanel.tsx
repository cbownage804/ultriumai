/**
 * AI-Powered Ticket Analysis Panel
 * Shows sentiment, auto-categorization, priority prediction, and suggested responses
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sparkles, Brain, TrendingUp, Clock, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronUp, Lightbulb, MessageSquare, Tag, Zap,
  ThumbsUp, ThumbsDown, Copy, RefreshCw, Target, Gauge, BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { useTicketAI, TicketAIAnalysis } from '@/hooks/useTicketAI';
import { useCannedResponses } from '@/hooks/useCannedResponses';

interface TicketAIAnalysisPanelProps {
  ticketId: string;
  ticketTitle: string;
  ticketDescription: string;
  onApplyCategory?: (category: string) => void;
  onApplyPriority?: (priority: string) => void;
  onInsertResponse?: (response: string) => void;
}

export function TicketAIAnalysisPanel({
  ticketId,
  ticketTitle,
  ticketDescription,
  onApplyCategory,
  onApplyPriority,
  onInsertResponse
}: TicketAIAnalysisPanelProps) {
  const { isAnalyzing, analysis, analyzeTicket, applySuggestion, getSentimentColor, getSentimentIcon } = useTicketAI();
  const { responses: cannedResponses } = useCannedResponses();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);

  useEffect(() => {
    if (ticketId && ticketTitle && ticketDescription) {
      analyzeTicket(ticketId, ticketTitle, ticketDescription);
    }
  }, [ticketId, ticketTitle, ticketDescription, analyzeTicket]);

  const handleRefreshAnalysis = () => {
    analyzeTicket(ticketId, ticketTitle, ticketDescription);
  };

  const handleApplyCategory = async () => {
    if (analysis?.suggested_category) {
      const success = await applySuggestion(ticketId, 'category', analysis.suggested_category);
      if (success && onApplyCategory) {
        onApplyCategory(analysis.suggested_category);
      }
    }
  };

  const handleApplyPriority = async () => {
    if (analysis?.suggested_priority) {
      const success = await applySuggestion(ticketId, 'priority', analysis.suggested_priority);
      if (success && onApplyPriority) {
        onApplyPriority(analysis.suggested_priority);
      }
    }
  };

  const handleCopyResponse = (response: string) => {
    navigator.clipboard.writeText(response);
    toast.success('Response copied to clipboard');
  };

  const handleInsertResponse = (response: string) => {
    if (onInsertResponse) {
      onInsertResponse(response);
      toast.success('Response inserted');
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-emerald-400';
    if (confidence >= 0.6) return 'text-amber-400';
    return 'text-red-400';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'low': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border-purple-500/30">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Brain className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  Cortex AI Analysis
                  {isAnalyzing && (
                    <RefreshCw className="h-4 w-4 animate-spin text-purple-400" />
                  )}
                </CardTitle>
                <p className="text-xs text-white/50">Powered by Vanguard Cortex</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshAnalysis}
                disabled={isAnalyzing}
                className="text-white/60 hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              </Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <div className="relative">
                  <div className="absolute inset-0 animate-ping">
                    <Sparkles className="h-8 w-8 text-purple-500/50" />
                  </div>
                  <Sparkles className="h-8 w-8 text-purple-400" />
                </div>
                <p className="text-white/60 text-sm">Analyzing ticket with AI...</p>
              </div>
            ) : analysis ? (
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Sentiment Analysis */}
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/70 text-sm flex items-center gap-2">
                        <Gauge className="h-4 w-4" />
                        Customer Sentiment
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getSentimentIcon(analysis.sentiment)}</span>
                        <span className={`capitalize font-medium ${getSentimentColor(analysis.sentiment)}`}>
                          {analysis.sentiment}
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={analysis.sentiment_score * 100} 
                      className="h-2"
                    />
                    {analysis.escalation_recommended && (
                      <div className="mt-2 flex items-center gap-2 text-amber-400 text-xs">
                        <AlertTriangle className="h-3 w-3" />
                        Escalation recommended based on sentiment
                      </div>
                    )}
                  </div>

                  {/* Category & Priority Suggestions */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Category */}
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="h-4 w-4 text-cyan-400" />
                        <span className="text-white/70 text-sm">Category</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                          {analysis.suggested_category}
                        </Badge>
                        <span className={`text-xs ${getConfidenceColor(analysis.category_confidence)}`}>
                          {Math.round(analysis.category_confidence * 100)}%
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleApplyCategory}
                        className="w-full mt-2 text-xs text-cyan-400 hover:bg-cyan-500/10"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Apply Category
                      </Button>
                    </div>

                    {/* Priority */}
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-orange-400" />
                        <span className="text-white/70 text-sm">Priority</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={getPriorityColor(analysis.suggested_priority)}>
                          {analysis.suggested_priority}
                        </Badge>
                        <span className={`text-xs ${getConfidenceColor(analysis.priority_confidence)}`}>
                          {Math.round(analysis.priority_confidence * 100)}%
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleApplyPriority}
                        className="w-full mt-2 text-xs text-orange-400 hover:bg-orange-500/10"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Apply Priority
                      </Button>
                    </div>
                  </div>

                  {/* Priority Factors */}
                  {analysis.priority_factors && (
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-amber-400" />
                        <span className="text-white/70 text-sm">Priority Factors</span>
                      </div>
                      <div className="space-y-2">
                        {analysis.priority_factors.urgency_keywords?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs text-white/50">Urgency:</span>
                            {analysis.priority_factors.urgency_keywords.map((keyword, i) => (
                              <Badge key={i} variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/20">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {analysis.priority_factors.impact_indicators?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs text-white/50">Impact:</span>
                            {analysis.priority_factors.impact_indicators.map((indicator, i) => (
                              <Badge key={i} variant="outline" className="text-xs bg-orange-500/10 text-orange-400 border-orange-500/20">
                                {indicator}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Resolution Time Estimate */}
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-emerald-400" />
                        <span className="text-white/70 text-sm">Estimated Resolution</span>
                      </div>
                      <span className="text-emerald-400 font-medium">
                        ~{analysis.estimated_resolution_hours}h
                      </span>
                    </div>
                  </div>

                  {/* Suggested Responses */}
                  <Collapsible open={showSuggestions} onOpenChange={setShowSuggestions}>
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-purple-400" />
                          <span className="text-white/70 text-sm">Suggested Responses</span>
                          <Badge variant="outline" className="text-xs">
                            {analysis.suggested_responses?.length || 0}
                          </Badge>
                        </div>
                        {showSuggestions ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <ScrollArea className="h-48 mt-2">
                        <div className="space-y-2 p-1">
                          {analysis.suggested_responses?.map((suggestion, index) => (
                            <div
                              key={index}
                              className="p-3 rounded-lg bg-slate-800/50 border border-white/5 hover:border-purple-500/30 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline" className={`text-xs ${
                                  suggestion.source === 'ai' ? 'bg-purple-500/20 text-purple-400' :
                                  suggestion.source === 'kb' ? 'bg-cyan-500/20 text-cyan-400' :
                                  'bg-slate-500/20 text-slate-400'
                                }`}>
                                  {suggestion.source === 'ai' ? '✨ AI Generated' :
                                   suggestion.source === 'kb' ? '📚 Knowledge Base' :
                                   '💬 Canned Response'}
                                </Badge>
                                <span className={`text-xs ${getConfidenceColor(suggestion.confidence)}`}>
                                  {Math.round(suggestion.confidence * 100)}% match
                                </span>
                              </div>
                              <p className="text-white/80 text-sm line-clamp-3 mb-2">
                                {suggestion.response}
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyResponse(suggestion.response)}
                                  className="flex-1 text-xs text-white/60 hover:text-white"
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleInsertResponse(suggestion.response)}
                                  className="flex-1 text-xs text-purple-400 hover:bg-purple-500/10"
                                >
                                  <Zap className="h-3 w-3 mr-1" />
                                  Insert
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* KB Article Suggestions */}
                  {analysis.suggested_kb_articles?.length > 0 && (
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-4 w-4 text-cyan-400" />
                        <span className="text-white/70 text-sm">Related KB Articles</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.suggested_kb_articles.map((articleId, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="text-xs bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20"
                          >
                            📄 {articleId}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feedback */}
                  <div className="flex items-center justify-center gap-4 pt-2 border-t border-white/10">
                    <span className="text-xs text-white/40">Was this analysis helpful?</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="text-white/40 hover:text-emerald-400">
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-white/40 hover:text-red-400">
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="text-center py-8 text-white/40">
                <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No analysis available</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshAnalysis}
                  className="mt-3"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze Ticket
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
