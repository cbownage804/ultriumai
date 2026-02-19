import { useState, useCallback } from 'react';

export interface BreadcrumbItem {
  id: string;
  label: string;
  href: string;
  icon: string;
}

export interface BreadcrumbConfig {
  id: string;
  name: string;
  items: BreadcrumbItem[];
  separator: '/' | '>' | '→' | '•' | 'chevron';
  showHome: boolean;
  collapsible: boolean;
  maxVisible: number;
  variant: 'default' | 'pill' | 'underline';
}

const PRESETS: Omit<BreadcrumbConfig, 'id'>[] = [
  { name: 'E-commerce', items: [
    { id: '1', label: 'Home', href: '/', icon: '🏠' },
    { id: '2', label: 'Electronics', href: '/electronics', icon: '🔌' },
    { id: '3', label: 'Laptops', href: '/electronics/laptops', icon: '💻' },
    { id: '4', label: 'MacBook Pro', href: '/electronics/laptops/macbook-pro', icon: '' },
  ], separator: 'chevron', showHome: true, collapsible: true, maxVisible: 4, variant: 'default' },
  { name: 'Dashboard', items: [
    { id: '1', label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { id: '2', label: 'Analytics', href: '/dashboard/analytics', icon: '📈' },
    { id: '3', label: 'Reports', href: '/dashboard/analytics/reports', icon: '📄' },
  ], separator: '/', showHome: false, collapsible: false, maxVisible: 5, variant: 'pill' },
];

export function useBreadcrumbGenerator() {
  const [configs, setConfigs] = useState<BreadcrumbConfig[]>([]);
  const [activeConfig, setActiveConfig] = useState<string | null>(null);

  const createConfig = useCallback((preset?: string) => {
    const p = preset ? PRESETS.find(pr => pr.name === preset) : undefined;
    const c: BreadcrumbConfig = {
      id: crypto.randomUUID(),
      name: p?.name || `Breadcrumb ${configs.length + 1}`,
      items: p?.items.map(i => ({ ...i, id: crypto.randomUUID() })) || [
        { id: crypto.randomUUID(), label: 'Home', href: '/', icon: '🏠' },
      ],
      separator: p?.separator || 'chevron',
      showHome: p?.showHome ?? true,
      collapsible: p?.collapsible ?? false,
      maxVisible: p?.maxVisible || 4,
      variant: p?.variant || 'default',
    };
    setConfigs(prev => [...prev, c]);
    setActiveConfig(c.id);
    return c;
  }, [configs.length]);

  const updateConfig = useCallback((id: string, updates: Partial<BreadcrumbConfig>) => {
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteConfig = useCallback((id: string) => {
    setConfigs(prev => prev.filter(c => c.id !== id));
    if (activeConfig === id) setActiveConfig(null);
  }, [activeConfig]);

  const addItem = useCallback((configId: string) => {
    setConfigs(prev => prev.map(c => c.id === configId ? { ...c, items: [...c.items, { id: crypto.randomUUID(), label: 'Page', href: '/page', icon: '' }] } : c));
  }, []);

  const removeItem = useCallback((configId: string, itemId: string) => {
    setConfigs(prev => prev.map(c => c.id === configId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c));
  }, []);

  const updateItem = useCallback((configId: string, itemId: string, updates: Partial<BreadcrumbItem>) => {
    setConfigs(prev => prev.map(c => c.id === configId ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, ...updates } : i) } : c));
  }, []);

  const generateCode = useCallback((id: string): string => {
    const c = configs.find(cfg => cfg.id === id);
    if (!c) return '';
    const sepMap: Record<string, string> = { '/': '/', '>': '>', '→': '→', '•': '•', chevron: '›' };
    const itemsArr = c.items.map(i => `  { label: ${JSON.stringify(i.label)}, href: ${JSON.stringify(i.href)} }`).join(',\n');
    return `import { Link } from 'react-router-dom';\n\nconst items = [\n${itemsArr}\n];\n\nexport function Breadcrumbs() {\n  return (\n    <nav className="flex items-center gap-1 text-sm text-muted-foreground">\n      {items.map((item, i) => (\n        <span key={i} className="flex items-center gap-1">\n          {i > 0 && <span className="mx-1">${sepMap[c.separator]}</span>}\n          {i < items.length - 1 ? (\n            <Link to={item.href} className="hover:text-foreground transition-colors">{item.label}</Link>\n          ) : (\n            <span className="text-foreground font-medium">{item.label}</span>\n          )}\n        </span>\n      ))}\n    </nav>\n  );\n}`;
  }, [configs]);

  const getActive = useCallback(() => configs.find(c => c.id === activeConfig) || null, [configs, activeConfig]);

  return { configs, activeConfig, setActiveConfig, createConfig, updateConfig, deleteConfig, addItem, removeItem, updateItem, generateCode, getActive, presetNames: PRESETS.map(p => p.name) };
}
