import { Suspense } from 'react';
import type { SupabaseConfig, GithubConfig, StripeConfig, VercelConfig, ServiceKey, EnvVar } from './ProjectSettings';
import type { CDNPackage } from './PackageManager';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import { PanelErrorBoundary } from './PanelErrorBoundary';
import {
  ProjectSettings, VercelDeployButton, GithubSyncButton, SharePreview, ExportButton,
} from './lazyPanels';

const PanelLoader = () => <div className="flex items-center justify-center h-full text-white/15 text-xs">Loading...</div>;

interface WorkspaceBottomBarProps {
  supabaseConfig: SupabaseConfig | null;
  githubConfig: GithubConfig | null;
  stripeConfig: StripeConfig | null;
  vercelConfig: VercelConfig | null;
  serviceKeys: ServiceKey[];
  envVars: EnvVar[];
  projectName: string;
  projectSlug: string | null;
  showSettingsPanel: boolean;
  setShowSettingsPanel: (v: boolean) => void;
  onSupabaseChange: (v: SupabaseConfig | null) => void;
  onGithubChange: (v: GithubConfig | null) => void;
  onStripeChange: (v: StripeConfig | null) => void;
  onVercelChange: (v: VercelConfig | null) => void;
  onServiceKeysChange: (v: ServiceKey[]) => void;
  onEnvVarsChange: (v: EnvVar[]) => void;
  onDeleteProject: () => void;
  onResetProject: () => void;
  files: ProjectFile[];
  compiledHTML: string | null;
  hostedPreviewUrl: string | null;
  isUploadingPreview: boolean;
  onInstantUpload?: () => void;
  cdnPackages: CDNPackage[];
  edgeFunctions: { name: string; status: 'deployed' | 'draft' | 'error'; lastDeployed?: string }[];
  publishedUrl: string | null;
  currentProjectId: string | null;
  onGithubPullFiles: (files: { path: string; content: string; language: string }[]) => void;
}

export function WorkspaceBottomBar({
  supabaseConfig, githubConfig, stripeConfig, vercelConfig, serviceKeys, envVars,
  projectName, projectSlug, showSettingsPanel, setShowSettingsPanel,
  onSupabaseChange, onGithubChange, onStripeChange, onVercelChange,
  onServiceKeysChange, onEnvVarsChange, onDeleteProject, onResetProject,
  files, compiledHTML, hostedPreviewUrl, isUploadingPreview, onInstantUpload,
  cdnPackages, edgeFunctions, publishedUrl, currentProjectId, onGithubPullFiles,
}: WorkspaceBottomBarProps) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 border-t border-white/[0.06] bg-[#09090b] shrink-0">
      <ProjectSettings
        supabaseConfig={supabaseConfig}
        githubConfig={githubConfig}
        stripeConfig={stripeConfig}
        vercelConfig={vercelConfig}
        serviceKeys={serviceKeys}
        envVars={envVars}
        projectName={projectName}
        projectSlug={projectSlug}
        open={showSettingsPanel}
        onOpenChange={setShowSettingsPanel}
        onSupabaseChange={onSupabaseChange}
        onGithubChange={onGithubChange}
        onStripeChange={onStripeChange}
        onVercelChange={onVercelChange}
        onServiceKeysChange={onServiceKeysChange}
        onEnvVarsChange={onEnvVarsChange}
        onDeleteProject={onDeleteProject}
        onResetProject={onResetProject}
      />
      {vercelConfig && <VercelDeployButton projectName={projectName} files={files} vercelToken={vercelConfig.token} />}
      {githubConfig && <GithubSyncButton projectName={projectName} files={files} githubToken={githubConfig.token} onPullFiles={onGithubPullFiles} />}
      <SharePreview html={compiledHTML} projectName={projectName} shareUrl={hostedPreviewUrl} isUploading={isUploadingPreview} onInstantUpload={onInstantUpload} />
      <ExportButton projectName={projectName} files={files} supabaseConfig={supabaseConfig} stripeConfig={stripeConfig} serviceKeys={serviceKeys} envVars={envVars} cdnPackages={cdnPackages} edgeFunctions={edgeFunctions} publishedUrl={publishedUrl} />
    </div>
  );
}
