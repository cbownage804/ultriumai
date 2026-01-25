import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useWhiteLabelConfig } from "@/hooks/useWhiteLabelConfig";
import { useSafeSuiteSubscription } from "@/hooks/useSafeSuite";
import { WhiteLabelBranding } from "./whiteLabel/WhiteLabelBranding";
import { WhiteLabelColors } from "./whiteLabel/WhiteLabelColors";
import { WhiteLabelDomain } from "./whiteLabel/WhiteLabelDomain";
import { WhiteLabelAdvanced } from "./whiteLabel/WhiteLabelAdvanced";
import { WhiteLabelPreview } from "./whiteLabel/WhiteLabelPreview";
import { TeaserLock } from "@/components/safesuite/TeaserLock";
import { Lock, Crown, Palette, Globe, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Teaser showing whitelabeling features
function WhiteLabelTeaser() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold">White-label Customization</h2>
        <p className="text-muted-foreground">Customize branding for your deployment</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Palette className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Custom Branding</p>
                <p className="text-sm text-muted-foreground">Your logo & colors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Custom Domain</p>
                <p className="text-sm text-muted-foreground">Your own URL</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Full Control</p>
                <p className="text-sm text-muted-foreground">Complete customization</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const WhiteLabelCustomization = () => {
  const { config, setConfig, loading, saveConfig, uploadFile } = useWhiteLabelConfig();
  const { isBusiness, tier, loading: subLoading } = useSafeSuiteSubscription();
  const navigate = useNavigate();
  const [previewMode, setPreviewMode] = useState(false);

  // Gate: Only Business tier can access whitelabeling
  if (!subLoading && !isBusiness) {
    return (
      <TeaserLock 
        feature="whitelabeling" 
        message="Custom branding with your logo, colors, and domain"
        teaserContent={<WhiteLabelTeaser />}
      >
        <div />
      </TeaserLock>
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
