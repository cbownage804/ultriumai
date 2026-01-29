import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Plus, Upload, Download, Trash2, FileText, File, FileImage, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { VanguardAgent } from "@/hooks/useVanguardAgents";
import { formatDistanceToNow } from "date-fns";

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
}

export function DeviceAttachmentsTab({ agent, onUpload }: DeviceAttachmentsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Extract attachments from agent config
  const attachments: Attachment[] = agent.config?.attachments || [];

  const filteredAttachments = attachments.filter((att) =>
    att.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <FileImage className="h-4 w-4 text-blue-500" />;
    if (type.includes("pdf")) return <FileText className="h-4 w-4 text-red-500" />;
    return <File className="h-4 w-4 text-gray-500" />;
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

  const handleDelete = (id: string) => {
    toast.success("Attachment deleted");
  };

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-gray-900">Attachments</CardTitle>
        <Button size="sm" variant="outline" onClick={onUpload} className="gap-1">
          <Upload className="h-4 w-4" />
          Upload file
        </Button>
      </CardHeader>
      <CardContent>
        {attachments.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-2">No attachments</p>
            <p className="text-xs text-gray-400 mb-4">
              Upload device-related files for easy access
            </p>
            <Button variant="outline" size="sm" onClick={onUpload} className="gap-1">
              <Upload className="h-4 w-4" />
              Upload first file
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttachments.map((att) => (
                  <TableRow key={att.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getFileIcon(att.type)}
                        <span className="font-medium">{att.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {formatFileSize(att.size)}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {formatDistanceToNow(new Date(att.uploaded_at), { addSuffix: true })}
                      {att.uploaded_by && <span className="block text-xs">by {att.uploaded_by}</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleDownload(att)}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500"
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
        )}
      </CardContent>
    </Card>
  );
}
