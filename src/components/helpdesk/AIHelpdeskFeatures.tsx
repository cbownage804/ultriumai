import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle,
  Copy,
  Merge,
  Link2,
  Languages,
  ArrowRight,
  Clock,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Duplicate Detection Component
interface DuplicateResult {
  ticket_id: string;
  confidence: number;
  reason: string;
}

interface DuplicateDetectorProps {
  ticketId?: string;
  title: string;
  description: string;
  onMerge?: (duplicateId: string) => void;
}

export function DuplicateDetector({ ticketId, title, description, onMerge }: DuplicateDetectorProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateResult[]>([]);

  const checkDuplicates = async () => {
    setIsChecking(true);
    try {
      const response = await supabase.functions.invoke('helpdesk-ai-features', {
        body: { action: 'detect_duplicates', ticketId, title, description }
      });

      if (response.error) throw response.error;
      setDuplicates(response.data.duplicates || []);
      
      if (response.data.duplicates?.length === 0) {
        toast.success('No duplicates found');
      }
    } catch (error) {
      console.error('Duplicate check error:', error);
      toast.error('Failed to check for duplicates');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Merge className="h-4 w-4 text-primary" />
          Duplicate Detection
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={checkDuplicates} 
          disabled={isChecking}
          className="w-full mb-3"
        >
          {isChecking ? 'Checking...' : 'Check for Duplicates'}
        </Button>

        {duplicates.length > 0 && (
          <div className="space-y-2">
            {duplicates.map((dup) => (
              <div 
                key={dup.ticket_id}
                className="p-2 rounded-lg border bg-yellow-500/5 border-yellow-500/20"
              >
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-xs">
                    {dup.confidence}% match
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => onMerge?.(dup.ticket_id)}
                  >
                    <Link2 className="h-3 w-3 mr-1" />
                    Link
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{dup.reason}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Escalation Predictor Component
interface EscalationPrediction {
  probability: number;
  factors: string[];
  recommended_action: string;
  risk_level: 'low' | 'medium' | 'high';
}

interface EscalationPredictorProps {
  ticketId: string;
}

export function EscalationPredictor({ ticketId }: EscalationPredictorProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState<EscalationPrediction | null>(null);

  const analyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await supabase.functions.invoke('helpdesk-ai-features', {
        body: { action: 'predict_escalation', ticketId }
      });

      if (response.error) throw response.error;
      setPrediction(response.data);
    } catch (error) {
      console.error('Escalation prediction error:', error);
      toast.error('Failed to predict escalation');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-500 bg-red-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      default: return 'text-green-500 bg-green-500/10';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary" />
          Escalation Risk
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!prediction ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={analyze} 
            disabled={isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? 'Analyzing...' : 'Predict Escalation Risk'}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Probability</span>
                  <span className="font-bold">{prediction.probability}%</span>
                </div>
                <Progress value={prediction.probability} className="h-2" />
              </div>
              <Badge className={cn("border", getRiskColor(prediction.risk_level))}>
                {prediction.risk_level}
              </Badge>
            </div>

            {prediction.factors?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Risk Factors:</p>
                {prediction.factors.slice(0, 3).map((factor, i) => (
                  <p key={i} className="text-xs">• {factor}</p>
                ))}
              </div>
            )}

            {prediction.recommended_action && (
              <div className="p-2 rounded bg-primary/5 text-xs">
                💡 {prediction.recommended_action}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Translation Component
interface TranslationResult {
  detected_language: string;
  is_english: boolean;
  translated_title?: string;
  translated_description?: string;
}

interface TicketTranslatorProps {
  ticketId?: string;
  title: string;
  description: string;
  onTranslated?: (result: TranslationResult) => void;
}

export function TicketTranslator({ ticketId, title, description, onTranslated }: TicketTranslatorProps) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);

  const translate = async () => {
    setIsTranslating(true);
    try {
      const response = await supabase.functions.invoke('helpdesk-ai-features', {
        body: { action: 'translate_ticket', ticketId, title, description }
      });

      if (response.error) throw response.error;
      setResult(response.data);
      onTranslated?.(response.data);
      
      if (response.data.is_english) {
        toast.success('Content is already in English');
      } else {
        toast.success(`Translated from ${response.data.detected_language}`);
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Failed to translate');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Languages className="h-4 w-4 text-primary" />
          Translation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={translate} 
          disabled={isTranslating}
          className="w-full mb-3"
        >
          {isTranslating ? 'Translating...' : 'Detect & Translate'}
        </Button>

        {result && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{result.detected_language}</Badge>
              {!result.is_english && (
                <>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Badge>English</Badge>
                </>
              )}
            </div>

            {!result.is_english && result.translated_title && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Translated Title:</p>
                <p className="text-sm font-medium">{result.translated_title}</p>
              </div>
            )}

            {!result.is_english && result.translated_description && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Translated Description:</p>
                <p className="text-sm">{result.translated_description}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Handoff Summary Generator
interface HandoffSummary {
  summary: string;
  key_points: string[];
  attempted_solutions: string[];
  next_steps: string[];
  user_context: string;
}

interface HandoffGeneratorProps {
  ticketId: string;
  fromTechId?: string;
  toTechId?: string;
  onGenerated?: (summary: HandoffSummary) => void;
}

export function HandoffGenerator({ ticketId, fromTechId, toTechId, onGenerated }: HandoffGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState<HandoffSummary | null>(null);

  const generate = async () => {
    setIsGenerating(true);
    try {
      const response = await supabase.functions.invoke('helpdesk-ai-features', {
        body: { action: 'generate_handoff', ticketId, fromTechId, toTechId }
      });

      if (response.error) throw response.error;
      setSummary(response.data);
      onGenerated?.(response.data);
      toast.success('Handoff summary generated');
    } catch (error) {
      console.error('Handoff generation error:', error);
      toast.error('Failed to generate handoff summary');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!summary) return;
    const text = `## Handoff Summary\n\n${summary.summary}\n\n### Key Points\n${summary.key_points.map(p => `- ${p}`).join('\n')}\n\n### Next Steps\n${summary.next_steps.map(s => `- ${s}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Handoff Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!summary ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={generate} 
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? 'Generating...' : 'Generate Handoff Summary'}
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm">{summary.summary}</p>

            {summary.key_points?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Key Points:</p>
                <ul className="text-xs space-y-1">
                  {summary.key_points.map((point, i) => (
                    <li key={i}>• {point}</li>
                  ))}
                </ul>
              </div>
            )}

            {summary.next_steps?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Next Steps:</p>
                <ul className="text-xs space-y-1">
                  {summary.next_steps.map((step, i) => (
                    <li key={i}>• {step}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button variant="ghost" size="sm" onClick={copyToClipboard}>
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Canned Response Suggester
interface ResponseSuggestion {
  response_id: string;
  relevance: number;
  customization_hint: string;
  response?: {
    id: string;
    title: string;
    content: string;
  };
}

interface ResponseSuggesterProps {
  ticketTitle: string;
  ticketDescription: string;
  category?: string;
  onSelect?: (content: string) => void;
}

export function ResponseSuggester({ ticketTitle, ticketDescription, category, onSelect }: ResponseSuggesterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ResponseSuggestion[]>([]);

  const getSuggestions = async () => {
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('helpdesk-ai-features', {
        body: { 
          action: 'suggest_responses', 
          ticketTitle, 
          ticketDescription, 
          category 
        }
      });

      if (response.error) throw response.error;
      setSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Response suggestion error:', error);
      toast.error('Failed to get suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Response Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={getSuggestions} 
          disabled={isLoading}
          className="w-full mb-3"
        >
          {isLoading ? 'Finding...' : 'Get Suggestions'}
        </Button>

        {suggestions.length > 0 && (
          <div className="space-y-2">
            {suggestions.map((sug, i) => (
              <div 
                key={i}
                className="p-2 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onSelect?.(sug.response?.content || '')}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">{sug.response?.title}</p>
                  <Badge variant="secondary" className="text-xs">
                    {sug.relevance}%
                  </Badge>
                </div>
                {sug.customization_hint && (
                  <p className="text-xs text-muted-foreground">
                    💡 {sug.customization_hint}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
