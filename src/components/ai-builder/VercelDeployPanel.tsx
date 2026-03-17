import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Rocket, Loader2, ExternalLink, Globe, Key, ChevronRight, CheckCircle2, XCircle, Settings, RefreshCw, Link } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import type { EnvVar } from './ProjectSettings';
import { cn } from '@/lib/utils';

interface VercelDeployPanelProps {
  open: boolean;
  onClose: () => void;
  projectName: string;
  files: ProjectFile[];
  vercelToken: string;
  envVars?: EnvVar[];
  customDomain?: string;
  /** Latest test suite results — blocks deploy if tests fail */
  testsPassed?: boolean;
  testsRan?: boolean;
  onRunTests?: () => Promise<boolean>;
}

type DeployStep = 'configure' | 'deploying' | 'success' | 'error';

interface DeployResult {
  url: string;
  deployId: string;
  readyState: string;
}

export function VercelDeployPanel({
  open,
  onClose,
  projectName,
  files,
  vercelToken,
  envVars = [],
  customDomain,
  testsPassed,
  testsRan,
  onRunTests,
}: VercelDeployPanelProps) {
  const [step, setStep] = useState<DeployStep>('configure');
  const [name, setName] = useState(projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
  const [domain, setDomain] = useState(customDomain || '');
  const [includeEnvVars, setIncludeEnvVars] = useState(true);
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const handleRunTests = useCallback(async () => {
    if (!onRunTests) return;
    setIsRunningTests(true);
    try {
      await onRunTests();
    } finally {
      setIsRunningTests(false);
    }
  }, [onRunTests]);

  const handleDeploy = useCallback(async () => {
    if (!name.trim() || files.length === 0) return;

    // Block deploy if tests failed
    if (testsRan && !testsPassed) {
      toast.error('Cannot deploy: tests are failing');
      return;
    }

    setStep('deploying');
    setProgress(10);
    setErrorMessage('');

    try {
      setProgress(30);

      const { data, error } = await supabase.functions.invoke('vercel-deploy', {
        body: {
          projectName: name.trim(),
          files: files.map(f => ({ path: f.path, content: f.content })),
          vercelToken,
          envVars: includeEnvVars ? envVars.map(v => ({ key: v.key, value: v.value })) : [],
          customDomain: domain.trim() || undefined,
        },
      });

      setProgress(80);

      if (error) throw error;

      if (data?.url) {
        setDeployResult({
          url: data.url,
          deployId: data.deployId || 'unknown',
          readyState: data.readyState || 'READY',
        });
        setStep('success');
        setProgress(100);
        toast.success('Deployed to Vercel!');
      } else {
        throw new Error('No deployment URL returned');
      }
    } catch (err: any) {
      console.error('Vercel deploy error:', err);
      setErrorMessage(err.message || 'Deployment failed');
      setStep('error');
      setProgress(0);
      toast.error(err.message || 'Deployment failed');
    }
  }, [name, files, vercelToken, envVars, includeEnvVars, domain, testsPassed, testsRan]);

  const handleReset = useCallback(() => {
    setStep('configure');
    setProgress(0);
    setDeployResult(null);
    setErrorMessage('');
  }, []);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#0d0d14] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Rocket className="h-4 w-4 text-purple-400" />
            Deploy to Vercel
          </DialogTitle>
          <DialogDescription className="text-white/40 text-xs">
            One-click deployment with environment variables and custom domains
          </DialogDescription>
        </DialogHeader>

        {step === 'configure' && (
          <div className="space-y-4 pt-2">
            {/* Project name */}
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">Project Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/5 border-white/10 text-white text-sm"
                placeholder="my-project"
              />
            </div>

            {/* Custom domain */}
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs flex items-center gap-1">
                <Globe className="h-3 w-3" />
                Custom Domain (optional)
              </Label>
              <Input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="bg-white/5 border-white/10 text-white text-sm"
                placeholder="myapp.com"
              />
            </div>

            {/* Env vars toggle */}
            {envVars.length > 0 && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Key className="h-3.5 w-3.5 text-yellow-400/60" />
                  <span className="text-xs text-white/60">
                    Include {envVars.length} environment variable{envVars.length > 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  onClick={() => setIncludeEnvVars(!includeEnvVars)}
                  className={cn(
                    "w-8 h-4 rounded-full transition-colors relative",
                    includeEnvVars ? "bg-purple-500" : "bg-white/20"
                  )}
                >
                  <div className={cn(
                    "absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform",
                    includeEnvVars ? "translate-x-4" : "translate-x-0.5"
                  )} />
                </button>
              </div>
            )}

            {/* Test gate */}
            {onRunTests && (
              <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {testsRan ? (
                      testsPassed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-400" />
                      )
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border border-white/20" />
                    )}
                    <span className="text-xs text-white/60">
                      {testsRan
                        ? testsPassed ? 'All tests passing' : 'Tests failing — deploy blocked'
                        : 'Run tests before deploying'}
                    </span>
                  </div>
                  <button
                    onClick={handleRunTests}
                    disabled={isRunningTests}
                    className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    {isRunningTests ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    {isRunningTests ? 'Running...' : 'Run tests'}
                  </button>
                </div>
              </div>
            )}

            <Button
              onClick={handleDeploy}
              disabled={!name.trim() || (testsRan && !testsPassed)}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white"
            >
              <Rocket className="h-4 w-4 mr-2" />
              Deploy
            </Button>
          </div>
        )}

        {step === 'deploying' && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto" />
            <p className="text-sm text-white/60">Deploying to Vercel...</p>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {step === 'success' && deployResult && (
          <div className="py-4 space-y-4">
            <div className="text-center">
              <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-3" />
              <p className="text-sm text-white/80 font-medium">Deployed successfully!</p>
            </div>

            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-white/40">URL</span>
                <a
                  href={deployResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  {deployResult.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-white/40">Status</span>
                <span className="text-xs text-green-400">{deployResult.readyState}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => window.open(deployResult.url, '_blank')}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Open site
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-white/10 text-white/60 hover:text-white text-xs"
              >
                Deploy again
              </Button>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="py-4 space-y-4">
            <div className="text-center">
              <XCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
              <p className="text-sm text-white/80 font-medium">Deployment failed</p>
              <p className="text-xs text-white/40 mt-1">{errorMessage}</p>
            </div>
            <Button
              onClick={handleReset}
              className="w-full bg-white/10 hover:bg-white/20 text-white text-xs"
            >
              Try again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
