import { useState, useCallback } from 'react';

export interface ContextMenuItem {
  id: string;
  label: string;
  shortcut: string;
  icon: string;
  type: 'item' | 'separator' | 'submenu';
  disabled: boolean;
  destructive: boolean;
  children: ContextMenuItem[];
}

export interface ContextMenuConfig {
  id: string;
  name: string;
  items: ContextMenuItem[];
  triggerArea: string;
}

const PRESETS: Omit<ContextMenuConfig, 'id'>[] = [
  { name: 'File Explorer', items: [
    { id: '1', label: 'New File', shortcut: '⌘N', icon: '📄', type: 'item', disabled: false, destructive: false, children: [] },
    { id: '2', label: 'New Folder', shortcut: '⇧⌘N', icon: '📁', type: 'item', disabled: false, destructive: false, children: [] },
    { id: '3', label: '', shortcut: '', icon: '', type: 'separator', disabled: false, destructive: false, children: [] },
    { id: '4', label: 'Copy', shortcut: '⌘C', icon: '📋', type: 'item', disabled: false, destructive: false, children: [] },
    { id: '5', label: 'Paste', shortcut: '⌘V', icon: '📋', type: 'item', disabled: false, destructive: false, children: [] },
    { id: '6', label: '', shortcut: '', icon: '', type: 'separator', disabled: false, destructive: false, children: [] },
    { id: '7', label: 'Delete', shortcut: '⌫', icon: '🗑️', type: 'item', disabled: false, destructive: true, children: [] },
  ], triggerArea: 'file-tree' },
  { name: 'Table Row', items: [
    { id: '1', label: 'Edit', shortcut: 'E', icon: '✏️', type: 'item', disabled: false, destructive: false, children: [] },
    { id: '2', label: 'Duplicate', shortcut: '⌘D', icon: '📋', type: 'item', disabled: false, destructive: false, children: [] },
    { id: '3', label: 'Move to', shortcut: '', icon: '📦', type: 'submenu', disabled: false, destructive: false, children: [
      { id: '3a', label: 'Archive', shortcut: '', icon: '📥', type: 'item', disabled: false, destructive: false, children: [] },
      { id: '3b', label: 'Trash', shortcut: '', icon: '🗑️', type: 'item', disabled: false, destructive: true, children: [] },
    ]},
    { id: '4', label: '', shortcut: '', icon: '', type: 'separator', disabled: false, destructive: false, children: [] },
    { id: '5', label: 'Delete', shortcut: '⌫', icon: '🗑️', type: 'item', disabled: false, destructive: true, children: [] },
  ], triggerArea: 'table-row' },
];

export function useContextMenuDesigner() {
  const [menus, setMenus] = useState<ContextMenuConfig[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const createMenu = useCallback((preset?: string) => {
    const p = preset ? PRESETS.find(pr => pr.name === preset) : undefined;
    const m: ContextMenuConfig = {
      id: crypto.randomUUID(),
      name: p?.name || `Context Menu ${menus.length + 1}`,
      items: p?.items.map(i => ({ ...i, id: crypto.randomUUID(), children: i.children.map(c => ({ ...c, id: crypto.randomUUID() })) })) || [],
      triggerArea: p?.triggerArea || 'element',
    };
    setMenus(prev => [...prev, m]);
    setActiveMenu(m.id);
    return m;
  }, [menus.length]);

  const updateMenu = useCallback((id: string, updates: Partial<ContextMenuConfig>) => {
    setMenus(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const deleteMenu = useCallback((id: string) => {
    setMenus(prev => prev.filter(m => m.id !== id));
    if (activeMenu === id) setActiveMenu(null);
  }, [activeMenu]);

  const addItem = useCallback((menuId: string, type: ContextMenuItem['type'] = 'item') => {
    const item: ContextMenuItem = { id: crypto.randomUUID(), label: type === 'separator' ? '' : 'New Item', shortcut: '', icon: '📋', type, disabled: false, destructive: false, children: [] };
    setMenus(prev => prev.map(m => m.id === menuId ? { ...m, items: [...m.items, item] } : m));
  }, []);

  const removeItem = useCallback((menuId: string, itemId: string) => {
    setMenus(prev => prev.map(m => m.id === menuId ? { ...m, items: m.items.filter(i => i.id !== itemId) } : m));
  }, []);

  const updateItem = useCallback((menuId: string, itemId: string, updates: Partial<ContextMenuItem>) => {
    setMenus(prev => prev.map(m => m.id === menuId ? { ...m, items: m.items.map(i => i.id === itemId ? { ...i, ...updates } : i) } : m));
  }, []);

  const generateCode = useCallback((id: string): string => {
    const m = menus.find(mn => mn.id === id);
    if (!m) return '';
    const renderItems = (items: ContextMenuItem[]): string => items.map(i => {
      if (i.type === 'separator') return '        <ContextMenuSeparator />';
      if (i.type === 'submenu') return `        <ContextMenuSub>\n          <ContextMenuSubTrigger>{${JSON.stringify(i.icon)}} ${i.label}</ContextMenuSubTrigger>\n          <ContextMenuSubContent>\n${renderItems(i.children)}\n          </ContextMenuSubContent>\n        </ContextMenuSub>`;
      return `        <ContextMenuItem${i.destructive ? ' className="text-destructive"' : ''}${i.disabled ? ' disabled' : ''}>\n          <span>${i.icon}</span> ${i.label}${i.shortcut ? `\n          <ContextMenuShortcut>${i.shortcut}</ContextMenuShortcut>` : ''}\n        </ContextMenuItem>`;
    }).join('\n');
    return `import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from '@/components/ui/context-menu';\n\nexport function ${m.name.replace(/\\s+/g, '')}() {\n  return (\n    <ContextMenu>\n      <ContextMenuTrigger className="w-full h-full">\n        {/* Right-click target area */}\n        <div className="p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">Right-click here</div>\n      </ContextMenuTrigger>\n      <ContextMenuContent className="w-56">\n${renderItems(m.items)}\n      </ContextMenuContent>\n    </ContextMenu>\n  );\n}`;
  }, [menus]);

  const getActive = useCallback(() => menus.find(m => m.id === activeMenu) || null, [menus, activeMenu]);

  return { menus, activeMenu, setActiveMenu, createMenu, updateMenu, deleteMenu, addItem, removeItem, updateItem, generateCode, getActive, presetNames: PRESETS.map(p => p.name) };
}
