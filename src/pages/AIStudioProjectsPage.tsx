import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Plus, Search, Globe, Trash2, Clock, Code2, LayoutGrid,
  List, MoreHorizontal, FolderOpen, Sparkles, ArrowRight,
  GitFork, ExternalLink, Loader2, Pencil, Copy, Check, X, Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Project {
  id: string;
  name: string;
  files: any[];
  is_published: boolean;
  published_url: string | null;
  updated_at: string;
  created_at: string;
  thumbnail_url?: string | null;
}

interface GPTItem {
  id: string;
  name: string;
  updated_at: string;
  created_at: string;
  avatar_url?: string | null;
  is_published?: boolean;
}

interface UnifiedItem {
  id: string;
  name: string;
  updated_at: string;
  created_at: string;
  type: 'app' | 'gpt';
  thumbnail_url?: string | null;
  is_published?: boolean;
  published_url?: string | null;
  files?: any[];
}

type ViewMode = 'grid' | 'list';
type SortBy = 'updated' | 'created' | 'name';
type FilterType = 'all' | 'app' | 'gpt';

export default function AIStudioProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [gpts, setGpts] = useState<GPTItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('updated');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [deleteTarget, setDeleteTarget] = useState<UnifiedItem | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [projectsRes, gptsRes] = await Promise.all([
        supabase.from('builder_projects')
          .select('id, name, files, is_published, published_url, updated_at, created_at, thumbnail_url')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false }),
        supabase.from('custom_gpts')
          .select('id, name, updated_at, created_at, avatar_url, is_published')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false }),
      ]);
      if (projectsRes.error) throw projectsRes.error;
      if (gptsRes.error) throw gptsRes.error;
      setProjects((projectsRes.data || []) as unknown as Project[]);
      setGpts((gptsRes.data || []) as unknown as GPTItem[]);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Merge into unified list
  const unified: UnifiedItem[] = [
    ...projects.map(p => ({ ...p, type: 'app' as const, thumbnail_url: p.thumbnail_url })),
    ...gpts.map(g => ({ ...g, type: 'gpt' as const, thumbnail_url: g.avatar_url, files: undefined, published_url: null })),
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const table = deleteTarget.type === 'app' ? 'builder_projects' : 'custom_gpts';
      const { error } = await supabase.from(table).delete().eq('id', deleteTarget.id);
      if (error) throw error;
      if (deleteTarget.type === 'app') {
        setProjects(prev => prev.filter(p => p.id !== deleteTarget.id));
      } else {
        setGpts(prev => prev.filter(g => g.id !== deleteTarget.id));
      }
      toast.success(`${deleteTarget.type === 'app' ? 'Project' : 'GPT'} deleted`);
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleRename = async (item: UnifiedItem, newName: string) => {
    if (!newName.trim()) { setRenamingId(null); return; }
    try {
      const table = item.type === 'app' ? 'builder_projects' : 'custom_gpts';
      const { error } = await supabase.from(table).update({ name: newName.trim() }).eq('id', item.id);
      if (error) throw error;
      if (item.type === 'app') {
        setProjects(prev => prev.map(p => p.id === item.id ? { ...p, name: newName.trim() } : p));
      } else {
        setGpts(prev => prev.map(g => g.id === item.id ? { ...g, name: newName.trim() } : g));
      }
      toast.success('Renamed');
    } catch {
      toast.error('Failed to rename');
    } finally {
      setRenamingId(null);
    }
  };

  const handleDuplicate = async (item: UnifiedItem) => {
    if (!user?.id) return;
    try {
      if (item.type === 'app') {
        const project = projects.find(p => p.id === item.id);
        if (!project) return;
        const { data, error } = await supabase
          .from('builder_projects')
          .insert({ name: `${project.name} (copy)`, files: project.files, user_id: user.id, is_published: false } as any)
          .select().single();
        if (error) throw error;
        setProjects(prev => [data as unknown as Project, ...prev]);
      } else {
        const gpt = gpts.find(g => g.id === item.id);
        if (!gpt) return;
        const { data: fullGpt } = await supabase.from('custom_gpts').select('*').eq('id', gpt.id).single();
        if (!fullGpt) return;
        const { id, created_at, updated_at, ...rest } = fullGpt as any;
        const { data, error } = await supabase
          .from('custom_gpts')
          .insert({ ...rest, name: `${gpt.name} (copy)`, user_id: user.id, is_published: false })
          .select('id, name, updated_at, created_at, avatar_url, is_published').single();
        if (error) throw error;
        setGpts(prev => [data as unknown as GPTItem, ...prev]);
      }
      toast.success('Duplicated');
    } catch {
      toast.error('Failed to duplicate');
    }
  };

  const filtered = unified
    .filter(item => filterType === 'all' || item.type === filterType)
    .filter(item => !search || item.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'created') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  const formatTimeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
  };

  const getFileCount = (files: any) => {
    if (Array.isArray(files)) return files.length;
    if (typeof files === 'object' && files) return Object.keys(files).length;
    return 0;
  };

  const openItem = (item: UnifiedItem) => {
    if (item.type === 'app') navigate(`/ai-studio/app-builder?project=${item.id}`);
    else navigate(`/ai-studio/gpt-builder/${item.id}`);
  };

  const totalCount = projects.length + gpts.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/20">
                <Code2 className="h-6 w-6 text-cyan-400" />
              </div>
              My Projects
            </h1>
            <p className="text-muted-foreground mt-1.5">
              {totalCount} item{totalCount !== 1 ? 's' : ''} in your workspace
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate('/ai-studio/gpt-builder')}
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/5"
            >
              <Bot className="h-4 w-4 mr-2" />
              New GPT
            </Button>
            <Button
              onClick={() => navigate('/ai-studio/app-builder')}
              className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white shadow-lg shadow-cyan-500/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              New App
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects & GPTs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card/50 border-border/50"
            />
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1 bg-card/50 border border-border/50 rounded-lg p-0.5">
            {(['all', 'app', 'gpt'] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={cn(
                  'h-8 px-3 rounded-md flex items-center gap-1.5 text-xs font-medium transition-colors',
                  filterType === f ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {f === 'all' && 'All'}
                {f === 'app' && <><Code2 className="h-3 w-3" /> Apps</>}
                {f === 'gpt' && <><Bot className="h-3 w-3" /> GPTs</>}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-card/50 border border-border/50 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'h-8 w-8 rounded-md flex items-center justify-center transition-colors',
                viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'h-8 w-8 rounded-md flex items-center justify-center transition-colors',
                viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="h-9 px-3 rounded-lg bg-card/50 border border-border/50 text-sm text-foreground outline-none"
          >
            <option value="updated">Last modified</option>
            <option value="created">Date created</option>
            <option value="name">Name</option>
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            {totalCount === 0 ? (
              <>
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 flex items-center justify-center mb-6">
                  <Sparkles className="h-10 w-10 text-cyan-400/50" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Start building your first app or GPT with AI.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => navigate('/ai-studio/app-builder')}
                    className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create App
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/ai-studio/gpt-builder')}>
                    <Bot className="h-4 w-4 mr-2" />
                    Create GPT
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Search className="h-10 w-10 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No items match "{search}"</p>
              </>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* New project card */}
            <button
              onClick={() => navigate('/ai-studio/app-builder')}
              className="group h-[200px] rounded-xl border-2 border-dashed border-border/50 hover:border-primary/40 flex flex-col items-center justify-center gap-3 transition-all hover:bg-primary/[0.02]"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">New project</span>
            </button>

            {filtered.map(item => (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => openItem(item)}
                className="group relative h-[200px] rounded-xl border border-border/50 bg-card/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 cursor-pointer transition-all overflow-hidden"
              >
                {/* Preview thumbnail */}
                <div className="h-[120px] overflow-hidden relative">
                  {item.type === 'app' && item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt={`${item.name} preview`}
                      className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className={cn(
                      "w-full h-full flex items-center justify-center",
                      item.type === 'app'
                        ? "bg-gradient-to-br from-card via-muted/30 to-card"
                        : "bg-gradient-to-br from-primary/10 to-muted/10"
                    )}>
                      {item.type === 'app' ? (
                        <Code2 className="h-8 w-8 text-muted-foreground/20" />
                      ) : (
                        <Bot className="h-8 w-8 text-muted-foreground/20" />
                      )}
                    </div>
                  )}
                  <Badge className={cn(
                    "absolute top-2 left-2 text-[10px] border-0",
                    item.type === 'app' ? "bg-violet-500/80" : "bg-primary/80"
                  )}>
                    {item.type === 'app' ? 'App' : 'GPT'}
                  </Badge>
                </div>

                {/* Info */}
                <div className="p-3 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {renamingId === item.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => handleRename(item, renameValue)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(item, renameValue);
                            if (e.key === 'Escape') setRenamingId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm font-medium bg-transparent border-b border-primary/50 outline-none w-full text-foreground"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <h3 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {item.name || (item.type === 'app' ? 'Untitled Project' : 'Untitled GPT')}
                      </h3>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(item.updated_at)}
                      </span>
                      {item.is_published && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-emerald-500/30 text-emerald-400">
                          <Globe className="h-2.5 w-2.5 mr-0.5" />
                          Live
                        </Badge>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted/50 transition-all">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openItem(item); }}>
                        <FolderOpen className="h-4 w-4 mr-2" /> Open
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setRenamingId(item.id); setRenameValue(item.name || ''); }}>
                        <Pencil className="h-4 w-4 mr-2" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(item); }}>
                        <Copy className="h-4 w-4 mr-2" /> Duplicate
                      </DropdownMenuItem>
                      {item.type === 'app' && item.published_url && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(item.published_url!, '_blank'); }}>
                          <ExternalLink className="h-4 w-4 mr-2" /> View live
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List view */
          <div className="border border-border/50 rounded-xl overflow-hidden bg-card/30">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 text-xs text-muted-foreground">
                  <th className="text-left font-medium px-4 py-3">Name</th>
                  <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Type</th>
                  <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Status</th>
                  <th className="text-left font-medium px-4 py-3">Modified</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr
                    key={`${item.type}-${item.id}`}
                    onClick={() => openItem(item)}
                    className="border-b border-border/30 last:border-0 hover:bg-muted/20 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          item.type === 'app'
                            ? "bg-gradient-to-br from-cyan-500/10 to-violet-500/10"
                            : "bg-gradient-to-br from-primary/10 to-emerald-500/10"
                        )}>
                          {item.type === 'app' ? (
                            <Code2 className="h-4 w-4 text-cyan-400/50" />
                          ) : (
                            <Bot className="h-4 w-4 text-primary/50" />
                          )}
                        </div>
                        {renamingId === item.id ? (
                          <input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => handleRename(item, renameValue)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRename(item, renameValue);
                              if (e.key === 'Escape') setRenamingId(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm font-medium bg-transparent border-b border-primary/50 outline-none text-foreground"
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {item.name || (item.type === 'app' ? 'Untitled Project' : 'Untitled GPT')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge variant="outline" className={cn(
                        "text-[10px]",
                        item.type === 'app' ? "border-violet-500/30 text-violet-400" : "border-primary/30 text-primary"
                      )}>
                        {item.type === 'app' ? 'App' : 'GPT'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {item.is_published ? (
                        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                          <Globe className="h-2.5 w-2.5 mr-1" /> Published
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] border-border/50 text-muted-foreground">
                          Draft
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatTimeAgo(item.updated_at)}
                    </td>
                    <td className="px-2 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <button className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted/50 transition-all">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openItem(item); }}>
                            <FolderOpen className="h-4 w-4 mr-2" /> Open
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setRenamingId(item.id); setRenameValue(item.name || ''); }}>
                            <Pencil className="h-4 w-4 mr-2" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(item); }}>
                            <Copy className="h-4 w-4 mr-2" /> Duplicate
                          </DropdownMenuItem>
                          {item.type === 'app' && item.published_url && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(item.published_url!, '_blank'); }}>
                              <ExternalLink className="h-4 w-4 mr-2" /> View live
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type === 'app' ? 'project' : 'GPT'}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
