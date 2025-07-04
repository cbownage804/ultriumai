import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image, Video, Download, ExternalLink } from "lucide-react";

interface MediaAttachmentProps {
  mediaUrl: string;
  type: 'image' | 'video';
  prompt: string;
}

const MediaAttachment = ({ mediaUrl, type, prompt }: MediaAttachmentProps) => {
  const handleDownload = () => {
    try {
      if (mediaUrl.startsWith('data:')) {
        // Firefox-compatible download for data URLs
        const mimeType = mediaUrl.split(',')[0].split(':')[1].split(';')[0];
        const byteCharacters = atob(mediaUrl.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        
        // Use Firefox-compatible download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `generated-image-${Date.now()}.png`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        
        // Trigger download with user gesture
        link.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        }));
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
      } else {
        // For regular URLs, try to force download in Firefox
        const link = document.createElement('a');
        link.href = mediaUrl;
        link.download = `generated-image-${Date.now()}.png`;
        link.rel = 'noopener';
        link.click();
      }
    } catch (error) {
      console.error('Download failed:', error);
      window.open(mediaUrl, '_blank');
    }
  };

  const handleOpenInNewTab = () => {
    window.open(mediaUrl, '_blank');
  };

  return (
    <Card className="p-3 max-w-md">
      <div className="space-y-3">
        {/* Media Preview */}
        <div className="relative rounded-lg overflow-hidden bg-muted">
          {type === 'image' ? (
            <img
              src={mediaUrl}
              alt={prompt}
              className="w-full h-auto max-h-64 object-cover"
              loading="lazy"
            />
          ) : (
            <video
              src={mediaUrl}
              controls
              className="w-full h-auto max-h-64"
              poster="/placeholder-video.jpg"
            >
              Your browser does not support the video tag.
            </video>
          )}
        </div>

        {/* Media Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {type === 'image' ? (
              <Image className="w-4 h-4" />
            ) : (
              <Video className="w-4 h-4" />
            )}
            <span className="capitalize">{type} generated</span>
          </div>
          
          <p className="text-sm line-clamp-2" title={prompt}>
            "{prompt}"
          </p>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              className="flex-1"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenInNewTab}
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MediaAttachment;