import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Link, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const VideoUploadManager = () => {
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const { toast } = useToast();

  const uploadVideo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select a video file to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `hero-video-${Math.random()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      setVideoUrl(data.publicUrl);
      
      toast({
        title: "Success",
        description: "Video uploaded successfully! Copy the URL below to use in your Hero component.",
      });

    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload video",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(videoUrl);
    toast({
      title: "Copied!",
      description: "Video URL copied to clipboard",
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Video Upload Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            type="file"
            accept="video/*"
            onChange={uploadVideo}
            disabled={uploading}
          />
        </div>
        
        {uploading && (
          <div className="text-center text-sm text-muted-foreground">
            Uploading video...
          </div>
        )}
        
        {videoUrl && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Video URL:</label>
            <div className="flex gap-2">
              <Input 
                value={videoUrl} 
                readOnly 
                className="text-xs"
              />
              <Button 
                size="sm" 
                variant="outline"
                onClick={copyToClipboard}
              >
                <Link className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Copy this URL and update your Hero component with:
              <br />
              <code className="bg-muted px-1 rounded">
                videoUrl="{videoUrl}"
              </code>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};