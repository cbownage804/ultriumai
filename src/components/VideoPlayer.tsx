import { Play } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl?: string;
  title?: string;
}

export const VideoPlayer = ({ 
  videoUrl = "/path/to/your/demo-video.mp4", // Replace with your actual video URL
  title = "UltriumAI Demo Video" 
}: VideoPlayerProps) => {
  if (!videoUrl) {
    return (
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20">
        <div className="aspect-video flex items-center justify-center text-center p-8">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
              <Play className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-foreground font-medium mb-2">Demo Video Coming Soon</p>
              <p className="text-sm text-muted-foreground">
                Our demo video will be available here shortly
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden bg-black shadow-2xl">
      <video 
        controls 
        className="w-full h-auto max-h-96 object-contain"
        preload="metadata"
        poster="/path/to/video-thumbnail.jpg" // Optional: Add a poster image
      >
        <source src={videoUrl} type="video/mp4" />
        <source src={videoUrl} type="video/webm" />
        <source src={videoUrl} type="video/ogg" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;