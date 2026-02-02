import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, Download, FileIcon, Folder, ArrowUp, ArrowDown,
  Trash2, RefreshCw, Search, HardDrive, Clock, CheckCircle2, XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileTransfer {
  id: string;
  fileName: string;
  direction: 'upload' | 'download';
  size: number;
  progress: number;
  status: 'pending' | 'transferring' | 'completed' | 'failed';
  deviceName: string;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

interface RemoteFile {
  name: string;
  type: 'file' | 'directory';
  size: number;
  modified: string;
  permissions: string;
}

interface FileTransferManagerProps {
  deviceId?: string;
  deviceName?: string;
}

export const FileTransferManager: React.FC<FileTransferManagerProps> = ({ 
  deviceId,
  deviceName = 'Selected Device' 
}) => {
  const { toast } = useToast();
  const [currentPath, setCurrentPath] = useState('C:\\');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  
  const [transfers] = useState<FileTransfer[]>([
    {
      id: '1',
      fileName: 'backup_config.zip',
      direction: 'download',
      size: 15728640,
      progress: 100,
      status: 'completed',
      deviceName: 'WORKSTATION-01',
      startedAt: new Date(Date.now() - 300000).toISOString(),
      completedAt: new Date(Date.now() - 60000).toISOString()
    },
    {
      id: '2',
      fileName: 'agent_update.msi',
      direction: 'upload',
      size: 52428800,
      progress: 67,
      status: 'transferring',
      deviceName: 'SERVER-PROD-01',
      startedAt: new Date(Date.now() - 120000).toISOString()
    },
    {
      id: '3',
      fileName: 'logs_export.tar.gz',
      direction: 'download',
      size: 8388608,
      progress: 0,
      status: 'pending',
      deviceName: 'DB-SERVER-02',
      startedAt: new Date().toISOString()
    }
  ]);

  const [remoteFiles] = useState<RemoteFile[]>([
    { name: 'Program Files', type: 'directory', size: 0, modified: '2024-01-15', permissions: 'drwxr-xr-x' },
    { name: 'Windows', type: 'directory', size: 0, modified: '2024-01-10', permissions: 'drwxr-xr-x' },
    { name: 'Users', type: 'directory', size: 0, modified: '2024-01-20', permissions: 'drwxr-xr-x' },
    { name: 'config.ini', type: 'file', size: 2048, modified: '2024-01-18', permissions: '-rw-r--r--' },
    { name: 'setup.log', type: 'file', size: 15360, modified: '2024-01-19', permissions: '-rw-r--r--' },
    { name: 'backup.zip', type: 'file', size: 52428800, modified: '2024-01-17', permissions: '-rw-r--r--' }
  ]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = () => {
    toast({
      title: "Upload Started",
      description: "File upload has been queued for the selected device."
    });
  };

  const handleDownload = () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select files to download.",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Download Started",
      description: `Downloading ${selectedFiles.length} file(s) from ${deviceName}.`
    });
  };

  const navigateUp = () => {
    const parts = currentPath.split('\\').filter(Boolean);
    if (parts.length > 1) {
      parts.pop();
      setCurrentPath(parts.join('\\') + '\\');
    }
  };

  const navigateToFolder = (folderName: string) => {
    setCurrentPath(currentPath + folderName + '\\');
  };

  const toggleFileSelection = (fileName: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileName) 
        ? prev.filter(f => f !== fileName)
        : [...prev, fileName]
    );
  };

  const getStatusIcon = (status: FileTransfer['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'transferring': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const filteredFiles = remoteFiles.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">File Transfer</h2>
          <p className="text-muted-foreground">Secure file transfer between console and remote devices</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleUpload}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
          <Button onClick={handleDownload} disabled={selectedFiles.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Download Selected
          </Button>
        </div>
      </div>

      <Tabs defaultValue="browser" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browser">Remote Browser</TabsTrigger>
          <TabsTrigger value="transfers">Active Transfers</TabsTrigger>
          <TabsTrigger value="history">Transfer History</TabsTrigger>
        </TabsList>

        <TabsContent value="browser" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">{deviceName}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={navigateUp}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search files..." 
                      className="pl-8 w-48"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <Label className="text-sm text-muted-foreground">Current Path</Label>
                <Input value={currentPath} onChange={(e) => setCurrentPath(e.target.value)} className="font-mono" />
              </div>
              
              <ScrollArea className="h-[400px] border rounded-lg">
                <div className="divide-y">
                  {filteredFiles.map((file) => (
                    <div 
                      key={file.name}
                      className={`flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer ${
                        selectedFiles.includes(file.name) ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => file.type === 'directory' ? navigateToFolder(file.name) : toggleFileSelection(file.name)}
                    >
                      <div className="flex items-center gap-3">
                        {file.type === 'directory' ? (
                          <Folder className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <FileIcon className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.type === 'file' ? formatBytes(file.size) : 'Directory'} • Modified {file.modified}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-muted-foreground">{file.permissions}</code>
                        {file.type === 'file' && (
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {selectedFiles.length > 0 && (
                <div className="mt-3 p-2 bg-muted rounded-lg flex items-center justify-between">
                  <span className="text-sm">{selectedFiles.length} file(s) selected</span>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFiles([])}>
                    Clear Selection
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Active Transfers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transfers.filter(t => t.status === 'transferring' || t.status === 'pending').map((transfer) => (
                  <div key={transfer.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {transfer.direction === 'upload' ? (
                          <ArrowUp className="h-5 w-5 text-blue-500" />
                        ) : (
                          <ArrowDown className="h-5 w-5 text-green-500" />
                        )}
                        <div>
                          <p className="font-medium">{transfer.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {transfer.deviceName} • {formatBytes(transfer.size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(transfer.status)}
                        <Badge variant={transfer.status === 'transferring' ? 'default' : 'secondary'}>
                          {transfer.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <Progress value={transfer.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1 text-right">{transfer.progress}%</p>
                  </div>
                ))}
                {transfers.filter(t => t.status === 'transferring' || t.status === 'pending').length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No active transfers</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Transfer History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {transfers.map((transfer) => (
                    <div key={transfer.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {transfer.direction === 'upload' ? (
                          <ArrowUp className="h-4 w-4 text-blue-500" />
                        ) : (
                          <ArrowDown className="h-4 w-4 text-green-500" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{transfer.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {transfer.deviceName} • {formatBytes(transfer.size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(transfer.status)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(transfer.startedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
