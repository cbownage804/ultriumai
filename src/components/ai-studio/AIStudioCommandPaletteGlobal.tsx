import { useState, useEffect, useMemo, useCallback } from 'react';
import { clearBuilderDraft } from '@/lib/clearBuilderDraft';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Bot, Code2, Plus, Star, Search, Layout, ArrowRight,
  Sparkles, BookOpen, Settings, Zap, BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickItem {
  id: string;
  label: string;
  type: 'app' | 'gpt';
  pinned?: boolean;
  updated_at?: string;
}

export function AIStudioCommandPaletteGlobal() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<QuickItem[]>([]);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { user } = useAuth();

  // Load pinned from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('ai-studio-pinned');
    if (stored) {
      try { setPinnedIds(new Set(JSON.parse(stored))); } catch {}
    }
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Fetch items when opened
  useEffect(() => {
    if (!open || !user?.id) return;
    const fetchItems = async () => {
      const [appsRes, gptsRes] = await Promise.all([
        supabase.from('builder_projects').select('id, name, updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(20),
        supabase.from('custom_gpts').select('id, name, updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(20),
      ]);
      const apps: QuickItem[] = (appsRes.data || []).map(p => ({ id: p.id, label: p.name, type: 'app', updated_at: p.updated_at }));
      const gpts: QuickItem[] = (gptsRes.data || []).map(g => ({ id: g.id, label: g.name, type: 'gpt', updated_at: g.updated_at }));
      setItems([...apps, ...gpts]);
    };
    fetchItems();
  }, [open, user?.id]);

  const togglePin = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem('ai-studio-pinned', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const pinned = useMemo(() => items.filter(i => pinnedIds.has(i.id)), [items, pinnedIds]);
  const recent = useMemo(() => items.filter(i => !pinnedIds.has(i.id)).slice(0, 8), [items, pinnedIds]);

  const handleSelect = (item: QuickItem) => {
    setOpen(false);
    if (item.type === 'app') navigate(`/ai-studio/app-builder?project=${item.id}`);
    else navigate(`/ai-studio/gpt-builder/${item.id}`);
  };

  const quickActions = [
    { label: 'New App', icon: Plus, action: () => { setOpen(false); clearBuilderDraft(); navigate('/ai-studio/app-builder?new=true'); } },
    { label: 'New GPT', icon: Plus, action: () => { setOpen(false); navigate('/ai-studio/gpt-builder'); } },
    { label: 'All Projects', icon: Layout, action: () => { setOpen(false); navigate('/ai-studio/projects'); } },
    { label: 'Dashboard', icon: BarChart3, action: () => { setOpen(false); navigate('/ai-studio'); } },
  ];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search apps, GPTs, or type a command..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          {quickActions.map(qa => (
            <CommandItem key={qa.label} onSelect={qa.action} className="gap-2">
              <qa.icon className="h-4 w-4 text-primary" />
              {qa.label}
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Pinned */}
        {pinned.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="⭐ Favorites">
              {pinned.map(item => (
                <CommandItem key={item.id} onSelect={() => handleSelect(item)} className="gap-2 group">
                  {item.type === 'app' ? (
                    <Code2 className="h-4 w-4 text-violet-400" />
                  ) : (
                    <Bot className="h-4 w-4 text-primary" />
                  )}
                  <span className="flex-1 truncate">{item.label}</span>
                  <button
                    onClick={(e) => togglePin(item.id, e)}
                    className="text-amber-400 hover:text-amber-300"
                  >
                    <Star className="h-3.5 w-3.5 fill-current" />
                  </button>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Recent */}
        {recent.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent">
              {recent.map(item => (
                <CommandItem key={item.id} onSelect={() => handleSelect(item)} className="gap-2 group">
                  {item.type === 'app' ? (
                    <Code2 className="h-4 w-4 text-violet-400" />
                  ) : (
                    <Bot className="h-4 w-4 text-primary" />
                  )}
                  <span className="flex-1 truncate">{item.label}</span>
                  <button
                    onClick={(e) => togglePin(item.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-amber-400 transition-opacity"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
