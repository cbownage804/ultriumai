import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface KBArticle {
  id: string;
  user_id: string;
  title: string;
  content: string;
  summary: string | null;
  category: string;
  tags: string[];
  is_published: boolean;
  is_internal: boolean;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  related_articles: string[];
  created_at: string;
  updated_at: string;
}

export interface KBStats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalViews: number;
}

export const useKnowledgeBase = () => {
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [stats, setStats] = useState<KBStats>({
    totalArticles: 0,
    publishedArticles: 0,
    draftArticles: 0,
    totalViews: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();
  const { toast } = useToast();

  // Load articles
  const loadArticles = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('knowledge_base_articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const articlesData = (data || []) as unknown as KBArticle[];
      setArticles(articlesData);

      // Calculate stats
      const published = articlesData.filter(a => a.is_published).length;
      const totalViews = articlesData.reduce((sum, a) => sum + a.view_count, 0);

      setStats({
        totalArticles: articlesData.length,
        publishedArticles: published,
        draftArticles: articlesData.length - published,
        totalViews
      });

      return articlesData;
    } catch (error) {
      console.error('Error loading articles:', error);
      return [];
    }
  }, [user]);

  // Create article
  const createArticle = async (articleData: Partial<KBArticle>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('knowledge_base_articles')
        .insert({
          user_id: user.id,
          title: articleData.title || 'Untitled Article',
          content: articleData.content || '',
          summary: articleData.summary,
          category: articleData.category || 'general',
          tags: articleData.tags || [],
          is_published: articleData.is_published ?? false,
          is_internal: articleData.is_internal ?? false
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Article Created",
        description: "Knowledge base article has been created"
      });

      await loadArticles();
      return data;
    } catch (error) {
      console.error('Error creating article:', error);
      toast({
        title: "Error",
        description: "Failed to create article",
        variant: "destructive"
      });
      return null;
    }
  };

  // Update article
  const updateArticle = async (articleId: string, updates: Partial<KBArticle>) => {
    try {
      const { data, error } = await supabase
        .from('knowledge_base_articles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', articleId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Article Updated",
        description: "Changes have been saved"
      });

      await loadArticles();
      return data;
    } catch (error) {
      console.error('Error updating article:', error);
      toast({
        title: "Error",
        description: "Failed to update article",
        variant: "destructive"
      });
      return null;
    }
  };

  // Delete article
  const deleteArticle = async (articleId: string) => {
    try {
      const { error } = await supabase
        .from('knowledge_base_articles')
        .delete()
        .eq('id', articleId);

      if (error) throw error;

      setArticles(prev => prev.filter(a => a.id !== articleId));

      toast({
        title: "Article Deleted",
        description: "Article has been removed"
      });

      return true;
    } catch (error) {
      console.error('Error deleting article:', error);
      toast({
        title: "Error",
        description: "Failed to delete article",
        variant: "destructive"
      });
      return false;
    }
  };

  // Publish/unpublish article
  const togglePublish = async (articleId: string) => {
    const article = articles.find(a => a.id === articleId);
    if (!article) return null;

    return updateArticle(articleId, { is_published: !article.is_published });
  };

  // Record view
  const recordView = async (articleId: string) => {
    try {
      const article = articles.find(a => a.id === articleId);
      if (!article) return;

      await supabase
        .from('knowledge_base_articles')
        .update({ view_count: article.view_count + 1 })
        .eq('id', articleId);

      setArticles(prev =>
        prev.map(a =>
          a.id === articleId ? { ...a, view_count: a.view_count + 1 } : a
        )
      );
    } catch (error) {
      console.error('Error recording view:', error);
    }
  };

  // Rate article
  const rateArticle = async (articleId: string, helpful: boolean) => {
    try {
      const article = articles.find(a => a.id === articleId);
      if (!article) return;

      const updates = helpful
        ? { helpful_count: article.helpful_count + 1 }
        : { not_helpful_count: article.not_helpful_count + 1 };

      await supabase
        .from('knowledge_base_articles')
        .update(updates)
        .eq('id', articleId);

      setArticles(prev =>
        prev.map(a =>
          a.id === articleId
            ? { ...a, ...updates }
            : a
        )
      );

      toast({
        title: "Thanks for your feedback!",
        description: helpful ? "Glad this was helpful" : "We'll work to improve this"
      });
    } catch (error) {
      console.error('Error rating article:', error);
    }
  };

  // Search articles
  const searchArticles = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return articles.filter(a =>
      a.title.toLowerCase().includes(lowerQuery) ||
      a.content.toLowerCase().includes(lowerQuery) ||
      a.tags.some(t => t.toLowerCase().includes(lowerQuery))
    );
  };

  // Initialize
  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    loadArticles().finally(() => setIsLoading(false));
  }, [user, loadArticles]);

  // Helpers
  const getArticlesByCategory = (category: string) => articles.filter(a => a.category === category);
  const getPublishedArticles = () => articles.filter(a => a.is_published);
  const getDraftArticles = () => articles.filter(a => !a.is_published);

  return {
    articles,
    stats,
    isLoading,
    
    // Operations
    createArticle,
    updateArticle,
    deleteArticle,
    togglePublish,
    recordView,
    rateArticle,
    searchArticles,
    loadArticles,
    
    // Helpers
    getArticlesByCategory,
    getPublishedArticles,
    getDraftArticles
  };
};
