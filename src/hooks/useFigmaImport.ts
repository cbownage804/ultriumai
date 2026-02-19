import { useState, useCallback } from 'react';

export interface FigmaLayer {
  id: string;
  name: string;
  type: 'FRAME' | 'TEXT' | 'RECTANGLE' | 'COMPONENT' | 'GROUP' | 'VECTOR' | 'IMAGE';
  x: number;
  y: number;
  width: number;
  height: number;
  fills?: { type: string; color?: { r: number; g: number; b: number; a: number } }[];
  strokes?: { type: string; color?: { r: number; g: number; b: number; a: number } }[];
  children?: FigmaLayer[];
  characters?: string;
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number;
    lineHeight?: number;
    letterSpacing?: number;
    textAlignHorizontal?: string;
  };
  cornerRadius?: number;
  opacity?: number;
}

export interface FigmaImportResult {
  componentName: string;
  jsx: string;
  css: string;
  layerCount: number;
}

function rgbaToTailwind(r: number, g: number, b: number, a: number): string {
  const hex = `#${Math.round(r * 255).toString(16).padStart(2, '0')}${Math.round(g * 255).toString(16).padStart(2, '0')}${Math.round(b * 255).toString(16).padStart(2, '0')}`;
  if (a < 1) return `${hex}/${Math.round(a * 100)}`;
  return hex;
}

function layerToJSX(layer: FigmaLayer, indent: number = 2): string {
  const pad = ' '.repeat(indent);
  const classes: string[] = [];

  if (layer.width) classes.push(`w-[${Math.round(layer.width)}px]`);
  if (layer.height) classes.push(`h-[${Math.round(layer.height)}px]`);
  if (layer.cornerRadius) classes.push(`rounded-[${layer.cornerRadius}px]`);
  if (layer.opacity !== undefined && layer.opacity < 1) classes.push(`opacity-${Math.round(layer.opacity * 100)}`);

  if (layer.fills?.length) {
    const fill = layer.fills[0];
    if (fill.color) {
      const c = fill.color;
      classes.push(`bg-[${rgbaToTailwind(c.r, c.g, c.b, c.a)}]`);
    }
  }

  if (layer.type === 'TEXT' && layer.characters) {
    const textClasses: string[] = [];
    if (layer.style?.fontSize) textClasses.push(`text-[${layer.style.fontSize}px]`);
    if (layer.style?.fontWeight && layer.style.fontWeight >= 700) textClasses.push('font-bold');
    else if (layer.style?.fontWeight && layer.style.fontWeight >= 500) textClasses.push('font-medium');
    return `${pad}<p className="${textClasses.join(' ')}">${layer.characters}</p>`;
  }

  const childJSX = layer.children?.map(c => layerToJSX(c, indent + 2)).join('\n') || '';
  const tag = layer.children?.length ? 'div' : 'div';

  if (childJSX) {
    return `${pad}<${tag} className="${classes.join(' ')}">\n${childJSX}\n${pad}</${tag}>`;
  }
  return `${pad}<${tag} className="${classes.join(' ')}" />`;
}

export function useFigmaImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<FigmaImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const importFromJSON = useCallback((jsonStr: string) => {
    setIsImporting(true);
    setError(null);
    try {
      const data = JSON.parse(jsonStr);
      const layers: FigmaLayer[] = Array.isArray(data) ? data : data.children || [data];
      const componentName = data.name?.replace(/[^a-zA-Z0-9]/g, '') || 'FigmaComponent';

      let layerCount = 0;
      const countLayers = (l: FigmaLayer) => { layerCount++; l.children?.forEach(countLayers); };
      layers.forEach(countLayers);

      const jsx = layers.map(l => layerToJSX(l)).join('\n');
      const result: FigmaImportResult = {
        componentName,
        jsx: `export function ${componentName}() {\n  return (\n    <div className="relative">\n${jsx}\n    </div>\n  );\n}`,
        css: '',
        layerCount,
      };
      setImportResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
    } finally {
      setIsImporting(false);
    }
  }, []);

  const importFromURL = useCallback(async (figmaUrl: string, _token?: string) => {
    setError('Figma API import requires a personal access token. Use JSON export for now.');
  }, []);

  const clearImport = useCallback(() => {
    setImportResult(null);
    setError(null);
  }, []);

  return { isImporting, importResult, error, importFromJSON, importFromURL, clearImport };
}
