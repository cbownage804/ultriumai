import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Download, FileArchive, Container } from 'lucide-react';
import { toast } from 'sonner';
import { exportProject, type ExportMode } from './exportProject';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface ExportButtonProps {
  projectName: string;
  files: ProjectFile[];
}

export function ExportButton({ projectName, files }: ExportButtonProps) {
  const handleExport = async (mode: ExportMode) => {
    try {
      await exportProject(projectName, files, mode);
      toast.success(
        mode === 'docker'
          ? 'Docker-ready project downloaded!'
          : 'Project files downloaded!'
      );
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
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('raw')}>
          <FileArchive className="h-4 w-4 mr-2" />
          <div>
            <div className="font-medium">Download as ZIP</div>
            <div className="text-xs text-muted-foreground">Raw project files only</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('docker')}>
          <Container className="h-4 w-4 mr-2" />
          <div>
            <div className="font-medium">Docker-Ready Export</div>
            <div className="text-xs text-muted-foreground">React + Vite + Dockerfile + nginx</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
