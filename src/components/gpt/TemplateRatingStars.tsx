import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TemplateRatingStarsProps {
  rating: number;
  totalReviews?: number;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onRate?: (rating: number) => void;
  showCount?: boolean;
}

export function TemplateRatingStars({
  rating,
  totalReviews = 0,
  interactive = false,
  size = 'sm',
  onRate,
  showCount = true,
}: TemplateRatingStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const handleClick = (starIndex: number) => {
    if (interactive && onRate) {
      onRate(starIndex);
    }
  };

  // Don't render if no rating and not interactive
  if (!interactive && rating === 0 && totalReviews === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;
          const isFilled = starIndex <= displayRating;
          const isHalfFilled = !isFilled && starIndex - 0.5 <= displayRating;

          return (
            <button
              key={starIndex}
              type="button"
              disabled={!interactive}
              className={cn(
                "relative transition-colors",
                interactive && "cursor-pointer hover:scale-110"
              )}
              onMouseEnter={() => interactive && setHoverRating(starIndex)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              onClick={() => handleClick(starIndex)}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  isFilled
                    ? "fill-yellow-400 text-yellow-400"
                    : isHalfFilled
                    ? "fill-yellow-400/50 text-yellow-400"
                    : "fill-muted text-muted-foreground/30"
                )}
              />
            </button>
          );
        })}
      </div>
      {showCount && rating > 0 && (
        <span className="text-xs text-muted-foreground ml-1">
          {rating.toFixed(1)} {totalReviews > 0 && `(${totalReviews})`}
        </span>
      )}
    </div>
  );
}
