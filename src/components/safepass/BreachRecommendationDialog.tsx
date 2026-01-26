import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ShieldAlert, AlertTriangle, CheckCircle, Sparkles, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

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

interface BreachRecommendationDialogProps {
  finding: BreachFindingDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BreachRecommendationDialog = ({ finding, open, onOpenChange }: BreachRecommendationDialogProps) => {
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchRecommendation = async () => {
    if (!finding) return;
    
    setIsLoading(true);
    setRecommendation(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('safepass-breach-recommendations', {
        body: { finding }
      });
      
      if (error) throw error;
      
      setRecommendation(data.recommendation);
    } catch (error: any) {
      console.error('Failed to get recommendations:', error);
      if (error.message?.includes('429')) {
        toast.error('Rate limit exceeded. Please try again later.');
      } else if (error.message?.includes('402')) {
        toast.error('AI credits exhausted. Please add credits.');
      } else {
        toast.error('Failed to generate recommendations');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch recommendation when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && finding && !recommendation) {
      fetchRecommendation();
    }
    if (!newOpen) {
      setRecommendation(null);
    }
    onOpenChange(newOpen);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ShieldAlert className="h-5 w-5 text-red-500" />;
      case 'high': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default: return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getSeverityIcon(finding.severity)}
            Security Analysis: {finding.title}
          </DialogTitle>
          <DialogDescription>
            AI-powered recommendations based on detected vulnerabilities
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Issues Summary */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Detected Issues</span>
              <Badge className={getSeverityColor(finding.severity)}>
                {finding.severity}
              </Badge>
            </div>
            <ul className="space-y-1">
              {finding.issues.map((issue, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {issue}
                </li>
              ))}
            </ul>
            
            {/* Email Breaches Detail */}
            {finding.emailBreaches && finding.emailBreaches.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <span className="text-sm font-medium">Account found in breaches:</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {finding.emailBreaches.slice(0, 5).map((breach, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {breach.name} ({breach.breachDate})
                    </Badge>
                  ))}
                  {finding.emailBreaches.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{finding.emailBreaches.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* AI Recommendations */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">AI Recommendations</span>
              </div>
              {recommendation && (
                <Button variant="ghost" size="sm" onClick={copyRecommendation}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              )}
            </div>
            
            <ScrollArea className="h-[300px] border rounded-lg p-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                  <p className="text-sm text-muted-foreground">Analyzing security risks...</p>
                </div>
              ) : recommendation ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{recommendation}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Failed to load recommendations</p>
                  <Button variant="outline" size="sm" onClick={fetchRecommendation}>
                    Try Again
                  </Button>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button 
              className="bg-amber-500 hover:bg-amber-600 text-black"
              onClick={() => {
                onOpenChange(false);
                toast.info('Navigate to your vault to update this password');
              }}
            >
              Update Password
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
