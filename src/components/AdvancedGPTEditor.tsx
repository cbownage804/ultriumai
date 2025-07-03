import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { 
  Upload, 
  Palette, 
  FileText, 
  Code2, 
  Globe, 
  Key,
  Copy,
  ExternalLink,
  Trash2,
  Crown
} from "lucide-react";

interface AdvancedGPTEditorProps {
  gpt: any;
  onUpdate: (gpt: any) => void;
  onClose: () => void;
}

const AdvancedGPTEditor = ({ gpt, onUpdate, onClose }: AdvancedGPTEditorProps) => {
  const [editedGPT, setEditedGPT] = useState(gpt);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { subscription } = useSubscription();

  const isAdvancedFeatureAvailable = (feature: string) => {
    switch (feature) {
      case "branding":
        return subscription.subscription_tier !== "free";
      case "documents":
        return subscription.subscription_tier !== "free";
      case "embedding":
        return subscription.subscription_tier !== "free"; // Now available to Premium
      case "api":
        return subscription.subscription_tier !== "free"; // Now available to Premium
      default:
        return false;
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!isAdvancedFeatureAvailable("branding")) {
      toast({
        title: "Premium Feature",
        description: "Logo upload is available for Premium and Enterprise plans.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${gpt.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('gpt-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('gpt-logos')
        .getPublicUrl(fileName);

      setEditedGPT(prev => ({ ...prev, logo_url: data.publicUrl }));
      
      toast({
        title: "Logo uploaded",
        description: "Your GPT logo has been updated successfully.",
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!isAdvancedFeatureAvailable("documents")) {
      toast({
        title: "Premium Feature",
        description: "Document upload is available for Premium and Enterprise plans.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `${user.id}/${gpt.id}/${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('gpt-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Store document metadata
      const { error: dbError } = await supabase
        .from('gpt_documents')
        .insert({
          gpt_id: gpt.id,
          user_id: user.id,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          mime_type: file.type
        });

      if (dbError) throw dbError;

      toast({
        title: "Document uploaded",
        description: `${file.name} has been added to your GPT's knowledge base.`,
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const generateAPIKey = () => {
    const apiKey = `gpt_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    setEditedGPT(prev => ({ ...prev, api_key: apiKey }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard.",
    });
  };

  const getEmbedCode = () => {
    const embedUrl = `${window.location.origin}/embed/${gpt.id}`;
    return `<iframe src="${embedUrl}" width="400" height="600" frameborder="0"></iframe>`;
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('custom_gpts')
        .update({
          name: editedGPT.name,
          description: editedGPT.description,
          system_prompt: editedGPT.system_prompt,
          theme_color: editedGPT.theme_color,
          logo_url: editedGPT.logo_url,
          embed_enabled: editedGPT.embed_enabled,
          api_enabled: editedGPT.api_enabled,
          api_key: editedGPT.api_key
        })
        .eq('id', gpt.id);

      if (error) throw error;

      onUpdate(editedGPT);
      toast({
        title: "GPT updated",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      console.error('Error updating GPT:', error);
      toast({
        title: "Save failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Edit {gpt.name}</h2>
          <p className="text-muted-foreground">Customize your AI assistant</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
          <TabsTrigger value="embedding">Embedding</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">GPT Name</Label>
                <Input
                  id="name"
                  value={editedGPT.name}
                  onChange={(e) => setEditedGPT(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={editedGPT.description || ""}
                  onChange={(e) => setEditedGPT(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="prompt">System Prompt</Label>
                <Textarea
                  id="prompt"
                  value={editedGPT.system_prompt}
                  onChange={(e) => setEditedGPT(prev => ({ ...prev, system_prompt: e.target.value }))}
                  className="min-h-32"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Branding & Appearance
                {!isAdvancedFeatureAvailable("branding") && (
                  <Badge variant="secondary">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme-color">Theme Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="theme-color"
                    type="color"
                    value={editedGPT.theme_color || "#3b82f6"}
                    onChange={(e) => setEditedGPT(prev => ({ ...prev, theme_color: e.target.value }))}
                    className="w-20"
                    disabled={!isAdvancedFeatureAvailable("branding")}
                  />
                  <Input
                    value={editedGPT.theme_color || "#3b82f6"}
                    onChange={(e) => setEditedGPT(prev => ({ ...prev, theme_color: e.target.value }))}
                    disabled={!isAdvancedFeatureAvailable("branding")}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  {editedGPT.logo_url && (
                    <img src={editedGPT.logo_url} alt="Logo" className="w-16 h-16 rounded object-cover" />
                  )}
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    disabled={!isAdvancedFeatureAvailable("branding") || isUploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? "Uploading..." : "Upload Logo"}
                  </Button>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Knowledge Base
                {!isAdvancedFeatureAvailable("documents") && (
                  <Badge variant="secondary">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline"
                onClick={() => document.getElementById('doc-upload')?.click()}
                disabled={!isAdvancedFeatureAvailable("documents") || isUploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? "Uploading..." : "Upload Documents"}
              </Button>
              <input
                id="doc-upload"
                type="file"
                accept=".pdf,.txt,.docx,.md"
                onChange={handleDocumentUpload}
                className="hidden"
              />
              
              <div className="text-sm text-muted-foreground">
                Upload documents to enhance your GPT's knowledge. Supported formats: PDF, TXT, DOCX, MD
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="embedding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Website Embedding
                {!isAdvancedFeatureAvailable("embedding") && (
                  <Badge variant="secondary">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editedGPT.embed_enabled || false}
                  onCheckedChange={(checked) => setEditedGPT(prev => ({ ...prev, embed_enabled: checked }))}
                  disabled={!isAdvancedFeatureAvailable("embedding")}
                />
                <Label>Enable website embedding</Label>
              </div>
              
              {editedGPT.embed_enabled && (
                <div className="space-y-2">
                  <Label>Embed Code</Label>
                  <div className="relative">
                    <Textarea
                      value={getEmbedCode()}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(getEmbedCode())}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="w-5 h-5" />
                API Access
                {!isAdvancedFeatureAvailable("api") && (
                  <Badge variant="secondary">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editedGPT.api_enabled || false}
                  onCheckedChange={(checked) => setEditedGPT(prev => ({ ...prev, api_enabled: checked }))}
                  disabled={!isAdvancedFeatureAvailable("api")}
                />
                <Label>Enable API access</Label>
              </div>
              
              {editedGPT.api_enabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        value={editedGPT.api_key || ""}
                        readOnly
                        className="font-mono"
                      />
                      <Button variant="outline" onClick={generateAPIKey}>
                        <Key className="w-4 h-4 mr-2" />
                        Generate
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => copyToClipboard(editedGPT.api_key || "")}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>API Endpoint</Label>
                    <div className="flex gap-2">
                      <Input
                        value={`${window.location.origin}/api/gpt/${gpt.id}/chat`}
                        readOnly
                        className="font-mono"
                      />
                      <Button 
                        variant="outline"
                        onClick={() => copyToClipboard(`${window.location.origin}/api/gpt/${gpt.id}/chat`)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedGPTEditor;