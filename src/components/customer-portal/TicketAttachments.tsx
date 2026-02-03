/**
 * Ticket Attachments Component
 * File upload and display for tickets
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Upload, X, FileText, Image, 
  File, Download, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePortalSession } from '@/hooks/usePortalSession';

interface Attachment {
  id: string;
  file_name: string;
  file_size: number;
  file_path: string;
  mime_type: string;
  uploaded_at: string;
}

interface TicketAttachmentsProps {
  ticketId?: string;
  onFilesChange?: (files: File[]) => void;
  existingAttachments?: Attachment[];
  readOnly?: boolean;
}

export function TicketAttachments({ 
  ticketId, 
  onFilesChange, 
  existingAttachments = [],
  readOnly = false 
}: TicketAttachmentsProps) {
  const { session } = usePortalSession();
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });
    
    setPendingFiles(prev => [...prev, ...validFiles]);
    onFilesChange?.(validFiles);
  }, [onFilesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024,
    disabled: readOnly
  });

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (!session || !ticketId || pendingFiles.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of pendingFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${ticketId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('ticket-attachments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Save attachment record using the existing table schema
        const { error: dbError } = await supabase
          .from('ticket_attachments')
          .insert({
            ticket_id: ticketId,
            user_id: session.user.id,
            file_name: file.name,
            file_size: file.size,
            file_path: fileName,
            mime_type: file.type
          });

        if (dbError) throw dbError;
      }

      toast.success(`${pendingFiles.length} file(s) uploaded`);
      setPendingFiles([]);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadAttachment = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('ticket-attachments')
        .download(attachment.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download file');
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type === 'application/pdf') return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Existing Attachments */}
      {existingAttachments.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-white/60">
            Attachments ({existingAttachments.length})
          </p>
          <div className="grid gap-2">
            {existingAttachments.map(attachment => {
              const FileIcon = getFileIcon(attachment.mime_type);
              return (
                <div 
                  key={attachment.id}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <FileIcon className="h-5 w-5 text-cyan-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{attachment.file_name}</p>
                    <p className="text-xs text-white/40">{formatFileSize(attachment.file_size)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadAttachment(attachment)}
                    className="text-white/60 hover:text-white"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Area */}
      {!readOnly && (
        <>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-cyan-500/50 bg-cyan-500/10' 
                : 'border-white/20 hover:border-white/30'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 text-white/40 mx-auto mb-2" />
            <p className="text-sm text-white/60">
              {isDragActive ? 'Drop files here' : 'Drag & drop files, or click to browse'}
            </p>
            <p className="text-xs text-white/40 mt-1">
              Max 10MB per file • Images, PDFs, Documents
            </p>
          </div>

          {/* Pending Files */}
          <AnimatePresence>
            {pendingFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                {pendingFiles.map((file, index) => {
                  const FileIcon = getFileIcon(file.type);
                  return (
                    <div 
                      key={index}
                      className="flex items-center gap-3 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20"
                    >
                      <FileIcon className="h-5 w-5 text-cyan-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{file.name}</p>
                        <p className="text-xs text-white/40">{formatFileSize(file.size)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePendingFile(index)}
                        className="text-white/60 hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}

                {ticketId && (
                  <Button
                    onClick={uploadFiles}
                    disabled={isUploading}
                    className="w-full bg-gradient-to-r from-cyan-500 to-purple-600"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload {pendingFiles.length} file(s)
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
