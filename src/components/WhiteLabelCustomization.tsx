import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useWhiteLabelConfig } from "@/hooks/useWhiteLabelConfig";
import { useSafeSuiteSubscription } from "@/hooks/useSafeSuite";
import { WhiteLabelBranding } from "./whiteLabel/WhiteLabelBranding";
import { WhiteLabelColors } from "./whiteLabel/WhiteLabelColors";
import { WhiteLabelDomain } from "./whiteLabel/WhiteLabelDomain";
import { WhiteLabelAdvanced } from "./whiteLabel/WhiteLabelAdvanced";
import { WhiteLabelPreview } from "./whiteLabel/WhiteLabelPreview";
import { Lock, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const WhiteLabelCustomization = () => {
  const { config, setConfig, loading, saveConfig, uploadFile } = useWhiteLabelConfig();
  const { isBusiness, tier, loading: subLoading } = useSafeSuiteSubscription();
  const navigate = useNavigate();
  const [previewMode, setPreviewMode] = useState(false);

  // Gate: Only Business tier can access whitelabeling
  if (!subLoading && !isBusiness) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 bg-amber-100 rounded-full mb-4">
          <Lock className="h-10 w-10 text-amber-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Whitelabeling is a Business Feature</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          Custom branding with your logo, colors, and domain is only available on the Business plan.
          {tier === 'free' && " Upgrade to unlock this and other premium features."}
          {tier === 'pro' && " Upgrade from Pro to Business to unlock whitelabeling."}
        </p>
        <Button onClick={() => navigate('/safesuite/billing')} className="gap-2">
          <Crown className="h-4 w-4" />
          Upgrade to Business
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">White-label Customization</h2>
          <p className="text-muted-foreground">Customize the branding and appearance of your UltriumGPT deployment.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={previewMode}
            onCheckedChange={setPreviewMode}
          />
          <Label>Preview Mode</Label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="branding" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="domain">Domain</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="branding" className="space-y-4">
              <WhiteLabelBranding 
                config={config} 
                setConfig={setConfig} 
                uploadFile={uploadFile} 
              />
            </TabsContent>

            <TabsContent value="colors" className="space-y-4">
              <WhiteLabelColors 
                config={config} 
                setConfig={setConfig} 
              />
            </TabsContent>

            <TabsContent value="domain" className="space-y-4">
              <WhiteLabelDomain 
                config={config} 
                setConfig={setConfig} 
              />
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <WhiteLabelAdvanced 
                config={config} 
                setConfig={setConfig} 
              />
            </TabsContent>
          </Tabs>
        </div>

        <WhiteLabelPreview 
          config={config} 
          loading={loading} 
          onSave={saveConfig} 
        />
      </div>
    </div>
  );
};

export default WhiteLabelCustomization;
