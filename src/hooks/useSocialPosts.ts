import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface SocialPost {
  id: string;
  title: string;
  post_content: string;
  platforms: string[];
  status: string;
  scheduled_at: string | null;
  posted_at: string | null;
  bundle_post_id: string | null;
  image_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BundleAccount {
  id: string;
  platform: string;
  name: string;
  username?: string;
  avatar?: string;
}

export function useSocialPosts() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all posts
  const { data: posts, isLoading: postsLoading, error: postsError } = useQuery({
    queryKey: ['social-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_social_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SocialPost[];
    },
  });

  // Fetch Bundle.Social accounts
  const { data: bundleAccounts, isLoading: accountsLoading, error: accountsError } = useQuery({
    queryKey: ['bundle-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-bundle-accounts');
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.accounts as BundleAccount[];
    },
  });

  // Generate post content
  const generatePost = useMutation({
    mutationFn: async ({ 
      topic, 
      tone, 
      platforms, 
      additionalContext,
      contentType,
    }: { 
      topic: string; 
      tone?: string; 
      platforms?: string[]; 
      additionalContext?: string;
      contentType?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-social-post', {
        body: { topic, tone, platforms, additionalContext, contentType },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.content as string;
    },
    onError: (error) => {
      toast({
        title: 'Generation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Generate image
  const generateImage = useMutation({
    mutationFn: async ({ 
      prompt, 
      aspectRatio 
    }: { 
      prompt: string; 
      aspectRatio?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-social-image', {
        body: { prompt, aspectRatio },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.imageUrl as string;
    },
    onError: (error) => {
      toast({
        title: 'Image Generation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Schedule/publish post
  const schedulePost = useMutation({
    mutationFn: async ({ 
      title, 
      content, 
      platforms, 
      scheduledAt, 
      imageUrl 
    }: { 
      title: string;
      content: string; 
      platforms: string[]; 
      scheduledAt?: string;
      imageUrl?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('schedule-bundle-post', {
        body: { 
          title,
          content, 
          platforms, 
          scheduledAt, 
          imageUrl,
          userId: user?.id,
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      toast({
        title: data.scheduled ? 'Post Scheduled' : 'Post Published',
        description: data.scheduled 
          ? 'Your post has been scheduled successfully.' 
          : 'Your post has been published to the selected platforms.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Posting Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete post
  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('scheduled_social_posts')
        .delete()
        .eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      toast({
        title: 'Post Deleted',
        description: 'The post has been removed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    posts,
    postsLoading,
    postsError,
    bundleAccounts,
    accountsLoading,
    accountsError,
    generatePost,
    generateImage,
    schedulePost,
    deletePost,
  };
}
