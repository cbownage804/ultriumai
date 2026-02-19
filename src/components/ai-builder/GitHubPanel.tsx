import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Github, GitBranch, GitPullRequest, GitCommit, Upload, Download, RefreshCw,
  Loader2, CheckCircle2, XCircle, Plus, Trash2, Eye, ExternalLink, Lock, Unlock,
  FolderGit2, ArrowUpDown, FileCode, Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import { motion } from 'framer-motion';

interface GitHubPanelProps {
  open: boolean;
  onClose: () => void;
  projectName: string;
  files: ProjectFile[];
  onFilesImported?: (files: { path: string; content: string }[]) => void;
  /** Connected useGithubSync hook — when provided, push/pull use the hook instead of local logic */
  githubSync?: {
    github: import('@/hooks/useGithubSync').GithubSyncState;
    connectGitHub: (token: string, repoName: string) => void;
    disconnectGitHub: () => void;
    pushToGitHub: (files: ProjectFile[], options?: { isPrivate?: boolean; description?: string }) => Promise<any>;
    pullFromGitHub: () => Promise<ProjectFile[] | null>;
  };
}

interface RepoInfo {
  name: string;
  full_name: string;
  html_url: string;
  default_branch: string;
  private: boolean;
  description: string;
  updated_at: string;
}

interface BranchInfo {
  name: string;
  commit: { sha: string; message?: string };
  protected: boolean;
}

interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
}

const PAT_KEY = 'app-builder-github-pat';
const REPO_KEY = 'app-builder-github-repo';

export function GitHubPanel({ open, onClose, projectName, files, onFilesImported, githubSync }: GitHubPanelProps) {
  const [token, setToken] = useState(() => localStorage.getItem(PAT_KEY) || '');
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState<'connect' | 'repo' | 'branches' | 'push' | 'pull'>('connect');

  // Repo state
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<RepoInfo | null>(null);
  const [repoSearch, setRepoSearch] = useState('');
  const [loadingRepos, setLoadingRepos] = useState(false);

  // Branch state
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [commits, setCommits] = useState<CommitInfo[]>([]);

  // Push state
  const [commitMessage, setCommitMessage] = useState('');
  const [isPushing, setIsPushing] = useState(false);
  const [createNewRepo, setCreateNewRepo] = useState(false);
  const [newRepoName, setNewRepoName] = useState(projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-app');
  const [newRepoPrivate, setNewRepoPrivate] = useState(true);

  // Pull state
  const [isPulling, setIsPulling] = useState(false);
  const [pullPreview, setPullPreview] = useState<{ path: string; content: string }[] | null>(null);

  const headers = useCallback(() => ({
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }), [token]);

  const testConnection = async () => {
    if (!token) return;
    try {
      const resp = await fetch('https://api.github.com/user', { headers: headers() });
      if (!resp.ok) { toast.error('Invalid token'); return; }
      const user = await resp.json();
      setUsername(user.login);
      setConnected(true);
      localStorage.setItem(PAT_KEY, token);
      // Also connect the githubSync hook if available
      if (githubSync) {
        const savedRepo = localStorage.getItem(REPO_KEY);
        if (savedRepo) githubSync.connectGitHub(token, savedRepo.split('/').pop() || '');
      }
      toast.success(`Connected as ${user.login}`);
      setActiveTab('repo');
      fetchRepos(user.login);
    } catch { toast.error('Connection failed'); }
  };

  const disconnect = () => {
    setConnected(false);
    setUsername('');
    setToken('');
    setRepos([]);
    setSelectedRepo(null);
    localStorage.removeItem(PAT_KEY);
    setActiveTab('connect');
    githubSync?.disconnectGitHub();
  };

  const fetchRepos = async (user?: string) => {
    setLoadingRepos(true);
    try {
      const resp = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', { headers: headers() });
      if (resp.ok) {
        const data = await resp.json();
        setRepos(data);
        // Restore saved repo
        const saved = localStorage.getItem(REPO_KEY);
        if (saved) {
          const found = data.find((r: RepoInfo) => r.full_name === saved);
          if (found) { setSelectedRepo(found); setSelectedBranch(found.default_branch); }
        }
      }
    } catch {} finally { setLoadingRepos(false); }
  };

  const selectRepo = (repo: RepoInfo) => {
    setSelectedRepo(repo);
    setSelectedBranch(repo.default_branch);
    localStorage.setItem(REPO_KEY, repo.full_name);
    // Sync with hook
    if (githubSync && token) {
      githubSync.connectGitHub(token, repo.name);
    }
    fetchBranches(repo);
    fetchCommits(repo, repo.default_branch);
  };

  const fetchBranches = async (repo: RepoInfo) => {
    setLoadingBranches(true);
    try {
      const resp = await fetch(`https://api.github.com/repos/${repo.full_name}/branches?per_page=100`, { headers: headers() });
      if (resp.ok) setBranches(await resp.json());
    } catch {} finally { setLoadingBranches(false); }
  };

  const fetchCommits = async (repo: RepoInfo, branch: string) => {
    try {
      const resp = await fetch(`https://api.github.com/repos/${repo.full_name}/commits?sha=${branch}&per_page=20`, { headers: headers() });
      if (resp.ok) {
        const data = await resp.json();
        setCommits(data.map((c: any) => ({
          sha: c.sha,
          message: c.commit.message,
          author: c.commit.author?.name || c.author?.login || 'unknown',
          date: c.commit.author?.date || '',
        })));
      }
    } catch {}
  };

  const createBranch = async () => {
    if (!selectedRepo || !newBranchName) return;
    try {
      const refResp = await fetch(`https://api.github.com/repos/${selectedRepo.full_name}/git/ref/heads/${selectedBranch}`, { headers: headers() });
      if (!refResp.ok) { toast.error('Failed to get base branch'); return; }
      const ref = await refResp.json();
      
      const createResp = await fetch(`https://api.github.com/repos/${selectedRepo.full_name}/git/refs`, {
        method: 'POST', headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: `refs/heads/${newBranchName}`, sha: ref.object.sha }),
      });
      if (createResp.ok) {
        toast.success(`Branch "${newBranchName}" created`);
        setNewBranchName('');
        fetchBranches(selectedRepo);
        setSelectedBranch(newBranchName);
      } else {
        const err = await createResp.json();
        toast.error(err.message || 'Failed to create branch');
      }
    } catch (e: any) { toast.error(e.message); }
  };

  const handlePush = async () => {
    setIsPushing(true);
    try {
      const { data, error } = await supabase.functions.invoke('github-push', {
        body: {
          token,
          repoName: createNewRepo ? newRepoName : selectedRepo?.name,
          isPrivate: createNewRepo ? newRepoPrivate : undefined,
          files: files.map(f => ({ path: f.path, content: f.content })),
          description: `Generated by AI App Builder — ${projectName}`,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(createNewRepo ? 'Repository created & pushed!' : 'Pushed to GitHub!', {
        description: data?.repoUrl,
        action: data?.repoUrl ? { label: 'Open', onClick: () => window.open(data.repoUrl, '_blank') } : undefined,
      });
      if (createNewRepo) { setCreateNewRepo(false); fetchRepos(); }
    } catch (e: any) {
      toast.error(e.message || 'Push failed');
    } finally { setIsPushing(false); }
  };

  const handlePull = async () => {
    if (!selectedRepo) return;
    setIsPulling(true);
    setPullPreview(null);
    try {
      // Get tree recursively
      const treeResp = await fetch(
        `https://api.github.com/repos/${selectedRepo.full_name}/git/trees/${selectedBranch}?recursive=1`,
        { headers: headers() }
      );
      if (!treeResp.ok) throw new Error('Failed to fetch file tree');
      const tree = await treeResp.json();

      const codeFiles = tree.tree.filter((f: any) =>
        f.type === 'blob' && !f.path.startsWith('.git') &&
        /\.(tsx?|jsx?|css|html|json|md|sql|toml|yaml|yml|env|txt)$/i.test(f.path)
      ).slice(0, 200); // Cap at 200 files

      const importedFiles: { path: string; content: string }[] = [];
      // Fetch in batches of 10
      for (let i = 0; i < codeFiles.length; i += 10) {
        const batch = codeFiles.slice(i, i + 10);
        const results = await Promise.all(batch.map(async (f: any) => {
          const resp = await fetch(`https://api.github.com/repos/${selectedRepo.full_name}/git/blobs/${f.sha}`, { headers: headers() });
          if (!resp.ok) return null;
          const blob = await resp.json();
          const content = blob.encoding === 'base64' ? atob(blob.content) : blob.content;
          return { path: f.path, content };
        }));
        importedFiles.push(...results.filter(Boolean) as any);
      }

      setPullPreview(importedFiles);
      toast.success(`Fetched ${importedFiles.length} files from ${selectedBranch}`);
    } catch (e: any) {
      toast.error(e.message || 'Pull failed');
    } finally { setIsPulling(false); }
  };

  const confirmPull = () => {
    if (pullPreview && onFilesImported) {
      onFilesImported(pullPreview);
      toast.success(`Imported ${pullPreview.length} files into project`);
      setPullPreview(null);
    }
  };

  // Auto-connect on mount
  useEffect(() => {
    const saved = localStorage.getItem(PAT_KEY);
    if (saved && !connected) { setToken(saved); }
  }, []);

  useEffect(() => {
    if (token && !connected) testConnection();
  }, [token]);

  const filteredRepos = repos.filter(r => !repoSearch || r.full_name.toLowerCase().includes(repoSearch.toLowerCase()));
  const effectiveTab = !connected && activeTab !== 'connect' ? 'connect' : activeTab;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 bg-[#0c0c14] border-white/10 shadow-2xl gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-4 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold text-white flex items-center gap-2">
              <Github className="h-4.5 w-4.5" />
              GitHub
              {connected && (
                <Badge className="bg-white/10 text-white/60 border-white/10 text-[10px] px-1.5 py-0">
                  @{username}
                </Badge>
              )}
              {selectedRepo && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                  {selectedRepo.name}
                </Badge>
              )}
            </DialogTitle>
            {connected && (
              <Button variant="ghost" size="sm" onClick={disconnect} className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10 text-xs gap-1">
                Disconnect
              </Button>
            )}
          </div>
        </DialogHeader>

        <Tabs value={effectiveTab} onValueChange={v => setActiveTab(v as any)} className="flex flex-col flex-1 min-h-0">
          <TabsList className="mx-5 mt-3 bg-white/[0.04] border border-white/[0.06] rounded-lg p-0.5 h-9">
            <TabsTrigger value="connect" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-md gap-1.5">
              <Github className="h-3 w-3" /> Connect
            </TabsTrigger>
            <TabsTrigger value="repo" disabled={!connected} className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-md gap-1.5">
              <FolderGit2 className="h-3 w-3" /> Repos
            </TabsTrigger>
            <TabsTrigger value="branches" disabled={!connected || !selectedRepo} className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-md gap-1.5">
              <GitBranch className="h-3 w-3" /> Branches
            </TabsTrigger>
            <TabsTrigger value="push" disabled={!connected} className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-md gap-1.5">
              <Upload className="h-3 w-3" /> Push
            </TabsTrigger>
            <TabsTrigger value="pull" disabled={!connected || !selectedRepo} className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-md gap-1.5">
              <Download className="h-3 w-3" /> Pull
            </TabsTrigger>
          </TabsList>

          {/* Connect */}
          <TabsContent value="connect" className="flex-1 p-5">
            <div className="max-w-md mx-auto space-y-4 py-4">
              <div className="text-center space-y-2">
                <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto"><Github className="h-6 w-6 text-white/80" /></div>
                <h3 className="text-white font-medium">Connect GitHub</h3>
                <p className="text-white/40 text-sm">Enter a Personal Access Token with <code className="bg-white/5 px-1 rounded text-[11px]">repo</code> scope.</p>
              </div>
              <Input value={token} onChange={e => setToken(e.target.value)} type="password" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" className="bg-white/5 border-white/10 text-white text-sm font-mono" />
              <Button onClick={testConnection} disabled={!token} className="w-full bg-white/10 hover:bg-white/15 text-white gap-2">
                <Github className="h-4 w-4" /> Connect
              </Button>
              <p className="text-[10px] text-white/20 text-center">Token stored locally. Never sent to our servers.</p>
            </div>
          </TabsContent>

          {/* Repos */}
          <TabsContent value="repo" className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center gap-2 px-5 py-2 border-b border-white/[0.06]">
              <Input value={repoSearch} onChange={e => setRepoSearch(e.target.value)} placeholder="Filter repos..." className="bg-transparent border-none text-sm text-white h-7 px-0 focus-visible:ring-0 flex-1" />
              <Button variant="ghost" size="sm" onClick={() => fetchRepos()} className="text-white/40 hover:text-white text-xs gap-1">
                <RefreshCw className={cn("h-3 w-3", loadingRepos && "animate-spin")} />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-1">
                {filteredRepos.map(repo => (
                  <button key={repo.full_name} onClick={() => { selectRepo(repo); setActiveTab('branches'); }} className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                    selectedRepo?.full_name === repo.full_name ? "bg-white/[0.06] border border-white/10" : "hover:bg-white/[0.03]"
                  )}>
                    {repo.private ? <Lock className="h-3.5 w-3.5 text-amber-400/60 shrink-0" /> : <Unlock className="h-3.5 w-3.5 text-white/20 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white/80 font-mono truncate">{repo.name}</div>
                      {repo.description && <div className="text-[10px] text-white/25 truncate">{repo.description}</div>}
                    </div>
                    <span className="text-[10px] text-white/15">{new Date(repo.updated_at).toLocaleDateString()}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Branches */}
          <TabsContent value="branches" className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center gap-2 px-5 py-2 border-b border-white/[0.06]">
              <Input value={newBranchName} onChange={e => setNewBranchName(e.target.value)} placeholder="New branch name..." className="bg-white/5 border-white/10 text-white text-sm font-mono flex-1" />
              <Button onClick={createBranch} disabled={!newBranchName} size="sm" className="text-xs gap-1">
                <Plus className="h-3 w-3" /> Create
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-1">
                {branches.map(b => (
                  <button key={b.name} onClick={() => { setSelectedBranch(b.name); if (selectedRepo) fetchCommits(selectedRepo, b.name); }} className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors",
                    selectedBranch === b.name ? "bg-white/[0.06] border border-white/10" : "hover:bg-white/[0.03]"
                  )}>
                    <GitBranch className="h-3.5 w-3.5 text-white/30 shrink-0" />
                    <span className="text-sm text-white/70 font-mono">{b.name}</span>
                    {b.protected && <Badge className="text-[9px] bg-amber-500/10 text-amber-400 border-amber-500/20">protected</Badge>}
                    <span className="text-[10px] text-white/15 ml-auto font-mono">{b.commit.sha.slice(0, 7)}</span>
                  </button>
                ))}
              </div>
              {commits.length > 0 && (
                <div className="px-3 pb-3">
                  <div className="text-[10px] text-white/25 uppercase tracking-wider px-3 py-2">Recent commits on {selectedBranch}</div>
                  {commits.slice(0, 10).map(c => (
                    <div key={c.sha} className="flex items-start gap-2 px-3 py-1.5 text-xs">
                      <GitCommit className="h-3 w-3 text-white/15 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-white/50 truncate">{c.message.split('\n')[0]}</div>
                        <div className="text-[10px] text-white/15">{c.author} · {new Date(c.date).toLocaleDateString()}</div>
                      </div>
                      <span className="text-[10px] text-white/15 font-mono shrink-0">{c.sha.slice(0, 7)}</span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Push */}
          <TabsContent value="push" className="flex-1 p-5 space-y-4">
            <div className="max-w-lg mx-auto space-y-4">
              {!selectedRepo && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={createNewRepo} onChange={e => setCreateNewRepo(e.target.checked)} className="rounded" />
                  <span className="text-sm text-white/60">Create new repository</span>
                </div>
              )}
              {(createNewRepo || !selectedRepo) && (
                <div className="space-y-2">
                  <Input value={newRepoName} onChange={e => setNewRepoName(e.target.value)} placeholder="repo-name" className="bg-white/5 border-white/10 text-white text-sm font-mono" />
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={newRepoPrivate} onChange={e => setNewRepoPrivate(e.target.checked)} className="rounded" />
                    <span className="text-xs text-white/40">Private repository</span>
                  </div>
                </div>
              )}
              {selectedRepo && !createNewRepo && (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 flex items-center gap-3">
                  <FolderGit2 className="h-4 w-4 text-white/30" />
                  <div>
                    <div className="text-sm text-white/80 font-mono">{selectedRepo.full_name}</div>
                    <div className="text-[10px] text-white/30">Branch: {selectedBranch}</div>
                  </div>
                </div>
              )}
              <Textarea value={commitMessage} onChange={e => setCommitMessage(e.target.value)} placeholder="Commit message (optional)" className="bg-white/5 border-white/10 text-white text-sm min-h-[60px]" />
              <div className="text-xs text-white/20">{files.length} files will be pushed</div>
              <Button onClick={handlePush} disabled={isPushing || (!selectedRepo && !newRepoName)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
                {isPushing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {isPushing ? 'Pushing...' : createNewRepo ? 'Create & Push' : 'Push to GitHub'}
              </Button>
            </div>
          </TabsContent>

          {/* Pull */}
          <TabsContent value="pull" className="flex-1 min-h-0 flex flex-col">
            <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-3">
              <div className="flex-1">
                <div className="text-sm text-white/60">{selectedRepo?.full_name} / <span className="text-white/80">{selectedBranch}</span></div>
              </div>
              <Button onClick={handlePull} disabled={isPulling} className="bg-blue-600 hover:bg-blue-500 text-white text-xs gap-1.5">
                {isPulling ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                {isPulling ? 'Pulling...' : 'Pull Files'}
              </Button>
            </div>
            <ScrollArea className="flex-1">
              {pullPreview ? (
                <div className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-emerald-400">{pullPreview.length} files fetched</span>
                    <Button onClick={confirmPull} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Import All
                    </Button>
                  </div>
                  <div className="space-y-0.5">
                    {pullPreview.map(f => (
                      <div key={f.path} className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-white/[0.02] text-xs">
                        <FileCode className="h-3 w-3 text-white/20" />
                        <span className="text-white/60 font-mono">{f.path}</span>
                        <span className="text-white/15 ml-auto">{f.content.length} chars</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-white/15 text-sm">
                  Click "Pull Files" to fetch code from the selected branch
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
