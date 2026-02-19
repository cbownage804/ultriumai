import { useState, useCallback } from 'react';

export interface PreviewType {
  id: string;
  name: string;
  extensions: string[];
  enabled: boolean;
  renderer: 'image' | 'pdf' | 'code' | 'audio' | 'video' | 'text';
}

const DEFAULT_TYPES: PreviewType[] = [
  { id: 'images', name: 'Images', extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'], enabled: true, renderer: 'image' },
  { id: 'pdf', name: 'PDF Documents', extensions: ['.pdf'], enabled: true, renderer: 'pdf' },
  { id: 'code', name: 'Code Files', extensions: ['.ts', '.tsx', '.js', '.jsx', '.css', '.html', '.json'], enabled: true, renderer: 'code' },
  { id: 'audio', name: 'Audio', extensions: ['.mp3', '.wav', '.ogg', '.m4a'], enabled: false, renderer: 'audio' },
  { id: 'video', name: 'Video', extensions: ['.mp4', '.webm', '.mov'], enabled: false, renderer: 'video' },
  { id: 'text', name: 'Text Files', extensions: ['.txt', '.md', '.csv', '.log'], enabled: true, renderer: 'text' },
];

export function useFilePreviewGenerator() {
  const [types, setTypes] = useState<PreviewType[]>(DEFAULT_TYPES);
  const [maxFileSize, setMaxFileSize] = useState(10); // MB

  const toggleType = useCallback((id: string) => {
    setTypes(prev => prev.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
  }, []);

  const generateCode = useCallback((): string => {
    const enabled = types.filter(t => t.enabled);
    const extMap = enabled.flatMap(t => t.extensions.map(ext => `'${ext}': '${t.renderer}'`)).join(',\n  ');

    return `import React, { useMemo } from 'react';

const RENDERER_MAP: Record<string, string> = {
  ${extMap}
};

const MAX_FILE_SIZE = ${maxFileSize} * 1024 * 1024;

function getRenderer(filename: string): string | null {
  const ext = '.' + filename.split('.').pop()?.toLowerCase();
  return RENDERER_MAP[ext] || null;
}

function ImagePreview({ url, name }: { url: string; name: string }) {
  return <img src={url} alt={name} className="max-w-full max-h-[500px] rounded-lg object-contain" />;
}

function PDFPreview({ url }: { url: string }) {
  return <iframe src={url} className="w-full h-[600px] rounded-lg border" title="PDF Preview" />;
}

function CodePreview({ content }: { content: string }) {
  return <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[500px] text-sm font-mono whitespace-pre-wrap">{content}</pre>;
}

function AudioPreview({ url }: { url: string }) {
  return <audio controls src={url} className="w-full" />;
}

function VideoPreview({ url }: { url: string }) {
  return <video controls src={url} className="max-w-full max-h-[500px] rounded-lg" />;
}

function TextPreview({ content }: { content: string }) {
  return <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[500px] text-sm whitespace-pre-wrap">{content}</pre>;
}

export function FilePreview({ file, url, content }: { file: { name: string; size: number }; url?: string; content?: string }) {
  const renderer = useMemo(() => getRenderer(file.name), [file.name]);

  if (file.size > MAX_FILE_SIZE) {
    return <div className="text-center py-8 text-muted-foreground">File too large to preview ({(file.size / 1024 / 1024).toFixed(1)} MB)</div>;
  }

  if (!renderer) {
    return <div className="text-center py-8 text-muted-foreground">No preview available for this file type</div>;
  }

  switch (renderer) {
    case 'image': return url ? <ImagePreview url={url} name={file.name} /> : null;
    case 'pdf': return url ? <PDFPreview url={url} /> : null;
    case 'code': return content ? <CodePreview content={content} /> : null;
    case 'audio': return url ? <AudioPreview url={url} /> : null;
    case 'video': return url ? <VideoPreview url={url} /> : null;
    case 'text': return content ? <TextPreview content={content} /> : null;
    default: return null;
  }
}`;
  }, [types, maxFileSize]);

  return { types, maxFileSize, setMaxFileSize, toggleType, generateCode };
}
