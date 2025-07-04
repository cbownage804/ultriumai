import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image, Video, Download, ExternalLink } from "lucide-react";

interface MediaAttachmentProps {
  mediaUrl: string;
  type: 'image' | 'video';
  prompt: string;
}

const MediaAttachment = ({ mediaUrl, type, prompt }: MediaAttachmentProps) => {
  const handleDownload = async () => {
    try {
      let blob;
      
      if (mediaUrl.startsWith('data:')) {
        // Handle base64 data URLs - convert to blob
        const base64Response = await fetch(mediaUrl);
        blob = await base64Response.blob();
      } else {
        // Handle regular URLs with CORS
        const response = await fetch(mediaUrl, { mode: 'cors' });
        blob = await response.blob();
      }
      
      // Create download URL and trigger download
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `generated-${type}-${Date.now()}.${type === 'image' ? 'png' : 'mp4'}`;
      
      // Force download by setting attributes
      link.setAttribute('download', link.download);
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }, 100);
      
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
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