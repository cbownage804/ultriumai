import { useParams, useNavigate } from "react-router-dom";
import { useCustomGPTs } from "@/hooks/useCustomGPTs";
import { GPTSettingsPanel } from "@/components/gpt/GPTSettingsPanel";
import { AuthLoadingScreen } from "@/components/auth/AuthLoadingScreen";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, ArrowLeft } from "lucide-react";

export default function GPTSettings() {
  const { gptId } = useParams<{ gptId: string }>();
  const navigate = useNavigate();
  const { gpts, isLoading } = useCustomGPTs();
  
  const gpt = gpts.find(g => g.id === gptId);
  
  if (isLoading) {
    return <AuthLoadingScreen message="Loading GPT settings..." />;
  }
  
  if (!gpt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">GPT Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The Custom GPT you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => navigate('/dashboard/gpt')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <GPTSettingsPanel 
          gpt={{
            id: gpt.id,
            name: gpt.name,
            description: gpt.description || undefined,
            theme_color: gpt.theme_color || undefined,
            api_enabled: gpt.api_enabled || false,
            embed_enabled: gpt.embed_enabled || false,
          }}
          onBack={() => navigate('/dashboard/gpt')}
        />
      </div>
    </div>
  );
}
