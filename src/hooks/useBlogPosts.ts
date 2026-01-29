import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  author_id: string | null;
  category: string | null;
  tags: string[] | null;
  featured_image: string | null;
  published: boolean | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface UseBlogPostsOptions {
  category?: string;
  published?: boolean;
  limit?: number;
  featured?: boolean;
}

export const useBlogPosts = (options: UseBlogPostsOptions = {}) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { category, published = true, limit, featured } = options;

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('blog_posts')
          .select('*')
          .order('published_at', { ascending: false, nullsFirst: false });

        if (published !== undefined) {
          query = query.eq('published', published);
        }

        if (category && category !== 'all') {
          query = query.eq('category', category);
        }

        if (limit) {
          query = query.limit(limit);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        let filteredPosts = data || [];
        
        // Filter featured posts client-side since we don't have a featured column
        // This can be extended later if needed
        
        setPosts(filteredPosts);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [category, published, limit, featured]);

  return { posts, loading, error };
};

export const useBlogPost = (slugOrId: string) => {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slugOrId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Try by slug first, then by ID
        let { data, error: fetchError } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slugOrId)
          .eq('published', true)
          .single();

        if (fetchError && fetchError.code === 'PGRST116') {
          // Not found by slug, try by ID
          const { data: idData, error: idError } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('id', slugOrId)
            .eq('published', true)
            .single();

          if (idError) throw idError;
          data = idData;
        } else if (fetchError) {
          throw fetchError;
        }

        setPost(data);
      } catch (err) {
        console.error('Error fetching blog post:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slugOrId]);

  return { post, loading, error };
};

export const useCategories = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('category')
          .eq('published', true)
          .not('category', 'is', null);

        if (error) throw error;

        const uniqueCategories = [...new Set(data?.map(p => p.category).filter(Boolean))] as string[];
        setCategories(['all', ...uniqueCategories.sort()]);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategories(['all']);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading };
};
