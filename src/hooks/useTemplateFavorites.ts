import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface TemplateFavorite {
  id: string;
  template_id: string;
  created_at: string;
}

interface RecentlyUsed {
  template_id: string;
  used_at: string;
  use_count: number;
}

export function useTemplateFavorites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentlyUsed, setRecentlyUsed] = useState<RecentlyUsed[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites and recently used from localStorage (for now, can migrate to Supabase later)
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setRecentlyUsed([]);
      setIsLoading(false);
      return;
    }

    const storageKey = `template_favorites_${user.id}`;
    const recentKey = `template_recent_${user.id}`;
    
    try {
      const savedFavorites = localStorage.getItem(storageKey);
      const savedRecent = localStorage.getItem(recentKey);
      
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
      if (savedRecent) {
        setRecentlyUsed(JSON.parse(savedRecent));
      }
    } catch (error) {
      console.error('Error loading template preferences:', error);
    }
    
    setIsLoading(false);
  }, [user]);

  const toggleFavorite = (templateId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save favorites",
        variant: "destructive",
      });
      return;
    }

    const storageKey = `template_favorites_${user.id}`;
    
    setFavorites(prev => {
      const isFavorite = prev.includes(templateId);
      const updated = isFavorite
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId];
      
      localStorage.setItem(storageKey, JSON.stringify(updated));
      
      toast({
        title: isFavorite ? "Removed from favorites" : "Added to favorites",
        description: isFavorite 
          ? "Template removed from your favorites" 
          : "Template saved to your favorites",
      });
      
      return updated;
    });
  };

  const trackUsage = (templateId: string) => {
    if (!user) return;

    const recentKey = `template_recent_${user.id}`;
    
    setRecentlyUsed(prev => {
      const existing = prev.find(r => r.template_id === templateId);
      let updated: RecentlyUsed[];
      
      if (existing) {
        updated = prev.map(r => 
          r.template_id === templateId 
            ? { ...r, used_at: new Date().toISOString(), use_count: r.use_count + 1 }
            : r
        );
      } else {
        updated = [
          { template_id: templateId, used_at: new Date().toISOString(), use_count: 1 },
          ...prev
        ];
      }
      
      // Keep only the 10 most recent
      updated = updated
        .sort((a, b) => new Date(b.used_at).getTime() - new Date(a.used_at).getTime())
        .slice(0, 10);
      
      localStorage.setItem(recentKey, JSON.stringify(updated));
      return updated;
    });
  };

  const isFavorite = (templateId: string) => favorites.includes(templateId);

  const getRecentTemplateIds = () => recentlyUsed.map(r => r.template_id);

  return {
    favorites,
    recentlyUsed,
    isLoading,
    toggleFavorite,
    trackUsage,
    isFavorite,
    getRecentTemplateIds,
  };
}
