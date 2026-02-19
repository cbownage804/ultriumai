import { useState, useCallback, useMemo } from 'react';

export interface IconEntry {
  name: string;
  library: 'lucide' | 'heroicons' | 'phosphor';
  importName: string;
  importStatement: string;
  jsx: string;
  tags: string[];
}

const LUCIDE_ICONS: Omit<IconEntry, 'library' | 'importStatement' | 'jsx'>[] = [
  { name: 'Home', importName: 'Home', tags: ['house', 'main', 'landing'] },
  { name: 'Search', importName: 'Search', tags: ['find', 'magnify', 'query'] },
  { name: 'Settings', importName: 'Settings', tags: ['gear', 'config', 'preferences'] },
  { name: 'User', importName: 'User', tags: ['person', 'profile', 'account'] },
  { name: 'Mail', importName: 'Mail', tags: ['email', 'envelope', 'message'] },
  { name: 'Heart', importName: 'Heart', tags: ['love', 'like', 'favorite'] },
  { name: 'Star', importName: 'Star', tags: ['rating', 'favorite', 'bookmark'] },
  { name: 'Bell', importName: 'Bell', tags: ['notification', 'alert', 'ring'] },
  { name: 'Calendar', importName: 'Calendar', tags: ['date', 'schedule', 'event'] },
  { name: 'Camera', importName: 'Camera', tags: ['photo', 'picture', 'capture'] },
  { name: 'Check', importName: 'Check', tags: ['done', 'complete', 'verify'] },
  { name: 'ChevronDown', importName: 'ChevronDown', tags: ['arrow', 'expand', 'dropdown'] },
  { name: 'Clock', importName: 'Clock', tags: ['time', 'schedule', 'hours'] },
  { name: 'Code', importName: 'Code', tags: ['programming', 'developer', 'syntax'] },
  { name: 'Copy', importName: 'Copy', tags: ['duplicate', 'clipboard', 'paste'] },
  { name: 'Database', importName: 'Database', tags: ['storage', 'data', 'server'] },
  { name: 'Download', importName: 'Download', tags: ['save', 'export', 'file'] },
  { name: 'Edit', importName: 'Edit', tags: ['modify', 'pencil', 'write'] },
  { name: 'Eye', importName: 'Eye', tags: ['view', 'visible', 'show'] },
  { name: 'File', importName: 'File', tags: ['document', 'page', 'paper'] },
  { name: 'Filter', importName: 'Filter', tags: ['sort', 'funnel', 'refine'] },
  { name: 'Folder', importName: 'Folder', tags: ['directory', 'organize', 'files'] },
  { name: 'Globe', importName: 'Globe', tags: ['world', 'web', 'internet'] },
  { name: 'Image', importName: 'Image', tags: ['photo', 'picture', 'media'] },
  { name: 'Info', importName: 'Info', tags: ['information', 'help', 'details'] },
  { name: 'Layout', importName: 'Layout', tags: ['grid', 'template', 'structure'] },
  { name: 'Link', importName: 'Link', tags: ['url', 'chain', 'connect'] },
  { name: 'Lock', importName: 'Lock', tags: ['security', 'password', 'private'] },
  { name: 'Map', importName: 'Map', tags: ['location', 'navigation', 'directions'] },
  { name: 'Menu', importName: 'Menu', tags: ['hamburger', 'navigation', 'sidebar'] },
  { name: 'MessageCircle', importName: 'MessageCircle', tags: ['chat', 'comment', 'discuss'] },
  { name: 'Moon', importName: 'Moon', tags: ['dark', 'night', 'theme'] },
  { name: 'MoreHorizontal', importName: 'MoreHorizontal', tags: ['dots', 'menu', 'options'] },
  { name: 'Music', importName: 'Music', tags: ['audio', 'sound', 'song'] },
  { name: 'Phone', importName: 'Phone', tags: ['call', 'contact', 'mobile'] },
  { name: 'Play', importName: 'Play', tags: ['start', 'video', 'media'] },
  { name: 'Plus', importName: 'Plus', tags: ['add', 'create', 'new'] },
  { name: 'Power', importName: 'Power', tags: ['on', 'off', 'switch'] },
  { name: 'Rocket', importName: 'Rocket', tags: ['launch', 'deploy', 'fast'] },
  { name: 'Save', importName: 'Save', tags: ['disk', 'store', 'persist'] },
  { name: 'Send', importName: 'Send', tags: ['submit', 'email', 'share'] },
  { name: 'Share', importName: 'Share2', tags: ['social', 'forward', 'distribute'] },
  { name: 'Shield', importName: 'Shield', tags: ['security', 'protect', 'safe'] },
  { name: 'ShoppingCart', importName: 'ShoppingCart', tags: ['buy', 'ecommerce', 'store'] },
  { name: 'Sun', importName: 'Sun', tags: ['light', 'day', 'theme'] },
  { name: 'Trash', importName: 'Trash2', tags: ['delete', 'remove', 'bin'] },
  { name: 'Upload', importName: 'Upload', tags: ['import', 'file', 'add'] },
  { name: 'Video', importName: 'Video', tags: ['camera', 'record', 'media'] },
  { name: 'Zap', importName: 'Zap', tags: ['lightning', 'fast', 'energy'] },
];

export function useIconPicker() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLibrary, setSelectedLibrary] = useState<'all' | 'lucide' | 'heroicons' | 'phosphor'>('all');

  const allIcons: IconEntry[] = useMemo(() =>
    LUCIDE_ICONS.map(icon => ({
      ...icon,
      library: 'lucide' as const,
      importStatement: `import { ${icon.importName} } from 'lucide-react';`,
      jsx: `<${icon.importName} className="h-5 w-5" />`,
    })),
  []);

  const filteredIcons = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return allIcons.filter(icon => {
      if (selectedLibrary !== 'all' && icon.library !== selectedLibrary) return false;
      if (!q) return true;
      return icon.name.toLowerCase().includes(q) || icon.tags.some(t => t.includes(q));
    });
  }, [allIcons, searchQuery, selectedLibrary]);

  const getInsertCode = useCallback((icon: IconEntry) => ({
    import: icon.importStatement,
    jsx: icon.jsx,
  }), []);

  return { searchQuery, setSearchQuery, selectedLibrary, setSelectedLibrary, filteredIcons, getInsertCode, totalCount: allIcons.length };
}
