import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColorPicker } from "@/components/whiteLabel/ColorPicker";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Palette, 
  Eye, 
  Download, 
  Upload, 
  Settings, 
  Monitor,
  Smartphone,
  Code,
  Globe,
  Shield,
  Mail,
  FileText,
  CheckCircle,
  ArrowRight
} from "lucide-react";

interface BrandingConfig {
  companyName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  backgroundType: 'color' | 'gradient' | 'image';
  backgroundValue: string;
  fontFamily: string;
  customDomain: string;
}

const WhiteLabelDemo = () => {
  const [selectedProduct, setSelectedProduct] = useState('safepass');
  const [activeTab, setActiveTab] = useState('branding');
  const [config, setConfig] = useState<BrandingConfig>({
    companyName: 'YourTech Solutions',
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    accentColor: '#3b82f6',
    logoUrl: '',
    backgroundType: 'gradient',
    backgroundValue: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: 'Inter, sans-serif',
    customDomain: 'secure.yourtech.com'
  });

  const products = [
    { 
      id: 'safepass', 
      name: 'SafePass Password Manager', 
      icon: Shield, 
      description: 'White-label password management solution'
    },
    { 
      id: 'safemail', 
      name: 'SafeMail Email Security', 
      icon: Mail, 
      description: 'Email threat detection and analysis'
    },
    { 
      id: 'safedoc', 
      name: 'SafeDoc Document Scanner', 
      icon: FileText, 
      description: 'Document security scanning widget'
    }
  ];

  const updateConfig = (key: keyof BrandingConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const generatePreviewUrl = () => {
    const params = new URLSearchParams({
      product: selectedProduct,
      company: config.companyName,
      primary: config.primaryColor,
      secondary: config.secondaryColor,
      logo: config.logoUrl,
      domain: config.customDomain
    });
    return `/embed-demo?${params.toString()}`;
  };

  const generateEmbedCode = () => {
    return `<!-- ${config.companyName} Security Widget -->
<div id="ultrium-${selectedProduct}-widget"></div>
<script>
  window.UltriumConfig = {
    product: '${selectedProduct}',
    branding: {
      companyName: '${config.companyName}',
      primaryColor: '${config.primaryColor}',
      secondaryColor: '${config.secondaryColor}',
      accentColor: '${config.accentColor}',
      logoUrl: '${config.logoUrl}',
      fontFamily: '${config.fontFamily}',
      customDomain: '${config.customDomain}'
    },
    containerId: 'ultrium-${selectedProduct}-widget'
  };
</script>
<script src="https://cdn.ultrium.ai/widgets/${selectedProduct}/v1.0.0/widget.js"></script>`;
  };

  const selectedProductInfo = products.find(p => p.id === selectedProduct);
  const ProductIcon = selectedProductInfo?.icon || Shield;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Palette className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-bold">White-Label Customization Demo</h2>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          See how easy it is to customize Ultrium's security solutions with your brand and deploy them to your clients
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Product</CardTitle>
              <CardDescription>Choose which Ultrium solution to customize</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {products.map((product) => {
                  const Icon = product.icon;
                  return (
                    <div 
                      key={product.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedProduct === product.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-border/80'
                      }`}
                      onClick={() => setSelectedProduct(product.id)}
                    >
                      <div className="text-center space-y-2">
                        <Icon className="h-8 w-8 mx-auto text-primary" />
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                        {selectedProduct === product.id && (
                          <CheckCircle className="h-5 w-5 mx-auto text-primary" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="domain">Domain</TabsTrigger>
              <TabsTrigger value="embed">Embed Code</TabsTrigger>
            </TabsList>

            <TabsContent value="branding" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Company Branding</CardTitle>
                  <CardDescription>Customize your company information and logo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={config.companyName}
                      onChange={(e) => updateConfig('companyName', e.target.value)}
                      placeholder="Your Company Name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">Logo URL</Label>
                    <Input
                      id="logoUrl"
                      value={config.logoUrl}
                      onChange={(e) => updateConfig('logoUrl', e.target.value)}
                      placeholder="https://your-domain.com/logo.png"
                    />
                    <p className="text-sm text-muted-foreground">
                      Recommended: 200x60px PNG or SVG with transparent background
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fontFamily">Font Family</Label>
                    <Select value={config.fontFamily} onValueChange={(value) => updateConfig('fontFamily', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter, sans-serif">Inter (Modern)</SelectItem>
                        <SelectItem value="Roboto, sans-serif">Roboto (Clean)</SelectItem>
                        <SelectItem value="Open Sans, sans-serif">Open Sans (Friendly)</SelectItem>
                        <SelectItem value="Lato, sans-serif">Lato (Professional)</SelectItem>
                        <SelectItem value="Poppins, sans-serif">Poppins (Rounded)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="colors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Color Scheme</CardTitle>
                  <CardDescription>Match your brand colors perfectly</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Primary Color</Label>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-10 h-10 rounded border"
                          style={{ backgroundColor: config.primaryColor }}
                        />
                        <Input
                          value={config.primaryColor}
                          onChange={(e) => updateConfig('primaryColor', e.target.value)}
                          placeholder="#2563eb"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Secondary Color</Label>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-10 h-10 rounded border"
                          style={{ backgroundColor: config.secondaryColor }}
                        />
                        <Input
                          value={config.secondaryColor}
                          onChange={(e) => updateConfig('secondaryColor', e.target.value)}
                          placeholder="#1e40af"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Accent Color</Label>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-10 h-10 rounded border"
                          style={{ backgroundColor: config.accentColor }}
                        />
                        <Input
                          value={config.accentColor}
                          onChange={(e) => updateConfig('accentColor', e.target.value)}
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Background Style</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={config.backgroundType === 'color' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateConfig('backgroundType', 'color')}
                      >
                        Solid Color
                      </Button>
                      <Button
                        variant={config.backgroundType === 'gradient' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateConfig('backgroundType', 'gradient')}
                      >
                        Gradient
                      </Button>
                      <Button
                        variant={config.backgroundType === 'image' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateConfig('backgroundType', 'image')}
                      >
                        Image
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="domain" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Custom Domain</CardTitle>
                  <CardDescription>Host the widget on your own domain</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customDomain">Custom Domain</Label>
                    <Input
                      id="customDomain"
                      value={config.customDomain}
                      onChange={(e) => updateConfig('customDomain', e.target.value)}
                      placeholder="secure.yourcompany.com"
                    />
                    <p className="text-sm text-muted-foreground">
                      We'll provide SSL certificates and handle all the technical setup
                    </p>
                  </div>

                  <div className="p-4 bg-info/10 border border-info/20 rounded-lg">
                    <h4 className="font-medium text-info-foreground mb-2">Domain Setup Steps:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Add a CNAME record pointing to ultrium-cdn.com</li>
                      <li>We'll automatically provision SSL certificates</li>
                      <li>Your widget will be available at your custom domain</li>
                      <li>Complete white-label experience for your clients</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="embed" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Embed Code</CardTitle>
                  <CardDescription>Copy this code to integrate the widget into any website</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>HTML Embed Code</Label>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                        <code>{generateEmbedCode()}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2"
                        onClick={() => navigator.clipboard.writeText(generateEmbedCode())}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Widget Size</Label>
                      <Select defaultValue="standard">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="compact">Compact (300x200px)</SelectItem>
                          <SelectItem value="standard">Standard (400x300px)</SelectItem>
                          <SelectItem value="large">Large (500x400px)</SelectItem>
                          <SelectItem value="fullwidth">Full Width (responsive)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Integration Method</Label>
                      <Select defaultValue="script">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="script">JavaScript Widget</SelectItem>
                          <SelectItem value="iframe">iFrame Embed</SelectItem>
                          <SelectItem value="api">REST API</SelectItem>
                          <SelectItem value="webhook">Webhook Integration</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Preview
              </CardTitle>
              <CardDescription>See how your branded widget will look</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Desktop Preview */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  <Label className="text-sm">Desktop View</Label>
                </div>
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div 
                    className="rounded-lg p-6 text-white min-h-[200px] flex flex-col justify-center"
                    style={{ 
                      background: config.backgroundValue,
                      fontFamily: config.fontFamily 
                    }}
                  >
                    <div className="text-center space-y-4">
                      {config.logoUrl && (
                        <img 
                          src={config.logoUrl} 
                          alt={config.companyName}
                          className="h-8 mx-auto"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                      <div>
                        <h3 className="text-xl font-bold" style={{ color: 'white' }}>
                          {config.companyName}
                        </h3>
                        <p className="text-sm opacity-90">
                          {selectedProductInfo?.name}
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <ProductIcon className="h-5 w-5" />
                        <Button 
                          size="sm" 
                          style={{ 
                            backgroundColor: config.accentColor,
                            color: 'white',
                            border: 'none'
                          }}
                        >
                          Start Scan
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Preview */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <Label className="text-sm">Mobile View</Label>
                </div>
                <div className="border rounded-lg p-2 bg-muted/30 max-w-[200px] mx-auto">
                  <div 
                    className="rounded p-4 text-white min-h-[150px] flex flex-col justify-center text-xs"
                    style={{ 
                      background: config.backgroundValue,
                      fontFamily: config.fontFamily 
                    }}
                  >
                    <div className="text-center space-y-2">
                      <h4 className="font-bold">{config.companyName}</h4>
                      <ProductIcon className="h-6 w-6 mx-auto" />
                      <Button 
                        size="sm" 
                        className="text-xs h-6"
                        style={{ 
                          backgroundColor: config.accentColor,
                          color: 'white',
                          border: 'none'
                        }}
                      >
                        Scan
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deployment Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Globe className="h-4 w-4 mr-2" />
                Launch Full Preview
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Resources
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Code className="h-4 w-4 mr-2" />
                API Documentation
              </Button>
              <Button className="w-full" variant="default">
                <ArrowRight className="h-4 w-4 mr-2" />
                Deploy to Production
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>MSP Benefits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Complete brand control</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>No Ultrium branding visible</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Custom domain hosting</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Easy client deployment</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Recurring revenue model</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WhiteLabelDemo;