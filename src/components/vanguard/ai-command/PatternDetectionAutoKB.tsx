import { useState } from 'react';
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

const DEMO_PATTERNS: DetectedPattern[] = [
  {
    id: '1',
    name: 'VPN Connection Timeout Surge',
    description: 'Significant increase in VPN timeout errors reported across multiple organizations',
    severity: 'high',
    ticketCount: 47,
    affectedCategory: 'Network/VPN',
    trend: 'increasing',
    recommendedAction: 'Generate KB article with troubleshooting steps and notify IT team',
    suggestedKBTitle: 'Troubleshooting VPN Connection Timeouts',
    autoKBGenerated: false
  },
  {
    id: '2',
    name: 'Office 365 Sync Issues',
    description: 'Multiple reports of OneDrive and SharePoint sync failures after recent update',
    severity: 'medium',
    ticketCount: 23,
    affectedCategory: 'Software/Microsoft',
    trend: 'stable',
    recommendedAction: 'Create KB article and link to Microsoft known issues',
    suggestedKBTitle: 'Resolving Office 365 Sync Problems',
    autoKBGenerated: false
  },
  {
    id: '3',
    name: 'Password Reset Confusion',
    description: 'Users reporting unclear instructions in self-service password reset',
    severity: 'low',
    ticketCount: 31,
    affectedCategory: 'Security/Password',
    trend: 'decreasing',
    recommendedAction: 'Update existing KB article with clearer step-by-step guide',
    suggestedKBTitle: 'Self-Service Password Reset Guide',
    autoKBGenerated: true
  },
  {
    id: '4',
    name: 'Printer Driver Conflicts',
    description: 'New Windows update causing printer driver compatibility issues',
    severity: 'medium',
    ticketCount: 18,
    affectedCategory: 'Hardware/Printers',
    trend: 'increasing',
    recommendedAction: 'Create KB with driver rollback instructions',
    suggestedKBTitle: 'Fixing Printer Driver Issues After Windows Update',
    autoKBGenerated: false
  }
];

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
  const [patterns, setPatterns] = useState<DetectedPattern[]>(DEMO_PATTERNS);
  const [selectedPattern, setSelectedPattern] = useState<DetectedPattern | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticle | null>(null);
  const [showArticleDialog, setShowArticleDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      
      // Mark pattern as having KB generated
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
      // Use client_portal_kb which exists in the schema
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
    // Simulate pattern detection
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRefreshing(false);
    toast.success('Patterns refreshed');
  };

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
                <Input defaultValue="24 hours" className="mt-1 bg-black/60 border-slate-700" />
              </div>
              <div>
                <label className="text-xs text-slate-500">Auto-KB Confidence</label>
                <div className="flex items-center gap-2 mt-1">
                  <Input type="number" defaultValue={85} className="w-20 bg-black/60 border-slate-700" />
                  <span className="text-slate-400">%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Generated Article Dialog */}
      <Dialog open={showArticleDialog} onOpenChange={setShowArticleDialog}>
        <DialogContent className="max-w-3xl bg-black/95 border-cyan-500/40">
          <DialogHeader>
            <DialogTitle className="text-cyan-400 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI-Generated KB Article
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Review and edit the generated article before publishing
            </DialogDescription>
          </DialogHeader>
          
          {generatedArticle && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Title</label>
                <Input
                  value={generatedArticle.title}
                  onChange={(e) => setGeneratedArticle({ ...generatedArticle, title: e.target.value })}
                  className="mt-1 bg-black/60 border-cyan-500/30"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400">Content (Markdown)</label>
                <Textarea
                  value={generatedArticle.content}
                  onChange={(e) => setGeneratedArticle({ ...generatedArticle, content: e.target.value })}
                  className="mt-1 h-64 bg-black/60 border-cyan-500/30 font-mono text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Tags:</span>
                {generatedArticle.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="border-purple-500/40 text-purple-400">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <Button variant="outline" className="border-slate-600" onClick={() => setShowArticleDialog(false)}>
                  Cancel
                </Button>
                <Button variant="outline" className="border-cyan-500/40 text-cyan-400">
                  <Edit className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                  onClick={publishArticle}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Publish Article
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
