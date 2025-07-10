import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Upload, 
  Download, 
  File, 
  Folder, 
  FileText, 
  Image, 
  Video, 
  Archive,
  Trash2,
  RefreshCw,
  HardDrive,
  FolderOpen
} from "lucide-react";

interface RemoteFile {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  modified: string;
  icon: any;
}

interface TransferProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'downloading' | 'completed' | 'error';
  speed?: string;
}

interface RemoteFileTransferProps {
  onUploadFile: (file: File, targetPath?: string) => void;
  onDownloadFile: (path: string) => void;
}

export const RemoteFileTransfer = ({ onUploadFile, onDownloadFile }: RemoteFileTransferProps) => {
  const [currentPath, setCurrentPath] = useState('C:\\');
  const [remoteFiles, setRemoteFiles] = useState<RemoteFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [transfers, setTransfers] = useState<TransferProgress[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Mock remote file system data
  const loadRemoteFiles = useCallback(async (path: string) => {
    // Simulate remote file system
    const mockFiles: RemoteFile[] = [
      { name: '..', path: path.split('\\').slice(0, -1).join('\\') || 'C:\\', type: 'folder', modified: '', icon: Folder },
      { name: 'Documents', path: `${path}Documents\\`, type: 'folder', modified: '2024-01-15', icon: Folder },
      { name: 'Downloads', path: `${path}Downloads\\`, type: 'folder', modified: '2024-01-14', icon: Folder },
      { name: 'Desktop', path: `${path}Desktop\\`, type: 'folder', modified: '2024-01-13', icon: Folder },
      { name: 'report.pdf', path: `${path}report.pdf`, type: 'file', size: 1024 * 512, modified: '2024-01-12', icon: FileText },
      { name: 'presentation.pptx', path: `${path}presentation.pptx`, type: 'file', size: 1024 * 1024 * 2, modified: '2024-01-11', icon: File },
      { name: 'backup.zip', path: `${path}backup.zip`, type: 'file', size: 1024 * 1024 * 50, modified: '2024-01-10', icon: Archive },
      { name: 'screenshot.png', path: `${path}screenshot.png`, type: 'file', size: 1024 * 256, modified: '2024-01-09', icon: Image },
    ];
    
    setRemoteFiles(mockFiles);
  }, []);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${mb.toFixed(1)} MB`;
  };

  const handleFileUpload = async (files: FileList | File[], targetPath?: string) => {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      const transferId = `${file.name}-${Date.now()}`;
      
      // Add transfer to progress tracking
      setTransfers(prev => [...prev, {
        fileName: file.name,
        progress: 0,
        status: 'uploading'
      }]);

      try {
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setTransfers(prev => prev.map(t => 
            t.fileName === file.name && t.status === 'uploading'
              ? { ...t, progress, speed: '2.5 MB/s' }
              : t
          ));
        }

        // Upload to Supabase Storage for actual file transfer
        const fileName = `remote-uploads/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage
          .from('gpt-documents')
          .upload(fileName, file);

        if (error) throw error;

        // Mark as completed and call parent handler
        setTransfers(prev => prev.map(t => 
          t.fileName === file.name ? { ...t, status: 'completed', progress: 100 } : t
        ));

        onUploadFile(file, targetPath || currentPath);
        
        toast({
          title: "Upload Completed",
          description: `${file.name} uploaded successfully`,
        });

        // Refresh file list
        await loadRemoteFiles(currentPath);

      } catch (error) {
        setTransfers(prev => prev.map(t => 
          t.fileName === file.name ? { ...t, status: 'error' } : t
        ));
        
        toast({
          title: "Upload Failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive"
        });
      }
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [currentPath]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const navigateToPath = (path: string) => {
    setCurrentPath(path);
    loadRemoteFiles(path);
    setSelectedFiles(new Set());
  };

  const handleFileClick = (file: RemoteFile) => {
    if (file.type === 'folder') {
      navigateToPath(file.path);
    } else {
      // Toggle selection for files
      const newSelected = new Set(selectedFiles);
      if (newSelected.has(file.path)) {
        newSelected.delete(file.path);
      } else {
        newSelected.add(file.path);
      }
      setSelectedFiles(newSelected);
    }
  };

  const downloadSelectedFiles = () => {
    selectedFiles.forEach(filePath => {
      onDownloadFile(filePath);
    });
    setSelectedFiles(new Set());
  };

  // Load initial files
  useState(() => {
    loadRemoteFiles(currentPath);
  });

  return (
    <div className="space-y-6">
      {/* File Browser */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Remote File Browser
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadRemoteFiles(currentPath)}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
              {selectedFiles.size > 0 && (
                <Button size="sm" onClick={downloadSelectedFiles}>
                  <Download className="h-4 w-4 mr-2" />
                  Download ({selectedFiles.size})
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Current Path */}
          <div className="flex items-center gap-2 mb-4 p-2 bg-muted rounded">
            <FolderOpen className="h-4 w-4" />
            <span className="font-mono text-sm">{currentPath}</span>
          </div>

          {/* Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-lg transition-colors ${
              dragActive ? 'border-primary bg-primary/5' : 'border-muted'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {dragActive && (
              <div className="absolute inset-0 bg-primary/10 rounded-lg flex items-center justify-center z-10">
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Drop files here to upload</p>
                </div>
              </div>
            )}

            {/* File List */}
            <div className="space-y-1 p-2 max-h-80 overflow-y-auto">
              {remoteFiles.map((file, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-muted/50 ${
                    selectedFiles.has(file.path) ? 'bg-primary/10' : ''
                  }`}
                  onClick={() => handleFileClick(file)}
                >
                  <file.icon className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    {file.type === 'file' && (
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)} • {file.modified}
                      </p>
                    )}
                  </div>
                  <Badge variant={file.type === 'folder' ? 'secondary' : 'outline'} className="text-xs">
                    {file.type}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          />
        </CardContent>
      </Card>

      {/* Transfer Progress */}
      {transfers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              File Transfers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transfers.map((transfer, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{transfer.fileName}</span>
                    <div className="flex items-center gap-2">
                      {transfer.speed && (
                        <span className="text-muted-foreground">{transfer.speed}</span>
                      )}
                      <Badge variant={
                        transfer.status === 'completed' ? 'default' :
                        transfer.status === 'error' ? 'destructive' : 'secondary'
                      }>
                        {transfer.status}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={transfer.progress} className="h-2" />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTransfers(transfers.filter(t => t.status !== 'completed'))}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Completed
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};