/**
 * Watch AI Recommendations Display
 * A polished, structured presentation of AI-generated security advice
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ShieldAlert,
  Shield,
  CheckCircle2,
  Clock,
  Target,
  Zap,
  Lock,
  Eye,
  KeyRound,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ParsedRecommendation {
  riskAssessment: {
    level: 'critical' | 'high' | 'medium' | 'low';
    summary: string;
    factors: string[];
  };
  immediateActions: {
    priority: 'urgent' | 'important' | 'recommended';
    actions: { text: string; completed?: boolean }[];
  };
  longTermProtection: {
    strategies: string[];
    bestPractices: string[];
  };
  additionalNotes?: string;
}

function parseAIRecommendation(rawText: string): ParsedRecommendation {
  const sections = rawText.split(/\n\n+/);
  
  const result: ParsedRecommendation = {
    riskAssessment: {
      level: 'medium',
      summary: '',
      factors: []
    },
    immediateActions: {
      priority: 'important',
      actions: []
    },
    longTermProtection: {
      strategies: [],
      bestPractices: []
    }
  };

  let currentSection: 'risk' | 'immediate' | 'longterm' | 'other' = 'other';
  
  for (const section of sections) {
    const cleanSection = section.replace(/\*\*/g, '').trim();
    const lowerSection = cleanSection.toLowerCase();
    
    // Detect section type
    if (lowerSection.includes('risk assessment') || lowerSection.includes('threat level') || lowerSection.includes('severity')) {
      currentSection = 'risk';
      
      // Determine risk level
      if (lowerSection.includes('critical') || lowerSection.includes('severe')) {
        result.riskAssessment.level = 'critical';
      } else if (lowerSection.includes('high') || lowerSection.includes('significant')) {
        result.riskAssessment.level = 'high';
      } else if (lowerSection.includes('low') || lowerSection.includes('minimal')) {
        result.riskAssessment.level = 'low';
      }
      
      // Extract content after the header
      const lines = cleanSection.split('\n').filter(l => l.trim());
      const contentLines = lines.slice(1);
      
      for (const line of contentLines) {
        const trimmed = line.replace(/^[-•*]\s*/, '').trim();
        if (trimmed.length > 10) {
          if (!result.riskAssessment.summary) {
            result.riskAssessment.summary = trimmed;
          } else {
            result.riskAssessment.factors.push(trimmed);
          }
        }
      }
      
      // If no content extracted, use remaining text as summary
      if (!result.riskAssessment.summary && contentLines.length === 0) {
        const headerRemoved = cleanSection.replace(/^[0-9.]*\s*(risk assessment|threat level)[:\s]*/i, '').trim();
        result.riskAssessment.summary = headerRemoved;
      }
      
    } else if (lowerSection.includes('immediate action') || lowerSection.includes('urgent') || lowerSection.includes('right now') || lowerSection.includes('first step')) {
      currentSection = 'immediate';
      
      if (lowerSection.includes('urgent') || lowerSection.includes('critical')) {
        result.immediateActions.priority = 'urgent';
      }
      
      const lines = cleanSection.split('\n').filter(l => l.trim());
      for (const line of lines) {
        const trimmed = line.replace(/^[-•*0-9.]\s*/, '').replace(/^\d+\.\s*/, '').trim();
        if (trimmed.length > 10 && !trimmed.toLowerCase().includes('immediate action')) {
          result.immediateActions.actions.push({ text: trimmed });
        }
      }
      
    } else if (lowerSection.includes('long-term') || lowerSection.includes('long term') || lowerSection.includes('ongoing') || lowerSection.includes('future') || lowerSection.includes('prevention')) {
      currentSection = 'longterm';
      
      const lines = cleanSection.split('\n').filter(l => l.trim());
      for (const line of lines) {
        const trimmed = line.replace(/^[-•*0-9.]\s*/, '').replace(/^\d+\.\s*/, '').trim();
        if (trimmed.length > 10 && !trimmed.toLowerCase().includes('long-term') && !trimmed.toLowerCase().includes('long term')) {
          if (trimmed.toLowerCase().includes('best practice') || trimmed.toLowerCase().includes('always') || trimmed.toLowerCase().includes('never')) {
            result.longTermProtection.bestPractices.push(trimmed);
          } else {
            result.longTermProtection.strategies.push(trimmed);
          }
        }
      }
      
    } else if (currentSection !== 'other') {
      // Continue adding to current section
      const lines = cleanSection.split('\n').filter(l => l.trim());
      for (const line of lines) {
        const trimmed = line.replace(/^[-•*0-9.]\s*/, '').trim();
        if (trimmed.length > 10) {
          if (currentSection === 'risk') {
            result.riskAssessment.factors.push(trimmed);
          } else if (currentSection === 'immediate') {
            result.immediateActions.actions.push({ text: trimmed });
          } else if (currentSection === 'longterm') {
            result.longTermProtection.strategies.push(trimmed);
          }
        }
      }
    } else {
      // Additional notes
      if (cleanSection.length > 20) {
        result.additionalNotes = (result.additionalNotes ? result.additionalNotes + ' ' : '') + cleanSection;
      }
    }
  }

  // Fallback: if no immediate actions found, try to extract from the whole text
  if (result.immediateActions.actions.length === 0) {
    const allLines = rawText.split('\n');
    for (const line of allLines) {
      const trimmed = line.replace(/^[-•*0-9.]\s*/, '').replace(/\*\*/g, '').trim();
      if (trimmed.toLowerCase().includes('change') || 
          trimmed.toLowerCase().includes('enable') || 
          trimmed.toLowerCase().includes('update') ||
          trimmed.toLowerCase().includes('check') ||
          trimmed.toLowerCase().includes('review')) {
        if (trimmed.length > 15 && trimmed.length < 200) {
          result.immediateActions.actions.push({ text: trimmed });
        }
      }
    }
  }

  return result;
}

interface AIRecommendationsDisplayProps {
  recommendation: string | null;
  loading: boolean;
  onRegenerate: () => void;
  onGenerate: () => void;
}

export function AIRecommendationsDisplay({
  recommendation,
  loading,
  onRegenerate,
  onGenerate
}: AIRecommendationsDisplayProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['risk', 'immediate', 'longterm']));

  const parsed = useMemo(() => {
    if (!recommendation) return null;
    return parseAIRecommendation(recommendation);
  }, [recommendation]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const getRiskStyles = (level: string) => {
    switch (level) {
      case 'critical':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          text: 'text-red-400',
          badge: 'bg-red-500/20 text-red-300 border-red-500/30'
        };
      case 'high':
        return {
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/30',
          text: 'text-orange-400',
          badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
        };
      case 'low':
        return {
          bg: 'bg-green-500/10',
          border: 'border-green-500/30',
          text: 'text-green-400',
          badge: 'bg-green-500/20 text-green-300 border-green-500/30'
        };
      default:
        return {
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/30',
          text: 'text-yellow-400',
          badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
        };
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-violet-500/20 animate-pulse">
            <Sparkles className="h-4 w-4 text-violet-400" />
          </div>
          <div className="flex-1">
            <div className="h-4 bg-violet-500/20 rounded w-48 animate-pulse" />
            <div className="h-3 bg-violet-500/10 rounded w-32 mt-1 animate-pulse" />
          </div>
        </div>
        
        {[1, 2, 3].map((i) => (
          <div 
            key={i}
            className="p-4 rounded-xl bg-card border border-white/5 animate-pulse"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20" />
              <div className="h-4 bg-violet-500/20 rounded w-32" />
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-violet-500/10 rounded w-full" />
              <div className="h-3 bg-violet-500/10 rounded w-3/4" />
            </div>
          </div>
        ))}
        
        <div className="flex items-center gap-2 text-xs text-gray-500 pt-2">
          <div className="animate-spin">
            <RefreshCw className="h-3 w-3 text-violet-400" />
          </div>
          <span>Analyzing threat data and generating personalized recommendations...</span>
        </div>
      </div>
    );
  }

  // Empty State
  if (!parsed) {
    return (
      <div className="text-center py-8">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-5 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-2xl w-fit mx-auto mb-5 border border-violet-500/20"
        >
          <Sparkles className="h-10 w-10 text-violet-400" />
        </motion.div>
        <h4 className="text-lg font-semibold text-white mb-2">Security Intelligence Ready</h4>
        <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
          Get AI-powered analysis with personalized action steps to secure your accounts.
        </p>
        <Button
          onClick={onGenerate}
          className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-lg shadow-violet-500/25"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Analyze & Recommend
        </Button>
      </div>
    );
  }

  const riskStyles = getRiskStyles(parsed.riskAssessment.level);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet-500/20">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          </div>
          <span className="text-sm font-medium text-violet-400">Security Analysis</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRegenerate}
          className="text-gray-400 hover:text-violet-400 hover:bg-violet-500/10 h-7 px-2"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          <span className="text-xs">Refresh</span>
        </Button>
      </div>

      {/* Risk Assessment Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn(
          "rounded-xl overflow-hidden border",
          riskStyles.bg,
          riskStyles.border
        )}
      >
        <button
          onClick={() => toggleSection('risk')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", riskStyles.bg)}>
              <AlertTriangle className={cn("h-4 w-4", riskStyles.text)} />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-semibold text-white">Risk Assessment</h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full border font-medium uppercase tracking-wide",
                  riskStyles.badge
                )}>
                  {parsed.riskAssessment.level} Risk
                </span>
              </div>
            </div>
          </div>
          {expandedSections.has('risk') ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
        
        <AnimatePresence>
          {expandedSections.has('risk') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-1">
                {parsed.riskAssessment.summary && (
                  <p className="text-sm text-gray-300 leading-relaxed mb-3">
                    {parsed.riskAssessment.summary}
                  </p>
                )}
                {parsed.riskAssessment.factors.length > 0 && (
                  <ul className="space-y-2">
                    {parsed.riskAssessment.factors.slice(0, 3).map((factor, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                        <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", riskStyles.text.replace('text-', 'bg-'))} />
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Immediate Actions Card */}
      {parsed.immediateActions.actions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl overflow-hidden border bg-red-500/10 border-red-500/20"
        >
          <button
            onClick={() => toggleSection('immediate')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <Zap className="h-4 w-4 text-red-400" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-semibold text-white">Immediate Actions</h4>
                <span className="text-xs text-red-400/80">{parsed.immediateActions.actions.length} steps to take now</span>
              </div>
            </div>
            {expandedSections.has('immediate') ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>
          
          <AnimatePresence>
            {expandedSections.has('immediate') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-2">
                  {parsed.immediateActions.actions.map((action, i) => (
                    <div 
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-lg bg-background border border-white/5"
                    >
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-xs font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">{action.text}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Long-term Protection Card */}
      {(parsed.longTermProtection.strategies.length > 0 || parsed.longTermProtection.bestPractices.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl overflow-hidden border bg-emerald-500/10 border-emerald-500/20"
        >
          <button
            onClick={() => toggleSection('longterm')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Shield className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-semibold text-white">Long-term Protection</h4>
                <span className="text-xs text-emerald-400/80">Ongoing security strategies</span>
              </div>
            </div>
            {expandedSections.has('longterm') ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>
          
          <AnimatePresence>
            {expandedSections.has('longterm') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-2">
                  {[...parsed.longTermProtection.strategies, ...parsed.longTermProtection.bestPractices].map((item, i) => (
                    <div 
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-300"
                    >
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

      {/* Additional Notes */}
      {parsed.additionalNotes && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 rounded-xl bg-card border border-white/5"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-400 leading-relaxed">{parsed.additionalNotes}</p>
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-center pt-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Lock className="h-3 w-3" />
          <span>Analysis based on latest threat intelligence</span>
        </div>
      </div>
    </div>
  );
}