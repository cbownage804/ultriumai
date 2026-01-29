import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Plus, Upload, Download, Trash2, FileText, File, FileImage, Search, Paperclip, FileCode, FileSpreadsheet, FileArchive } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { VanguardAgent } from "@/hooks/useVanguardAgents";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  uploaded_at: string;
  uploaded_by?: string;
}

interface DeviceAttachmentsTabProps {
  agent: VanguardAgent;
  onUpload: () => void;
  onDeleteAttachment?: (id: string) => Promise<void>;
}

export function DeviceAttachmentsTab({ agent, onUpload, onDeleteAttachment }: DeviceAttachmentsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Extract attachments from agent config
  const attachments: Attachment[] = agent.config?.attachments || [];

  const filteredAttachments = attachments.filter((att) =>
    att.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (type: string, name: string) => {
    if (type.startsWith("image/")) return <FileImage className="h-4 w-4 text-blue-400" />;
    if (type.includes("pdf")) return <FileText className="h-4 w-4 text-red-400" />;
    if (type.includes("spreadsheet") || name.endsWith('.xlsx') || name.endsWith('.csv')) 
      return <FileSpreadsheet className="h-4 w-4 text-green-400" />;
    if (type.includes("zip") || type.includes("archive") || name.endsWith('.zip') || name.endsWith('.rar'))
      return <FileArchive className="h-4 w-4 text-yellow-400" />;
    if (type.includes("code") || name.endsWith('.js') || name.endsWith('.py') || name.endsWith('.ps1'))
      return <FileCode className="h-4 w-4 text-purple-400" />;
    return <File className="h-4 w-4 text-slate-400" />;
  };

  const getFileTypeColor = (type: string, name: string) => {
    if (type.startsWith("image/")) return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    if (type.includes("pdf")) return "bg-red-500/20 text-red-400 border-red-500/30";
    if (type.includes("spreadsheet") || name.endsWith('.xlsx') || name.endsWith('.csv')) 
      return "bg-green-500/20 text-green-400 border-green-500/30";
    if (type.includes("zip") || type.includes("archive"))
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDownload = (attachment: Attachment) => {
    toast.success(`Downloading ${attachment.name}...`);
  };

  const handleDelete = async (id: string) => {
    if (onDeleteAttachment) {
      await onDeleteAttachment(id);
    } else {
      toast.success("Attachment deleted");
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            Attachments
          </CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            Documents and files attached to this device
          </p>
        </div>
        <Button 
          size="sm" 
          onClick={onUpload} 
          className="gap-1 bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <Upload className="h-4 w-4" />
          Upload file
        </Button>
      </CardHeader>
      <CardContent>
        {attachments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
              <Paperclip className="h-8 w-8 text-slate-600" />
            </div>
            <p className="text-sm text-slate-400 mb-2">No attachments</p>
            <p className="text-xs text-slate-500 mb-4">
              Upload device-related files for easy access
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onUpload} 
              className="gap-1 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            >
              <Upload className="h-4 w-4" />
              Upload first file
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-900/50 border-cyan-500/20 text-slate-200 placeholder:text-slate-500 focus:border-cyan-500/50"
              />
            </div>

            <div className="rounded-lg border border-cyan-500/20 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-cyan-500/20 hover:bg-transparent">
                    <TableHead className="text-slate-400">File</TableHead>
                    <TableHead className="text-slate-400">Type</TableHead>
                    <TableHead className="text-slate-400">Size</TableHead>
                    <TableHead className="text-slate-400">Uploaded</TableHead>
                    <TableHead className="text-slate-400 w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttachments.map((att) => (
                    <TableRow key={att.id} className="border-cyan-500/10 hover:bg-cyan-500/5">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-slate-800/50">
                            {getFileIcon(att.type, att.name)}
                          </div>
                          <span className="font-medium text-slate-200">{att.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getFileTypeColor(att.type, att.name)} variant="outline">
                          {att.name.split('.').pop()?.toUpperCase() || 'FILE'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {formatFileSize(att.size)}
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">
                        <div>
                          {formatDistanceToNow(new Date(att.uploaded_at), { addSuffix: true })}
                        </div>
                        {att.uploaded_by && (
                          <span className="text-xs text-slate-500">by {att.uploaded_by}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-cyan-500/20 hover:text-cyan-400"
                            onClick={() => handleDownload(att)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-red-500/20 hover:text-red-400"
                            onClick={() => handleDelete(att.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
