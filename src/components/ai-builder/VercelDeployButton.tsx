import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from '@/components/ui/dialog';
import { Rocket, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface VercelDeployButtonProps {
  projectName: string;
  files: ProjectFile[];
  vercelToken: string;
}

export function VercelDeployButton({ projectName, files, vercelToken }: VercelDeployButtonProps) {
  const [open, setOpen] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [name, setName] = useState(projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
  const [deployUrl, setDeployUrl] = useState<string | null>(null);

  const handleDeploy = async () => {
    if (!name.trim() || files.length === 0) return;
    setDeploying(true);
    setDeployUrl(null);

    try {
      const { data, error } = await supabase.functions.invoke('vercel-deploy', {
        body: {
          projectName: name.trim(),
          files: files.map(f => ({ path: f.path, content: f.content })),
          vercelToken,
        },
      });

      if (error) throw error;

      if (data?.url) {
        setDeployUrl(data.url);
        toast.success('Deployed to Vercel!');
      } else {
        toast.success('Deployment initiated');
      }
    } catch (err: any) {
      console.error('Vercel deploy error:', err);
      toast.error(err.message || 'Deployment failed');
    } finally {
      setDeploying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
          <Rocket className="h-3 w-3" />
          Deploy
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            Deploy to Vercel
          </DialogTitle>
          <DialogDescription>
            Deploy your project to Vercel for instant hosting with SSL.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="vercel-name" className="text-xs">Project Name</Label>
            <Input
              id="vercel-name"
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              placeholder="my-app"
              className="text-sm font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              Will be deployed to <code className="bg-muted px-1 rounded">{name || 'my-app'}.vercel.app</code>
            </p>
          </div>

          {deployUrl && (
            <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3">
              <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">🎉 Deployed successfully!</p>
              <a
                href={deployUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                {deployUrl} <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          <Button
            onClick={handleDeploy}
            disabled={deploying || !name.trim()}
            className="w-full text-xs gap-1.5"
          >
            {deploying ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <Rocket className="h-3 w-3" />
                Deploy to Vercel
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
