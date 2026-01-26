import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface TemplateRating {
  template_id: string;
  rating: number;
  review?: string;
  created_at: string;
}

interface AggregatedRating {
  template_id: string;
  average_rating: number;
  total_reviews: number;
}

export function useTemplateRatings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userRatings, setUserRatings] = useState<Record<string, TemplateRating>>({});
  const [aggregatedRatings, setAggregatedRatings] = useState<Record<string, AggregatedRating>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load ratings from localStorage (can migrate to Supabase later for shared ratings)
  useEffect(() => {
    if (!user) {
      setUserRatings({});
      setIsLoading(false);
      return;
    }

    const userRatingsKey = `template_ratings_${user.id}`;
    const aggregatedKey = 'template_ratings_aggregated';
    
    try {
      const savedUserRatings = localStorage.getItem(userRatingsKey);
      const savedAggregated = localStorage.getItem(aggregatedKey);
      
      if (savedUserRatings) {
        setUserRatings(JSON.parse(savedUserRatings));
      }
      if (savedAggregated) {
        setAggregatedRatings(JSON.parse(savedAggregated));
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
    }
    
    setIsLoading(false);
  }, [user]);

  const rateTemplate = (templateId: string, rating: number, review?: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to rate templates",
        variant: "destructive",
      });
      return;
    }

    const userRatingsKey = `template_ratings_${user.id}`;
    const aggregatedKey = 'template_ratings_aggregated';
    
    const newRating: TemplateRating = {
      template_id: templateId,
      rating,
      review,
      created_at: new Date().toISOString(),
    };

    // Update user ratings
    const updatedUserRatings = {
      ...userRatings,
      [templateId]: newRating,
    };
    setUserRatings(updatedUserRatings);
    localStorage.setItem(userRatingsKey, JSON.stringify(updatedUserRatings));

    // Update aggregated ratings (simplified - in production this would be server-side)
    const currentAggregated = aggregatedRatings[templateId] || { 
      template_id: templateId, 
      average_rating: 0, 
      total_reviews: 0 
    };
    
    const wasRatedBefore = userRatings[templateId] !== undefined;
    const newTotal = wasRatedBefore ? currentAggregated.total_reviews : currentAggregated.total_reviews + 1;
    
    // Recalculate average (simplified)
    let newAverage: number;
    if (wasRatedBefore) {
      // Update existing rating
      const oldRating = userRatings[templateId].rating;
      const totalPoints = currentAggregated.average_rating * currentAggregated.total_reviews;
      newAverage = (totalPoints - oldRating + rating) / newTotal;
    } else {
      // New rating
      const totalPoints = currentAggregated.average_rating * currentAggregated.total_reviews;
      newAverage = (totalPoints + rating) / newTotal;
    }

    const updatedAggregated = {
      ...aggregatedRatings,
      [templateId]: {
        template_id: templateId,
        average_rating: Math.round(newAverage * 10) / 10,
        total_reviews: newTotal,
      },
    };
    setAggregatedRatings(updatedAggregated);
    localStorage.setItem(aggregatedKey, JSON.stringify(updatedAggregated));

    toast({
      title: "Rating saved",
      description: `You rated this template ${rating} stars`,
    });
  };

  const getUserRating = (templateId: string) => userRatings[templateId];
  
  const getAggregatedRating = (templateId: string) => aggregatedRatings[templateId];

  return {
    userRatings,
    aggregatedRatings,
    isLoading,
    rateTemplate,
    getUserRating,
    getAggregatedRating,
  };
}
