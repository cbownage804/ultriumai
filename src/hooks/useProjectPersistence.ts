import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ProjectFile } from './useProjectFileSystem';

export interface SavedProject {
  id: string;
  name: string;
  files: ProjectFile[];
  branches: any;
  active_branch: string;
  settings: any;
  is_published: boolean;
  published_url: string | null;
  last_saved_at: string;
  created_at: string;
  updated_at: string;
}

export function useProjectPersistence() {
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('builder_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSavedProjects((data || []) as unknown as SavedProject[]);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  }, []);

  const saveProject = useCallback(async (
    name: string,
    files: ProjectFile[],
    branches?: any,
    activeBranch?: string,
    chatMessages?: any[],
    extraSettings?: Record<string, any>,
  ) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Sign in to save projects');
        return null;
      }

      const projectData: any = {
        user_id: user.id,
        name,
        files: JSON.parse(JSON.stringify(files)),
        branches: branches || [{ id: 'main', name: 'main', isActive: true }],
        active_branch: activeBranch || 'main',
        last_saved_at: new Date().toISOString(),
      };
      const settings: Record<string, any> = {};
      if (chatMessages) {
        settings.chatMessages = JSON.parse(JSON.stringify(chatMessages));
      }
      if (extraSettings) {
        Object.assign(settings, extraSettings);
      }
      if (Object.keys(settings).length > 0) {
        projectData.settings = settings;
      }

      if (currentProjectId) {
        const { error } = await supabase
          .from('builder_projects')
          .update(projectData)
          .eq('id', currentProjectId);
        if (error) throw error;
        setLastSaved(new Date());
        return currentProjectId;
      } else {
        const { data, error } = await supabase
          .from('builder_projects')
          .insert(projectData)
          .select('id')
          .single();
        if (error) throw error;
        setCurrentProjectId(data.id);
        setLastSaved(new Date());
        return data.id;
      }
    } catch (err) {
      console.error('Save failed:', err);
      toast.error('Failed to save project');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [currentProjectId]);

  const loadProject = useCallback(async (projectId: string): Promise<SavedProject | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('builder_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setCurrentProjectId(projectId);
      setLastSaved(new Date(data.updated_at));
      return data as unknown as SavedProject;
    } catch (err) {
      console.error('Load failed:', err);
      toast.error('Failed to load project');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteProject = useCallback(async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('builder_projects')
        .delete()
        .eq('id', projectId);
      if (error) throw error;
      setSavedProjects(prev => prev.filter(p => p.id !== projectId));
      if (currentProjectId === projectId) setCurrentProjectId(null);
      toast.success('Project deleted');
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete project');
    }
  }, [currentProjectId]);

  const publishProject = useCallback(async (
    name: string,
    compiledHtml: string,
  ): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Sign in to publish');
        return null;
      }

      const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'app';
      const projectSuffix = currentProjectId
        ? currentProjectId.split('-')[0]
        : crypto.randomUUID().split('-')[0];
      let slug = `${baseSlug}--${projectSuffix}`;

      // Check if slug is already taken by another user, increment if needed
      let attempt = 0;
      while (attempt < 10) {
        const checkPath = `${user.id}/${slug}/index.html`;
        // If this is our own project re-publishing, upsert will handle it
        // Check if any OTHER user has this slug by listing all previews
        const { data: existing } = await supabase.storage
          .from('published-apps')
          .list('previews', { search: slug });
        
        // Also check the user's own folder - if it exists and belongs to current project, allow overwrite
        const { data: ownFiles } = await supabase.storage
          .from('published-apps')
          .list(`${user.id}/${slug}`);

        const isOwnExisting = ownFiles && ownFiles.length > 0;
        const isNewSlug = !existing || existing.length === 0;

        if (isNewSlug || isOwnExisting) break;

        attempt++;
        slug = `${baseSlug}--${projectSuffix}-${attempt}`;
      }

      const filePath = `${user.id}/${slug}/index.html`;

      const { error } = await supabase.storage
        .from('published-apps')
        .upload(filePath, new Blob([compiledHtml], { type: 'text/html' }), {
          upsert: true,
          contentType: 'text/html',
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('published-apps')
        .getPublicUrl(filePath);

      const publishedUrl = urlData.publicUrl;

      // Update project record
      if (currentProjectId) {
        await supabase
          .from('builder_projects')
          .update({ is_published: true, published_url: publishedUrl })
          .eq('id', currentProjectId);
      }

      return publishedUrl;
    } catch (err) {
      console.error('Publish failed:', err);
      toast.error('Failed to publish');
      return null;
    }
  }, [currentProjectId]);

  // Auto-save setup
  const scheduleAutoSave = useCallback((name: string, files: ProjectFile[], chatMessages?: any[]) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      if (files.length > 0) {
        saveProject(name, files, undefined, undefined, chatMessages);
      }
    }, 30000); // Auto-save every 30s after changes
  }, [saveProject]);

  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  return {
    savedProjects,
    currentProjectId,
    isSaving,
    isLoading,
    lastSaved,
    loadProjects,
    saveProject,
    loadProject,
    deleteProject,
    publishProject,
    scheduleAutoSave,
    setCurrentProjectId,
  };
}
