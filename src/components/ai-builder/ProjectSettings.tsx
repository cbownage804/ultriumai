import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Github, Settings, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface GithubConfig {
  token: string;
}

interface ProjectSettingsProps {
  supabaseConfig: SupabaseConfig | null;
  githubConfig: GithubConfig | null;
  onSupabaseChange: (config: SupabaseConfig | null) => void;
  onGithubChange: (config: GithubConfig | null) => void;
}

export function ProjectSettings({
  supabaseConfig,
  githubConfig,
  onSupabaseChange,
  onGithubChange,
}: ProjectSettingsProps) {
  const [open, setOpen] = useState(false);
  const [sbUrl, setSbUrl] = useState(supabaseConfig?.url || '');
  const [sbKey, setSbKey] = useState(supabaseConfig?.anonKey || '');
  const [ghToken, setGhToken] = useState(githubConfig?.token || '');

  const handleSaveSupabase = () => {
    if (sbUrl.trim() && sbKey.trim()) {
      onSupabaseChange({ url: sbUrl.trim(), anonKey: sbKey.trim() });
      toast.success('Supabase connected');
    } else {
      onSupabaseChange(null);
      toast.info('Supabase disconnected');
    }
  };

  const handleSaveGithub = () => {
    if (ghToken.trim()) {
      onGithubChange({ token: ghToken.trim() });
      toast.success('GitHub token saved');
    } else {
      onGithubChange(null);
      toast.info('GitHub disconnected');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
          <Settings className="h-3 w-3" />
          Settings
          {(supabaseConfig || githubConfig) && (
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
          <DialogDescription>
            Connect external services to enhance your generated apps.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="supabase">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="supabase" className="text-xs gap-1.5">
              <Database className="h-3 w-3" />
              Supabase
              {supabaseConfig && <CheckCircle2 className="h-3 w-3 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="github" className="text-xs gap-1.5">
              <Github className="h-3 w-3" />
              GitHub
              {githubConfig && <CheckCircle2 className="h-3 w-3 text-green-500" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="supabase" className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Connect your Supabase project to enable auth, database queries, and real-time features in the live preview.
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="sb-url" className="text-xs">Project URL</Label>
                <Input
                  id="sb-url"
                  placeholder="https://your-project.supabase.co"
                  value={sbUrl}
                  onChange={(e) => setSbUrl(e.target.value)}
                  className="text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sb-key" className="text-xs">Anon / Public Key</Label>
                <Input
                  id="sb-key"
                  type="password"
                  placeholder="eyJhbGciOi..."
                  value={sbKey}
                  onChange={(e) => setSbKey(e.target.value)}
                  className="text-sm font-mono"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveSupabase} className="text-xs">
                  {supabaseConfig ? 'Update' : 'Connect'}
                </Button>
                {supabaseConfig && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      onSupabaseChange(null);
                      setSbUrl('');
                      setSbKey('');
                      toast.info('Supabase disconnected');
                    }}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Disconnect
                  </Button>
                )}
              </div>
            </div>
            {supabaseConfig && (
              <Badge variant="secondary" className="text-xs gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Connected — AI will generate Supabase-powered code
              </Badge>
            )}
          </TabsContent>

          <TabsContent value="github" className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Add a GitHub Personal Access Token to push your project to a new repository.
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="gh-token" className="text-xs">Personal Access Token</Label>
                <Input
                  id="gh-token"
                  type="password"
                  placeholder="ghp_..."
                  value={ghToken}
                  onChange={(e) => setGhToken(e.target.value)}
                  className="text-sm font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  Needs <code className="bg-muted px-1 rounded">repo</code> scope.{' '}
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=AI+App+Builder"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    Create one <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveGithub} className="text-xs">
                  {githubConfig ? 'Update' : 'Save Token'}
                </Button>
                {githubConfig && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      onGithubChange(null);
                      setGhToken('');
                      toast.info('GitHub disconnected');
                    }}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
            {githubConfig && (
              <Badge variant="secondary" className="text-xs gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Token saved — use "Push to GitHub" to create a repo
              </Badge>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
