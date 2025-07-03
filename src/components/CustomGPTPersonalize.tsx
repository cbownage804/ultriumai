import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Settings, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CustomGPTPersonalize = () => {
  const [gptData, setGptData] = useState({
    name: "",
    description: "",
    systemPrompt: "",
    avatarUrl: "",
    themeColor: "#3b82f6"
  });
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your Custom GPT configuration has been updated",
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setGptData(prev => ({ ...prev, avatarUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const colorOptions = [
    "#3b82f6", "#8b5cf6", "#ef4444", "#f59e0b", 
    "#10b981", "#06b6d4", "#ec4899", "#6366f1"
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Personalize Your GPT</h1>
        <p className="text-muted-foreground mt-2">
          Configure your Custom GPT's personality and appearance
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Set the name and description for your Custom GPT
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="My Custom GPT"
                value={gptData.name}
                onChange={(e) => setGptData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="A helpful assistant that..."
                value={gptData.description}
                onChange={(e) => setGptData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Avatar & Theme */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Avatar & Theme
            </CardTitle>
            <CardDescription>
              Customize the visual appearance of your GPT
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Avatar</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={gptData.avatarUrl} />
                  <AvatarFallback>
                    {gptData.name ? gptData.name.substring(0, 2).toUpperCase() : "GPT"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                      </span>
                    </Button>
                  </Label>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommended: 256x256px
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Theme Color</Label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${
                      gptData.themeColor === color ? 'border-foreground' : 'border-muted'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setGptData(prev => ({ ...prev, themeColor: color }))}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Prompt */}
      <Card>
        <CardHeader>
          <CardTitle>System Instructions</CardTitle>
          <CardDescription>
            Define how your GPT should behave and respond to users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="system-prompt">System Prompt</Label>
            <Textarea
              id="system-prompt"
              placeholder="You are a helpful assistant that specializes in..."
              value={gptData.systemPrompt}
              onChange={(e) => setGptData(prev => ({ ...prev, systemPrompt: e.target.value }))}
              rows={8}
            />
            <p className="text-xs text-muted-foreground">
              This defines your GPT's personality, expertise, and how it should respond to users.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          Save Configuration
        </Button>
      </div>
    </div>
  );
};

export default CustomGPTPersonalize;