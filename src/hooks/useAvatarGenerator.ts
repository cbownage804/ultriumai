import { useState, useCallback } from 'react';

export interface AvatarConfig {
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape: 'circle' | 'rounded' | 'square';
  showInitials: boolean;
  showUpload: boolean;
  fallbackColor: string;
  borderWidth: number;
}

const SIZE_MAP: Record<string, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-2xl',
};

export function useAvatarGenerator() {
  const [config, setConfig] = useState<AvatarConfig>({
    size: 'md',
    shape: 'circle',
    showInitials: true,
    showUpload: true,
    fallbackColor: 'hsl(var(--primary))',
    borderWidth: 0,
  });

  const updateConfig = useCallback((updates: Partial<AvatarConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const generateCode = useCallback((): string => {
    const shapeClass = config.shape === 'circle' ? 'rounded-full' : config.shape === 'rounded' ? 'rounded-lg' : 'rounded-none';
    const borderStyle = config.borderWidth > 0 ? ` border-${config.borderWidth} border-border` : '';

    return `import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';
${config.showUpload ? "import { useRef, useState } from 'react';" : ''}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

interface UserAvatarProps {
  src?: string | null;
  name: string;
  className?: string;
${config.showUpload ? '  onUpload?: (file: File) => void;' : ''}
}

export function UserAvatar({ src, name, className${config.showUpload ? ', onUpload' : ''} }: UserAvatarProps) {
${config.showUpload ? `  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onUpload?.(file);
  };
` : ''}
  return (
${config.showUpload ? `    <div className="relative group cursor-pointer" onClick={() => inputRef.current?.click()}>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
` : ''}    <AvatarPrimitive.Root className={cn('${SIZE_MAP[config.size]} ${shapeClass}${borderStyle} inline-flex items-center justify-center overflow-hidden bg-muted', className)}>
      <AvatarPrimitive.Image
        src={${config.showUpload ? 'preview || ' : ''}src || undefined}
        alt={name}
        className="h-full w-full object-cover"
      />
${config.showInitials ? `      <AvatarPrimitive.Fallback
        className="flex h-full w-full items-center justify-center font-medium"
        style={{ backgroundColor: '${config.fallbackColor}', color: 'white' }}
      >
        {getInitials(name)}
      </AvatarPrimitive.Fallback>` : `      <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center bg-muted">
        <svg className="h-1/2 w-1/2 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
      </AvatarPrimitive.Fallback>`}
    </AvatarPrimitive.Root>
${config.showUpload ? `    <div className="absolute inset-0 ${shapeClass} bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      </div>
    </div>` : ''}
  );
}`;
  }, [config]);

  return { config, updateConfig, generateCode };
}
