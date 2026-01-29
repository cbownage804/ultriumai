import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddAttachmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (attachment: {
    name: string;
    size: number;
    type: string;
    file: File;
  }) => Promise<void>;
}

export function AddAttachmentDialog({ open, onOpenChange, onSave }: AddAttachmentDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setCustomName(selectedFile.name);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const resetForm = () => {
    setFile(null);
    setCustomName("");
  };

  const handleSave = async () => {
    if (!file) return;
    
    setIsSaving(true);
    try {
      await onSave({
        name: customName.trim() || file.name,
        size: file.size,
        type: file.type,
        file,
      });
      
      resetForm();
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Attachment</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!file ? (
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragActive 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25 hover:border-primary/50"
              )}
            >
              <input {...getInputProps()} />
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              {isDragActive ? (
                <p className="text-sm text-primary">Drop the file here...</p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-1">
                    Drag and drop a file here, or click to select
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Maximum file size: 10MB
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <File className="h-8 w-8 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)} • {file.type || "Unknown type"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {file && (
            <div className="space-y-2">
              <Label htmlFor="customName">Display Name</Label>
              <Input
                id="customName"
                placeholder="Custom display name (optional)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !file}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
