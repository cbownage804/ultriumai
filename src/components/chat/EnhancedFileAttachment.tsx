import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Paperclip,
  File,
  FileText,
  FileImage,
  FileCode,
  FileJson,
  X,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'processing' | 'ready' | 'error';
  progress?: number;
  content?: string;
  error?: string;
}

interface EnhancedFileAttachmentProps {
  attachedFiles: AttachedFile[];
  onFilesAdd: (files: FileList) => void;
  onFileRemove: (fileId: string) => void;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  themeColor?: string;
}

const FILE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'text': FileText,
  'image': FileImage,
  'code': FileCode,
  'json': FileJson,
  'default': File,
};

const ACCEPTED_TYPES = [
  '.txt', '.md', '.json', '.csv', '.xml', '.html', '.css', '.js', '.ts', 
  '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.php', '.rb', 
  '.go', '.rs', '.sql', '.yml', '.yaml', '.log', '.conf', '.config',
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf'
];

function getFileIcon(type: string, name: string) {
  if (type.startsWith('image/')) return FILE_ICONS['image'];
  if (type.includes('json')) return FILE_ICONS['json'];
  if (type.includes('text') || name.match(/\.(txt|md|log)$/)) return FILE_ICONS['text'];
  if (name.match(/\.(js|ts|jsx|tsx|py|java|cpp|c|php|rb|go|rs)$/)) return FILE_ICONS['code'];
  return FILE_ICONS['default'];
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function EnhancedFileAttachment({
  attachedFiles,
  onFilesAdd,
  onFileRemove,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
  themeColor = "#3b82f6"
}: EnhancedFileAttachmentProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, [disabled]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      onFilesAdd(files);
    }
  }, [disabled, onFilesAdd]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesAdd(e.target.files);
    }
    e.target.value = '';
  };

  const canAddMore = attachedFiles.length < maxFiles;

  return (
    <div className="space-y-2">
      {/* Attached Files List */}
      <AnimatePresence>
        {attachedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-lg border"
          >
            {attachedFiles.map((file) => {
              const Icon = getFileIcon(file.type, file.name);
              
                  const iconColor = themeColor;
                  
                  return (
                    <motion.div
                      key={file.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative group"
                >
                  <div className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md border bg-background text-sm",
                    file.status === 'error' && "border-destructive/50 bg-destructive/5"
                  )}>
                    <Icon className="h-4 w-4 flex-shrink-0 text-primary" />
                    
                    <div className="flex flex-col min-w-0 max-w-32">
                      <span className="truncate font-medium text-xs">{file.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                    </div>

                    {/* Status indicators */}
                    {file.status === 'uploading' && (
                      <div className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {file.progress !== undefined && (
                          <span className="text-[10px]">{file.progress}%</span>
                        )}
                      </div>
                    )}
                    {file.status === 'processing' && (
                      <Badge variant="outline" className="text-[10px] h-4">
                        Processing...
                      </Badge>
                    )}
                    {file.status === 'ready' && (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    )}
                    {file.status === 'error' && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <AlertCircle className="h-3 w-3 text-destructive" />
                          </TooltipTrigger>
                          <TooltipContent>
                            {file.error || 'Upload failed'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    {/* Remove button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                      onClick={() => onFileRemove(file.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Upload progress bar */}
                  {file.status === 'uploading' && file.progress !== undefined && (
                    <Progress 
                      value={file.progress} 
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-md"
                    />
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drop Zone & Add Button */}
      <div
        className={cn(
          "relative transition-colors",
          isDragging && "ring-2 ring-primary ring-offset-2 rounded-lg"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileInput}
          disabled={disabled || !canAddMore}
          className="hidden"
          id="file-attachment-input"
        />
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled || !canAddMore}
                className="h-9 w-9 p-0"
                onClick={() => document.getElementById('file-attachment-input')?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Attach files ({attachedFiles.length}/{maxFiles})</p>
              <p className="text-xs text-muted-foreground">Max {formatFileSize(maxSize)} per file</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <Upload className="h-8 w-8 mx-auto mb-2" style={{ color: themeColor }} />
              <p className="text-sm font-medium">Drop files here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
