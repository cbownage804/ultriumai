import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Settings, User, Palette, Image } from "lucide-react";

interface GPTConfigGeneralProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  themeColor: string;
}

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
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: themeColor }}
            >
              {formData.name?.charAt(0) || "AI"}
            </div>
            <div>
              <Button variant="outline" size="sm">
                <Image className="h-4 w-4 mr-2" />
                Change Avatar
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Upload square image only. Allowed are JPG, GIF or PNG image up to 800 kb.
              </p>
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
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Primary color</Label>
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-10 rounded-lg border cursor-pointer"
                  style={{ backgroundColor: formData.theme_color }}
                />
                <Input
                  value={formData.theme_color}
                  onChange={(e) => onChange("theme_color", e.target.value)}
                  placeholder="#3b82f6"
                  className="bg-muted font-mono"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Secondary color</Label>
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-10 rounded-lg border cursor-pointer"
                  style={{ backgroundColor: formData.secondary_color || formData.theme_color }}
                />
                <Input
                  value={formData.secondary_color || formData.theme_color}
                  onChange={(e) => onChange("secondary_color", e.target.value)}
                  placeholder="#3b82f6"
                  className="bg-muted font-mono"
                />
              </div>
            </div>
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
              <RadioGroupItem value="image" id="bg-image" />
              <Label htmlFor="bg-image">Background Image</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="color" id="bg-color" />
              <Label htmlFor="bg-color">Background Color</Label>
            </div>
          </RadioGroup>
          
          <Input
            value={formData.background_color || "#ffffff"}
            onChange={(e) => onChange("background_color", e.target.value)}
            placeholder="#ffffff"
            className="bg-muted font-mono"
          />
        </CardContent>
      </Card>
    </div>
  );
}
