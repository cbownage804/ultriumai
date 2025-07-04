import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Play, X, Loader2 } from 'lucide-react';

interface VideoUploadProps {
  onVideoUploaded?: (url: string) => void;
  existingVideoUrl?: string;
}

export const VideoUpload = ({ onVideoUploaded, existingVideoUrl }: VideoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(existingVideoUrl || null);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const uploadVideo = async (file: File) => {
    try {
      setUploading(true);

      // Validate file type
      if (!file.type.startsWith('video/')) {
        throw new Error('Please select a video file');
      }

      // Validate file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        throw new Error('Video file must be less than 100MB');
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `hero-video-${Math.random()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;
      setVideoUrl(publicUrl);
      onVideoUploaded?.(publicUrl);

      toast({
        title: "Success!",
        description: "Video uploaded successfully",
      });

    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload video",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadVideo(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadVideo(e.target.files[0]);
    }
  };

  const removeVideo = () => {
    setVideoUrl(null);
    onVideoUploaded?.('');
  };

  if (videoUrl) {
    return (
      <div className="relative rounded-xl overflow-hidden bg-black">
        <video 
          controls 
          className="w-full h-auto max-h-96 object-contain"
          preload="metadata"
        >
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl} type="video/webm" />
          <source src={videoUrl} type="video/ogg" />
          Your browser does not support the video tag.
        </video>
        <Button
          variant="destructive"
          size="sm"
          className="absolute top-2 right-2 opacity-80 hover:opacity-100 transition-opacity"
          onClick={removeVideo}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
        ${dragActive 
          ? 'border-primary bg-primary/5 scale-105' 
          : 'border-primary/30 hover:border-primary/60 hover:bg-primary/5'
        }
        ${uploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
      `}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => !uploading && document.getElementById('video-upload')?.click()}
    >
      <input
        id="video-upload"
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
      
      <div className="space-y-4">
        {uploading ? (
          <>
            <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
            <p className="text-muted-foreground">Uploading your video...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto hover:scale-110 transition-transform duration-300">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-foreground font-medium mb-2">
                {dragActive ? 'Drop your video here' : 'Upload your video'}
              </p>
              <p className="text-sm text-muted-foreground">
                Drag & drop or click to select
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                MP4, WebM, OGG • Max 100MB
              </p>
            </div>
            <Button variant="outline" className="pointer-events-none">
              <Play className="mr-2 h-4 w-4" />
              Choose Video File
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default VideoUpload;