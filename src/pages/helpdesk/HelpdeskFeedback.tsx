import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Bot, ArrowRight } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

const HelpdeskFeedback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'escalated'>('loading');
  const [message, setMessage] = useState('');

  const ticketId = searchParams.get('ticket');
  const action = searchParams.get('action');

  useEffect(() => {
    const processFeedback = async () => {
      if (!ticketId || !action) {
        setStatus('error');
        setMessage('Invalid feedback link');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('ai-ticket-agent', {
          body: {
            action: 'user_feedback',
            ticketId,
            feedbackType: action === 'resolved' ? 'resolved' : 'need_help',
          },
        });

        if (error) throw error;

        if (action === 'resolved') {
          setStatus('success');
          setMessage('Thank you! Your ticket has been marked as resolved.');
        } else {
          setStatus('escalated');
          setMessage('A technician will reach out to help you shortly.');
        }
      } catch (error) {
        console.error('Feedback error:', error);
        setStatus('error');
        setMessage('Something went wrong. Please try again or contact support.');
      }
    };

    processFeedback();
  }, [ticketId, action]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'loading' && (
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            )}
            {status === 'success' && (
              <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
            )}
            {status === 'escalated' && (
              <div className="h-16 w-16 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Bot className="h-10 w-10 text-blue-500" />
              </div>
            )}
            {status === 'error' && (
              <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-500" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Processing...'}
            {status === 'success' && 'Issue Resolved!'}
            {status === 'escalated' && 'Help is on the way!'}
            {status === 'error' && 'Something went wrong'}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' && (
            <div className="bg-green-500/10 rounded-lg p-4 text-center">
              <p className="text-sm text-green-700">
                Your feedback helps our AI learn and improve. Thank you for using SafeDesk!
              </p>
            </div>
          )}

          {status === 'escalated' && (
            <div className="bg-blue-500/10 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-700">
                A technician has been notified and will assist you as soon as possible. 
                You'll receive an email with next steps.
              </p>
            </div>
          )}

          <div className="flex justify-center pt-4">
            <Button onClick={() => navigate('/hub')}>
              Return to Hub
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground pt-4">
            Ticket #{ticketId?.slice(0, 8)} • Powered by SafeDesk™
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpdeskFeedback;
