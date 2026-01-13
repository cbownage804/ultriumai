import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Bot, CheckCircle, XCircle, Edit, Send, AlertTriangle, 
  Brain, Loader2, ThumbsUp, ThumbsDown, Clock
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AITicketReviewProps {
  ticket: {
    id: string;
    title: string;
    description: string;
    requester_name: string;
    requester_email: string;
    priority: string;
    status: string;
    ai_suggested_solution: string | null;
    ai_confidence_score: number | null;
    ai_summary: string | null;
    ai_processing_status: string | null;
    ai_auto_responded: boolean | null;
    tech_action: string | null;
    user_feedback: string | null;
  };
  onActionComplete?: () => void;
}

const AITicketReview = ({ ticket, onActionComplete }: AITicketReviewProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSolution, setEditedSolution] = useState(ticket.ai_suggested_solution || '');
  const [isLoading, setIsLoading] = useState(false);
  const [actionType, setActionType] = useState<string | null>(null);
  const { toast } = useToast();

  const confidenceScore = ticket.ai_confidence_score || 0;
  const isTier1 = confidenceScore >= 85;

  const getConfidenceColor = (score: number) => {
    if (score >= 85) return 'text-green-500 bg-green-500/10';
    if (score >= 60) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-red-500 bg-red-500/10';
  };

  const handleTechAction = async (action: 'accept' | 'edit' | 'reject') => {
    setIsLoading(true);
    setActionType(action);

    try {
      const { data, error } = await supabase.functions.invoke('ai-ticket-agent', {
        body: {
          action: 'tech_review_action',
          ticketId: ticket.id,
          techAction: action,
          editedSolution: action === 'edit' ? editedSolution : undefined,
        },
      });

      if (error) throw error;

      toast({
        title: action === 'reject' ? 'Solution Rejected' : 'Solution Sent',
        description: action === 'reject' 
          ? 'You can now handle this ticket manually'
          : 'The solution has been sent to the user',
      });

      onActionComplete?.();
    } catch (error) {
      console.error('Tech action error:', error);
      toast({
        title: 'Error',
        description: 'Failed to process action',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  const handleProcessTicket = async () => {
    setIsLoading(true);
    setActionType('process');

    try {
      const { error } = await supabase.functions.invoke('ai-ticket-agent', {
        body: {
          action: 'process_new_ticket',
          ticketId: ticket.id,
          ticketData: {
            title: ticket.title,
            description: ticket.description,
            requester_name: ticket.requester_name,
            requester_email: ticket.requester_email,
            priority: ticket.priority,
          },
        },
      });

      if (error) throw error;

      toast({
        title: 'Ticket Processed',
        description: 'AI has analyzed the ticket',
      });

      onActionComplete?.();
    } catch (error) {
      console.error('Process error:', error);
      toast({
        title: 'Error',
        description: 'Failed to process ticket',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  // Show processing state
  if (ticket.ai_processing_status === 'processing') {
    return (
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <span className="text-blue-500 font-medium">AI is analyzing this ticket...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show trigger button if not yet processed
  if (!ticket.ai_suggested_solution && ticket.ai_processing_status !== 'completed') {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Bot className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">AI hasn't analyzed this ticket yet</p>
            <Button onClick={handleProcessTicket} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Brain className="mr-2 h-4 w-4" />
              )}
              Analyze with AI
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show auto-responded state
  if (ticket.ai_auto_responded && ticket.status === 'pending_confirmation') {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5 text-green-500" />
              AI Auto-Responded (Tier 1)
            </CardTitle>
            <Badge variant="outline" className="text-green-500 border-green-500/30">
              <Clock className="h-3 w-3 mr-1" />
              Awaiting User Confirmation
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            AI sent a solution directly to the user with {confidenceScore}% confidence.
            Waiting for user to confirm if the issue is resolved.
          </p>
          
          <div className="bg-background rounded-lg p-4 border">
            <p className="text-sm font-medium mb-2">Solution Sent:</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {ticket.ai_suggested_solution}
            </p>
          </div>

          {ticket.user_feedback && (
            <div className="flex items-center gap-2">
              {ticket.user_feedback === 'resolved' ? (
                <Badge className="bg-green-500">
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  User Confirmed Resolved
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <ThumbsDown className="h-3 w-3 mr-1" />
                  User Needs More Help
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show tech review UI (Tier 2)
  return (
    <Card className="border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="h-5 w-5 text-primary" />
            AI Suggestion
            {isTier1 ? (
              <Badge className="bg-green-500 ml-2">Tier 1 Eligible</Badge>
            ) : (
              <Badge variant="secondary" className="ml-2">Tier 2 - Review Required</Badge>
            )}
          </CardTitle>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(confidenceScore)}`}>
            {confidenceScore}% Confidence
          </div>
        </div>
        {ticket.ai_summary && (
          <CardDescription>{ticket.ai_summary}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* AI Solution */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Suggested Solution
            {!isTier1 && (
              <span className="text-muted-foreground font-normal ml-2">
                (Review before sending to user)
              </span>
            )}
          </label>
          
          {isEditing ? (
            <Textarea
              value={editedSolution}
              onChange={(e) => setEditedSolution(e.target.value)}
              className="min-h-[200px]"
              placeholder="Edit the AI solution..."
            />
          ) : (
            <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap">
              {ticket.ai_suggested_solution}
            </div>
          )}
        </div>

        {/* Warning for low confidence */}
        {confidenceScore < 60 && (
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-600">Low Confidence Score</p>
              <p className="text-muted-foreground">
                AI is uncertain about this solution. Please review carefully before sending.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          {isEditing ? (
            <>
              <Button
                onClick={() => handleTechAction('edit')}
                disabled={isLoading}
              >
                {isLoading && actionType === 'edit' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send Edited Solution
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditedSolution(ticket.ai_suggested_solution || '');
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => handleTechAction('accept')}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading && actionType === 'accept' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Accept & Send
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => handleTechAction('reject')}
                disabled={isLoading}
                className="text-red-500 hover:text-red-600"
              >
                {isLoading && actionType === 'reject' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                Reject & Handle Manually
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AITicketReview;
