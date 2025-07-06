import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MessageSquare, Lock, Send, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useHelpdeskRole } from "@/hooks/useHelpdeskRole";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  content: string;
  is_internal: boolean;
  visibility_level: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string;
    email: string;
  } | null;
}

interface TicketCommentsProps {
  ticketId: string;
}

export const TicketComments = ({ ticketId }: TicketCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { canCreateInternalComments, canViewInternalNotes, isMSPUser } = useHelpdeskRole();

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_comments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: ticketId,
          content: newComment,
          is_internal: isInternal,
          visibility_level: isInternal ? 'msp_only' : 'all',
          user_id: 'current-user' // Will be replaced by auth trigger
        });

      if (error) throw error;

      setNewComment("");
      setIsInternal(false);
      loadComments();

      toast({
        title: "Success",
        description: "Comment added successfully"
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [ticketId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comments & Updates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Comments */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No comments yet. Be the first to add one!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium text-sm">
                      User #{comment.user_id.slice(0, 8)}
                    </span>
                    {comment.is_internal && canViewInternalNotes() && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Internal
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap pl-6">
                  {comment.content}
                </p>
              </div>
            ))
          )}
        </div>

        <Separator />

        {/* Add New Comment */}
        <div className="space-y-3">
          <Textarea
            placeholder="Add a comment or update..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px]"
          />
          
          {canCreateInternalComments() && (
            <div className="flex items-center gap-2">
              <Switch
                id="internal-comment"
                checked={isInternal}
                onCheckedChange={setIsInternal}
              />
              <Label htmlFor="internal-comment" className="text-sm">
                Internal comment (only visible to MSP staff)
              </Label>
            </div>
          )}

          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              {isMSPUser() ? 
                "Comments are visible to client unless marked as internal" :
                "Comments are visible to your MSP support team"
              }
            </p>
            <Button 
              onClick={addComment} 
              disabled={!newComment.trim() || submitting}
              size="sm"
            >
              <Send className="w-4 h-4 mr-2" />
              {submitting ? "Adding..." : "Add Comment"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
