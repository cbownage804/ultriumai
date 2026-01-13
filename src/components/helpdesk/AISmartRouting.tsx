import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  UserCheck, 
  Clock, 
  Target, 
  BookOpen,
  ExternalLink,
  Sparkles,
  TrendingUp,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AISmartRoutingProps {
  ticket: {
    ai_recommended_technician_id?: string;
    ai_routing_reason?: string;
    ai_routing_confidence?: number;
    ai_suggested_kb_articles?: string[];
    ai_kb_article_relevance?: Record<string, number>;
    ai_predicted_sla_hours?: number;
    ai_sla_confidence?: number;
    ai_sla_factors?: string[];
    ai_complexity_score?: number;
  };
  onAssignTech?: (techId: string) => void;
  onViewArticle?: (articleId: string) => void;
}

export function AISmartRouting({ ticket, onAssignTech, onViewArticle }: AISmartRoutingProps) {
  // Fetch recommended technician details
  const { data: technician } = useQuery({
    queryKey: ['technician', ticket.ai_recommended_technician_id],
    queryFn: async () => {
      if (!ticket.ai_recommended_technician_id) return null;
      const { data } = await supabase
        .from('helpdesk_technicians')
        .select('*')
        .eq('id', ticket.ai_recommended_technician_id)
        .single();
      return data;
    },
    enabled: !!ticket.ai_recommended_technician_id,
  });

  // Fetch suggested KB articles
  const { data: kbArticles } = useQuery({
    queryKey: ['kb-articles', ticket.ai_suggested_kb_articles],
    queryFn: async () => {
      if (!ticket.ai_suggested_kb_articles?.length) return [];
      const { data } = await supabase
        .from('helpdesk_kb_articles')
        .select('*')
        .in('id', ticket.ai_suggested_kb_articles);
      return data || [];
    },
    enabled: !!ticket.ai_suggested_kb_articles?.length,
  });

  const getComplexityColor = (score: number) => {
    if (score <= 3) return 'text-green-500';
    if (score <= 6) return 'text-yellow-500';
    if (score <= 8) return 'text-orange-500';
    return 'text-red-500';
  };

  const getSLAStatus = (hours: number) => {
    if (hours <= 1) return { label: 'Quick Fix', color: 'bg-green-500/10 text-green-500 border-green-500/30' };
    if (hours <= 4) return { label: 'Same Day', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' };
    if (hours <= 24) return { label: 'Next Day', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' };
    return { label: 'Extended', color: 'bg-orange-500/10 text-orange-500 border-orange-500/30' };
  };

  return (
    <div className="space-y-4">
      {/* Smart Routing Header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        <span>AI Smart Routing & Predictions</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recommended Technician */}
        {technician && (
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" />
                Recommended Technician
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {technician.display_name?.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{technician.display_name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(technician.specializations as string[])?.slice(0, 3).map((spec: string) => (
                      <Badge key={spec} variant="secondary" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>Load: {technician.current_ticket_count}/{technician.max_concurrent_tickets}</span>
                    <span>•</span>
                    <Badge variant={technician.availability_status === 'available' ? 'default' : 'secondary'} className="text-xs">
                      {technician.availability_status}
                    </Badge>
                  </div>
                </div>
              </div>

              {ticket.ai_routing_reason && (
                <div className="mt-3 p-2 rounded bg-muted/50 text-xs">
                  <p className="text-muted-foreground">{ticket.ai_routing_reason}</p>
                </div>
              )}

              {ticket.ai_routing_confidence && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Confidence:</span>
                  <Progress value={ticket.ai_routing_confidence} className="h-1.5 flex-1" />
                  <span className="text-xs font-medium">{ticket.ai_routing_confidence}%</span>
                </div>
              )}

              {onAssignTech && (
                <Button 
                  size="sm" 
                  className="w-full mt-3"
                  onClick={() => onAssignTech(technician.id)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Assign to {technician.display_name?.split(' ')[0]}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* SLA Prediction */}
        {ticket.ai_predicted_sla_hours !== undefined && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                SLA Prediction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-3">
                <div className="text-3xl font-bold">
                  {ticket.ai_predicted_sla_hours < 1 
                    ? `${Math.round(ticket.ai_predicted_sla_hours * 60)}m`
                    : `${ticket.ai_predicted_sla_hours}h`}
                </div>
                <Badge className={cn("border", getSLAStatus(ticket.ai_predicted_sla_hours).color)}>
                  {getSLAStatus(ticket.ai_predicted_sla_hours).label}
                </Badge>
              </div>

              {ticket.ai_sla_confidence && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-muted-foreground">Confidence:</span>
                  <Progress value={ticket.ai_sla_confidence} className="h-1.5 flex-1" />
                  <span className="text-xs font-medium">{ticket.ai_sla_confidence}%</span>
                </div>
              )}

              {ticket.ai_complexity_score && (
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Complexity:</span>
                  <span className={cn("font-bold", getComplexityColor(ticket.ai_complexity_score))}>
                    {ticket.ai_complexity_score}/10
                  </span>
                </div>
              )}

              {ticket.ai_sla_factors && ticket.ai_sla_factors.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Factors:</p>
                  {ticket.ai_sla_factors.slice(0, 3).map((factor, i) => (
                    <div key={i} className="flex items-center gap-1 text-xs">
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Suggested KB Articles */}
      {kbArticles && kbArticles.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Suggested Knowledge Base Articles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {kbArticles.map((article) => {
                const relevance = ticket.ai_kb_article_relevance?.[article.id] || 0;
                return (
                  <div 
                    key={article.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                    onClick={() => onViewArticle?.(article.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {article.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {article.category}
                        </Badge>
                        {relevance > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {relevance}% relevant
                          </span>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
