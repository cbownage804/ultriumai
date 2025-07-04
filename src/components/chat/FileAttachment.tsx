import { Button } from "@/components/ui/button";
import { FileText, Image, File, X } from "lucide-react";
import { ConversationFile } from "@/types/chat";

interface FileAttachmentProps {
  file: ConversationFile;
  onRemove?: (file: ConversationFile) => void;
  showRemove?: boolean;
}

const FileAttachment = ({ file, onRemove, showRemove = true }: FileAttachmentProps) => {
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('csv')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const IconComponent = getFileIcon(file.mime_type);

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded text-sm">
      <IconComponent className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{file.file_name}</p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.file_size)}
        </p>
      </div>
      {showRemove && onRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(file)}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
        >
          <X className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
};

export default FileAttachment;