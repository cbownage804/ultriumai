import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Download, FileArchive, Container, Rocket } from 'lucide-react';
import { toast } from 'sonner';
import { exportProject, type ExportMode, type ExportContext, type EdgeFunctionMeta } from './exportProject';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import type { SupabaseConfig, StripeConfig, ServiceKey, EnvVar } from './ProjectSettings';

interface ExportButtonProps {
  projectName: string;
  files: ProjectFile[];
  supabaseConfig?: SupabaseConfig | null;
  stripeConfig?: StripeConfig | null;
  serviceKeys?: ServiceKey[];
  envVars?: EnvVar[];
  cdnPackages?: Array<{ name: string; version: string }>;
  edgeFunctions?: EdgeFunctionMeta[];
  storageBuckets?: string[];
  authProviders?: string[];
}

export function ExportButton({
  projectName, files,
  supabaseConfig, stripeConfig, serviceKeys, envVars, cdnPackages,
  edgeFunctions, storageBuckets, authProviders,
}: ExportButtonProps) {
  const hasIntegrations = !!(supabaseConfig || stripeConfig || (serviceKeys && serviceKeys.length > 0));

  const handleExport = async (mode: ExportMode) => {
    try {
      const ctx: ExportContext = { supabaseConfig, stripeConfig, serviceKeys, envVars, cdnPackages, edgeFunctions, storageBuckets, authProviders };
      await exportProject(projectName, files, mode, ctx);
      const messages: Record<ExportMode, string> = {
        raw: 'Project files downloaded!',
        docker: 'Docker-ready project downloaded!',
        fullstack: 'Full-stack project downloaded! Check README.md for setup instructions.',
      };
      toast.success(messages[mode]);
    } catch (e) {
      console.error('Export error:', e);
      toast.error('Failed to export project');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
          <Download className="h-3 w-3" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {hasIntegrations && (
          <>
            <DropdownMenuItem onClick={() => handleExport('fullstack')}>
              <Rocket className="h-4 w-4 mr-2 text-cyan-400" />
              <div>
                <div className="font-medium">Full-Stack Export</div>
                <div className="text-xs text-muted-foreground">
                  Includes .env, Supabase client, deps, setup guide
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={() => handleExport('docker')}>
          <Container className="h-4 w-4 mr-2" />
          <div>
            <div className="font-medium">Docker-Ready Export</div>
            <div className="text-xs text-muted-foreground">React + Vite + Dockerfile + nginx</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('raw')}>
          <FileArchive className="h-4 w-4 mr-2" />
          <div>
            <div className="font-medium">Download as ZIP</div>
            <div className="text-xs text-muted-foreground">Raw project files only</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
