import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  AlertTriangle, 
  Clock, 
  Users, 
  Tag, 
  TrendingUp,
  MessageSquare,
  Zap,
  Shield,
  ThermometerSun
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AITicketInsightsProps {
  ticket: {
    ai_confidence_score?: number;
    ai_detected_category?: string;
    ai_category_confidence?: number;
    ai_sub_category?: string;
    ai_user_sentiment?: string;
    ai_sentiment_indicators?: string[];
    ai_frustration_level?: number;
    ai_detected_priority?: string;
    ai_priority_factors?: string[];
    ai_business_impact?: string;
    ai_users_affected?: string;
    ai_keywords?: string[];
    ai_requires_escalation?: boolean;
    ai_escalation_reason?: string;
    ai_estimated_resolution_time?: string;
    ai_tech_notes?: string;
    ai_similar_issues_hint?: string;
    ai_summary?: string;
  };
  compact?: boolean;
}

const sentimentConfig = {
  frustrated: { color: 'text-red-500', bg: 'bg-red-500/10', icon: '😤', label: 'Frustrated' },
  urgent: { color: 'text-orange-500', bg: 'bg-orange-500/10', icon: '⚡', label: 'Urgent' },
  confused: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: '😕', label: 'Confused' },
  neutral: { color: 'text-muted-foreground', bg: 'bg-muted', icon: '😐', label: 'Neutral' },
  appreciative: { color: 'text-green-500', bg: 'bg-green-500/10', icon: '😊', label: 'Appreciative' },
};

const priorityConfig = {
  low: { color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  medium: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  high: { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  critical: { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' },
};

const impactConfig = {
  minimal: { color: 'text-green-500', width: 25 },
  moderate: { color: 'text-yellow-500', width: 50 },
  significant: { color: 'text-orange-500', width: 75 },
  severe: { color: 'text-red-500', width: 100 },
};

const categoryIcons: Record<string, string> = {
  hardware: '🖥️',
  software: '💿',
  network: '🌐',
  security: '🔐',
  email: '📧',
  printer: '🖨️',
  mobile: '📱',
  account: '👤',
  data: '💾',
  other: '📋',
};

export function AITicketInsights({ ticket, compact = false }: AITicketInsightsProps) {
  const sentiment = ticket.ai_user_sentiment || 'neutral';
  const sentimentStyle = sentimentConfig[sentiment as keyof typeof sentimentConfig] || sentimentConfig.neutral;
  
  const priority = ticket.ai_detected_priority || 'medium';
  const priorityStyle = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
  
  const impact = ticket.ai_business_impact || 'minimal';
  const impactStyle = impactConfig[impact as keyof typeof impactConfig] || impactConfig.minimal;

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2 items-center">
        {/* Category Badge */}
        {ticket.ai_detected_category && (
          <Badge variant="outline" className="gap-1">
            <span>{categoryIcons[ticket.ai_detected_category] || '📋'}</span>
            {ticket.ai_detected_category}
          </Badge>
        )}
        
        {/* Priority Badge */}
        <Badge className={cn("gap-1", priorityStyle.bg, priorityStyle.color, "border", priorityStyle.border)}>
          <TrendingUp className="h-3 w-3" />
          {priority.toUpperCase()}
        </Badge>
        
        {/* Sentiment Badge */}
        <Badge className={cn("gap-1", sentimentStyle.bg, sentimentStyle.color)}>
          <span>{sentimentStyle.icon}</span>
          {sentimentStyle.label}
        </Badge>
        
        {/* Frustration Indicator */}
        {ticket.ai_frustration_level && ticket.ai_frustration_level >= 7 && (
          <Badge variant="destructive" className="gap-1 animate-pulse">
            <ThermometerSun className="h-3 w-3" />
            High Frustration
          </Badge>
        )}
        
        {/* Escalation Warning */}
        {ticket.ai_requires_escalation && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Needs Escalation
          </Badge>
        )}
        
        {/* Confidence */}
        {ticket.ai_confidence_score !== undefined && (
          <Badge variant="secondary" className="gap-1">
            <Brain className="h-3 w-3" />
            {ticket.ai_confidence_score}% confident
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          AI Analysis Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Escalation Warning */}
        {ticket.ai_requires_escalation && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Immediate Escalation Required</p>
              <p className="text-sm text-muted-foreground">{ticket.ai_escalation_reason}</p>
            </div>
          </div>
        )}

        {/* Top Row: Classification, Priority, Sentiment */}
        <div className="grid grid-cols-3 gap-3">
          {/* Classification */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Category</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">{categoryIcons[ticket.ai_detected_category || 'other']}</span>
              <div>
                <p className="font-medium capitalize">{ticket.ai_detected_category || 'Other'}</p>
                {ticket.ai_sub_category && (
                  <p className="text-xs text-muted-foreground">{ticket.ai_sub_category}</p>
                )}
              </div>
            </div>
            {ticket.ai_category_confidence && (
              <Progress value={ticket.ai_category_confidence} className="h-1 mt-2" />
            )}
          </div>

          {/* Priority */}
          <div className={cn("p-3 rounded-lg border", priorityStyle.bg, priorityStyle.border)}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">AI Priority</span>
            </div>
            <p className={cn("font-bold text-lg uppercase", priorityStyle.color)}>{priority}</p>
            {ticket.ai_priority_factors && ticket.ai_priority_factors.length > 0 && (
              <div className="mt-1">
                {ticket.ai_priority_factors.slice(0, 2).map((factor, i) => (
                  <p key={i} className="text-xs text-muted-foreground truncate">• {factor}</p>
                ))}
              </div>
            )}
          </div>

          {/* Sentiment */}
          <div className={cn("p-3 rounded-lg", sentimentStyle.bg)}>
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Sentiment</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{sentimentStyle.icon}</span>
              <div>
                <p className={cn("font-medium", sentimentStyle.color)}>{sentimentStyle.label}</p>
                {ticket.ai_frustration_level !== undefined && (
                  <div className="flex items-center gap-1 mt-1">
                    <ThermometerSun className={cn(
                      "h-3 w-3",
                      ticket.ai_frustration_level >= 7 ? "text-red-500" : 
                      ticket.ai_frustration_level >= 4 ? "text-yellow-500" : "text-green-500"
                    )} />
                    <span className="text-xs">Frustration: {ticket.ai_frustration_level}/10</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Second Row: Impact & Users Affected */}
        <div className="grid grid-cols-2 gap-3">
          {/* Business Impact */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Business Impact</span>
            </div>
            <p className={cn("font-medium capitalize", impactStyle.color)}>{impact}</p>
            <Progress value={impactStyle.width} className="h-1.5 mt-2" />
          </div>

          {/* Users Affected */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Users Affected</span>
            </div>
            <p className="font-medium capitalize">{ticket.ai_users_affected || 'Single'}</p>
          </div>
        </div>

        {/* Resolution Time & Confidence */}
        <div className="grid grid-cols-2 gap-3">
          {ticket.ai_estimated_resolution_time && (
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Est. Resolution</span>
              </div>
              <p className="font-medium">{ticket.ai_estimated_resolution_time}</p>
            </div>
          )}
          
          {ticket.ai_confidence_score !== undefined && (
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">AI Confidence</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{ticket.ai_confidence_score}%</p>
                <Progress value={ticket.ai_confidence_score} className="h-2 flex-1" />
              </div>
            </div>
          )}
        </div>

        {/* Keywords */}
        {ticket.ai_keywords && ticket.ai_keywords.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Keywords Detected</p>
            <div className="flex flex-wrap gap-1">
              {ticket.ai_keywords.map((keyword, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tech Notes */}
        {ticket.ai_tech_notes && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary">Tech Notes</span>
            </div>
            <p className="text-sm">{ticket.ai_tech_notes}</p>
          </div>
        )}

        {/* Similar Issues Hint */}
        {ticket.ai_similar_issues_hint && (
          <div className="p-2 rounded bg-muted/30 text-xs text-muted-foreground">
            💡 {ticket.ai_similar_issues_hint}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
