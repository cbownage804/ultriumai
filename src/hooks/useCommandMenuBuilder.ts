import { useState, useCallback } from 'react';

export interface CommandItem {
  id: string;
  label: string;
  shortcut: string;
  icon: string;
  group: string;
  action: string;
}

export interface CommandMenuConfig {
  id: string;
  name: string;
  items: CommandItem[];
  placeholder: string;
  triggerKey: string;
  maxResults: number;
  showRecent: boolean;
}

const PRESETS: Omit<CommandMenuConfig, 'id'>[] = [
  { name: 'App Navigation', items: [
    { id: '1', label: 'Go to Dashboard', shortcut: '⌘D', icon: '📊', group: 'Navigation', action: 'navigate("/dashboard")' },
    { id: '2', label: 'Go to Settings', shortcut: '⌘,', icon: '⚙️', group: 'Navigation', action: 'navigate("/settings")' },
    { id: '3', label: 'Search Users', shortcut: '⌘U', icon: '👥', group: 'Actions', action: 'openSearch("users")' },
    { id: '4', label: 'Toggle Theme', shortcut: '⌘T', icon: '🎨', group: 'Actions', action: 'toggleTheme()' },
  ], placeholder: 'Type a command...', triggerKey: '⌘K', maxResults: 10, showRecent: true },
  { name: 'Editor Commands', items: [
    { id: '1', label: 'Save File', shortcut: '⌘S', icon: '💾', group: 'File', action: 'save()' },
    { id: '2', label: 'Find & Replace', shortcut: '⌘H', icon: '🔍', group: 'Edit', action: 'findReplace()' },
    { id: '3', label: 'Format Document', shortcut: '⇧⌥F', icon: '📐', group: 'Edit', action: 'format()' },
  ], placeholder: 'Search commands...', triggerKey: '⌘K', maxResults: 20, showRecent: true },
];

export function useCommandMenuBuilder() {
  const [menus, setMenus] = useState<CommandMenuConfig[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const createMenu = useCallback((preset?: string) => {
    const p = preset ? PRESETS.find(pr => pr.name === preset) : undefined;
    const m: CommandMenuConfig = {
      id: crypto.randomUUID(),
      name: p?.name || `Menu ${menus.length + 1}`,
      items: p?.items.map(i => ({ ...i, id: crypto.randomUUID() })) || [],
      placeholder: p?.placeholder || 'Type a command...',
      triggerKey: p?.triggerKey || '⌘K',
      maxResults: p?.maxResults || 10,
      showRecent: p?.showRecent ?? true,
    };
    setMenus(prev => [...prev, m]);
    setActiveMenu(m.id);
    return m;
  }, [menus.length]);

  const updateMenu = useCallback((id: string, updates: Partial<CommandMenuConfig>) => {
    setMenus(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const deleteMenu = useCallback((id: string) => {
    setMenus(prev => prev.filter(m => m.id !== id));
    if (activeMenu === id) setActiveMenu(null);
  }, [activeMenu]);

  const addItem = useCallback((menuId: string) => {
    setMenus(prev => prev.map(m => m.id === menuId ? { ...m, items: [...m.items, { id: crypto.randomUUID(), label: 'New Command', shortcut: '', icon: '⚡', group: 'General', action: '' }] } : m));
  }, []);

  const removeItem = useCallback((menuId: string, itemId: string) => {
    setMenus(prev => prev.map(m => m.id === menuId ? { ...m, items: m.items.filter(i => i.id !== itemId) } : m));
  }, []);

  const updateItem = useCallback((menuId: string, itemId: string, updates: Partial<CommandItem>) => {
    setMenus(prev => prev.map(m => m.id === menuId ? { ...m, items: m.items.map(i => i.id === itemId ? { ...i, ...updates } : i) } : m));
  }, []);

  const generateCode = useCallback((id: string): string => {
    const m = menus.find(mn => mn.id === id);
    if (!m) return '';
    const groups = [...new Set(m.items.map(i => i.group))];
    const itemsCode = m.items.map(i => `  { label: ${JSON.stringify(i.label)}, shortcut: ${JSON.stringify(i.shortcut)}, icon: ${JSON.stringify(i.icon)}, group: ${JSON.stringify(i.group)}, action: () => ${i.action || 'console.log("action")'} }`).join(',\n');
    return `import { useState, useEffect } from 'react';\nimport { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut } from '@/components/ui/command';\nimport { Dialog, DialogContent } from '@/components/ui/dialog';\n\nconst commands = [\n${itemsCode}\n];\n\nexport function ${m.name.replace(/\\s+/g, '')}() {\n  const [open, setOpen] = useState(false);\n\n  useEffect(() => {\n    const down = (e: KeyboardEvent) => {\n      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen(o => !o); }\n    };\n    document.addEventListener('keydown', down);\n    return () => document.removeEventListener('keydown', down);\n  }, []);\n\n  return (\n    <Dialog open={open} onOpenChange={setOpen}>\n      <DialogContent className="p-0">\n        <Command>\n          <CommandInput placeholder=${JSON.stringify(m.placeholder)} />\n          <CommandList>\n            <CommandEmpty>No results found.</CommandEmpty>\n            ${groups.map(g => `<CommandGroup heading=${JSON.stringify(g)}>\n              {commands.filter(c => c.group === ${JSON.stringify(g)}).map(c => (\n                <CommandItem key={c.label} onSelect={() => { c.action(); setOpen(false); }}>\n                  <span>{c.icon}</span> {c.label}\n                  {c.shortcut && <CommandShortcut>{c.shortcut}</CommandShortcut>}\n                </CommandItem>\n              ))}\n            </CommandGroup>`).join('\n            ')}\n          </CommandList>\n        </Command>\n      </DialogContent>\n    </Dialog>\n  );\n}`;
  }, [menus]);

  const getActive = useCallback(() => menus.find(m => m.id === activeMenu) || null, [menus, activeMenu]);

  return { menus, activeMenu, setActiveMenu, createMenu, updateMenu, deleteMenu, addItem, removeItem, updateItem, generateCode, getActive, presetNames: PRESETS.map(p => p.name) };
}
