import { useState, useRef, useCallback } from 'react';
import { Paperclip, X, FileText, Image as ImageIcon, File } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatAttachment {
  id: string;
  name: string;
  type: 'image' | 'file';
  dataUrl: string;
  size: number;
}

interface ChatFileUploadProps {
  attachments: ChatAttachment[];
  onAdd: (attachment: ChatAttachment) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export function ChatFileUpload({ attachments, onAdd, onRemove, disabled }: ChatFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) return; // 10MB limit
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        onAdd({
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'file',
          dataUrl,
          size: file.size,
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }, [onAdd]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className={cn(
          "h-7 w-7 rounded-lg flex items-center justify-center transition-colors shrink-0",
          disabled ? "text-white/10" : "text-white/20 hover:text-white/50 hover:bg-white/5"
        )}
        title="Attach file"
      >
        <Paperclip className="h-3.5 w-3.5" />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf,.txt,.md,.json,.csv,.html,.css,.js,.ts,.tsx,.jsx"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-3 pb-2">
          {attachments.map(att => (
            <div key={att.id} className="relative group/att flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1">
              {att.type === 'image' ? (
                <img src={att.dataUrl} alt={att.name} className="h-8 w-8 rounded object-cover" />
              ) : (
                <div className="h-8 w-8 rounded bg-white/[0.04] flex items-center justify-center">
                  <FileText className="h-3.5 w-3.5 text-white/30" />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[10px] text-white/50 truncate max-w-[80px]">{att.name}</div>
                <div className="text-[8px] text-white/20">{formatSize(att.size)}</div>
              </div>
              <button
                onClick={() => onRemove(att.id)}
                className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover/att:opacity-100 transition-opacity"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
