import { useState, useCallback } from 'react';
import { Image, Upload, Trash2, Copy, FileImage, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

export interface ProjectAsset {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  createdAt: Date;
}

interface AssetManagerProps {
  assets: ProjectAsset[];
  onUpload: (asset: ProjectAsset) => void;
  onDelete: (id: string) => void;
  open: boolean;
  onClose: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AssetManager({ assets, onUpload, onDelete, open, onClose }: AssetManagerProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback((fileList: FileList) => {
    Array.from(fileList).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        onUpload({
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: reader.result as string,
          createdAt: new Date(),
        });
        toast.success(`Uploaded ${file.name}`);
      };
      reader.readAsDataURL(file);
    });
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const copyReference = (asset: ProjectAsset) => {
    const isImage = asset.type.startsWith('image/');
    const ref = isImage
      ? `<img src="${asset.dataUrl.slice(0, 50)}..." alt="${asset.name}" />`
      : `/* Asset: ${asset.name} */`;
    navigator.clipboard.writeText(asset.dataUrl);
    toast.success('Data URL copied');
  };

  if (!open) return null;

  return (
    <div className="w-72 h-full border-r border-white/[0.06] bg-[#0a0a10] flex flex-col shrink-0">
      <div className="flex items-center justify-between px-3 h-9 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5 text-xs font-medium text-white/60">
          <Image className="h-3.5 w-3.5" />
          Assets
        </div>
        <button onClick={onClose} className="text-[10px] text-white/30 hover:text-white/60">Close</button>
      </div>

      {/* Drop zone */}
      <div
        className={cn(
          "mx-3 mt-3 p-4 rounded-lg border-2 border-dashed transition-colors text-center cursor-pointer",
          dragOver ? "border-cyan-500/40 bg-cyan-500/5" : "border-white/[0.06] hover:border-white/10"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.multiple = true;
          input.accept = 'image/*,.svg,.ico,.json,.txt,.csv';
          input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files) handleFiles(files);
          };
          input.click();
        }}
      >
        <Upload className="h-5 w-5 text-white/20 mx-auto mb-1.5" />
        <p className="text-[10px] text-white/30">Drop files or click to upload</p>
        <p className="text-[8px] text-white/15 mt-0.5">Images, SVG, JSON, CSV (max 5MB)</p>
      </div>

      <ScrollArea className="flex-1 mt-2">
        <div className="px-3 pb-3 space-y-1.5">
          {assets.length === 0 ? (
            <p className="text-center text-[10px] text-white/15 py-6">No assets uploaded</p>
          ) : (
            assets.map(asset => (
              <div key={asset.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] group">
                {asset.type.startsWith('image/') ? (
                  <img
                    src={asset.dataUrl}
                    alt={asset.name}
                    className="h-9 w-9 rounded object-cover bg-white/5 shrink-0"
                  />
                ) : (
                  <div className="h-9 w-9 rounded bg-white/5 flex items-center justify-center shrink-0">
                    <File className="h-4 w-4 text-white/20" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white/60 truncate">{asset.name}</p>
                  <p className="text-[8px] text-white/20">{formatSize(asset.size)}</p>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => copyReference(asset)}
                    className="h-6 w-6 rounded flex items-center justify-center text-white/20 hover:text-cyan-400 transition-colors"
                    title="Copy data URL"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => onDelete(asset.id)}
                    className="h-6 w-6 rounded flex items-center justify-center text-white/20 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
