import type { ProjectFile } from '@/hooks/useProjectFileSystem';

export interface PanelGroupSharedProps {
  project: { files: ProjectFile[]; name: string };
  upsertFile: (path: string, content: string) => void;
  activeFile: { path: string; content: string; language?: string } | null;
  setActiveFile: (path: string) => void;
  setRightTab: (tab: 'preview' | 'code' | 'split') => void;
  pushUndo: (label: string, files: ProjectFile[]) => void;
  setFiles: (files: ProjectFile[]) => void;
  sendMessage: (...args: any[]) => void;
  supabaseConfig: any;
  stripeConfig: any;
  serviceKeys: any;
  selectedModel: string;
  publishedUrl: string | null;
  hostedPreviewUrl: string | null;
  previewSlug: string | null;
  currentProjectId: string | null;
}

export function makeInsertCode(activeFile: PanelGroupSharedProps['activeFile'], upsertFile: PanelGroupSharedProps['upsertFile']) {
  return (code: string) => {
    if (activeFile) upsertFile(activeFile.path, activeFile.content + '\n' + code);
  };
}
