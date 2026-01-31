import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export default function SurveyPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [surveyData, setSurveyData] = useState<{
    ticketTitle?: string;
    clientName?: string;
    technicianName?: string;
    userId?: string;
    templateId?: string;
    ticketId?: string;
  } | null>(null);
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setError('Invalid survey link');
      setIsLoading(false);
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const { data, error: tokenError } = await (supabase as any)
        .from('vanguard_survey_tokens')
        .select('*')
        .eq('token', token)
        .single();

      if (tokenError || !data) {
        setError('Invalid or expired survey link');
        return;
      }

      if (data.is_used) {
        setError('This survey has already been completed');
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setError('This survey link has expired');
        return;
      }

      setSurveyData({
        ticketTitle: data.ticket_title,
        clientName: data.client_name,
        technicianName: data.technician_name,
        userId: data.user_id,
        templateId: data.template_id,
        ticketId: data.ticket_id,
      });
    } catch (err) {
      console.error('Token validation error:', err);
      setError('Failed to load survey');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0 || npsScore === null) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Insert response
      const { error: responseError } = await (supabase as any)
        .from('vanguard_survey_responses')
        .insert({
          user_id: surveyData?.userId,
          template_id: surveyData?.templateId,
          ticket_id: surveyData?.ticketId,
          ticket_title: surveyData?.ticketTitle,
          client_name: surveyData?.clientName,
          rating,
          nps_score: npsScore,
          feedback: feedback.trim() || null,
          technician_name: surveyData?.technicianName,
        });

      if (responseError) throw responseError;

      // Mark token as used
      await (supabase as any)
        .from('vanguard_survey_tokens')
        .update({ is_used: true })
        .eq('token', token);

      setSubmitted(true);
    } catch (err) {
      console.error('Survey submission error:', err);
      setError('Failed to submit survey. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Survey Unavailable</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
            <p className="text-muted-foreground">
              Your feedback has been submitted successfully. We appreciate you taking the time to share your experience.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <CardTitle>How was your experience?</CardTitle>
          <CardDescription>
            {surveyData?.ticketTitle && (
              <span className="block mt-1">Regarding: {surveyData.ticketTitle}</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Star Rating */}
          <div className="space-y-3">
            <Label className="text-center block">Rate your overall satisfaction</Label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      'h-10 w-10 transition-colors',
                      (hoverRating || rating) >= star
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-muted-foreground/30'
                    )}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {rating === 0 ? 'Click to rate' : 
               rating === 1 ? 'Poor' :
               rating === 2 ? 'Fair' :
               rating === 3 ? 'Good' :
               rating === 4 ? 'Very Good' : 'Excellent'}
            </p>
          </div>

          {/* NPS Score */}
          <div className="space-y-3">
            <Label className="text-center block">
              How likely are you to recommend us? (0-10)
            </Label>
            <div className="flex justify-center gap-1 flex-wrap">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setNpsScore(score)}
                  className={cn(
                    'w-9 h-9 rounded-lg text-sm font-medium transition-all',
                    npsScore === score
                      ? score >= 9 ? 'bg-green-500 text-white' :
                        score >= 7 ? 'bg-yellow-500 text-white' :
                        'bg-red-500 text-white'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  {score}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>Not likely</span>
              <span>Very likely</span>
            </div>
          </div>

          {/* Feedback */}
          <div className="space-y-3">
            <Label htmlFor="feedback">Additional feedback (optional)</Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us more about your experience..."
              rows={4}
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || npsScore === null || isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Feedback'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
