import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Paperclip, 
  Upload, 
  Download, 
  Trash2, 
  File, 
  Image, 
  FileText,
  Loader2,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  path: string;
  uploaded_at: string;
}

interface EntryAttachmentsProps {
  entryId: string;
  entryTitle: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return Image;
  if (type === 'application/pdf') return FileText;
  return File;
};

export const EntryAttachments = ({ entryId, entryTitle }: EntryAttachmentsProps) => {
  const { user } = useAuth();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const loadAttachments = useCallback(async () => {
    if (!user || !entryId) return;
    
    setIsLoading(true);
    try {
      const folderPath = `${user.id}/${entryId}/`;
      const { data, error } = await supabase.storage
        .from('safepass-attachments')
        .list(folderPath);

      if (error) throw error;

      const files: Attachment[] = (data || []).map(file => ({
        id: file.id,
        name: file.name,
        size: file.metadata?.size || 0,
        type: file.metadata?.mimetype || 'application/octet-stream',
        path: `${folderPath}${file.name}`,
        uploaded_at: file.created_at
      }));

      setAttachments(files);
    } catch (error) {
      console.error('Failed to load attachments');
    } finally {
      setIsLoading(false);
    }
  }, [user, entryId]);

  useEffect(() => {
    if (isOpen) {
      loadAttachments();
    }
  }, [isOpen, loadAttachments]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || !user || !entryId) return;

    setIsUploading(true);
    let successCount = 0;

    try {
      for (const file of Array.from(files)) {
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 10MB limit`);
          continue;
        }

        const filePath = `${user.id}/${entryId}/${file.name}`;
        
        const { error } = await supabase.storage
          .from('safepass-attachments')
          .upload(filePath, file, { upsert: true });

        if (error) {
          console.error('Upload error:', error);
          toast.error(`Failed to upload ${file.name}`);
        } else {
          successCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} file(s) uploaded`);
        loadAttachments();
      }
    } catch (error) {
      console.error('Upload failed');
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('safepass-attachments')
        .download(attachment.path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('File downloaded');
    } catch (error) {
      console.error('Download failed');
      toast.error('Download failed');
    }
  };

  const handleDelete = async (attachment: Attachment) => {
    if (!confirm(`Delete ${attachment.name}?`)) return;

    try {
      const { error } = await supabase.storage
        .from('safepass-attachments')
        .remove([attachment.path]);

      if (error) throw error;

      toast.success('File deleted');
      loadAttachments();
    } catch (error) {
      console.error('Delete failed');
      toast.error('Delete failed');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          <Paperclip className="h-4 w-4" />
          {attachments.length > 0 && (
            <span className="text-xs bg-primary/10 px-1.5 rounded-full">
              {attachments.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Attachments - {entryTitle}
          </DialogTitle>
        </DialogHeader>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag & drop files here or
              </p>
              <label>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files)}
                  accept="image/*,.pdf,.txt,.json"
                />
                <Button variant="outline" size="sm" asChild>
                  <span>Browse Files</span>
                </Button>
              </label>
              <p className="text-xs text-muted-foreground mt-2">
                Max 10MB per file. Images, PDFs, text files.
              </p>
            </>
          )}
        </div>

        {/* Attachments List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-4">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : attachments.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground text-sm max-w-xs mx-auto">
              Attach recovery codes, license PDFs, or ID scans. I'll encrypt them alongside this entry.
            </p>

          ) : (
            attachments.map((attachment) => {
              const FileIcon = getFileIcon(attachment.type);
              return (
                <Card key={attachment.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{attachment.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.size)} • {formatDistanceToNow(new Date(attachment.uploaded_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(attachment)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(attachment)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
