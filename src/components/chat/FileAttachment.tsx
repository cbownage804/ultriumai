import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { File, X, Download } from "lucide-react";
import { ConversationFile } from "@/types/chat";
import { useFileUpload } from "@/hooks/useFileUpload";

interface FileAttachmentProps {
  file: ConversationFile;
  onRemove?: (file: ConversationFile) => void;
  showRemove?: boolean;
}

const FileAttachment = ({ file, onRemove, showRemove = true }: FileAttachmentProps) => {
  const { deleteFile } = useFileUpload();

  const handleRemove = async () => {
    if (onRemove) {
      const success = await deleteFile(file);
      if (success) {
        onRemove(file);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    if (file.mime_type.startsWith('text/')) return File;
    if (file.mime_type.includes('json')) return File;
    if (file.mime_type.includes('csv')) return File;
    return File;
  };

  const FileIcon = getFileIcon();

  return (
    <Card className="p-3 flex items-center gap-3 bg-muted/50">
      <FileIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.file_name}</p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.file_size)} • {new Date(file.uploaded_at).toLocaleDateString()}
        </p>
      </div>
      {showRemove && onRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </Card>
  );
};

export default FileAttachment;