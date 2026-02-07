import { useState, useCallback, useEffect } from 'react';
import { X, FolderOpen, Upload, Trash2, Copy, Image, FileText, Plus, Loader2, RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function StorageBrowser({ open, onClose, supabaseConfig }: StorageBrowserProps) {
  const [buckets, setBuckets] = useState<StorageBucket[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showCreateBucket, setShowCreateBucket] = useState(false);
  const [newBucketName, setNewBucketName] = useState('');

  const bucket = buckets.find(b => b.name === selectedBucket);

  const loadBuckets = useCallback(async () => {
    if (!supabaseConfig) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) throw error;
      const loaded: StorageBucket[] = (data || []).map(b => ({
        name: b.name,
        isPublic: b.public,
        files: [],
      }));
      setBuckets(loaded);
    } catch (err) {
      console.error('Failed to load buckets:', err);
      toast.error('Failed to load storage buckets');
    } finally {
      setIsLoading(false);
    }
  }, [supabaseConfig]);

  const loadFiles = useCallback(async (bucketName: string) => {
    try {
      const { data, error } = await supabase.storage.from(bucketName).list('', { limit: 100 });
      if (error) throw error;
      const files: StorageFile[] = (data || [])
        .filter(f => f.name)
        .map(f => {
          const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(f.name);
          return {
            name: f.name,
            size: f.metadata?.size || 0,
            type: f.metadata?.mimetype || 'application/octet-stream',
            created_at: f.created_at || '',
            url: urlData.publicUrl,
          };
        });
      setBuckets(prev => prev.map(b => b.name === bucketName ? { ...b, files } : b));
    } catch (err) {
      console.error('Failed to load files:', err);
    }
  }, []);

  useEffect(() => {
    if (open && supabaseConfig) loadBuckets();
  }, [open, supabaseConfig, loadBuckets]);

  useEffect(() => {
    if (selectedBucket) loadFiles(selectedBucket);
  }, [selectedBucket, loadFiles]);

  const handleCreateBucket = async () => {
    if (!newBucketName.trim()) return;
    try {
      const { error } = await supabase.storage.createBucket(newBucketName.trim(), { public: false });
      if (error) throw error;
      toast.success(`Bucket "${newBucketName}" created`);
      setNewBucketName('');
      setShowCreateBucket(false);
      loadBuckets();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create bucket');
    }
  };

  const handleUpload = async (files: File[]) => {
    if (!selectedBucket || files.length === 0) return;
    setIsUploading(true);
    let uploaded = 0;
    for (const file of files) {
      try {
        const { error } = await supabase.storage.from(selectedBucket).upload(file.name, file, { upsert: true });
        if (error) throw error;
        uploaded++;
      } catch (err: any) {
        console.error(`Upload failed for ${file.name}:`, err);
      }
    }
    setIsUploading(false);
    if (uploaded > 0) {
      toast.success(`${uploaded} file(s) uploaded`);
      loadFiles(selectedBucket);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleUpload(files);
  }, [selectedBucket]);

  const handleDeleteFile = async (fileName: string) => {
    if (!selectedBucket) return;
    try {
      const { error } = await supabase.storage.from(selectedBucket).remove([fileName]);
      if (error) throw error;
      toast.success('File deleted');
      loadFiles(selectedBucket);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const isImage = (type: string) => type.startsWith('image/');

  if (!open) return null;

  return (
    <div className="w-72 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-xs font-medium text-white/80">Storage</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => loadBuckets()} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
            <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
          </button>
          <button onClick={onClose} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
            <X className="h-3 w-3" />
          </button>
        </div>
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
              <button onClick={() => setShowCreateBucket(true)} className="text-[10px] text-cyan-400/60 hover:text-cyan-400 flex items-center gap-0.5">
                <Plus className="h-2.5 w-2.5" />
              </button>
            </div>

            {showCreateBucket && (
              <div className="px-3 pb-2 space-y-1.5">
                <Input value={newBucketName} onChange={e => setNewBucketName(e.target.value)} placeholder="bucket-name" className="h-7 text-xs bg-white/[0.03] border-white/[0.08] text-white/80 font-mono" onKeyDown={e => e.key === 'Enter' && handleCreateBucket()} autoFocus />
                <div className="flex gap-1 justify-end">
                  <button onClick={() => setShowCreateBucket(false)} className="text-[10px] text-white/30 hover:text-white/60 px-2 py-0.5">Cancel</button>
                  <button onClick={handleCreateBucket} className="text-[10px] text-cyan-400 px-2 py-0.5 bg-cyan-500/10 rounded hover:bg-cyan-500/20">Create</button>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 text-white/20 animate-spin" />
              </div>
            ) : buckets.length === 0 ? (
              <div className="px-3 py-3 text-[10px] text-white/20 text-center">No buckets found</div>
            ) : (
              buckets.map(b => (
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
              ))
            )}
          </div>

          {/* Files */}
          {bucket ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={cn(
                  "mx-3 mt-2 p-3 rounded-lg border-2 border-dashed text-center transition-all cursor-pointer",
                  isDragOver ? "border-cyan-500/40 bg-cyan-500/[0.05]" : "border-white/[0.06]"
                )}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.onchange = (e) => {
                    const files = Array.from((e.target as HTMLInputElement).files || []);
                    handleUpload(files);
                  };
                  input.click();
                }}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 text-cyan-400 mx-auto animate-spin" />
                ) : (
                  <>
                    <Upload className="h-4 w-4 text-white/20 mx-auto mb-1" />
                    <p className="text-[10px] text-white/30">Drop or click to upload</p>
                  </>
                )}
              </div>

              <ScrollArea className="flex-1 px-3 mt-2">
                {bucket.files.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 py-2 border-b border-white/[0.03] group">
                    <div className="h-8 w-8 rounded bg-white/[0.03] flex items-center justify-center shrink-0">
                      {isImage(file.type) ? <Image className="h-3.5 w-3.5 text-white/20" /> : <FileText className="h-3.5 w-3.5 text-white/20" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-white/70 font-mono truncate">{file.name}</div>
                      <div className="text-[9px] text-white/20">{formatBytes(file.size)}</div>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { navigator.clipboard.writeText(file.url); toast.success('URL copied'); }} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
                        <Copy className="h-2.5 w-2.5" />
                      </button>
                      <button onClick={() => handleDeleteFile(file.name)} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10">
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
