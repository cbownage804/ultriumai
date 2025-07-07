import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, ClipboardCopy } from "lucide-react";

interface RemoteClipboardProps {
  onSyncToRemote: (content: string) => void;
  onSyncFromRemote: () => void;
  remoteClipboard: string;
}

export const RemoteClipboard = ({ onSyncToRemote, onSyncFromRemote, remoteClipboard }: RemoteClipboardProps) => {
  const [localClipboard, setLocalClipboard] = useState('');

  const handleSyncToRemote = () => {
    if (localClipboard.trim()) {
      onSyncToRemote(localClipboard);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Copy className="h-4 w-4" />
          Send to Remote Clipboard
        </h3>
        <Textarea
          placeholder="Enter text to send to remote clipboard..."
          value={localClipboard}
          onChange={(e) => setLocalClipboard(e.target.value)}
          rows={4}
        />
        <Button onClick={handleSyncToRemote}>
          <Copy className="h-4 w-4 mr-2" />
          Send to Remote
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <ClipboardCopy className="h-4 w-4" />
          Remote Clipboard Content
        </h3>
        <Textarea
          value={remoteClipboard}
          readOnly
          rows={4}
          className="bg-muted"
        />
        <Button onClick={onSyncFromRemote}>
          <ClipboardCopy className="h-4 w-4 mr-2" />
          Get from Remote
        </Button>
      </div>
    </div>
  );
};