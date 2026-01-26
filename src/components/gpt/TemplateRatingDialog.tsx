import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { TemplateRatingStars } from './TemplateRatingStars';
import { GPTTemplate } from '@/types/templates';

interface TemplateRatingDialogProps {
  template: GPTTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (templateId: string, rating: number, review?: string) => void;
  existingRating?: number;
  existingReview?: string;
}

export function TemplateRatingDialog({
  template,
  open,
  onOpenChange,
  onSubmit,
  existingRating = 0,
  existingReview = '',
}: TemplateRatingDialogProps) {
  const [rating, setRating] = useState(existingRating);
  const [review, setReview] = useState(existingReview);

  const handleSubmit = () => {
    if (template && rating > 0) {
      onSubmit(template.id, rating, review || undefined);
      onOpenChange(false);
      setRating(0);
      setReview('');
    }
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{template.icon}</span>
            Rate {template.name}
          </DialogTitle>
          <DialogDescription>
            Share your experience with this template
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex flex-col items-center gap-2">
            <Label className="text-sm font-medium">Your Rating</Label>
            <TemplateRatingStars
              rating={rating}
              interactive
              size="lg"
              onRate={setRating}
              showCount={false}
            />
            <span className="text-sm text-muted-foreground">
              {rating === 0 && "Click to rate"}
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Great"}
              {rating === 5 && "Excellent!"}
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review">Review (optional)</Label>
            <Textarea
              id="review"
              placeholder="Share your thoughts about this template..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={rating === 0}>
            Submit Rating
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
