import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCustomGPTs } from "@/hooks/useCustomGPTs";
import { useSubscription } from "@/hooks/useSubscription";
import GPTSelector from "./GPTSelector";
import EmbedWidgetConfig from "./EmbedWidgetConfig";
import APIAccessConfig from "./APIAccessConfig";
import ShareLinkConfig from "./ShareLinkConfig";
import DeploymentAnalytics from "./DeploymentAnalytics";
import TeamsIntegrationConfig from "./TeamsIntegrationConfig";

const GPTDeployment = () => {
  const { gpts: customGPTs, updateGPT } = useCustomGPTs();
  const { subscription } = useSubscription();
  const { toast } = useToast();
  const [selectedGPT, setSelectedGPT] = useState<string>("");
  const [isPublic, setIsPublic] = useState(false);
  const [embedSettings, setEmbedSettings] = useState({
    width: "400",
    height: "600",
    theme: "light",
    position: "bottom-right",
    customDomain: "",
    allowFullscreen: true,
    showBranding: true
  });

  const selectedGPTData = customGPTs.find(gpt => gpt.id === selectedGPT);

  // Update isPublic when selectedGPT changes
  useEffect(() => {
    if (selectedGPTData) {
      setIsPublic(selectedGPTData.agent_visibility === 'public');
    }
  }, [selectedGPTData]);

  const baseUrl = window.location.origin;
  const publicUrl = selectedGPTData ? `${baseUrl}/gpt/${selectedGPTData.id}` : "";
  const embedUrl = selectedGPTData ? `${baseUrl}/gpt/${selectedGPTData.id}/embed?embed=true` : "";
  const apiEndpoint = selectedGPTData ? `https://api.ultriumai.com/v1/gpt/${selectedGPTData.id}/chat` : "";

  const embedCode = `<!-- UltriumGPT Embed Widget -->
<iframe
  src="${embedUrl}"
  width="${embedSettings.width}px"
  height="${embedSettings.height}px"
  frameborder="0"
  style="border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"
  allow="clipboard-write"
></iframe>`;

  const apiExample = `// Example API call
fetch('${apiEndpoint}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    message: 'Hello, how can you help me?',
    conversation_id: 'optional-conversation-id'
  })
})
.then(response => response.json())
.then(data => console.log(data));`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const handleDeploy = async () => {
    if (!selectedGPTData) return;

    try {
      // Update the GPT's visibility in the database
      await updateGPT(selectedGPT, {
        agent_visibility: isPublic ? 'public' : 'private',
        is_active: isPublic,
        embed_enabled: isPublic && !isPremiumFeature('embed'),
        api_enabled: isPublic && !isPremiumFeature('api')
      });
      
      toast({
        title: isPublic ? "GPT Published!" : "GPT Made Private",
        description: isPublic 
          ? `${selectedGPTData.name} is now live and accessible`
          : `${selectedGPTData.name} is now private`,
      });
    } catch (error) {
      toast({
        title: "Deployment failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const isPremiumFeature = (feature: string) => {
    const premiumFeatures = ['embed', 'api', 'customDomain', 'removeBranding'];
    return premiumFeatures.includes(feature) && subscription.subscription_tier === "free";
  };

  return (
    <div className="space-y-6">
      <GPTSelector
        customGPTs={customGPTs}
        selectedGPT={selectedGPT}
        setSelectedGPT={setSelectedGPT}
        selectedGPTData={selectedGPTData}
        isPublic={isPublic}
        setIsPublic={setIsPublic}
        onDeploy={handleDeploy}
        publicUrl={publicUrl}
      />

      {/* Quick Embed Script Tag for easy external embedding */}
      {selectedGPTData && isPublic && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Quick Embed (Script Tag)</h4>
            <button
              onClick={() => copyToClipboard(
                `<script src="${baseUrl}/gpt-widget.js" data-gpt-id="${selectedGPTData.id}" data-position="bottom-right" data-theme="${embedSettings.theme}"></script>`,
                "Embed script tag"
              )}
              className="text-xs text-primary hover:underline"
            >
              Copy
            </button>
          </div>
          <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto font-mono text-muted-foreground">
{`<script src="${baseUrl}/gpt-widget.js"
  data-gpt-id="${selectedGPTData.id}"
  data-position="bottom-right"
  data-theme="${embedSettings.theme}">
</script>`}
          </pre>
          <p className="text-xs text-muted-foreground mt-2">
            Add this single line to any website to embed your GPT as a floating chat widget.
          </p>
        </div>
      )}

      {selectedGPTData && isPublic && (
        <Tabs defaultValue="teams" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="teams">
              Teams
            </TabsTrigger>
            <TabsTrigger value="embed" className="relative">
              Embed Widget
              {isPremiumFeature('embed') && <Crown className="h-3 w-3 ml-1 text-yellow-500" />}
            </TabsTrigger>
            <TabsTrigger value="api" className="relative">
              API Access
              {isPremiumFeature('api') && <Crown className="h-3 w-3 ml-1 text-yellow-500" />}
            </TabsTrigger>
            <TabsTrigger value="share">Share Link</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="teams">
            <TeamsIntegrationConfig
              gptId={selectedGPTData.id}
              gptName={selectedGPTData.name}
              copyToClipboard={copyToClipboard}
            />
          </TabsContent>

          <TabsContent value="embed">
            <EmbedWidgetConfig
              isPremiumFeature={isPremiumFeature}
              embedSettings={embedSettings}
              setEmbedSettings={setEmbedSettings}
              embedCode={embedCode}
              copyToClipboard={copyToClipboard}
            />
          </TabsContent>

          <TabsContent value="api">
            <APIAccessConfig
              isPremiumFeature={isPremiumFeature}
              apiEndpoint={apiEndpoint}
              apiExample={apiExample}
              copyToClipboard={copyToClipboard}
            />
          </TabsContent>

          <TabsContent value="share">
            <ShareLinkConfig
              publicUrl={publicUrl}
              copyToClipboard={copyToClipboard}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <DeploymentAnalytics />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default GPTDeployment;