import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TicketAISummaryProps {
  ticket: {
    id: string;
    title: string;
    description: string;
    ai_summary?: string;
    priority: string;
    category: string;
    asset_name?: string;
    requester_name?: string;
  };
  onSummaryUpdate?: (ticketId: string, summary: string) => void;
}

export const TicketAISummary = ({ ticket, onSummaryUpdate }: TicketAISummaryProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState(ticket.ai_summary || '');

  const generateAISummary = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-helpdesk-assistant', {
        body: {
          action: 'generate_summary',
          ticketData: {
            title: ticket.title,
            description: ticket.description,
            priority: ticket.priority,
            category: ticket.category,
            asset_name: ticket.asset_name,
            requester_name: ticket.requester_name
          }
        }
      });

      if (error) throw error;

      const newSummary = data.summary;
      setSummary(newSummary);

      // Update the database
      const { error: updateError } = await supabase
        .from('support_tickets')
        .update({ ai_summary: newSummary })
        .eq('id', ticket.id);

      if (updateError) throw updateError;

      onSummaryUpdate?.(ticket.id, newSummary);
      toast.success('AI summary generated successfully');

    } catch (error) {
      console.error('Error generating AI summary:', error);
      toast.error('Failed to generate AI summary');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Summary
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={generateAISummary}
            disabled={isGenerating}
            className="h-8"
          >
            {isGenerating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            {isGenerating ? 'Generating...' : 'Regenerate'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {summary ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {summary}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">
                Priority: {ticket.priority}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Category: {ticket.category}
              </Badge>
              {ticket.asset_name && (
                <Badge variant="outline" className="text-xs">
                  Asset: {ticket.asset_name}
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              No AI summary available yet
            </p>
            <Button 
              onClick={generateAISummary} 
              disabled={isGenerating}
              size="sm"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate Summary
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};