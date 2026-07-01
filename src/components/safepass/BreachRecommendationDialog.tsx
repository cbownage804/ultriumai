/**
 * Breach Recommendation Dialog
 * Beautiful, user-friendly AI recommendations for breach findings
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, ShieldAlert, AlertTriangle, Shield, Sparkles, Copy, Check, 
  Zap, ChevronDown, ChevronUp, KeyRound, RefreshCw, CheckCircle2, ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { isWraythDomain } from '@/utils/subdomain';

import { devLog } from '@/lib/logger';
export interface BreachFindingDetails {
  entryId: string;
  title: string;
  username?: string;
  issues: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  emailBreaches?: {
    name: string;
    breachDate: string;
    dataClasses: string[];
  }[];
  passwordBreachCount?: number;
}

interface ParsedRecommendation {
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  riskSummary: string;
  immediateActions: string[];
  passwordTip?: string;
  additionalProtection: string[];
}

function parseRecommendation(raw: string): ParsedRecommendation {
  const result: ParsedRecommendation = {
    riskLevel: 'medium',
    riskSummary: '',
    immediateActions: [],
    additionalProtection: []
  };

  const sections = raw.split(/\n\n+/);
  let currentSection: 'risk' | 'immediate' | 'password' | 'additional' | null = null;

  for (const section of sections) {
    const clean = section.replace(/\*\*/g, '').trim();
    const lower = clean.toLowerCase();

    if (lower.includes('risk assessment') || lower.includes('severity')) {
      currentSection = 'risk';
      if (lower.includes('critical') || lower.includes('severe')) result.riskLevel = 'critical';
      else if (lower.includes('high')) result.riskLevel = 'high';
      else if (lower.includes('low')) result.riskLevel = 'low';
      
      const lines = clean.split('\n').slice(1);
      result.riskSummary = lines.map(l => l.replace(/^[-•*]\s*/, '').trim()).filter(l => l.length > 10).join(' ');
    } else if (lower.includes('immediate action') || lower.includes('right now') || lower.includes('first step')) {
      currentSection = 'immediate';
      const lines = clean.split('\n');
      for (const line of lines) {
        const trimmed = line.replace(/^[-•*0-9.]\s*/, '').trim();
        if (trimmed.length > 10 && !trimmed.toLowerCase().includes('immediate action')) {
          result.immediateActions.push(trimmed);
        }
      }
    } else if (lower.includes('password recommendation') || lower.includes('strong password')) {
      currentSection = 'password';
      const lines = clean.split('\n').slice(1);
      result.passwordTip = lines.map(l => l.replace(/^[-•*]\s*/, '').trim()).filter(l => l.length > 10).join(' ');
    } else if (lower.includes('additional') || lower.includes('protection') || lower.includes('2fa') || lower.includes('monitoring')) {
      currentSection = 'additional';
      const lines = clean.split('\n');
      for (const line of lines) {
        const trimmed = line.replace(/^[-•*0-9.]\s*/, '').trim();
        if (trimmed.length > 10 && !trimmed.toLowerCase().includes('additional')) {
          result.additionalProtection.push(trimmed);
        }
      }
    }
  }

  return result;
}

interface BreachRecommendationDialogProps {
  finding: BreachFindingDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BreachRecommendationDialog = ({ finding, open, onOpenChange }: BreachRecommendationDialogProps) => {
  const navigate = useNavigate();
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['risk', 'immediate', 'additional']));

  const parsed = useMemo(() => {
    if (!recommendation) return null;
    return parseRecommendation(recommendation);
  }, [recommendation]);

  const fetchRecommendation = async (retryCount = 0) => {
    if (!finding) return;
    
    setIsLoading(true);
    if (retryCount === 0) setRecommendation(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('safepass-breach-recommendations', {
        body: { finding }
      });
      
      if (error) {
        // Auto-retry once on initial failure (cold start issues)
        if (retryCount === 0) {
          devLog.log('First attempt failed, retrying after delay...');
          await new Promise(resolve => setTimeout(resolve, 1500));
          return fetchRecommendation(1);
        }
        throw error;
      }
      
      if (data?.error) {
        if (retryCount === 0) {
          devLog.log('First attempt returned error, retrying after delay...');
          await new Promise(resolve => setTimeout(resolve, 1500));
          return fetchRecommendation(1);
        }
        throw new Error(data.error);
      }
      
      setRecommendation(data.recommendation);
      setIsLoading(false);
    } catch (error: any) {
      console.error('Failed to get recommendations:', error);
      if (error.message?.includes('429')) {
        toast.error('Rate limit exceeded. Please try again later.');
      } else if (error.message?.includes('402')) {
        toast.error('AI credits exhausted. Please add credits.');
      } else {
        // Auto-retry once on any failure (cold start issues)
        if (retryCount === 0) {
          devLog.log('First attempt failed, retrying after delay...');
          await new Promise(resolve => setTimeout(resolve, 1500));
          return fetchRecommendation(1);
        }
        toast.error('Failed to generate recommendations');
      }
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && finding && !recommendation) {
      fetchRecommendation();
    }
    if (!newOpen) {
      setRecommendation(null);
    }
    onOpenChange(newOpen);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const getRiskStyles = (level: string) => {
    switch (level) {
      case 'critical': return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', badge: 'bg-red-500/20 text-red-300' };
      case 'high': return { bg: 'bg-primary/10', border: 'border-primary/30', text: 'text-orange-400', badge: 'bg-primary/20 text-orange-300' };
      case 'low': return { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', badge: 'bg-green-500/20 text-green-300' };
      default: return { bg: 'bg-primary/10', border: 'border-primary/30', text: 'text-primary', badge: 'bg-primary/20 text-primary' };
    }
  };

  const copyRecommendation = async () => {
    if (!recommendation) return;
    await navigator.clipboard.writeText(recommendation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  if (!finding) return null;

  const severityStyles = getRiskStyles(finding.severity);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden bg-background border-primary/20">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-primary/10 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="flex items-start gap-4">
            <div className={cn("p-3 rounded-xl", severityStyles.bg, severityStyles.border, "border")}>
              <ShieldAlert className={cn("h-6 w-6", severityStyles.text)} />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                {finding.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={cn("uppercase text-xs font-medium", severityStyles.badge)}>
                  {finding.severity} Risk
                </Badge>
                {finding.passwordBreachCount && finding.passwordBreachCount > 0 && (
                  <Badge variant="outline" className="text-xs text-red-400 border-red-500/30">
                    Password in {finding.passwordBreachCount.toLocaleString()} breaches
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh]">
          <div className="p-6 space-y-4">
            {/* Issues Summary */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <h4 className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Security Issues Detected
              </h4>
              <ul className="space-y-2">
                {finding.issues.map((issue, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
              
              {finding.emailBreaches && finding.emailBreaches.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">Account found in:</span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {finding.emailBreaches.slice(0, 5).map((breach, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs bg-red-500/5 border-red-500/20 text-red-300">
                        {breach.name}
                      </Badge>
                    ))}
                    {finding.emailBreaches.length > 5 && (
                      <Badge variant="outline" className="text-xs">+{finding.emailBreaches.length - 5} more</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* AI Recommendations */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/20">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-primary">AI Security Advisor</span>
                </div>
                {recommendation && (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => fetchRecommendation()} className="h-7 px-2 text-xs">
                      <RefreshCw className="h-3 w-3 mr-1" /> Refresh
                    </Button>
                    <Button variant="ghost" size="sm" onClick={copyRecommendation} className="h-7 px-2">
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                )}
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 rounded-xl bg-primary/5 border border-primary/10 animate-pulse">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20" />
                        <div className="h-4 bg-primary/20 rounded w-32" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-primary/10 rounded w-full" />
                        <div className="h-3 bg-primary/10 rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    Analyzing security risks...
                  </p>
                </div>
              ) : parsed ? (
                <div className="space-y-3">
                  {/* Risk Assessment */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                    className={cn("rounded-xl overflow-hidden border", getRiskStyles(parsed.riskLevel).bg, getRiskStyles(parsed.riskLevel).border)}>
                    <button onClick={() => toggleSection('risk')} 
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", getRiskStyles(parsed.riskLevel).bg)}>
                          <AlertTriangle className={cn("h-4 w-4", getRiskStyles(parsed.riskLevel).text)} />
                        </div>
                        <div className="text-left">
                          <h4 className="text-sm font-semibold">Risk Assessment</h4>
                          <Badge className={cn("text-xs uppercase mt-1", getRiskStyles(parsed.riskLevel).badge)}>
                            {parsed.riskLevel} Risk
                          </Badge>
                        </div>
                      </div>
                      {expandedSections.has('risk') ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    <AnimatePresence>
                      {expandedSections.has('risk') && parsed.riskSummary && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{parsed.riskSummary}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Immediate Actions */}
                  {parsed.immediateActions.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                      className="rounded-xl overflow-hidden border bg-red-500/10 border-red-500/20">
                      <button onClick={() => toggleSection('immediate')} 
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-red-500/20">
                            <Zap className="h-4 w-4 text-red-400" />
                          </div>
                          <div className="text-left">
                            <h4 className="text-sm font-semibold">What To Do Now</h4>
                            <span className="text-xs text-red-400/80">{parsed.immediateActions.length} action{parsed.immediateActions.length > 1 ? 's' : ''} required</span>
                          </div>
                        </div>
                        {expandedSections.has('immediate') ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </button>
                      <AnimatePresence>
                        {expandedSections.has('immediate') && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="px-4 pb-4 space-y-2">
                              {parsed.immediateActions.map((action, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/30">
                                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-xs font-bold shrink-0 mt-0.5">
                                    {i + 1}
                                  </div>
                                  <p className="text-sm text-muted-foreground leading-relaxed">{action}</p>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {/* Password Tip */}
                  {parsed.passwordTip && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                      className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/20">
                          <KeyRound className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Password Tip</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">{parsed.passwordTip}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Additional Protection */}
                  {parsed.additionalProtection.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                      className="rounded-xl overflow-hidden border bg-emerald-500/10 border-emerald-500/20">
                      <button onClick={() => toggleSection('additional')} 
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-emerald-500/20">
                            <Shield className="h-4 w-4 text-emerald-400" />
                          </div>
                          <div className="text-left">
                            <h4 className="text-sm font-semibold">Extra Protection</h4>
                            <span className="text-xs text-emerald-400/80">Recommended security steps</span>
                          </div>
                        </div>
                        {expandedSections.has('additional') ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </button>
                      <AnimatePresence>
                        {expandedSections.has('additional') && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="px-4 pb-4 space-y-2">
                              {parsed.additionalProtection.map((item, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                                  <span>{item}</span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">Failed to load recommendations</p>
                  <Button variant="outline" size="sm" onClick={() => fetchRecommendation()}>Try Again</Button>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-primary/10 bg-gradient-to-t from-primary/5 to-transparent space-y-3">
          {/* Important reminder */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <ExternalLink className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-primary/80">
              <span className="font-medium text-primary">Important:</span> After updating here, remember to change the password on <span className="font-semibold">{finding.title}</span>'s actual website too. Vault stores your passwords but doesn't change them automatically.
            </p>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button className="bg-primary hover:bg-primary text-black" onClick={() => {
              onOpenChange(false);
              const vaultPath = isWraythDomain() ? '/pass' : '/app/pass';
              navigate(vaultPath, { state: { editEntryId: finding.entryId } });
            }}>
              <KeyRound className="h-4 w-4 mr-2" />
              Update Password
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
