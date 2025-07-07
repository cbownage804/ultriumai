import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Download } from "lucide-react";

interface RemoteFileTransferProps {
  onUploadFile: (file: File) => void;
  onDownloadFile: (path: string) => void;
}

export const RemoteFileTransfer = ({ onUploadFile, onDownloadFile }: RemoteFileTransferProps) => {
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [downloadPath, setDownloadPath] = useState('');

  const handleUpload = () => {
    if (fileToUpload) {
      onUploadFile(fileToUpload);
      setFileToUpload(null);
    }
  };

  const handleDownload = () => {
    if (downloadPath.trim()) {
      onDownloadFile(downloadPath);
      setDownloadPath('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload File to Remote
        </h3>
        <div className="flex gap-2">
          <Input
            type="file"
            onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
          />
          <Button onClick={handleUpload} disabled={!fileToUpload}>
            Upload
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download File from Remote
        </h3>
        <div className="flex gap-2">
          <Input
            placeholder="C:\path\to\file.txt"
            value={downloadPath}
            onChange={(e) => setDownloadPath(e.target.value)}
          />
          <Button onClick={handleDownload}>
            Download
          </Button>
        </div>
      </div>
    </div>
  );
};