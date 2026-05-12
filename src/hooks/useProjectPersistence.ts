import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ProjectFile } from './useProjectFileSystem';
import { hasUserGeneratedFiles } from '@/components/ai-builder/goldenTemplate';

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

export interface DeploymentRecord {
  id: string;
  version: number;
  timestamp: Date;
  status: 'success' | 'failed' | 'building';
  url?: string;
  fileCount: number;
  totalSizeKB: number;
  duration?: number;
  compiledHtml?: string;
}

const DEPLOY_HISTORY_KEY = 'deploy-history';

function loadDeployHistory(projectId: string): DeploymentRecord[] {
  try {
    const raw = localStorage.getItem(`${DEPLOY_HISTORY_KEY}-${projectId}`);
    if (!raw) return [];
    return JSON.parse(raw).map((d: any) => ({ ...d, timestamp: new Date(d.timestamp) }));
  } catch { return []; }
}

function persistDeployHistory(projectId: string, history: DeploymentRecord[]) {
  try {
    const toSave = history.slice(0, 20).map((d, i) => ({
      ...d,
      compiledHtml: i < 3 ? d.compiledHtml : undefined,
    }));
    localStorage.setItem(`${DEPLOY_HISTORY_KEY}-${projectId}`, JSON.stringify(toSave));
  } catch { /* ignore */ }
}

/** Phase 87: BroadcastChannel for multi-tab conflict detection */
const CHANNEL_NAME = 'ai-builder-sync';

export function useProjectPersistence() {
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [deployHistory, setDeployHistory] = useState<DeploymentRecord[]>([]);
  const [tabConflict, setTabConflict] = useState(false);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const hasUnsavedRef = useRef(false);

  // Phase 87: Set up BroadcastChannel for multi-tab sync
  useEffect(() => {
    try {
      channelRef.current = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current.onmessage = (e) => {
        if (e.data?.type === 'project-saved' && e.data.projectId === currentProjectId) {
          if (hasUnsavedRef.current) {
            setTabConflict(true);
            toast.warning('Project modified in another tab — reload to see latest changes', { duration: 8000 });
          } else {
            // No local changes, silently accept
            setLastSaved(new Date(e.data.savedAt));
          }
        }
      };
    } catch {
      // BroadcastChannel not supported
    }
    return () => {
      channelRef.current?.close();
    };
  }, [currentProjectId]);

  // Load deploy history when project changes
  useEffect(() => {
    if (currentProjectId) {
      setDeployHistory(loadDeployHistory(currentProjectId));
    } else {
      setDeployHistory([]);
    }
  }, [currentProjectId]);

  useEffect(() => {
    if (currentProjectId && deployHistory.length > 0) {
      persistDeployHistory(currentProjectId, deployHistory);
    }
  }, [deployHistory, currentProjectId]);

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
        hasUnsavedRef.current = false;
        // Phase 87: Notify other tabs
        channelRef.current?.postMessage({
          type: 'project-saved',
          projectId: currentProjectId,
          savedAt: new Date().toISOString(),
        });
        return currentProjectId;
      } else {
        // Guard: never auto-create a new project row when there is no real user content.
        // Prevents stray "Untitled Project" rows from spawning on each session/rollback.
        if (!hasUserGeneratedFiles(files)) {
          return null;
        }
        const { data, error } = await supabase
          .from('builder_projects')
          .insert(projectData)
          .select('id')
          .single();
        if (error) throw error;
        setCurrentProjectId(data.id);
        setLastSaved(new Date());
        hasUnsavedRef.current = false;
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
      setTabConflict(false);
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
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch name first so we can also clean preview/settings/domain rows tied to slug
      const { data: existingProject } = await supabase
        .from('builder_projects')
        .select('name')
        .eq('id', projectId)
        .maybeSingle();

      const { error } = await supabase
        .from('builder_projects')
        .delete()
        .eq('id', projectId);
      if (error) throw error;

      if (user && existingProject?.name) {
        const slug = existingProject.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 30);

        if (slug) {
          const [{ error: livePreviewDeleteError }, { error: settingsDeleteError }, { error: domainsDeleteError }, { error: storageDeleteError }] = await Promise.all([
            supabase.from('app_builder_live_previews').delete().eq('user_id', user.id).eq('project_slug', slug),
            (supabase as any).from('app_builder_project_settings').delete().eq('user_id', user.id).eq('project_slug', slug),
            (supabase as any).from('app_builder_domains').delete().eq('user_id', user.id).eq('project_slug', slug),
            supabase.storage.from('published-apps').remove([
              `${user.id}/previews/${slug}/index.html`,
              `${user.id}/${slug}/index.html`,
            ]),
          ]);

          if (livePreviewDeleteError) console.warn('Failed to delete live preview rows:', livePreviewDeleteError);
          if (settingsDeleteError) console.warn('Failed to delete project settings rows:', settingsDeleteError);
          if (domainsDeleteError) console.warn('Failed to delete project domains rows:', domainsDeleteError);
          if (storageDeleteError) console.warn('Failed to delete preview storage files:', storageDeleteError);
        }
      }

      try { localStorage.removeItem(`${DEPLOY_HISTORY_KEY}-${projectId}`); } catch { /* */ }
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
    const startTime = Date.now();
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

      let attempt = 0;
      while (attempt < 10) {
        const { data: existing } = await supabase.storage
          .from('published-apps')
          .list('previews', { search: slug });
        
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
      const duration = Date.now() - startTime;

      if (currentProjectId) {
        await supabase
          .from('builder_projects')
          .update({ is_published: true, published_url: publishedUrl })
          .eq('id', currentProjectId);
      }

      const newVersion = (deployHistory[0]?.version || 0) + 1;
      const sizeKB = Math.round(new Blob([compiledHtml]).size / 1024);

      const deployment: DeploymentRecord = {
        id: crypto.randomUUID(),
        version: newVersion,
        timestamp: new Date(),
        status: 'success',
        url: publishedUrl,
        fileCount: (compiledHtml.match(/<style/gi) || []).length + (compiledHtml.match(/<script/gi) || []).length + 1,
        totalSizeKB: sizeKB,
        duration,
        compiledHtml,
      };

      setDeployHistory(prev => [deployment, ...prev].slice(0, 50));

      return publishedUrl;
    } catch (err) {
      console.error('Publish failed:', err);

      const newVersion = (deployHistory[0]?.version || 0) + 1;
      const failedDeploy: DeploymentRecord = {
        id: crypto.randomUUID(),
        version: newVersion,
        timestamp: new Date(),
        status: 'failed',
        fileCount: 0,
        totalSizeKB: 0,
        duration: Date.now() - startTime,
      };
      setDeployHistory(prev => [failedDeploy, ...prev].slice(0, 50));

      toast.error('Failed to publish');
      return null;
    }
  }, [currentProjectId, deployHistory]);

  const rollbackToVersion = useCallback(async (
    name: string,
    deploymentId: string,
  ): Promise<string | null> => {
    const target = deployHistory.find(d => d.id === deploymentId);
    if (!target?.compiledHtml) {
      toast.error('Snapshot not available for this version');
      return null;
    }

    toast.info(`Rolling back to v${target.version}...`);
    const result = await publishProject(name, target.compiledHtml);
    if (result) {
      toast.success(`Rolled back to v${target.version}`);
    }
    return result;
  }, [deployHistory, publishProject]);

  // Track unsaved state for multi-tab conflict detection
  const markUnsaved = useCallback(() => {
    hasUnsavedRef.current = true;
  }, []);

  /**
   * Reset active project identity/state for a truly fresh workspace session.
   * Prevents accidental autosave into the previous project.
   */
  const resetCurrentProject = useCallback(() => {
    setCurrentProjectId(null);
    setLastSaved(null);
    setDeployHistory([]);
    setTabConflict(false);
    hasUnsavedRef.current = false;
  }, []);

  const scheduleAutoSave = useCallback((name: string, files: ProjectFile[], chatMessages?: any[], extraSettings?: Record<string, any>) => {
    hasUnsavedRef.current = true;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      if (files.length > 0) {
        saveProject(name, files, undefined, undefined, chatMessages, extraSettings);
      }
    }, 5000); // Save after 5s of inactivity so projects appear in recents quickly
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
    deployHistory,
    tabConflict,
    loadProjects,
    saveProject,
    loadProject,
    deleteProject,
    publishProject,
    rollbackToVersion,
    scheduleAutoSave,
    resetCurrentProject,
    setCurrentProjectId,
    markUnsaved,
  };
}
