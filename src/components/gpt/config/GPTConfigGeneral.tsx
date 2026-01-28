import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Settings, User, Palette, Image, Upload, X, ImageIcon } from "lucide-react";
import { SketchPicker, ColorResult } from 'react-color';
import { useToast } from "@/hooks/use-toast";

interface GPTConfigGeneralProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  themeColor: string;
}

const ColorPickerInput = ({ 
  label, 
  value, 
  onChange, 
  placeholder = "#3b82f6" 
}: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void; 
  placeholder?: string;
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleColorChange = (color: ColorResult) => {
    onChange(color.hex);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3 relative">
        <div 
          className="w-12 h-10 rounded-lg border cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
          style={{ backgroundColor: value || placeholder }}
          onClick={() => setShowPicker(!showPicker)}
        />
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-muted font-mono"
        />
        {showPicker && (
          <div className="absolute top-full left-0 z-50 mt-2">
            <div
              className="fixed inset-0"
              onClick={() => setShowPicker(false)}
            />
            <SketchPicker
              color={value || placeholder}
              onChange={handleColorChange}
              onChangeComplete={handleColorChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const ImageUploader = ({
  label,
  description,
  value,
  onChange,
  accept = "image/*",
  maxSize = 800 * 1024, // 800KB default
  aspectHint = "square",
}: {
  label: string;
  description: string;
  value?: string;
  onChange: (value: string | null) => void;
  accept?: string;
  maxSize?: number;
  aspectHint?: "square" | "wide" | "any";
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `Please upload an image smaller than ${Math.round(maxSize / 1024)}KB`,
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, GIF, or WebP)",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Convert to base64 for preview (in production, upload to storage)
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        onChange(result);
        setIsUploading(false);
        toast({
          title: "Image uploaded",
          description: "Your image has been uploaded successfully.",
        });
      };
      reader.onerror = () => {
        setIsUploading(false);
        toast({
          title: "Upload failed",
          description: "Failed to read the image file. Please try again.",
          variant: "destructive",
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsUploading(false);
      toast({
        title: "Upload failed",
        description: "An error occurred while uploading the image.",
        variant: "destructive",
      });
    }

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onChange(null);
    toast({
      title: "Image removed",
      description: "The image has been removed.",
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-4">
        {value ? (
          <div className="relative group">
            <img 
              src={value} 
              alt={label} 
              className={`${aspectHint === 'square' ? 'w-16 h-16' : 'w-24 h-16'} rounded-lg object-cover border`}
            />
            <button
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div 
            className={`${aspectHint === 'square' ? 'w-16 h-16' : 'w-24 h-16'} rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/50`}
          >
            <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
          </div>
        )}
        <div className="flex-1">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? "Uploading..." : value ? "Change Image" : "Upload Image"}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            {description}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
};

export function GPTConfigGeneral({ formData, onChange, themeColor }: GPTConfigGeneralProps) {
  return (
    <div className="space-y-6">
      {/* Agent Name */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5" />
            Agent Name
          </CardTitle>
          <CardDescription>
            Choose a name for your AI assistant that reflects its purpose and personality.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={formData.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="My AI Assistant"
            className="bg-muted"
          />
        </CardContent>
      </Card>

      {/* Agent Avatar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Agent Avatar
          </CardTitle>
          <CardDescription>
            Upload a profile picture for your AI assistant. This image will appear in conversations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {formData.avatar_url ? (
              <div className="relative group">
                <img 
                  src={formData.avatar_url} 
                  alt="Avatar" 
                  className="w-16 h-16 rounded-full object-cover border"
                />
                <button
                  onClick={() => onChange("avatar_url", null)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                style={{ backgroundColor: themeColor }}
              >
                {formData.name?.charAt(0) || "AI"}
              </div>
            )}
            <div>
              <ImageUploader
                label="Avatar"
                description="Upload square image only. Allowed are JPG, GIF or PNG image up to 800 KB."
                value={formData.avatar_url}
                onChange={(val) => onChange("avatar_url", val)}
                aspectHint="square"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="h-5 w-5" />
            Colors
          </CardTitle>
          <CardDescription>
            Customize the color scheme for your AI assistant's interface to match your brand.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ColorPickerInput
              label="Primary color"
              value={formData.theme_color}
              onChange={(val) => onChange("theme_color", val)}
              placeholder="#3b82f6"
            />
            <ColorPickerInput
              label="Secondary color"
              value={formData.secondary_color || formData.theme_color}
              onChange={(val) => onChange("secondary_color", val)}
              placeholder="#3b82f6"
            />
          </div>
        </CardContent>
      </Card>

      {/* Background */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="h-5 w-5" />
            Background
          </CardTitle>
          <CardDescription>
            Choose between a solid color or image background for the chat interface.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup 
            value={formData.background_type || "color"} 
            onValueChange={(value) => onChange("background_type", value)}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="color" id="bg-color" />
              <Label htmlFor="bg-color">Background Color</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="image" id="bg-image" />
              <Label htmlFor="bg-image">Background Image</Label>
            </div>
          </RadioGroup>
          
          {formData.background_type === "image" ? (
            <div className="space-y-4">
              <ImageUploader
                label="Background Image"
                description="Upload a wide image for best results. Recommended size: 1920x1080. Max 2MB."
                value={formData.background_image}
                onChange={(val) => onChange("background_image", val)}
                maxSize={2 * 1024 * 1024}
                aspectHint="wide"
              />
              {formData.background_image && (
                <div className="rounded-lg overflow-hidden border">
                  <img 
                    src={formData.background_image} 
                    alt="Background preview" 
                    className="w-full h-32 object-cover"
                  />
                </div>
              )}
            </div>
          ) : (
            <ColorPickerInput
              label="Background color"
              value={formData.background_color || "#0a0a0a"}
              onChange={(val) => onChange("background_color", val)}
              placeholder="#0a0a0a"
            />
          )}
        </CardContent>
      </Card>

      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Image className="h-5 w-5" />
            Agent Logo
          </CardTitle>
          <CardDescription>
            Upload a logo that will be displayed in the chat header and embed widget.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUploader
            label="Logo"
            description="Upload your logo. Recommended: transparent PNG, max 500KB."
            value={formData.logo_url}
            onChange={(val) => onChange("logo_url", val)}
            maxSize={500 * 1024}
            aspectHint="any"
          />
          {formData.logo_url && (
            <div className="mt-4 p-4 bg-muted rounded-lg flex items-center justify-center">
              <img 
                src={formData.logo_url} 
                alt="Logo preview" 
                className="max-h-16 object-contain"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
