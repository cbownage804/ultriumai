import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sliders, ThumbsUp, Share, Download, Palette } from "lucide-react";

interface GPTConfigAdvancedProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  themeColor: string;
}

export function GPTConfigAdvanced({ formData, onChange, themeColor }: GPTConfigAdvancedProps) {
  return (
    <div className="space-y-6">
      {/* User Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ThumbsUp className="h-5 w-5" />
            User Feedback
          </CardTitle>
          <CardDescription>
            Allow users to rate responses with thumbs up/down to help improve the AI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={formData.enable_feedback ? "enabled" : "disabled"} 
            onValueChange={(value) => onChange("enable_feedback", value === "enabled")}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="enabled" id="feedback-enabled" />
              <Label htmlFor="feedback-enabled">Enabled</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="disabled" id="feedback-disabled" />
              <Label htmlFor="feedback-disabled">Disabled</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Conversation Sharing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Share className="h-5 w-5" />
            Conversation Sharing
          </CardTitle>
          <CardDescription>
            Allow users to share conversations with others via shareable links.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={formData.enable_sharing ? "enabled" : "disabled"} 
            onValueChange={(value) => onChange("enable_sharing", value === "enabled")}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="enabled" id="sharing-enabled" />
              <Label htmlFor="sharing-enabled">Enabled</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="disabled" id="sharing-disabled" />
              <Label htmlFor="sharing-disabled">Disabled</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Conversation Exporting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Download className="h-5 w-5" />
            Conversation Exporting
          </CardTitle>
          <CardDescription>
            Allow users to export their conversation history as files (PDF, TXT, etc.).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={formData.enable_export ? "enabled" : "disabled"} 
            onValueChange={(value) => onChange("enable_export", value === "enabled")}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="enabled" id="export-enabled" />
              <Label htmlFor="export-enabled">Enabled</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="disabled" id="export-disabled" />
              <Label htmlFor="export-disabled">Disabled</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="h-5 w-5" />
            Branding
          </CardTitle>
          <CardDescription>
            Customize the branding and appearance of your AI assistant interface.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Remove Branding */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Remove Branding</Label>
              <p className="text-sm text-muted-foreground">Powered by UltriumGPT</p>
            </div>
            <Switch
              checked={formData.remove_branding || false}
              onCheckedChange={(checked) => onChange("remove_branding", checked)}
            />
          </div>

          <Separator />

          {/* Agent Title */}
          <div className="space-y-2">
            <Label>Agent Title</Label>
            <Input
              value={formData.agent_title || ""}
              onChange={(e) => onChange("agent_title", e.target.value)}
              placeholder="Leave blank if you don't want to use title"
              className="bg-muted"
            />
          </div>

          {/* Title Color */}
          <div className="space-y-2">
            <Label>Title Color</Label>
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-10 rounded-lg border cursor-pointer"
                style={{ backgroundColor: formData.title_color || "#000000" }}
              />
              <Input
                value={formData.title_color || "#000000"}
                onChange={(e) => onChange("title_color", e.target.value)}
                placeholder="#000000"
                className="bg-muted font-mono"
              />
            </div>
          </div>

          {/* Spotlight Avatar */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Spotlight Avatar</Label>
              <p className="text-sm text-muted-foreground">Highlight the agent avatar</p>
            </div>
            <Switch
              checked={formData.spotlight_avatar || false}
              onCheckedChange={(checked) => onChange("spotlight_avatar", checked)}
            />
          </div>

          {/* User Avatar */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">User Avatar</Label>
              <p className="text-sm text-muted-foreground">Show user profile pictures</p>
            </div>
            <Switch
              checked={formData.show_user_avatar || false}
              onCheckedChange={(checked) => onChange("show_user_avatar", checked)}
            />
          </div>

          {/* Avatar Orientations */}
          <div className="space-y-2">
            <Label>Avatar Orientations</Label>
            <Select 
              value={formData.avatar_orientation || "agent_left"} 
              onValueChange={(value) => onChange("avatar_orientation", value)}
            >
              <SelectTrigger className="bg-muted">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agent_left">Agent left, User right</SelectItem>
                <SelectItem value="agent_right">Agent right, User left</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Terms of Service */}
          <div className="space-y-2">
            <Label>Terms of Service</Label>
            <Textarea
              value={formData.terms_of_service || ""}
              onChange={(e) => onChange("terms_of_service", e.target.value)}
              placeholder="Enter your terms of service text here"
              rows={4}
              className="bg-muted resize-none"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
