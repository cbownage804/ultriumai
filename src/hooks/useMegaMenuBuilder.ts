import { useState, useCallback } from 'react';

export interface MegaMenuItem {
  id: string;
  label: string;
  href: string;
  description: string;
  icon: string;
}

export interface MegaMenuColumn {
  id: string;
  title: string;
  items: MegaMenuItem[];
}

export interface MegaMenuConfig {
  id: string;
  name: string;
  columns: MegaMenuColumn[];
  trigger: string;
  showCTA: boolean;
  ctaLabel: string;
  ctaHref: string;
  variant: 'full-width' | 'dropdown' | 'flyout';
}

const PRESETS: Omit<MegaMenuConfig, 'id'>[] = [
  { name: 'Product Menu', columns: [
    { id: '1', title: 'Features', items: [
      { id: '1a', label: 'Analytics', href: '/features/analytics', description: 'Track your metrics', icon: '📊' },
      { id: '1b', label: 'Automation', href: '/features/automation', description: 'Automate workflows', icon: '⚡' },
    ]},
    { id: '2', title: 'Solutions', items: [
      { id: '2a', label: 'Enterprise', href: '/solutions/enterprise', description: 'For large teams', icon: '🏢' },
      { id: '2b', label: 'Startup', href: '/solutions/startup', description: 'For growing teams', icon: '🚀' },
    ]},
    { id: '3', title: 'Resources', items: [
      { id: '3a', label: 'Documentation', href: '/docs', description: 'Learn the platform', icon: '📖' },
      { id: '3b', label: 'Blog', href: '/blog', description: 'Latest updates', icon: '✍️' },
    ]},
  ], trigger: 'Products', showCTA: true, ctaLabel: 'Get Started Free', ctaHref: '/signup', variant: 'full-width' },
];

export function useMegaMenuBuilder() {
  const [menus, setMenus] = useState<MegaMenuConfig[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const createMenu = useCallback((preset?: string) => {
    const p = preset ? PRESETS.find(pr => pr.name === preset) : undefined;
    const m: MegaMenuConfig = {
      id: crypto.randomUUID(),
      name: p?.name || `Mega Menu ${menus.length + 1}`,
      columns: p?.columns.map(c => ({ ...c, id: crypto.randomUUID(), items: c.items.map(i => ({ ...i, id: crypto.randomUUID() })) })) || [],
      trigger: p?.trigger || 'Menu',
      showCTA: p?.showCTA ?? false,
      ctaLabel: p?.ctaLabel || '',
      ctaHref: p?.ctaHref || '',
      variant: p?.variant || 'full-width',
    };
    setMenus(prev => [...prev, m]);
    setActiveMenu(m.id);
    return m;
  }, [menus.length]);

  const updateMenu = useCallback((id: string, updates: Partial<MegaMenuConfig>) => {
    setMenus(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const deleteMenu = useCallback((id: string) => {
    setMenus(prev => prev.filter(m => m.id !== id));
    if (activeMenu === id) setActiveMenu(null);
  }, [activeMenu]);

  const addColumn = useCallback((menuId: string) => {
    setMenus(prev => prev.map(m => m.id === menuId ? { ...m, columns: [...m.columns, { id: crypto.randomUUID(), title: `Column ${m.columns.length + 1}`, items: [] }] } : m));
  }, []);

  const removeColumn = useCallback((menuId: string, colId: string) => {
    setMenus(prev => prev.map(m => m.id === menuId ? { ...m, columns: m.columns.filter(c => c.id !== colId) } : m));
  }, []);

  const addItemToColumn = useCallback((menuId: string, colId: string) => {
    setMenus(prev => prev.map(m => m.id === menuId ? { ...m, columns: m.columns.map(c => c.id === colId ? { ...c, items: [...c.items, { id: crypto.randomUUID(), label: 'New Item', href: '#', description: '', icon: '📋' }] } : c) } : m));
  }, []);

  const generateCode = useCallback((id: string): string => {
    const m = menus.find(mn => mn.id === id);
    if (!m) return '';
    const colCode = m.columns.map(c => {
      const items = c.items.map(i => `        { label: ${JSON.stringify(i.label)}, href: ${JSON.stringify(i.href)}, description: ${JSON.stringify(i.description)}, icon: ${JSON.stringify(i.icon)} }`).join(',\n');
      return `    { title: ${JSON.stringify(c.title)}, items: [\n${items}\n    ]}`;
    }).join(',\n');
    return `import { useState } from 'react';\nimport { Link } from 'react-router-dom';\n\nconst columns = [\n${colCode}\n];\n\nexport function MegaMenu() {\n  const [open, setOpen] = useState(false);\n  return (\n    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>\n      <button className="px-4 py-2 font-medium">${m.trigger}</button>\n      {open && (\n        <div className="absolute top-full left-0 w-full min-w-[600px] bg-popover border rounded-lg shadow-lg p-6 grid grid-cols-${m.columns.length} gap-6">\n          {columns.map((col, i) => (\n            <div key={i}>\n              <h3 className="font-semibold text-sm mb-3">{col.title}</h3>\n              <ul className="space-y-2">\n                {col.items.map((item, j) => (\n                  <li key={j}><Link to={item.href} className="flex items-start gap-2 p-2 rounded hover:bg-accent"><span>{item.icon}</span><div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.description}</p></div></Link></li>\n                ))}\n              </ul>\n            </div>\n          ))}\n        </div>\n      )}\n    </div>\n  );\n}`;
  }, [menus]);

  const getActive = useCallback(() => menus.find(m => m.id === activeMenu) || null, [menus, activeMenu]);

  return { menus, activeMenu, setActiveMenu, createMenu, updateMenu, deleteMenu, addColumn, removeColumn, addItemToColumn, generateCode, getActive, presetNames: PRESETS.map(p => p.name) };
}
