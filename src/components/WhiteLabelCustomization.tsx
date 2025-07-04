import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWhiteLabelConfig } from "@/hooks/useWhiteLabelConfig";
import { WhiteLabelBranding } from "./whiteLabel/WhiteLabelBranding";
import { WhiteLabelColors } from "./whiteLabel/WhiteLabelColors";
import { WhiteLabelDomain } from "./whiteLabel/WhiteLabelDomain";
import { WhiteLabelAdvanced } from "./whiteLabel/WhiteLabelAdvanced";
import { WhiteLabelPreview } from "./whiteLabel/WhiteLabelPreview";

const WhiteLabelCustomization = () => {
  const { config, setConfig, loading, saveConfig, uploadFile } = useWhiteLabelConfig();
  const [previewMode, setPreviewMode] = useState(false);

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