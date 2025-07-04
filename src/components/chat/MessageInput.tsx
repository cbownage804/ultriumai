import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Paperclip, Image, Search, Brain } from "lucide-react";
import { ConversationFile } from "@/types/chat";
import FileUpload from "./FileUpload";
import FileAttachment from "./FileAttachment";
import MediaGeneration from "./MediaGeneration";

interface MessageInputProps {
  input: string;
  setInput: (value: string) => void;
  onSendMessage: (attachments?: ConversationFile[], generatedMedia?: { url: string; type: 'image' | 'video'; prompt: string }[], aiModel?: string, webSearchEnabled?: boolean) => void;
  isLoading: boolean;
  conversationId: string | null;
  allowWebSearch?: boolean;
  customGPTName?: string;
}

const MessageInput = ({ input, setInput, onSendMessage, isLoading, conversationId, allowWebSearch = true, customGPTName }: MessageInputProps) => {
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showMediaGeneration, setShowMediaGeneration] = useState(false);
  const [attachments, setAttachments] = useState<ConversationFile[]>([]);
  const [generatedMedia, setGeneratedMedia] = useState<{ url: string; type: 'image' | 'video'; prompt: string }[]>([]);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");

  // Reset web search when not allowed
  if (!allowWebSearch && webSearchEnabled) {
    setWebSearchEnabled(false);
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    onSendMessage(
      attachments.length > 0 ? attachments : undefined,
      generatedMedia.length > 0 ? generatedMedia : undefined,
      selectedModel,
      webSearchEnabled
    );
    setAttachments([]);
    setGeneratedMedia([]);
    setShowFileUpload(false);
    setShowMediaGeneration(false);
  };

  const handleFileUploaded = (file: ConversationFile) => {
    setAttachments(prev => [...prev, file]);
  };

  const handleRemoveAttachment = (fileToRemove: ConversationFile) => {
    setAttachments(prev => prev.filter(file => file.id !== fileToRemove.id));
  };

  const handleMediaGenerated = (mediaUrl: string, type: 'image' | 'video', prompt: string) => {
    setGeneratedMedia(prev => [...prev, { url: mediaUrl, type, prompt }]);
  };

  const handleRemoveGeneratedMedia = (index: number) => {
    setGeneratedMedia(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t">
      {/* File Attachments */}
      {attachments.length > 0 && (
        <div className="p-4 border-b bg-muted/30">
          <div className="space-y-2">
            <p className="text-sm font-medium">File Attachments</p>
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

      {/* Generated Media */}
      {generatedMedia.length > 0 && (
        <div className="p-4 border-b bg-muted/30">
          <div className="space-y-2">
            <p className="text-sm font-medium">Generated Media</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {generatedMedia.map((media, index) => (
                <div key={index} className="relative">
                  <div className="rounded-lg overflow-hidden">
                    {media.type === 'image' ? (
                      <img
                        src={media.url}
                        alt={media.prompt}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <video
                        src={media.url}
                        className="w-full h-32 object-cover"
                        controls
                      />
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={() => handleRemoveGeneratedMedia(index)}
                  >
                    ×
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {media.prompt}
                  </p>
                </div>
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
      
      {/* Media Generation Area */}
      {showMediaGeneration && (
        <div className="p-4 border-b">
          <MediaGeneration
            onMediaGenerated={handleMediaGenerated}
            disabled={isLoading}
          />
        </div>
      )}
      
      {/* AI Settings */}
      <div className="px-4 py-2 border-b bg-muted/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="model-select" className="text-sm">Model:</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                  <SelectItem value="claude-3-5-haiku">Claude 3.5 Haiku</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {allowWebSearch ? (
            <div className="flex items-center gap-2">
              <Search className={`w-4 h-4 ${webSearchEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
              <Label htmlFor="web-search" className="text-sm">Web Search</Label>
              <Switch
                id="web-search"
                checked={webSearchEnabled}
                onCheckedChange={setWebSearchEnabled}
                disabled={isLoading}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 opacity-50">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm text-muted-foreground">
                Web Search (Disabled for {customGPTName || "this GPT"})
              </Label>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFileUpload(!showFileUpload)}
            disabled={!conversationId}
            className="flex-shrink-0"
            title="Upload files"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMediaGeneration(!showMediaGeneration)}
            disabled={!conversationId}
            className="flex-shrink-0"
            title="Generate images and videos"
          >
            <Image className="w-4 h-4" />
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
            disabled={(!input.trim() && attachments.length === 0 && generatedMedia.length === 0) || isLoading}
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