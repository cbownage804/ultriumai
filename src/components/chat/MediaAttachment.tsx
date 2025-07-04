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
      const link = document.createElement('a');
      
      if (mediaUrl.startsWith('data:')) {
        // For data URLs, use the data directly
        link.href = mediaUrl;
        link.download = `generated-image-${Date.now()}.png`;
        
        // Force download attributes
        link.setAttribute('download', link.download);
        link.setAttribute('target', '_blank');
        
        // Temporarily add to DOM and click
        document.body.appendChild(link);
        link.style.display = 'none';
        link.click();
        
        // Remove after a short delay
        setTimeout(() => {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
        }, 100);
      } else {
        // For regular URLs
        window.open(mediaUrl, '_blank');
      }
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to opening in new tab
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