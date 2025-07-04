import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Globe, EyeOff, Zap } from "lucide-react";
import { CustomGPT } from "@/hooks/useCustomGPTs";

interface GPTSelectorProps {
  customGPTs: CustomGPT[];
  selectedGPT: string;
  setSelectedGPT: (value: string) => void;
  selectedGPTData: CustomGPT | undefined;
  isPublic: boolean;
  setIsPublic: (value: boolean) => void;
  onDeploy: () => void;
  publicUrl: string;
}

const GPTSelector = ({
  customGPTs,
  selectedGPT,
  setSelectedGPT,
  selectedGPTData,
  isPublic,
  setIsPublic,
  onDeploy,
  publicUrl
}: GPTSelectorProps) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Deploy & Share</h1>
          <p className="text-muted-foreground mt-2">
            Make your Custom GPT accessible to the world
          </p>
        </div>
        {selectedGPTData && (
          <Badge variant={isPublic ? "default" : "secondary"} className="gap-2">
            {isPublic ? <Globe className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            {isPublic ? "Public" : "Private"}
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Select GPT to Deploy
          </CardTitle>
          <CardDescription>
            Choose which Custom GPT you want to make public
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gpt-select">Custom GPT</Label>
            <Select value={selectedGPT} onValueChange={setSelectedGPT}>
              <SelectTrigger>
                <SelectValue placeholder="Select a Custom GPT" />
              </SelectTrigger>
              <SelectContent>
                {customGPTs.map((gpt) => (
                  <SelectItem key={gpt.id} value={gpt.id}>
                    <div className="flex items-center gap-2">
                      <span>{gpt.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {gpt.chat_count} chats
                      </Badge>
                      {gpt.agent_visibility === 'public' && (
                        <Badge variant="default" className="text-xs">
                          <Globe className="h-3 w-3 mr-1" />
                          Public
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedGPTData && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="public-access"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label htmlFor="public-access">Make publicly accessible</Label>
              </div>

              {isPublic && (
                <Alert>
                  <Globe className="h-4 w-4" />
                  <AlertDescription>
                    Your GPT will be accessible at: {publicUrl}
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={onDeploy} className="w-full">
                <Zap className="h-4 w-4 mr-2" />
                {isPublic ? "Deploy GPT" : "Make Private"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GPTSelector;