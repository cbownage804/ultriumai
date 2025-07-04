import { useState, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Paperclip, Upload, FileText, Image, File, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  uploading?: boolean;
  url?: string;
  content?: string;
}

interface ChatFileUploaderProps {
  sessionId: string | null;
  gptId: string;
  onFileAttached: (file: AttachedFile) => void;
  onFileRemoved: (fileId: string) => void;
  attachedFiles: AttachedFile[];
}

const ChatFileUploader = ({ 
  sessionId, 
  gptId, 
  onFileAttached, 
  onFileRemoved, 
  attachedFiles 
}: ChatFileUploaderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.includes('text') || type.includes('json') || type.includes('csv')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !user) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} is too large. Maximum size is 10MB.`,
            variant: "destructive",
          });
          continue;
        }

        const fileId = Math.random().toString(36).substr(2, 9);
        const attachedFile: AttachedFile = {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          file: file,
          uploading: true
        };

        onFileAttached(attachedFile);

        try {
          // Upload to Supabase storage
          const fileName = `${sessionId || gptId}/${fileId}-${file.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('chat-files')
            .upload(fileName, file);

          if (uploadError) {
            throw uploadError;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('chat-files')
            .getPublicUrl(uploadData.path);

          // Read file content for text files
          let fileContent = '';
          if (file.type.startsWith('text/') || file.type.includes('json') || file.type.includes('csv')) {
            fileContent = await file.text();
          }

          // Store file record in database
          const { error: dbError } = await supabase
            .from('conversation_files')
            .insert({
              conversation_id: sessionId || gptId,
              user_id: user.id,
              file_name: file.name,
              file_path: uploadData.path,
              file_size: file.size,
              mime_type: file.type
            });

          if (dbError) {
            console.error('Database error:', dbError);
          }

          // Update the attached file with URL and content
          const updatedFile: AttachedFile = {
            ...attachedFile,
            uploading: false,
            url: urlData.publicUrl,
            content: fileContent
          };

          onFileAttached(updatedFile);

        } catch (error) {
          console.error('Upload error:', error);
          onFileRemoved(fileId);
          
          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}. Please try again.`,
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Files attached",
        description: `${files.length} file(s) attached to conversation`,
      });

    } catch (error) {
      console.error('File attachment error:', error);
      toast({
        title: "Error",
        description: "Failed to attach files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setIsOpen(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" className="flex-shrink-0 relative">
            <Paperclip className="w-4 h-4" />
            {/* Show attached files count badge */}
            {attachedFiles.length > 0 && (
              <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                {attachedFiles.length}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Attach Files</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Choose Files
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Drag & drop or click to upload
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports: Images, Text, PDF, CSV, JSON (Max 10MB each)
                </p>
              </div>
            </div>

            {attachedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Attached Files ({attachedFiles.length})</h4>
                <div className="max-h-40 overflow-auto space-y-1">
                  {attachedFiles.map((file) => {
                    const IconComponent = getFileIcon(file.type);
                    return (
                      <div key={file.id} className="flex items-center gap-2 p-2 border rounded text-sm">
                        <IconComponent className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        {file.uploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onFileRemoved(file.id)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.pdf,.doc,.docx,.csv,.json,.md,.png,.jpg,.jpeg,.gif,.webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatFileUploader;