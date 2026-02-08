import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { HardDrive, RefreshCw, Folder, FileIcon } from 'lucide-react';
import { toast } from 'sonner';

interface BucketInfo { id: string; name: string; public: boolean; file_count?: number; }

const StorageManagerTab = () => {
  const [buckets, setBuckets] = useState<BucketInfo[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBuckets = async () => {
    setLoading(true);
    const { data } = await supabase.storage.listBuckets();
    setBuckets((data || []).map(b => ({ id: b.id, name: b.name, public: b.public })));
    setLoading(false);
  };

  const loadFiles = async (bucketId: string) => {
    setSelectedBucket(bucketId);
    const { data, error } = await supabase.storage.from(bucketId).list('', { limit: 50 });
    if (error) { toast.error('Failed to list files'); return; }
    setFiles(data || []);
  };

  const deleteFile = async (path: string) => {
    if (!selectedBucket) return;
    const { error } = await supabase.storage.from(selectedBucket).remove([path]);
    if (error) toast.error('Failed to delete');
    else { toast.success('Deleted'); loadFiles(selectedBucket); }
  };

  useEffect(() => { loadBuckets(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold flex items-center gap-2"><HardDrive className="h-6 w-6" /> Storage Manager</h2><p className="text-muted-foreground">Browse and manage Supabase storage buckets and files</p></div>
        <Button variant="outline" size="sm" onClick={loadBuckets} className="gap-2"><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {loading ? <p className="col-span-4 text-center text-muted-foreground py-8">Loading...</p> :
         buckets.map(b => (
          <Card key={b.id} className={`cursor-pointer transition-colors ${selectedBucket === b.id ? 'border-primary' : ''}`} onClick={() => loadFiles(b.id)}>
            <CardContent className="pt-4 text-center">
              <Folder className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-semibold text-sm">{b.name}</p>
              <Badge variant={b.public ? 'default' : 'secondary'} className="mt-1 text-xs">{b.public ? 'Public' : 'Private'}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedBucket && (
        <Card>
          <CardContent className="p-0">
            <div className="p-3 border-b bg-muted/50 flex items-center gap-2"><Folder className="h-4 w-4" /> <span className="font-medium text-sm">{selectedBucket}</span><Badge variant="outline">{files.length} items</Badge></div>
            {files.length === 0 ? <p className="p-8 text-center text-muted-foreground">Empty bucket</p> :
            <div className="divide-y">
              {files.map(f => (
                <div key={f.name} className="flex items-center justify-between px-4 py-2 hover:bg-muted/30">
                  <div className="flex items-center gap-2"><FileIcon className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{f.name}</span></div>
                  <div className="flex items-center gap-2">
                    {f.metadata?.size && <span className="text-xs text-muted-foreground">{(f.metadata.size / 1024).toFixed(1)} KB</span>}
                    <Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={() => deleteFile(f.name)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StorageManagerTab;
