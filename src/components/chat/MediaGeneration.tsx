import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image, Video, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUserCredits } from "@/hooks/useUserCredits";
import { CREDIT_RATES } from "@/types/aiStudioCredits";

interface MediaGenerationProps {
  onMediaGenerated: (mediaUrl: string, type: 'image' | 'video', prompt: string) => void;
  disabled?: boolean;
}

const MediaGeneration = ({ onMediaGenerated, disabled }: MediaGenerationProps) => {
  const [prompt, setPrompt] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [imageSize, setImageSize] = useState("1024x1024");
  const [imageQuality, setImageQuality] = useState("high");
  const { toast } = useToast();
  const { deductCredits } = useUserCredits();

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a prompt for image generation",
        variant: "destructive",
      });
      return;
    }

    try {
      // Deduct credits before generating
      const credited = await deductCredits(CREDIT_RATES.IMAGE_GENERATION, 'Image generation');
      if (!credited) return;

      setIsGeneratingImage(true);
      
      const { data, error } = await supabase.functions.invoke('image-generation', {
        body: {
          prompt: prompt.trim(),
          size: imageSize,
          quality: imageQuality
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate image');
      }

      onMediaGenerated(data.image, 'image', prompt);
      setPrompt(""); // Clear the prompt after successful generation
      toast({
        title: "Image generated",
        description: "Your image has been sent to the chat",
      });
      
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Generation failed",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const generateVideo = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a prompt for video generation",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGeneratingVideo(true);
      
      // For now, show a message that video generation is coming soon
      toast({
        title: "Video generation",
        description: "Veo 3 video generation will be available soon. Stay tuned!",
      });
      
    } catch (error) {
      console.error('Error generating video:', error);
      toast({
        title: "Generation failed",
        description: "Failed to generate video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="prompt">Describe what you want to create</Label>
        <Textarea
          id="prompt"
          placeholder="A beautiful sunset over a calm ocean with sailing boats..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={disabled || isGeneratingImage || isGeneratingVideo}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Image Generation Section */}
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <Image className="w-4 h-4" />
            Image Generation
          </h3>
          
          <div className="space-y-2">
            <Label htmlFor="size">Size</Label>
            <Select value={imageSize} onValueChange={setImageSize}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1024x1024">Square (1024×1024)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quality">Quality</Label>
            <Select value={imageQuality} onValueChange={setImageQuality}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={generateImage}
            disabled={disabled || isGeneratingImage || isGeneratingVideo || !prompt.trim()}
            className="w-full"
            variant="hero"
          >
            {isGeneratingImage ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Image className="w-4 h-4 mr-2" />
                Generate Image
              </>
            )}
          </Button>
        </div>

        {/* Video Generation Section */}
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <Video className="w-4 h-4" />
            Video Generation (Coming Soon)
          </h3>
          
          <div className="space-y-2 opacity-60">
            <Label>Duration</Label>
            <Select disabled>
              <SelectTrigger>
                <SelectValue placeholder="5 seconds" />
              </SelectTrigger>
            </Select>
          </div>

          <div className="space-y-2 opacity-60">
            <Label>Style</Label>
            <Select disabled>
              <SelectTrigger>
                <SelectValue placeholder="Realistic" />
              </SelectTrigger>
            </Select>
          </div>

          <Button
            onClick={generateVideo}
            disabled={true}
            className="w-full"
            variant="outline"
          >
            <Video className="w-4 h-4 mr-2" />
            Generate Video (Soon)
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default MediaGeneration;