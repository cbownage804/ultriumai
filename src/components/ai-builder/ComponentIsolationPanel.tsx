/**
 * Component Preview Isolation — Wave 12
 * Storybook-like panel for previewing individual components
 * with prop controls, independent of the main app routing.
 */

import { useState, useMemo, useCallback } from 'react';
import { X, Play, RotateCcw, Code, Eye, Plus, Trash2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface PropControl {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  value: string;
  options?: string[];
}

interface ComponentIsolationPanelProps {
  open: boolean;
  onClose: () => void;
  files: ProjectFile[];
  onGeneratePreview?: (componentPath: string, props: Record<string, any>) => void;
  onGoToFile?: (path: string) => void;
}

// Extract component exports from project files
function extractComponents(files: ProjectFile[]): { path: string; name: string; hasProps: boolean; propNames: string[] }[] {
  const components: { path: string; name: string; hasProps: boolean; propNames: string[] }[] = [];

  for (const file of files) {
    if (!file.path.match(/\.(tsx|jsx)$/) || file.path.includes('.test.') || file.path.includes('__tests__')) continue;

    // Match exported function/const components
    const exportRegex = /export\s+(?:default\s+)?(?:function|const)\s+([A-Z]\w+)/g;
    let match;
    while ((match = exportRegex.exec(file.content)) !== null) {
      const name = match[1];
      // Try to extract prop interface/type
      const propsRegex = new RegExp(`(?:interface|type)\\s+${name}Props\\s*[={]([^}]+)`, 'g');
      const propsMatch = propsRegex.exec(file.content);
      const propNames: string[] = [];
      if (propsMatch) {
        const propsBody = propsMatch[1];
        const propLineRegex = /(\w+)\s*[?:]?\s*:\s*(\w+)/g;
        let propMatch;
        while ((propMatch = propLineRegex.exec(propsBody)) !== null) {
          propNames.push(propMatch[1]);
        }
      }
      components.push({ path: file.path, name, hasProps: propNames.length > 0, propNames });
    }
  }

  return components.sort((a, b) => a.name.localeCompare(b.name));
}

export function ComponentIsolationPanel({ open, onClose, files, onGeneratePreview, onGoToFile }: ComponentIsolationPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [propControls, setPropControls] = useState<PropControl[]>([]);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'controls' | 'code'>('controls');

  const components = useMemo(() => extractComponents(files), [files]);
  const filtered = useMemo(() => {
    if (!searchQuery) return components;
    const q = searchQuery.toLowerCase();
    return components.filter(c => c.name.toLowerCase().includes(q) || c.path.toLowerCase().includes(q));
  }, [components, searchQuery]);

  const selectedInfo = useMemo(() => components.find(c => `${c.path}:${c.name}` === selectedComponent), [components, selectedComponent]);

  const selectComponent = useCallback((path: string, name: string, propNames: string[]) => {
    const key = `${path}:${name}`;
    setSelectedComponent(key);
    setPropControls(propNames.map(pn => ({
      name: pn,
      type: 'string',
      value: '',
    })));
    setPreviewCode(null);
  }, []);

  const addPropControl = useCallback(() => {
    setPropControls(prev => [...prev, { name: '', type: 'string', value: '' }]);
  }, []);

  const updateProp = useCallback((index: number, field: keyof PropControl, val: string) => {
    setPropControls(prev => prev.map((p, i) => i === index ? { ...p, [field]: val } : p));
  }, []);

  const removeProp = useCallback((index: number) => {
    setPropControls(prev => prev.filter((_, i) => i !== index));
  }, []);

  const generatePreviewCode = useCallback(() => {
    if (!selectedInfo) return;
    const propsObj: Record<string, any> = {};
    for (const ctrl of propControls) {
      if (!ctrl.name) continue;
      if (ctrl.type === 'boolean') propsObj[ctrl.name] = ctrl.value === 'true';
      else if (ctrl.type === 'number') propsObj[ctrl.name] = Number(ctrl.value) || 0;
      else propsObj[ctrl.name] = ctrl.value;
    }

    const propsStr = Object.entries(propsObj)
      .map(([k, v]) => {
        if (typeof v === 'boolean') return v ? k : `${k}={false}`;
        if (typeof v === 'number') return `${k}={${v}}`;
        return `${k}="${v}"`;
      })
      .join(' ');

    const importPath = selectedInfo.path.replace(/^src\//, '@/').replace(/\.(tsx|jsx)$/, '');
    const code = `import { ${selectedInfo.name} } from '${importPath}';\n\nexport default function Preview() {\n  return (\n    <div className="p-8 flex items-center justify-center min-h-screen bg-background">\n      <${selectedInfo.name}${propsStr ? ' ' + propsStr : ''} />\n    </div>\n  );\n}`;

    setPreviewCode(code);
    onGeneratePreview?.(selectedInfo.path, propsObj);
  }, [selectedInfo, propControls, onGeneratePreview]);

  if (!open) return null;

  return (
    <div className="w-80 h-full border-r border-white/[0.06] bg-[#0a0a10] flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-9 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5 text-xs font-medium text-white/60">
          <Eye className="h-3.5 w-3.5" />
          Component Preview
        </div>
        <button onClick={onClose} className="text-[10px] text-white/30 hover:text-white/60">Close</button>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-white/[0.04]">
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search components..."
          className="h-7 text-[11px] bg-white/[0.04] border-white/[0.06] text-white/70"
        />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* Component list */}
          {!selectedComponent && (
            <>
              <p className="text-[10px] text-white/25 px-1 mb-2">
                {filtered.length} component{filtered.length !== 1 ? 's' : ''} found
              </p>
              {filtered.map(c => (
                <button
                  key={`${c.path}:${c.name}`}
                  onClick={() => selectComponent(c.path, c.name, c.propNames)}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-white/[0.04] transition-colors group"
                >
                  <div className="text-[12px] text-white/70 font-medium group-hover:text-white/90">{c.name}</div>
                  <div className="text-[10px] text-white/25 font-mono truncate">{c.path}</div>
                  {c.propNames.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {c.propNames.slice(0, 4).map(p => (
                        <span key={p} className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300/60">{p}</span>
                      ))}
                      {c.propNames.length > 4 && (
                        <span className="text-[9px] text-white/20">+{c.propNames.length - 4}</span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </>
          )}

          {/* Selected component controls */}
          {selectedComponent && selectedInfo && (
            <div className="space-y-3">
              <button
                onClick={() => { setSelectedComponent(null); setPreviewCode(null); }}
                className="text-[10px] text-white/30 hover:text-white/60 flex items-center gap-1"
              >
                ← Back to list
              </button>

              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[12px] text-white/80 font-medium">{selectedInfo.name}</div>
                <button
                  onClick={() => onGoToFile?.(selectedInfo.path)}
                  className="text-[10px] text-cyan-400/60 hover:text-cyan-400/90 font-mono"
                >
                  {selectedInfo.path}
                </button>
              </div>

              {/* View mode tabs */}
              <div className="flex gap-1">
                <button
                  onClick={() => setViewMode('controls')}
                  className={cn(
                    "flex-1 h-7 text-[10px] rounded-md flex items-center justify-center gap-1 transition-colors",
                    viewMode === 'controls' ? "bg-white/[0.08] text-white/70" : "text-white/30 hover:text-white/50"
                  )}
                >
                  <ChevronDown className="h-3 w-3" /> Props
                </button>
                <button
                  onClick={() => setViewMode('code')}
                  className={cn(
                    "flex-1 h-7 text-[10px] rounded-md flex items-center justify-center gap-1 transition-colors",
                    viewMode === 'code' ? "bg-white/[0.08] text-white/70" : "text-white/30 hover:text-white/50"
                  )}
                >
                  <Code className="h-3 w-3" /> Code
                </button>
              </div>

              {viewMode === 'controls' && (
                <div className="space-y-2">
                  {propControls.map((ctrl, i) => (
                    <div key={i} className="space-y-1 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <div className="flex items-center gap-1">
                        <Input
                          value={ctrl.name}
                          onChange={e => updateProp(i, 'name', e.target.value)}
                          placeholder="prop name"
                          className="h-6 text-[10px] bg-black/30 border-white/[0.06] text-white/60 font-mono flex-1"
                        />
                        <select
                          value={ctrl.type}
                          onChange={e => updateProp(i, 'type', e.target.value)}
                          className="h-6 text-[10px] bg-black/30 border border-white/[0.06] text-white/40 rounded px-1"
                        >
                          <option value="string">str</option>
                          <option value="number">num</option>
                          <option value="boolean">bool</option>
                        </select>
                        <button onClick={() => removeProp(i)} className="text-white/20 hover:text-red-400">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      {ctrl.type === 'boolean' ? (
                        <select
                          value={ctrl.value}
                          onChange={e => updateProp(i, 'value', e.target.value)}
                          className="w-full h-6 text-[10px] bg-black/30 border border-white/[0.06] text-white/50 rounded px-1.5"
                        >
                          <option value="true">true</option>
                          <option value="false">false</option>
                        </select>
                      ) : (
                        <Input
                          value={ctrl.value}
                          onChange={e => updateProp(i, 'value', e.target.value)}
                          placeholder="value"
                          type={ctrl.type === 'number' ? 'number' : 'text'}
                          className="h-6 text-[10px] bg-black/30 border-white/[0.06] text-white/50 font-mono"
                        />
                      )}
                    </div>
                  ))}

                  <Button
                    onClick={addPropControl}
                    variant="outline"
                    size="sm"
                    className="w-full h-7 text-[10px] bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/70"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Prop
                  </Button>
                </div>
              )}

              {viewMode === 'code' && previewCode && (
                <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-2">
                  <pre className="text-[10px] text-emerald-300/60 font-mono whitespace-pre-wrap leading-4 overflow-auto max-h-48">
                    {previewCode}
                  </pre>
                </div>
              )}

              <div className="flex gap-1.5">
                <Button
                  onClick={generatePreviewCode}
                  size="sm"
                  className="flex-1 h-7 text-[10px] bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 border-0"
                >
                  <Play className="h-3 w-3 mr-1" /> Preview
                </Button>
                <Button
                  onClick={() => { setPropControls([]); setPreviewCode(null); }}
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] bg-white/[0.02] border-white/[0.06] text-white/40"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default ComponentIsolationPanel;
