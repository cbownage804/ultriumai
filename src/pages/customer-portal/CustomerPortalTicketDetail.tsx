/**
 * Customer Portal Ticket Detail Page
 * View ticket details, add comments, see status updates
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, Clock, AlertCircle, User, MessageSquare,
  Loader2, Send, Paperclip, CheckCircle, Building
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePortalSession } from '@/hooks/usePortalSession';
import { PortalHeader } from '@/components/customer-portal/PortalHeader';

interface TicketComment {
  id: string;
  content: string;
  author_name: string;
  author_type: 'customer' | 'technician' | 'system';
  created_at: string;
  is_internal: boolean;
}

interface TicketDetail {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  assigned_to_name?: string;
  comments: TicketComment[];
}

export default function CustomerPortalTicketDetail() {
  const navigate = useNavigate();
  const { ticketId } = useParams<{ ticketId: string }>();
  const { session, isLoading: sessionLoading } = usePortalSession();
  
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !session) {
      navigate('/customer-portal/login');
    }
  }, [session, sessionLoading, navigate]);

  useEffect(() => {
    if (session && ticketId) {
      fetchTicket();
    }
  }, [session, ticketId]);

  const fetchTicket = async () => {
    if (!session || !ticketId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('portal-ticket-api', {
        body: { action: 'get', ticketId },
        headers: {
          'x-portal-session': session.sessionToken
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setTicket(data.ticket);
    } catch (error) {
      console.error('Failed to fetch ticket:', error);
      toast.error('Failed to load ticket');
      navigate('/customer-portal/tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!session || !ticketId || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('portal-ticket-api', {
        body: { 
          action: 'comment', 
          ticketId,
          content: newComment.trim()
        },
        headers: {
          'x-portal-session': session.sessionToken
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success('Reply sent!');
      setNewComment('');
      fetchTicket(); // Refresh to show new comment
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to send reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in_progress': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'waiting_on_customer': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'resolved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'closed': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-500/10';
      case 'high': return 'text-orange-400 bg-orange-500/10';
      case 'medium': return 'text-amber-400 bg-amber-500/10';
      case 'low': return 'text-slate-400 bg-slate-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const getCommentAuthorColor = (type: string) => {
    switch (type) {
      case 'technician': return 'bg-cyan-500';
      case 'customer': return 'bg-purple-500';
      case 'system': return 'bg-slate-500';
      default: return 'bg-slate-500';
    }
  };

  if (sessionLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!session || !ticket) return null;

  const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <PortalHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/customer-portal/tickets')}
          className="text-white/60 hover:text-white hover:bg-white/10 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          All Tickets
        </Button>

        {/* Ticket Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-black/40 border-white/10 mb-6">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-xl text-white mb-2">
                    {ticket.subject}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className={getStatusColor(ticket.status)}>
                      {formatStatus(ticket.status)}
                    </Badge>
                    <Badge variant="outline" className={`${getPriorityColor(ticket.priority)} border-current`}>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {ticket.priority}
                    </Badge>
                    {ticket.category && (
                      <Badge variant="outline" className="border-white/20 text-white/60">
                        {ticket.category}
                      </Badge>
                    )}
                  </div>
                </div>
                {isResolved && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 rounded-lg border border-green-500/20">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-sm text-green-400 font-medium">Resolved</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-6 text-sm text-white/50">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Created {new Date(ticket.created_at).toLocaleDateString()} at {new Date(ticket.created_at).toLocaleTimeString()}
                </span>
                {ticket.assigned_to_name && (
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Assigned to {ticket.assigned_to_name}
                  </span>
                )}
              </div>
              
              <Separator className="my-4 bg-white/10" />
              
              <div className="prose prose-invert max-w-none">
                <p className="text-white/80 whitespace-pre-wrap">{ticket.description}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Conversation */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-2 text-white/60">
            <MessageSquare className="h-4 w-4" />
            <span className="font-medium">Conversation</span>
            <span className="text-xs">({ticket.comments?.length || 0} messages)</span>
          </div>

          {ticket.comments?.filter(c => !c.is_internal).map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`bg-black/40 border-white/10 ${
                comment.author_type === 'customer' ? 'ml-8' : 'mr-8'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={getCommentAuthorColor(comment.author_type)}>
                        {comment.author_type === 'technician' ? (
                          <Building className="h-4 w-4" />
                        ) : (
                          comment.author_name?.charAt(0) || 'U'
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white text-sm">
                          {comment.author_name}
                        </span>
                        <Badge variant="outline" className="text-[10px] border-white/20 text-white/40">
                          {comment.author_type === 'technician' ? 'Support' : 'You'}
                        </Badge>
                        <span className="text-xs text-white/40">
                          {new Date(comment.created_at).toLocaleDateString()} at{' '}
                          {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-white/80 text-sm whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {(!ticket.comments || ticket.comments.filter(c => !c.is_internal).length === 0) && (
            <Card className="bg-black/40 border-white/10">
              <CardContent className="py-8 text-center">
                <MessageSquare className="h-8 w-8 text-white/20 mx-auto mb-2" />
                <p className="text-white/50">No messages yet</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Reply Box */}
        {!isResolved && (
          <Card className="bg-black/40 border-white/10">
            <CardContent className="p-4">
              <Textarea
                placeholder="Type your reply..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-24 bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none mb-3"
              />
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" className="text-white/50">
                  <Paperclip className="h-4 w-4 mr-1" />
                  Attach
                </Button>
                <Button
                  onClick={handleAddComment}
                  disabled={isSubmitting || !newComment.trim()}
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Reply
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isResolved && (
          <Card className="bg-green-500/5 border-green-500/20">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-6 w-6 text-green-400 mx-auto mb-2" />
              <p className="text-green-400 font-medium">This ticket has been resolved</p>
              <p className="text-white/50 text-sm mt-1">
                Need more help? <button 
                  onClick={() => navigate('/customer-portal/tickets/new')}
                  className="text-cyan-400 hover:underline"
                >
                  Create a new ticket
                </button>
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
