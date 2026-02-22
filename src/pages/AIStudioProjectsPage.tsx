import { useState, useEffect, useCallback } from 'react';
import { clearBuilderDraft } from '@/lib/clearBuilderDraft';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Plus, Search, Globe, Trash2, Clock, Code2, LayoutGrid,
  List, MoreHorizontal, FolderOpen, Sparkles, Bot,
  Loader2, Pencil, Copy, ExternalLink, Star, CheckSquare,
  Square, FileCode, GripVertical,
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
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { ActivityFeed } from '@/components/ai-studio/projects/ActivityFeed';
import { BulkActionsBar } from '@/components/ai-studio/projects/BulkActionsBar';

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
  logo_url?: string | null;
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
  pinned?: boolean;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'updated' | 'created' | 'name';
type FilterType = 'all' | 'app' | 'gpt';
type StatusFilter = 'all' | 'draft' | 'deployed' | 'pinned';
type DateRange = 'all' | 'today' | 'week' | 'month' | 'older';

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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [deleteTarget, setDeleteTarget] = useState<UnifiedItem | null>(null);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('ai-studio-pinned');
      return new Set(saved ? JSON.parse(saved) : []);
    } catch { return new Set(); }
  });
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [customOrder, setCustomOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ai-studio-order');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [projectsRes, gptsRes] = await Promise.all([
        supabase.from('builder_projects')
          .select('id, name, files, is_published, published_url, updated_at, created_at, thumbnail_url')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false }),
        supabase.from('custom_gpts')
          .select('id, name, updated_at, created_at, avatar_url, logo_url')
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

  // Persist pins
  useEffect(() => {
    localStorage.setItem('ai-studio-pinned', JSON.stringify(Array.from(pinnedIds)));
  }, [pinnedIds]);

  // Persist order
  useEffect(() => {
    localStorage.setItem('ai-studio-order', JSON.stringify(customOrder));
  }, [customOrder]);

  const togglePin = (id: string) => {
    setPinnedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Merge into unified list
  const unified: UnifiedItem[] = [
    ...projects.map(p => ({ ...p, type: 'app' as const, thumbnail_url: p.thumbnail_url, pinned: pinnedIds.has(p.id) })),
    ...gpts.map(g => ({ ...g, type: 'gpt' as const, thumbnail_url: g.logo_url || g.avatar_url, files: undefined, published_url: null, pinned: pinnedIds.has(g.id) })),
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
      setBulkDeleteMode(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleteMode(true);
    const items = unified.filter(i => selectedIds.has(i.id));
    const count = items.length;
    setDeleteTarget({ id: 'bulk', name: `${count} items`, type: 'app', updated_at: '', created_at: '' });
  };

  const executeBulkDelete = async () => {
    const items = unified.filter(i => selectedIds.has(i.id));
    try {
      const appIds = items.filter(i => i.type === 'app').map(i => i.id);
      const gptIds = items.filter(i => i.type === 'gpt').map(i => i.id);

      if (appIds.length > 0) {
        const { error } = await supabase.from('builder_projects').delete().in('id', appIds);
        if (error) throw error;
        setProjects(prev => prev.filter(p => !appIds.includes(p.id)));
      }
      if (gptIds.length > 0) {
        const { error } = await supabase.from('custom_gpts').delete().in('id', gptIds);
        if (error) throw error;
        setGpts(prev => prev.filter(g => !gptIds.includes(g.id)));
      }
      toast.success(`Deleted ${items.length} items`);
      setSelectedIds(new Set());
      setSelectionMode(false);
    } catch {
      toast.error('Failed to delete some items');
    } finally {
      setDeleteTarget(null);
      setBulkDeleteMode(false);
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
          .select('id, name, updated_at, created_at, avatar_url').single();
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
    .filter(item => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'pinned') return item.pinned;
      if (statusFilter === 'deployed') return item.is_published;
      if (statusFilter === 'draft') return !item.is_published;
      return true;
    })
    .filter(item => !search || item.name.toLowerCase().includes(search.toLowerCase()))
    .filter(item => {
      if (dateRange === 'all') return true;
      const updated = new Date(item.updated_at).getTime();
      const now = Date.now();
      if (dateRange === 'today') return now - updated < 86400000;
      if (dateRange === 'week') return now - updated < 604800000;
      if (dateRange === 'month') return now - updated < 2592000000;
      if (dateRange === 'older') return now - updated >= 2592000000;
      return true;
    })
    .sort((a, b) => {
      // Pinned items always first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      // Check custom order
      const aOrder = customOrder.indexOf(`${a.type}-${a.id}`);
      const bOrder = customOrder.indexOf(`${b.type}-${b.id}`);
      if (aOrder !== -1 && bOrder !== -1) return aOrder - bOrder;
      if (aOrder !== -1) return -1;
      if (bOrder !== -1) return 1;

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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(filtered);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setCustomOrder(reordered.map(i => `${i.type}-${i.id}`));
  };

  const totalCount = projects.length + gpts.length;
  const pinnedCount = unified.filter(i => i.pinned).length;
  const deployedCount = unified.filter(i => i.is_published).length;

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
              {pinnedCount > 0 && <span> · {pinnedCount} pinned</span>}
              {deployedCount > 0 && <span> · {deployedCount} deployed</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSelectionMode(!selectionMode); setSelectedIds(new Set()); }}
              className={cn(selectionMode && "bg-primary/10 border-primary/30")}
            >
              <CheckSquare className="h-4 w-4 mr-1" />
              Select
            </Button>
            <Button
              onClick={() => navigate('/ai-studio/gpt-builder')}
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/5"
            >
              <Bot className="h-4 w-4 mr-2" />
              New GPT
            </Button>
            <Button
              onClick={() => { clearBuilderDraft(); navigate('/ai-studio/app-builder?new=true'); }}
              className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white shadow-lg shadow-cyan-500/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              New App
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
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

          {/* Status filter */}
          <div className="flex items-center gap-1 bg-card/50 border border-border/50 rounded-lg p-0.5">
            {([
              { key: 'all', label: 'All' },
              { key: 'pinned', label: '★ Pinned', count: pinnedCount },
              { key: 'deployed', label: 'Deployed', count: deployedCount },
              { key: 'draft', label: 'Drafts' },
            ] as { key: StatusFilter; label: string; count?: number }[]).map(s => (
              <button
                key={s.key}
                onClick={() => setStatusFilter(s.key)}
                className={cn(
                  'h-8 px-3 rounded-md flex items-center gap-1 text-xs font-medium transition-colors',
                  statusFilter === s.key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {s.label}
                {s.count !== undefined && s.count > 0 && (
                  <span className="text-[10px] opacity-60">({s.count})</span>
                )}
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
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="h-9 px-3 rounded-lg bg-card/50 border border-border/50 text-sm text-foreground outline-none"
          >
            <option value="all">Any time</option>
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
            <option value="older">Older</option>
          </select>

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

        {/* Bulk actions bar */}
        <BulkActionsBar
          selectedCount={selectedIds.size}
          totalCount={filtered.length}
          onSelectAll={() => setSelectedIds(new Set(filtered.map(i => i.id)))}
          onClearSelection={() => { setSelectedIds(new Set()); setSelectionMode(false); }}
          onBulkDelete={handleBulkDelete}
        />

        {/* Activity Feed */}
        {user?.id && !loading && totalCount > 0 && (
          <ActivityFeed userId={user.id} />
        )}

        {/* Content */}
        {loading ? (
          <div className="animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[260px] rounded-xl border border-border/30 overflow-hidden">
                  <div className="h-[180px] bg-muted/15" />
                  <div className="p-2.5 space-y-2">
                    <div className="h-3.5 w-3/4 bg-muted/25 rounded" />
                    <div className="h-2.5 w-1/2 bg-muted/15 rounded" />
                  </div>
                </div>
              ))}
            </div>
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
                    onClick={() => { clearBuilderDraft(); navigate('/ai-studio/app-builder?new=true'); }}
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
                <p className="text-muted-foreground">No items match your filters</p>
              </>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="projects-grid" direction="horizontal">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
                  style={{ gridAutoRows: 'min-content' }}
                >
                  {/* New project card */}
                  <button
                    onClick={() => { clearBuilderDraft(); navigate('/ai-studio/app-builder?new=true'); }}
                    className="group h-[260px] rounded-xl border-2 border-dashed border-border/50 hover:border-primary/40 flex flex-col items-center justify-center gap-2 transition-all hover:bg-primary/[0.02]"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                      <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">New project</span>
                  </button>

                  {filtered.map((item, index) => (
                    <Draggable key={`${item.type}-${item.id}`} draggableId={`${item.type}-${item.id}`} index={index}>
                      {(dragProvided, snapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className={cn(
                            "group relative h-[260px] rounded-xl border bg-card/50 cursor-pointer transition-all overflow-hidden",
                            snapshot.isDragging && "shadow-xl ring-2 ring-primary/30",
                            selectedIds.has(item.id)
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                          )}
                          onClick={() => selectionMode ? toggleSelect(item.id) : openItem(item)}
                        >
                          {/* Drag handle */}
                          <div
                            {...dragProvided.dragHandleProps}
                            className="absolute top-2 right-9 z-10 h-6 w-6 rounded flex items-center justify-center text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-muted-foreground transition-all cursor-grab"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <GripVertical className="h-3.5 w-3.5" />
                          </div>

                          {/* Selection checkbox */}
                          {selectionMode && (
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }}
                              className="absolute top-2 right-2 z-20 h-6 w-6 rounded flex items-center justify-center bg-background/80 backdrop-blur-sm border border-border/50"
                            >
                              {selectedIds.has(item.id) ? (
                                <CheckSquare className="h-4 w-4 text-primary" />
                              ) : (
                                <Square className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                          )}

                          {/* Pin button */}
                          {!selectionMode && (
                            <button
                              onClick={(e) => { e.stopPropagation(); togglePin(item.id); }}
                              className={cn(
                                "absolute top-2 right-2 z-10 h-6 w-6 rounded flex items-center justify-center transition-all",
                                item.pinned
                                  ? "text-amber-400"
                                  : "text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:text-amber-400"
                              )}
                            >
                              <Star className={cn("h-3.5 w-3.5", item.pinned && "fill-current")} />
                            </button>
                          )}

                          {/* Preview thumbnail */}
                          <div className="h-[180px] overflow-hidden relative">
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
                            {/* Badges */}
                            <div className="absolute top-2 left-2 flex items-center gap-1">
                              <Badge className={cn(
                                "text-[10px] border-0",
                                item.type === 'app' ? "bg-violet-500/80" : "bg-primary/80"
                              )}>
                                {item.type === 'app' ? 'App' : 'GPT'}
                              </Badge>
                              {item.is_published && (
                                <Badge className="text-[10px] border-0 bg-emerald-500/80">
                                  <Globe className="h-2.5 w-2.5 mr-0.5" /> Live
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Info */}
                          <div className="p-2.5 flex items-start justify-between gap-1">
                            <div className="min-w-0 flex-1">
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
                                  className="text-xs font-medium bg-transparent border-b border-primary/50 outline-none w-full text-foreground"
                                  autoFocus
                                />
                              ) : (
                                <h3 className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                                  {item.pinned && <Star className="h-2.5 w-2.5 text-amber-400 fill-current inline mr-1" />}
                                  {item.name || (item.type === 'app' ? 'Untitled Project' : 'Untitled GPT')}
                                </h3>
                              )}
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                  <Clock className="h-2.5 w-2.5" />
                                  {formatTimeAgo(item.updated_at)}
                                </span>
                                {item.type === 'app' && getFileCount(item.files) > 0 && (
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                    <FileCode className="h-2.5 w-2.5" />
                                    {getFileCount(item.files)} files
                                  </span>
                                )}
                              </div>
                            </div>

                            {!selectionMode && (
                              <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <button className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted/50 transition-all">
                                    <MoreHorizontal className="h-3.5 w-3.5" />
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
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); togglePin(item.id); }}>
                                    <Star className={cn("h-4 w-4 mr-2", item.pinned && "fill-current text-amber-400")} />
                                    {item.pinned ? 'Unpin' : 'Pin to top'}
                                  </DropdownMenuItem>
                                  {item.type === 'app' && item.published_url && (
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(item.published_url!, '_blank'); }}>
                                      <ExternalLink className="h-4 w-4 mr-2" /> View live
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={(e) => { e.stopPropagation(); setTimeout(() => setDeleteTarget(item), 0); }}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          /* List view */
          <div className="border border-border/50 rounded-xl overflow-hidden bg-card/30">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 text-xs text-muted-foreground">
                  {selectionMode && <th className="w-10 px-3"></th>}
                  <th className="text-left font-medium px-4 py-3">Name</th>
                  <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Type</th>
                  <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Status</th>
                  <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Files</th>
                  <th className="text-left font-medium px-4 py-3">Modified</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr
                    key={`${item.type}-${item.id}`}
                    onClick={() => selectionMode ? toggleSelect(item.id) : openItem(item)}
                    className={cn(
                      "border-b border-border/30 last:border-0 hover:bg-muted/20 cursor-pointer transition-colors group",
                      selectedIds.has(item.id) && "bg-primary/5"
                    )}
                  >
                    {selectionMode && (
                      <td className="px-3 py-3">
                        <button onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }}>
                          {selectedIds.has(item.id) ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </td>
                    )}
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
                        <div className="flex items-center gap-1.5">
                          {item.pinned && <Star className="h-3 w-3 text-amber-400 fill-current shrink-0" />}
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
                          <Globe className="h-2.5 w-2.5 mr-1" /> Deployed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] border-border/50 text-muted-foreground">
                          Draft
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground">
                      {item.type === 'app' ? getFileCount(item.files) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatTimeAgo(item.updated_at)}
                    </td>
                    <td className="px-2 py-3">
                      {!selectionMode && (
                        <DropdownMenu modal={false}>
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
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); togglePin(item.id); }}>
                              <Star className={cn("h-4 w-4 mr-2", item.pinned && "fill-current text-amber-400")} />
                              {item.pinned ? 'Unpin' : 'Pin to top'}
                            </DropdownMenuItem>
                            {item.type === 'app' && item.published_url && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(item.published_url!, '_blank'); }}>
                                <ExternalLink className="h-4 w-4 mr-2" /> View live
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => { e.stopPropagation(); setTimeout(() => setDeleteTarget(item), 0); }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
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
            <AlertDialogTitle>
              {bulkDeleteMode ? `Delete ${selectedIds.size} items?` : `Delete ${deleteTarget?.type === 'app' ? 'project' : 'GPT'}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkDeleteMode
                ? `This will permanently delete ${selectedIds.size} selected items. This action cannot be undone.`
                : <>This will permanently delete <strong>{deleteTarget?.name}</strong>. This action cannot be undone.</>
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBulkDeleteMode(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={bulkDeleteMode ? executeBulkDelete : handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
