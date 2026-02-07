import { useState, useCallback } from 'react';
import { X, FolderOpen, Upload, Trash2, Copy, Image, FileText, RefreshCw, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StorageFile {
  name: string;
  size: number;
  type: string;
  created_at: string;
  url: string;
}

interface StorageBucket {
  name: string;
  isPublic: boolean;
  files: StorageFile[];
}

interface StorageBrowserProps {
  open: boolean;
  onClose: () => void;
  supabaseConfig: { url: string; anonKey: string } | null;
}

const MOCK_BUCKETS: StorageBucket[] = [
  {
    name: 'avatars', isPublic: true, files: [
      { name: 'user1.jpg', size: 45000, type: 'image/jpeg', created_at: '2024-01-15', url: '/placeholder.svg' },
      { name: 'user2.png', size: 32000, type: 'image/png', created_at: '2024-02-20', url: '/placeholder.svg' },
    ]
  },
  {
    name: 'documents', isPublic: false, files: [
      { name: 'report.pdf', size: 125000, type: 'application/pdf', created_at: '2024-03-10', url: '#' },
      { name: 'data.csv', size: 8400, type: 'text/csv', created_at: '2024-03-15', url: '#' },
    ]
  },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function StorageBrowser({ open, onClose, supabaseConfig }: StorageBrowserProps) {
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const bucket = MOCK_BUCKETS.find(b => b.name === selectedBucket);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      toast.success(`${files.length} file(s) uploaded (simulated)`);
    }
  }, []);

  const isImage = (type: string) => type.startsWith('image/');

  if (!open) return null;

  return (
    <div className="w-72 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-xs font-medium text-white/80">Storage</span>
        </div>
        <button onClick={onClose} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
          <X className="h-3 w-3" />
        </button>
      </div>

      {!supabaseConfig ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-white/30 text-center">Connect Supabase in Settings to browse storage.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Buckets */}
          <div className="border-b border-white/[0.06]">
            <div className="px-3 py-1.5 flex items-center justify-between">
              <span className="text-[10px] text-white/20 uppercase tracking-wider font-medium">Buckets</span>
              <button onClick={() => toast.success('Bucket created (simulated)')} className="text-[10px] text-cyan-400/60 hover:text-cyan-400 flex items-center gap-0.5">
                <Plus className="h-2.5 w-2.5" />
              </button>
            </div>
            {MOCK_BUCKETS.map(b => (
              <button
                key={b.name}
                onClick={() => setSelectedBucket(b.name)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-1.5 text-xs transition-colors",
                  selectedBucket === b.name ? "bg-white/[0.06] text-white/90" : "text-white/50 hover:text-white/70 hover:bg-white/[0.03]"
                )}
              >
                <div className="flex items-center gap-1.5">
                  <FolderOpen className="h-3 w-3 text-white/20" />
                  <span className="font-mono">{b.name}</span>
                </div>
                <span className={cn("text-[8px] px-1 py-0.5 rounded", b.isPublic ? "text-emerald-400 bg-emerald-500/10" : "text-white/20 bg-white/5")}>
                  {b.isPublic ? 'public' : 'private'}
                </span>
              </button>
            ))}
          </div>

          {/* Files */}
          {bucket ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={cn(
                  "mx-3 mt-2 p-3 rounded-lg border-2 border-dashed text-center transition-all",
                  isDragOver ? "border-cyan-500/40 bg-cyan-500/[0.05]" : "border-white/[0.06]"
                )}
              >
                <Upload className="h-4 w-4 text-white/20 mx-auto mb-1" />
                <p className="text-[10px] text-white/30">Drop files to upload</p>
              </div>

              <ScrollArea className="flex-1 px-3 mt-2">
                {bucket.files.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 py-2 border-b border-white/[0.03] group">
                    <div className="h-8 w-8 rounded bg-white/[0.03] flex items-center justify-center shrink-0">
                      {isImage(file.type) ? (
                        <Image className="h-3.5 w-3.5 text-white/20" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 text-white/20" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-white/70 font-mono truncate">{file.name}</div>
                      <div className="text-[9px] text-white/20">{formatBytes(file.size)}</div>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { navigator.clipboard.writeText(file.url); toast.success('URL copied'); }} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
                        <Copy className="h-2.5 w-2.5" />
                      </button>
                      <button onClick={() => toast.success('File deleted (simulated)')} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10">
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-white/20">Select a bucket</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
