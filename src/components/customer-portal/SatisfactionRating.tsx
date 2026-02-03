/**
 * Satisfaction Rating Component
 * Let users rate ticket resolution quality after closure
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Send, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePortalSession } from '@/hooks/usePortalSession';

interface SatisfactionRatingProps {
  ticketId: string;
  existingRating?: {
    rating: number;
    feedback?: string;
  };
  onRated?: () => void;
}

export function SatisfactionRating({ 
  ticketId, 
  existingRating,
  onRated 
}: SatisfactionRatingProps) {
  const { session } = usePortalSession();
  const [rating, setRating] = useState(existingRating?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState(existingRating?.feedback || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(!!existingRating);

  const handleSubmit = async () => {
    if (!session || rating === 0) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('ticket_satisfaction_ratings')
        .upsert({
          ticket_id: ticketId,
          portal_user_id: session.user.id,
          rating,
          feedback: feedback.trim() || null
        }, {
          onConflict: 'ticket_id'
        });

      if (error) throw error;

      toast.success('Thank you for your feedback!');
      setIsSubmitted(true);
      onRated?.();
    } catch (error) {
      console.error('Failed to submit rating:', error);
      toast.error('Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  if (isSubmitted) {
    return (
      <Card className="bg-green-500/5 border-green-500/20">
        <CardContent className="p-4 text-center">
          <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
          <p className="text-green-400 font-medium">Thank you for your feedback!</p>
          <div className="flex justify-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= rating 
                    ? 'text-amber-400 fill-amber-400' 
                    : 'text-white/20'
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40 border-white/10">
      <CardContent className="p-4">
        <h4 className="text-white font-medium mb-3">How was your experience?</h4>
        
        {/* Star Rating */}
        <div className="flex items-center gap-1 mb-3">
          {[1, 2, 3, 4, 5].map(star => (
            <motion.button
              key={star}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
              className="p-1"
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  star <= (hoveredRating || rating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-white/20'
                }`}
              />
            </motion.button>
          ))}
          <AnimatePresence mode="wait">
            {(hoveredRating || rating) > 0 && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="ml-3 text-sm text-white/60"
              >
                {ratingLabels[hoveredRating || rating]}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {rating > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <Textarea
                placeholder="Tell us more about your experience (optional)"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
                rows={3}
              />
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Submit Rating
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
