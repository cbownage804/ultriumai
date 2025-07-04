import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Upload, File, X, Loader2 } from "lucide-react";
import { useFileUpload } from "@/hooks/useFileUpload";
import { ConversationFile } from "@/types/chat";

interface FileUploadProps {
  conversationId: string | null;
  onFileUploaded: (file: ConversationFile) => void;
  disabled?: boolean;
}

const ACCEPTED_FILE_TYPES = [
  '.txt', '.md', '.json', '.csv', '.xml', '.html', '.css', '.js', '.ts', '.jsx', '.tsx',
  '.py', '.java', '.cpp', '.c', '.h', '.php', '.rb', '.go', '.rs', '.sql', '.yml', '.yaml',
  '.log', '.conf', '.config', '.ini', '.properties', '.env', '.gitignore', '.dockerfile'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const FileUpload = ({ conversationId, onFileUploaded, disabled }: FileUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const { uploadFile, isUploading } = useFileUpload();

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || !conversationId || disabled) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        continue;
      }

      // Check if file type is supported
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ACCEPTED_FILE_TYPES.includes(fileExt) && !file.type.startsWith('text/')) {
        continue;
      }

      const uploadedFile = await uploadFile(file, conversationId);
      if (uploadedFile) {
        onFileUploaded(uploadedFile);
      }
    }
  }, [conversationId, disabled, uploadFile, onFileUploaded]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  return (
    <Card
      className={`border-2 border-dashed transition-colors ${
        dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className="p-6 text-center">
        <Input
          type="file"
          onChange={handleFileInput}
          accept={ACCEPTED_FILE_TYPES.join(',')}
          multiple
          className="hidden"
          id="file-upload"
          disabled={disabled || isUploading}
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="space-y-2">
            {isUploading ? (
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
            ) : (
              <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">
                {isUploading ? 'Uploading...' : 'Upload files for AI analysis'}
              </p>
              <p className="text-xs text-muted-foreground">
                Drag and drop or click to select files (max 10MB)
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports: Text, Code, JSON, CSV, Markdown, Config files
              </p>
            </div>
          </div>
        </label>
      </div>
    </Card>
  );
};

export default FileUpload;