import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  GitBranch, TrendingUp, Lightbulb, BookOpen, AlertTriangle,
  CheckCircle2, Loader2, Sparkles, Wand2, Eye, Edit, Plus,
  RefreshCw, Zap, Brain, Target, Activity, ArrowRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DetectedPattern {
  id: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  ticketCount: number;
  affectedCategory: string;
  trend: 'increasing' | 'stable' | 'decreasing';
  recommendedAction: string;
  suggestedKBTitle?: string;
  autoKBGenerated: boolean;
}

interface GeneratedArticle {
  title: string;
  content: string;
  category: string;
  tags: string[];
}

const severityColors = {
  critical: 'text-red-400 bg-red-500/20 border-red-500/40',
  high: 'text-orange-400 bg-orange-500/20 border-orange-500/40',
  medium: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40',
  low: 'text-green-400 bg-green-500/20 border-green-500/40'
};

const trendIcons = {
  increasing: <TrendingUp className="h-4 w-4 text-red-400" />,
  stable: <Activity className="h-4 w-4 text-amber-400" />,
  decreasing: <TrendingUp className="h-4 w-4 text-green-400 rotate-180" />
};

export function PatternDetectionAutoKB() {
  const [patterns, setPatterns] = useState<DetectedPattern[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<DetectedPattern | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticle | null>(null);
  const [showArticleDialog, setShowArticleDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPatterns();
  }, []);

  const loadPatterns = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('vanguard_kb_patterns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPatterns((data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        severity: p.severity as 'critical' | 'high' | 'medium' | 'low',
        ticketCount: p.ticket_count || 0,
        affectedCategory: p.affected_category,
        trend: p.trend as 'increasing' | 'stable' | 'decreasing',
        recommendedAction: p.recommended_action || '',
        suggestedKBTitle: p.suggested_kb_title,
        autoKBGenerated: p.auto_kb_generated || false
      })));
    } catch (error) {
      console.error('Error loading patterns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateKBArticle = async (pattern: DetectedPattern) => {
    setIsGenerating(true);
    setSelectedPattern(pattern);

    try {
      // Call AI to generate KB article
      const { data, error } = await supabase.functions.invoke('helpdesk-ai-features', {
        body: {
          action: 'generate_kb_article',
          patternName: pattern.name,
          patternDescription: pattern.description,
          affectedCategory: pattern.affectedCategory,
          ticketCount: pattern.ticketCount
        }
      });

      if (error) throw error;

      const article: GeneratedArticle = {
        title: data?.title || pattern.suggestedKBTitle || `Guide: ${pattern.name}`,
        content: data?.content || generateDemoArticle(pattern),
        category: pattern.affectedCategory.split('/')[0],
        tags: [pattern.affectedCategory, pattern.severity, 'auto-generated']
      };

      setGeneratedArticle(article);
      setShowArticleDialog(true);
      
      // Mark pattern as having KB generated in database
      await supabase
        .from('vanguard_kb_patterns')
        .update({ auto_kb_generated: true })
        .eq('id', pattern.id);

      setPatterns(patterns.map(p => 
        p.id === pattern.id ? { ...p, autoKBGenerated: true } : p
      ));

    } catch (error) {
      console.error('Error generating KB:', error);
      // Use demo content on error
      setGeneratedArticle({
        title: pattern.suggestedKBTitle || `Guide: ${pattern.name}`,
        content: generateDemoArticle(pattern),
        category: pattern.affectedCategory.split('/')[0],
        tags: [pattern.affectedCategory, pattern.severity, 'auto-generated']
      });
      setShowArticleDialog(true);
      setPatterns(patterns.map(p => 
        p.id === pattern.id ? { ...p, autoKBGenerated: true } : p
      ));
    } finally {
      setIsGenerating(false);
    }
  };

  const generateDemoArticle = (pattern: DetectedPattern): string => {
    return `# ${pattern.suggestedKBTitle || pattern.name}

## Overview
This article addresses the issue: **${pattern.description}**

Based on analysis of ${pattern.ticketCount} related tickets, we've compiled the following troubleshooting guide.

## Symptoms
- Users experiencing issues related to ${pattern.affectedCategory}
- Reports indicate this is a ${pattern.trend} trend
- Severity level: ${pattern.severity}

## Resolution Steps

### Step 1: Initial Diagnosis
1. Verify the user's system configuration
2. Check for recent changes or updates
3. Review error logs for specific messages

### Step 2: Common Fixes
1. Restart the affected service or application
2. Clear cached data and temporary files
3. Verify network connectivity

### Step 3: Advanced Troubleshooting
If the above steps don't resolve the issue:
1. Collect diagnostic information
2. Escalate to the appropriate team
3. Reference ticket pattern: ${pattern.name}

## Related Resources
- Category: ${pattern.affectedCategory}
- Pattern ID: ${pattern.id}
- Auto-generated based on AI pattern detection

---
*This article was automatically generated by Vanguard Cortex AI*`;
  };

  const publishArticle = async () => {
    if (!generatedArticle) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase.from('client_portal_kb').insert({
        title: generatedArticle.title,
        content: generatedArticle.content,
        category: generatedArticle.category,
        tags: generatedArticle.tags,
        is_public: true,
        is_featured: false,
        created_by: user.id
      });

      toast.success('KB article published successfully!');
      setShowArticleDialog(false);
      setGeneratedArticle(null);
    } catch (error) {
      console.error('Error publishing:', error);
      toast.error('Failed to publish article');
    }
  };

  const refreshPatterns = async () => {
    setIsRefreshing(true);
    await loadPatterns();
    setIsRefreshing(false);
    toast.success('Patterns refreshed');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Active Patterns</p>
                <p className="text-2xl font-bold text-cyan-400">{patterns.length}</p>
              </div>
              <GitBranch className="h-8 w-8 text-cyan-400/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">KB Generated</p>
                <p className="text-2xl font-bold text-green-400">
                  {patterns.filter(p => p.autoKBGenerated).length}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-green-400/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Tickets Affected</p>
                <p className="text-2xl font-bold text-purple-400">
                  {patterns.reduce((sum, p) => sum + p.ticketCount, 0)}
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-400/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Critical Patterns</p>
                <p className="text-2xl font-bold text-red-400">
                  {patterns.filter(p => p.severity === 'critical' || p.severity === 'high').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pattern List */}
        <div className="lg:col-span-2">
          <Card className="bg-black/80 border-cyan-500/30">
            <CardHeader className="border-b border-purple-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-cyan-400 flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Detected Patterns
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    AI-identified trends from recent tickets
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-cyan-500/40 text-cyan-400"
                  onClick={refreshPatterns}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <ScrollArea className="h-[500px]">
              <div className="p-4 space-y-4">
                {patterns.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No patterns detected yet</p>
                    <p className="text-sm">Patterns will appear as ticket trends are analyzed</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {patterns.map((pattern, i) => (
                      <motion.div
                        key={pattern.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Card className="bg-slate-900/50 border-slate-700 hover:border-purple-500/50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                                  <GitBranch className="h-4 w-4 text-purple-400" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-white">{pattern.name}</h4>
                                  <p className="text-sm text-slate-400 mt-1">{pattern.description}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className={severityColors[pattern.severity]}>
                                {pattern.severity}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-4 mb-3 text-sm">
                              <div className="flex items-center gap-1">
                                {trendIcons[pattern.trend]}
                                <span className="text-slate-400">{pattern.trend}</span>
                              </div>
                              <span className="text-slate-500">•</span>
                              <span className="text-cyan-400">{pattern.ticketCount} tickets</span>
                              <span className="text-slate-500">•</span>
                              <span className="text-slate-400">{pattern.affectedCategory}</span>
                            </div>

                            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 mb-3">
                              <div className="flex items-start gap-2">
                                <Lightbulb className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                                <p className="text-sm text-slate-300">{pattern.recommendedAction}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {pattern.autoKBGenerated ? (
                                <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  KB Generated
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white"
                                  onClick={() => generateKBArticle(pattern)}
                                  disabled={isGenerating && selectedPattern?.id === pattern.id}
                                >
                                  {isGenerating && selectedPattern?.id === pattern.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : (
                                    <Wand2 className="h-4 w-4 mr-2" />
                                  )}
                                  Generate KB Article
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" className="text-slate-400">
                                <Eye className="h-4 w-4 mr-1" />
                                View Tickets
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Quick Actions & Stats */}
        <div className="space-y-4">
          <Card className="bg-black/80 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-purple-400 flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30">
                <Wand2 className="h-4 w-4 mr-2" />
                Auto-Generate All KB
              </Button>
              <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Send Pattern Alert
              </Button>
              <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300">
                <RefreshCw className="h-4 w-4 mr-2" />
                Run Deep Analysis
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-black/80 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-400 text-sm">Pattern Analysis Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs text-slate-500">Minimum Ticket Threshold</label>
                <Input type="number" defaultValue={5} className="mt-1 bg-black/60 border-slate-700" />
              </div>
              <div>
                <label className="text-xs text-slate-500">Analysis Timeframe</label>
                <Input type="text" defaultValue="7 days" className="mt-1 bg-black/60 border-slate-700" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Article Preview Dialog */}
      <Dialog open={showArticleDialog} onOpenChange={setShowArticleDialog}>
        <DialogContent className="max-w-3xl bg-black/95 border-cyan-500/30">
          <DialogHeader>
            <DialogTitle className="text-cyan-400 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generated KB Article
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Review and publish to Knowledge Base
            </DialogDescription>
          </DialogHeader>
          
          {generatedArticle && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">{generatedArticle.title}</h3>
                <div className="flex gap-2">
                  <Badge variant="outline" className="border-cyan-500/40 text-cyan-400">
                    {generatedArticle.category}
                  </Badge>
                  {generatedArticle.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="border-slate-600 text-slate-400">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <ScrollArea className="h-[300px] border border-slate-700 rounded-lg p-4">
                <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans">
                  {generatedArticle.content}
                </pre>
              </ScrollArea>
              
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowArticleDialog(false)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Draft
                </Button>
                <Button 
                  className="bg-gradient-to-r from-cyan-500 to-purple-600"
                  onClick={publishArticle}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Publish to KB
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}