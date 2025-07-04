import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCustomGPTs } from "@/hooks/useCustomGPTs";
import { Share2, Code, Link, Eye, Copy, Download, ExternalLink, Settings, Globe, Lock, Users } from "lucide-react";

interface DeploymentConfig {
  gpt_id: string;
  share_link_enabled: boolean;
  embed_enabled: boolean;
  public_access: boolean;
  custom_domain?: string;
  embed_settings: {
    width: string;
    height: string;
    theme: 'light' | 'dark' | 'auto';
    show_branding: boolean;
    custom_css?: string;
  };
  access_settings: {
    require_auth: boolean;
    allowed_domains: string[];
    rate_limit: number;
  };
}

export const GPTDeploymentCenter = () => {
  const [selectedGPT, setSelectedGPT] = useState<string>("");
  const [config, setConfig] = useState<DeploymentConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [embedCode, setEmbedCode] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { gpts } = useCustomGPTs();

  useEffect(() => {
    if (selectedGPT) {
      loadDeploymentConfig();
    }
  }, [selectedGPT]);

  const loadDeploymentConfig = async () => {
    if (!selectedGPT) return;
    
    setIsLoading(true);
    try {
      const { data: gpt, error } = await supabase
        .from('custom_gpts')
        .select('*')
        .eq('id', selectedGPT)
        .single();

      if (error) throw error;

      const deploymentConfig: DeploymentConfig = {
        gpt_id: selectedGPT,
        share_link_enabled: gpt.sharing_level !== 'private',
        embed_enabled: gpt.embed_enabled,
        public_access: gpt.sharing_level === 'public',
        embed_settings: {
          width: '400px',
          height: '600px',
          theme: 'auto',
          show_branding: !gpt.remove_branding,
          custom_css: (gpt.integration_settings as any)?.custom_css || ''
        },
        access_settings: {
          require_auth: gpt.sharing_level === 'private',
          allowed_domains: gpt.whitelisted_domains ? gpt.whitelisted_domains.split(',') : [],
          rate_limit: 100
        }
      };

      setConfig(deploymentConfig);
      generateUrls(deploymentConfig);
    } catch (error) {
      console.error('Error loading deployment config:', error);
      toast({
        title: "Error",
        description: "Failed to load deployment configuration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateUrls = (deploymentConfig: DeploymentConfig) => {
    const baseUrl = window.location.origin;
    const gptSlug = gpts.find(g => g.id === selectedGPT)?.name.toLowerCase().replace(/\s+/g, '-') || selectedGPT;
    
    // Share URL
    const shareUrl = `${baseUrl}/gpt/${gptSlug}`;
    setShareUrl(shareUrl);
    
    // Embed code
    const embedCode = `<iframe
  src="${shareUrl}?embed=true"
  width="${deploymentConfig.embed_settings.width}"
  height="${deploymentConfig.embed_settings.height}"
  frameborder="0"
  style="border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"
  ${!deploymentConfig.embed_settings.show_branding ? 'data-hide-branding="true"' : ''}
></iframe>`;
    setEmbedCode(embedCode);
  };

  const saveDeploymentConfig = async () => {
    if (!config || !selectedGPT) return;
    
    setIsSaving(true);
    try {
      const updates = {
        sharing_level: config.public_access ? 'public' : (config.share_link_enabled ? 'link' : 'private'),
        embed_enabled: config.embed_enabled,
        remove_branding: !config.embed_settings.show_branding,
        whitelisted_domains: config.access_settings.allowed_domains.join(','),
        integration_settings: {
          ...config.embed_settings,
          rate_limit: config.access_settings.rate_limit
        }
      };

      const { error } = await supabase
        .from('custom_gpts')
        .update(updates)
        .eq('id', selectedGPT)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Deployment settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving deployment config:', error);
      toast({
        title: "Error",
        description: "Failed to save deployment settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${type} copied to clipboard`,
    });
  };

  const openPreview = () => {
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  const downloadEmbedFiles = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GPT Integration Example</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .gpt-container {
            margin: 20px 0;
        }
        ${config?.embed_settings.custom_css || ''}
    </style>
</head>
<body>
    <div class="container">
        <h1>My GPT Integration</h1>
        <p>This is an example of how to embed your GPT into any website.</p>
        
        <div class="gpt-container">
            ${embedCode}
        </div>
        
        <p>You can customize the styling and placement as needed.</p>
    </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gpt-embed-example.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: "Embed example file downloaded",
    });
  };

  if (!gpts.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Share2 className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No GPTs Available</h3>
          <p className="text-muted-foreground text-center mb-4">
            Create a GPT first before setting up deployment options.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">GPT Deployment Center</h2>
          <p className="text-muted-foreground">
            Configure sharing, embedding, and deployment options for your GPTs.
          </p>
        </div>
      </div>

      {/* GPT Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select GPT to Deploy</CardTitle>
          <CardDescription>
            Choose which GPT you want to configure for deployment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedGPT} onValueChange={setSelectedGPT}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a GPT" />
            </SelectTrigger>
            <SelectContent>
              {gpts.map((gpt) => (
                <SelectItem key={gpt.id} value={gpt.id}>
                  <div className="flex items-center space-x-2">
                    {gpt.logo_url ? (
                      <img src={gpt.logo_url} alt={gpt.name} className="w-4 h-4 rounded" />
                    ) : (
                      <div 
                        className="w-4 h-4 rounded flex items-center justify-center text-white text-xs"
                        style={{ backgroundColor: gpt.theme_color || '#3b82f6' }}
                      >
                        {gpt.name.charAt(0)}
                      </div>
                    )}
                    <span>{gpt.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedGPT && config && (
        <Tabs defaultValue="sharing" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sharing">Sharing</TabsTrigger>
            <TabsTrigger value="embed">Embed</TabsTrigger>
            <TabsTrigger value="access">Access Control</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Sharing Settings */}
          <TabsContent value="sharing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Link className="w-5 h-5" />
                  <span>Share Link Settings</span>
                </CardTitle>
                <CardDescription>
                  Configure how your GPT can be shared and accessed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Public Access</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow anyone to access your GPT without authentication
                    </p>
                  </div>
                  <Switch
                    checked={config.public_access}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, public_access: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Share Link</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable sharing via direct link
                    </p>
                  </div>
                  <Switch
                    checked={config.share_link_enabled}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, share_link_enabled: checked })
                    }
                  />
                </div>

                {config.share_link_enabled && (
                  <div className="space-y-2">
                    <Label>Share URL</Label>
                    <div className="flex space-x-2">
                      <Input value={shareUrl} readOnly className="flex-1" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(shareUrl, "Share URL")}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={openPreview}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-green-500" />
                  <Badge variant={config.public_access ? "default" : "secondary"}>
                    {config.public_access ? "Public" : config.share_link_enabled ? "Link Only" : "Private"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Embed Settings */}
          <TabsContent value="embed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Code className="w-5 h-5" />
                  <span>Embed Widget</span>
                </CardTitle>
                <CardDescription>
                  Embed your GPT as a widget on any website.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Enable Embedding</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow your GPT to be embedded in other websites
                    </p>
                  </div>
                  <Switch
                    checked={config.embed_enabled}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, embed_enabled: checked })
                    }
                  />
                </div>

                {config.embed_enabled && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="width">Width</Label>
                        <Input
                          id="width"
                          value={config.embed_settings.width}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              embed_settings: {
                                ...config.embed_settings,
                                width: e.target.value
                              }
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="height">Height</Label>
                        <Input
                          id="height"
                          value={config.embed_settings.height}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              embed_settings: {
                                ...config.embed_settings,
                                height: e.target.value
                              }
                            })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="theme">Theme</Label>
                      <Select
                        value={config.embed_settings.theme}
                        onValueChange={(value: 'light' | 'dark' | 'auto') =>
                          setConfig({
                            ...config,
                            embed_settings: {
                              ...config.embed_settings,
                              theme: value
                            }
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="auto">Auto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Show Branding</Label>
                        <p className="text-sm text-muted-foreground">
                          Display "Powered by UltriumGPT" in the widget
                        </p>
                      </div>
                      <Switch
                        checked={config.embed_settings.show_branding}
                        onCheckedChange={(checked) =>
                          setConfig({
                            ...config,
                            embed_settings: {
                              ...config.embed_settings,
                              show_branding: checked
                            }
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="customCss">Custom CSS (Optional)</Label>
                      <Textarea
                        id="customCss"
                        value={config.embed_settings.custom_css}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            embed_settings: {
                              ...config.embed_settings,
                              custom_css: e.target.value
                            }
                          })
                        }
                        placeholder="/* Custom CSS for the embed widget */"
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Embed Code</Label>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(embedCode, "Embed code")}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={downloadEmbedFiles}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Example
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        value={embedCode}
                        readOnly
                        rows={6}
                        className="font-mono text-sm"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Access Control */}
          <TabsContent value="access" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="w-5 h-5" />
                  <span>Access Control</span>
                </CardTitle>
                <CardDescription>
                  Control who can access your GPT and how.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Require Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Users must be logged in to access the GPT
                    </p>
                  </div>
                  <Switch
                    checked={config.access_settings.require_auth}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        access_settings: {
                          ...config.access_settings,
                          require_auth: checked
                        }
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="allowedDomains">Allowed Domains</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Comma-separated list of domains that can embed this GPT
                  </p>
                  <Input
                    id="allowedDomains"
                    value={config.access_settings.allowed_domains.join(', ')}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        access_settings: {
                          ...config.access_settings,
                          allowed_domains: e.target.value.split(',').map(d => d.trim()).filter(Boolean)
                        }
                      })
                    }
                    placeholder="example.com, subdomain.example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="rateLimit">Rate Limit (requests per hour)</Label>
                  <Input
                    id="rateLimit"
                    type="number"
                    value={config.access_settings.rate_limit}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        access_settings: {
                          ...config.access_settings,
                          rate_limit: parseInt(e.target.value)
                        }
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="w-5 h-5" />
                  <span>Deployment Analytics</span>
                </CardTitle>
                <CardDescription>
                  Monitor usage and performance of your deployed GPT.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">0</div>
                    <div className="text-sm text-muted-foreground">Total Views</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">0</div>
                    <div className="text-sm text-muted-foreground">Conversations</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">0</div>
                    <div className="text-sm text-muted-foreground">Embeds Active</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Analytics data will appear here once your GPT is deployed and receiving traffic.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Save Button */}
      {selectedGPT && config && (
        <div className="flex justify-end">
          <Button onClick={saveDeploymentConfig} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Deployment Settings"}
          </Button>
        </div>
      )}
    </div>
  );
};