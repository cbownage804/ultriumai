import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDropzone } from 'react-dropzone';
import {
  FolderOpen,
  Upload,
  Download,
  ArrowUp,
  RefreshCw,
  Loader2,
  File,
  Folder,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface RemoteFile {
  name: string;
  type: 'file' | 'directory';
  size: number;
  modified: Date;
  permissions?: string;
}

interface TransferJob {
  id: string;
  name: string;
  direction: 'upload' | 'download';
  progress: number;
  status: 'pending' | 'transferring' | 'completed' | 'failed';
  size: number;
}

interface FileTransferProps {
  agentId: string;
  sendCommand: (cmd: string, payload?: any) => Promise<any>;
}

// Demo file structure
const demoFiles: RemoteFile[] = [
  { name: '..', type: 'directory', size: 0, modified: new Date() },
  { name: 'Users', type: 'directory', size: 0, modified: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) },
  { name: 'Program Files', type: 'directory', size: 0, modified: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60) },
  { name: 'Windows', type: 'directory', size: 0, modified: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90) },
  { name: 'pagefile.sys', type: 'file', size: 4294967296, modified: new Date() },
  { name: 'hiberfil.sys', type: 'file', size: 3221225472, modified: new Date() },
];

export function FileTransfer({ agentId, sendCommand }: FileTransferProps) {
  const [currentPath, setCurrentPath] = useState('C:\\');
  const [files, setFiles] = useState<RemoteFile[]>(demoFiles);
  const [isLoading, setIsLoading] = useState(false);
  const [transfers, setTransfers] = useState<TransferJob[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  const loadDirectory = async (path: string) => {
    setIsLoading(true);
    try {
      const result = await sendCommand('list_directory', { path });
      if (result?.files) {
        setFiles(result.files.map((f: any) => ({
          ...f,
          modified: new Date(f.modified)
        })));
        setCurrentPath(path);
      }
    } catch (err) {
      // Keep demo data
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigate = (file: RemoteFile) => {
    if (file.type === 'directory') {
      const newPath = file.name === '..' 
        ? currentPath.split('\\').slice(0, -1).join('\\') || 'C:\\'
        : `${currentPath}${currentPath.endsWith('\\') ? '' : '\\'}${file.name}`;
      loadDirectory(newPath);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newTransfers: TransferJob[] = acceptedFiles.map(file => ({
      id: crypto.randomUUID(),
      name: file.name,
      direction: 'upload' as const,
      progress: 0,
      status: 'pending' as const,
      size: file.size,
    }));
    
    setTransfers(prev => [...prev, ...newTransfers]);
    
    // Simulate upload progress
    newTransfers.forEach(transfer => {
      simulateTransfer(transfer.id);
    });
    
    toast.success(`Uploading ${acceptedFiles.length} file(s)`);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const simulateTransfer = (id: string) => {
    setTransfers(prev => prev.map(t => 
      t.id === id ? { ...t, status: 'transferring' } : t
    ));
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTransfers(prev => prev.map(t => 
          t.id === id ? { ...t, progress: 100, status: 'completed' } : t
        ));
      } else {
        setTransfers(prev => prev.map(t => 
          t.id === id ? { ...t, progress } : t
        ));
      }
    }, 500);
  };

  const handleDownload = (file: RemoteFile) => {
    const transfer: TransferJob = {
      id: crypto.randomUUID(),
      name: file.name,
      direction: 'download',
      progress: 0,
      status: 'pending',
      size: file.size,
    };
    
    setTransfers(prev => [...prev, transfer]);
    simulateTransfer(transfer.id);
    toast.success(`Downloading ${file.name}`);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '-';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearCompleted = () => {
    setTransfers(prev => prev.filter(t => t.status !== 'completed'));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            File Transfer
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="browser">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browser">File Browser</TabsTrigger>
            <TabsTrigger value="transfers">
              Transfers
              {transfers.length > 0 && (
                <Badge className="ml-2" variant="secondary">{transfers.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="browser" className="mt-4">
            {/* Path bar */}
            <div className="flex items-center gap-2 mb-3">
              <Input
                value={currentPath}
                onChange={(e) => setCurrentPath(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadDirectory(currentPath)}
                className="font-mono text-sm"
              />
              <Button variant="outline" size="icon" onClick={() => loadDirectory(currentPath)}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="outline" size="icon" onClick={() => {
                const parent = currentPath.split('\\').slice(0, -1).join('\\') || 'C:\\';
                loadDirectory(parent);
              }}>
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
              {currentPath.split('\\').filter(Boolean).map((part, i, arr) => (
                <div key={i} className="flex items-center">
                  <button
                    className="hover:text-foreground hover:underline"
                    onClick={() => loadDirectory(arr.slice(0, i + 1).join('\\') + '\\')}
                  >
                    {part}
                  </button>
                  {i < arr.length - 1 && <ChevronRight className="h-3 w-3 mx-1" />}
                </div>
              ))}
            </div>
            
            {/* Drop zone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-4 mb-3 text-center transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isDragActive ? 'Drop files here...' : 'Drag & drop files to upload, or click to select'}
              </p>
            </div>
            
            {/* File list */}
            <ScrollArea className="h-[280px] border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Size</TableHead>
                    <TableHead>Modified</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file, i) => (
                    <TableRow 
                      key={i}
                      className="cursor-pointer"
                      onDoubleClick={() => handleNavigate(file)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {file.type === 'directory' ? (
                            <Folder className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <File className="h-4 w-4 text-gray-400" />
                          )}
                          <span className={file.type === 'directory' ? 'font-medium' : ''}>
                            {file.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatSize(file.size)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(file.modified, 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {file.type === 'file' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDownload(file)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="transfers" className="mt-4">
            {transfers.length > 0 && (
              <div className="flex justify-end mb-3">
                <Button variant="outline" size="sm" onClick={clearCompleted}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Completed
                </Button>
              </div>
            )}
            
            <ScrollArea className="h-[380px]">
              {transfers.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  No active transfers
                </div>
              ) : (
                <div className="space-y-3">
                  {transfers.map((transfer) => (
                    <div key={transfer.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {transfer.direction === 'upload' ? (
                            <Upload className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Download className="h-4 w-4 text-green-500" />
                          )}
                          <span className="font-medium text-sm">{transfer.name}</span>
                        </div>
                        <Badge variant={
                          transfer.status === 'completed' ? 'default' :
                          transfer.status === 'failed' ? 'destructive' :
                          'secondary'
                        }>
                          {transfer.status}
                        </Badge>
                      </div>
                      <Progress value={transfer.progress} className="h-2" />
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span>{formatSize(transfer.size)}</span>
                        <span>{transfer.progress.toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
