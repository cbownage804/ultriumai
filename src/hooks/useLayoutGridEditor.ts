import { useState, useCallback } from 'react';

export interface GridArea {
  id: string;
  name: string;
  gridColumn: string;
  gridRow: string;
  backgroundColor: string;
  content?: string;
}

export interface GridConfig {
  id: string;
  name: string;
  mode: 'grid' | 'flex';
  columns: number;
  rows: number;
  gap: number;
  areas: GridArea[];
  justifyContent?: string;
  alignItems?: string;
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  flexWrap?: 'wrap' | 'nowrap';
  breakpoints: { minWidth: number; columns: number; gap: number }[];
}

type AreaInput = { name: string; gridColumn: string; gridRow: string; backgroundColor: string; content?: string };
const LAYOUT_PRESETS: { name: string; config: { mode: 'grid' | 'flex'; columns: number; rows: number; gap: number; areas: AreaInput[] } }[] = [
  {
    name: 'Holy Grail',
    config: {
      mode: 'grid', columns: 3, rows: 3, gap: 16,
      areas: [
        { name: 'header', gridColumn: '1 / -1', gridRow: '1', backgroundColor: '#e2e8f0' },
        { name: 'sidebar', gridColumn: '1', gridRow: '2', backgroundColor: '#f1f5f9' },
        { name: 'main', gridColumn: '2 / 4', gridRow: '2', backgroundColor: '#ffffff' },
        { name: 'footer', gridColumn: '1 / -1', gridRow: '3', backgroundColor: '#e2e8f0' },
      ],
    },
  },
  {
    name: '2-Column',
    config: {
      mode: 'grid', columns: 2, rows: 1, gap: 24,
      areas: [
        { name: 'left', gridColumn: '1', gridRow: '1', backgroundColor: '#f1f5f9' },
        { name: 'right', gridColumn: '2', gridRow: '1', backgroundColor: '#ffffff' },
      ],
    },
  },
  {
    name: 'Dashboard',
    config: {
      mode: 'grid', columns: 4, rows: 3, gap: 16,
      areas: [
        { name: 'header', gridColumn: '1 / -1', gridRow: '1', backgroundColor: '#1e293b', content: 'Header' },
        { name: 'sidebar', gridColumn: '1', gridRow: '2 / 4', backgroundColor: '#f1f5f9', content: 'Sidebar' },
        { name: 'widget1', gridColumn: '2', gridRow: '2', backgroundColor: '#dbeafe', content: 'Widget 1' },
        { name: 'widget2', gridColumn: '3', gridRow: '2', backgroundColor: '#dcfce7', content: 'Widget 2' },
        { name: 'widget3', gridColumn: '4', gridRow: '2', backgroundColor: '#fef3c7', content: 'Widget 3' },
        { name: 'main', gridColumn: '2 / -1', gridRow: '3', backgroundColor: '#ffffff', content: 'Main Content' },
      ],
    },
  },
  {
    name: 'Masonry',
    config: {
      mode: 'grid', columns: 3, rows: 4, gap: 12,
      areas: [
        { name: 'a', gridColumn: '1', gridRow: '1 / 3', backgroundColor: '#dbeafe' },
        { name: 'b', gridColumn: '2', gridRow: '1', backgroundColor: '#dcfce7' },
        { name: 'c', gridColumn: '3', gridRow: '1 / 3', backgroundColor: '#fef3c7' },
        { name: 'd', gridColumn: '2', gridRow: '2 / 4', backgroundColor: '#fce7f3' },
        { name: 'e', gridColumn: '1', gridRow: '3 / 5', backgroundColor: '#e0e7ff' },
        { name: 'f', gridColumn: '3', gridRow: '3', backgroundColor: '#f3e8ff' },
      ],
    },
  },
];

export function useLayoutGridEditor() {
  const [layouts, setLayouts] = useState<GridConfig[]>([]);
  const [activeLayout, setActiveLayout] = useState<string | null>(null);

  const createLayout = useCallback((name: string, mode: 'grid' | 'flex' = 'grid') => {
    const layout: GridConfig = {
      id: crypto.randomUUID(), name, mode,
      columns: 3, rows: 2, gap: 16, areas: [],
      justifyContent: 'start', alignItems: 'stretch',
      flexDirection: 'row', flexWrap: 'wrap', breakpoints: [],
    };
    setLayouts(prev => [...prev, layout]);
    setActiveLayout(layout.id);
    return layout;
  }, []);

  const applyPreset = useCallback((layoutId: string, presetName: string) => {
    const preset = LAYOUT_PRESETS.find(p => p.name === presetName);
    if (!preset) return;
    setLayouts(prev => prev.map(l => l.id === layoutId ? {
      ...l, ...preset.config,
      areas: preset.config.areas.map(a => ({ ...a, id: crypto.randomUUID() })),
    } : l));
  }, []);

  const addArea = useCallback((layoutId: string) => {
    const area: GridArea = { id: crypto.randomUUID(), name: 'area', gridColumn: '1', gridRow: '1', backgroundColor: '#f1f5f9' };
    setLayouts(prev => prev.map(l => l.id === layoutId ? { ...l, areas: [...l.areas, area] } : l));
  }, []);

  const updateArea = useCallback((layoutId: string, areaId: string, updates: Partial<GridArea>) => {
    setLayouts(prev => prev.map(l => l.id === layoutId ? {
      ...l, areas: l.areas.map(a => a.id === areaId ? { ...a, ...updates } : a)
    } : l));
  }, []);

  const removeArea = useCallback((layoutId: string, areaId: string) => {
    setLayouts(prev => prev.map(l => l.id === layoutId ? { ...l, areas: l.areas.filter(a => a.id !== areaId) } : l));
  }, []);

  const updateLayout = useCallback((layoutId: string, updates: Partial<GridConfig>) => {
    setLayouts(prev => prev.map(l => l.id === layoutId ? { ...l, ...updates } : l));
  }, []);

  const addBreakpoint = useCallback((layoutId: string, minWidth: number, columns: number, gap: number) => {
    setLayouts(prev => prev.map(l => l.id === layoutId ? {
      ...l, breakpoints: [...l.breakpoints, { minWidth, columns, gap }].sort((a, b) => a.minWidth - b.minWidth)
    } : l));
  }, []);

  const generateCSS = useCallback((layoutId: string): string => {
    const layout = layouts.find(l => l.id === layoutId);
    if (!layout) return '';
    if (layout.mode === 'grid') {
      let css = `.${layout.name.replace(/\s/g, '-').toLowerCase()} {\n  display: grid;\n  grid-template-columns: repeat(${layout.columns}, 1fr);\n  grid-template-rows: repeat(${layout.rows}, auto);\n  gap: ${layout.gap}px;\n}\n`;
      layout.areas.forEach(a => {
        css += `\n.${a.name} {\n  grid-column: ${a.gridColumn};\n  grid-row: ${a.gridRow};\n}`;
      });
      layout.breakpoints.forEach(bp => {
        css += `\n\n@media (min-width: ${bp.minWidth}px) {\n  .${layout.name.replace(/\s/g, '-').toLowerCase()} {\n    grid-template-columns: repeat(${bp.columns}, 1fr);\n    gap: ${bp.gap}px;\n  }\n}`;
      });
      return css;
    } else {
      return `.${layout.name.replace(/\s/g, '-').toLowerCase()} {\n  display: flex;\n  flex-direction: ${layout.flexDirection || 'row'};\n  flex-wrap: ${layout.flexWrap || 'wrap'};\n  gap: ${layout.gap}px;\n  justify-content: ${layout.justifyContent || 'start'};\n  align-items: ${layout.alignItems || 'stretch'};\n}`;
    }
  }, [layouts]);

  const generateTailwind = useCallback((layoutId: string): string => {
    const layout = layouts.find(l => l.id === layoutId);
    if (!layout) return '';
    if (layout.mode === 'grid') {
      const cls = `grid grid-cols-${layout.columns} gap-${Math.round(layout.gap / 4)}`;
      const areasJSX = layout.areas.map(a => `  <div className="col-span-1" style={{gridColumn:'${a.gridColumn}',gridRow:'${a.gridRow}'}}>\n    {/* ${a.name} */}\n  </div>`).join('\n');
      return `<div className="${cls}">\n${areasJSX}\n</div>`;
    } else {
      const cls = `flex ${layout.flexDirection === 'column' ? 'flex-col' : ''} ${layout.flexWrap === 'wrap' ? 'flex-wrap' : ''} gap-${Math.round(layout.gap / 4)} items-${layout.alignItems === 'center' ? 'center' : 'stretch'}`;
      return `<div className="${cls.trim()}">\n  {/* flex children */}\n</div>`;
    }
  }, [layouts]);

  const getActiveLayout = useCallback(() => layouts.find(l => l.id === activeLayout) || null, [layouts, activeLayout]);

  return {
    layouts, activeLayout, setActiveLayout, createLayout, applyPreset, addArea,
    updateArea, removeArea, updateLayout, addBreakpoint, generateCSS, generateTailwind,
    getActiveLayout, presets: LAYOUT_PRESETS.map(p => p.name),
  };
}
