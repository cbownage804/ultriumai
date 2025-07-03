import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip } from "lucide-react";
import { ConversationFile } from "@/types/chat";
import FileUpload from "./FileUpload";
import FileAttachment from "./FileAttachment";

interface MessageInputProps {
  input: string;
  setInput: (value: string) => void;
  onSendMessage: (attachments?: ConversationFile[]) => void;
  isLoading: boolean;
  conversationId: string | null;
}

const MessageInput = ({ input, setInput, onSendMessage, isLoading, conversationId }: MessageInputProps) => {
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [attachments, setAttachments] = useState<ConversationFile[]>([]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    onSendMessage(attachments.length > 0 ? attachments : undefined);
    setAttachments([]);
    setShowFileUpload(false);
  };

  const handleFileUploaded = (file: ConversationFile) => {
    setAttachments(prev => [...prev, file]);
  };

  const handleRemoveAttachment = (fileToRemove: ConversationFile) => {
    setAttachments(prev => prev.filter(file => file.id !== fileToRemove.id));
  };

  return (
    <div className="border-t">
      {/* File Attachments */}
      {attachments.length > 0 && (
        <div className="p-4 border-b bg-muted/30">
          <div className="space-y-2">
            <p className="text-sm font-medium">Attachments</p>
            <div className="space-y-2">
              {attachments.map((file) => (
                <FileAttachment
                  key={file.id}
                  file={file}
                  onRemove={handleRemoveAttachment}
                  showRemove={true}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* File Upload Area */}
      {showFileUpload && (
        <div className="p-4 border-b">
          <FileUpload
            conversationId={conversationId}
            onFileUploaded={handleFileUploaded}
            disabled={isLoading}
          />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFileUpload(!showFileUpload)}
            disabled={!conversationId}
            className="flex-shrink-0"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={(!input.trim() && attachments.length === 0) || isLoading}
            size="icon"
            variant="hero"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default MessageInput;