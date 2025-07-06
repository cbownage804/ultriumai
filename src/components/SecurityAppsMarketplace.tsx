import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Shield, Zap, Users, Lock, ExternalLink, Settings, Crown, Check, X, Star } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SecurityApp {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  icon: any;
  price: number;
  features: string[];
  capabilities: string[];
  integrations: string[];
  threatTypes: string[];
  subscription_required: boolean;
  enterprise_included: boolean;
  enabled: boolean;
  usage_limit: number;
  usage_current: number;
}

const SecurityAppsMarketplace = () => {
  const { subscription } = useSubscription();
  const { toast } = useToast();
  const [selectedApp, setSelectedApp] = useState<SecurityApp | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const securityApps: SecurityApp[] = [
    {
      id: 'safepass',
      name: 'Ultrium SafePass™',
      description: 'Enterprise password management with security monitoring',
      longDescription: 'Comprehensive password management solution with team collaboration, security monitoring, password generation, and audit logging. Includes advanced features like password strength analysis, breach monitoring, and white-label deployment options.',
      icon: Shield,
      price: 20,
      features: [
        'Secure password vaults',
        'Team collaboration',
        'Password strength analysis',
        'Secure password generator',
        'Audit logging',
        'Breach monitoring'
      ],
      capabilities: [
        'Unlimited password storage',
        'Team sharing & permissions',
        'Advanced security scoring',
        'Real-time breach alerts',
        'Custom branding',
        'API access included'
      ],
      integrations: ['Custom GPTs', 'Team Management', 'Security Dashboard', 'API'],
      threatTypes: ['Weak Passwords', 'Data Breaches', 'Credential Theft', 'Account Takeover'],
      subscription_required: true,
      enterprise_included: true,
      enabled: false,
      usage_limit: -1,
      usage_current: 0
    },
    {
      id: 'safelink',
      name: 'Ultrium SafeLink™',
      description: 'Advanced AI-powered link security scanning and threat detection',
      longDescription: 'Comprehensive link analysis using multiple threat intelligence sources, machine learning models, and behavioral analysis to detect malicious URLs, phishing attempts, and advanced persistent threats.',
      icon: Shield,
      price: 20,
      features: [
        'Real-time URL scanning',
        'Threat intelligence integration',
        'Phishing detection AI',
        'Malware analysis',
        'Reputation scoring',
        'Custom blocklists'
      ],
      capabilities: [
        'Scan 10,000 URLs/month',
        '99.9% threat detection accuracy',
        'Sub-second response time',
        'API access included',
        'Custom rule engine',
        'Embeddable widgets'
      ],
      integrations: ['Custom GPTs', 'Email Systems', 'Web Browsers', 'Slack', 'Teams', 'API'],
      threatTypes: ['Phishing', 'Malware', 'Ransomware', 'APTs', 'Scams', 'Spam'],
      subscription_required: true,
      enterprise_included: true,
      enabled: false,
      usage_limit: 10000,
      usage_current: 0
    },
    {
      id: 'safeemail',
      name: 'Ultrium SafeEmail™',
      description: 'AI-driven email security analysis and reputation checking',
      longDescription: 'Advanced email header analysis, sender reputation verification, and content analysis using natural language processing to detect sophisticated email threats and business email compromise attacks.',
      icon: Shield,
      price: 20,
      features: [
        'Email header analysis',
        'Sender reputation check',
        'Content analysis AI',
        'Attachment scanning',
        'SPF/DKIM/DMARC validation',
        'BEC detection'
      ],
      capabilities: [
        'Scan 5,000 emails/month',
        '99.7% spam detection rate',
        'Advanced BEC protection',
        'Multi-language support',
        'Custom policies',
        'Embeddable widgets'
      ],
      integrations: ['Custom GPTs', 'Office 365', 'Google Workspace', 'Exchange', 'API'],
      threatTypes: ['Spam', 'Phishing', 'BEC', 'Malware', 'Spoofing', 'Social Engineering'],
      subscription_required: true,
      enterprise_included: true,
      enabled: false,
      usage_limit: 5000,
      usage_current: 0
    },
    {
      id: 'safedoc',
      name: 'Ultrium SafeDoc™',
      description: 'Intelligent file analysis and malware detection system',
      longDescription: 'Deep file analysis using machine learning, behavioral analysis, and signature detection to identify malware, trojans, and advanced file-based threats across multiple file formats.',
      icon: Shield,
      price: 20,
      features: [
        'Multi-format file scanning',
        'Behavioral analysis',
        'Hash-based detection',
        'Sandbox execution',
        'Metadata extraction',
        'Zero-day protection'
      ],
      capabilities: [
        'Scan 1,000 files/month',
        '99.8% malware detection',
        'Support 100+ file types',
        'Quarantine system',
        'Detailed forensics',
        'Embeddable widgets'
      ],
      integrations: ['Custom GPTs', 'File Servers', 'Cloud Storage', 'Email Gateways', 'API'],
      threatTypes: ['Malware', 'Trojans', 'Ransomware', 'Viruses', 'Rootkits', 'Zero-day'],
      subscription_required: true,
      enterprise_included: true,
      enabled: false,
      usage_limit: 1000,
      usage_current: 0
    },
    {
      id: 'darkweb',
      name: 'Ultrium DarkWeb Scanner™',
      description: 'Advanced dark web monitoring and breach detection system',
      longDescription: 'Comprehensive dark web monitoring using AI-powered crawling, breach database analysis, and threat intelligence to detect compromised credentials, data leaks, and emerging threats targeting your organization.',
      icon: Shield,
      price: 20,
      features: [
        'Dark web monitoring',
        'Breach database scanning',
        'Credential compromise detection',
        'Personal info monitoring',
        'Real-time alerts',
        'Historical breach analysis'
      ],
      capabilities: [
        'Monitor 500 entities/month',
        '99.5% breach detection rate',
        '847 dark web sources',
        'Real-time notifications',
        'Executive reporting',
        'Embeddable widgets'
      ],
      integrations: ['Custom GPTs', 'SIEM Systems', 'Security Dashboards', 'Email Alerts', 'API'],
      threatTypes: ['Data Breaches', 'Credential Theft', 'Identity Theft', 'Corporate Espionage', 'Financial Fraud', 'Personal Data Leaks'],
      subscription_required: true,
      enterprise_included: true,
      enabled: false,
      usage_limit: 500,
      usage_current: 0
    }
  ];

  const handleSubscribe = async (app: SecurityApp) => {
    if (subscription.subscription_tier === 'enterprise') {
      toast({
        title: "Already Included",
        description: `${app.name} is included in your Enterprise plan!`,
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-security-app-subscription', {
        body: {
          app_id: app.id,
          app_name: app.name,
          price: app.price
        }
      });

      if (error) throw error;

      // Redirect to Stripe checkout
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      toast({
        title: "Subscription Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleApp = async (appId: string, enabled: boolean) => {
    try {
      // Here you would typically update the app status in your database
      toast({
        title: enabled ? "App Enabled" : "App Disabled",
        description: `Security app has been ${enabled ? 'enabled' : 'disabled'} for your Custom GPTs.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update app status.",
        variant: "destructive"
      });
    }
  };

  const isSubscribed = (app: SecurityApp) => {
    if (subscription.subscription_tier === 'enterprise') return true;
    // Here you would check if user has subscribed to this specific app
    return false;
  };

  const canUseApp = (app: SecurityApp) => {
    return isSubscribed(app) || subscription.subscription_tier === 'enterprise';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Security Apps Marketplace</h1>
          <p className="text-muted-foreground mt-2">
            Premium AI-powered security tools for your Custom GPTs
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="secondary" className="text-xs">
              <Crown className="h-3 w-3 mr-1" />
              Enterprise: All apps included
            </Badge>
            <Badge variant="outline" className="text-xs">
              Standard: $20/month | White Label: $35/month
            </Badge>
          </div>
        </div>
      </div>

      {/* Current Subscription Status */}
      <Card className="border-2 border-dashed">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Current Plan: {subscription.subscription_tier || 'Free'}</h3>
              <p className="text-sm text-muted-foreground">
                {subscription.subscription_tier === 'enterprise' 
                  ? 'All security apps included ✨' 
                  : 'Subscribe to individual apps or upgrade to Enterprise'}
              </p>
            </div>
            {subscription.subscription_tier !== 'enterprise' && (
              <Button variant="outline">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Enterprise
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Apps Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {securityApps.map((app) => {
          const Icon = app.icon;
          const subscribed = isSubscribed(app);
          const usagePercent = (app.usage_current / app.usage_limit) * 100;

          return (
            <Card key={app.id} className={`relative ${subscribed ? 'border-green-200 bg-green-50/50' : ''}`}>
              {subscribed && (
                <div className="absolute -top-2 -right-2">
                  <Badge className="bg-green-500 text-white">
                    <Check className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
              )}
              
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-100">
                      <Icon className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{app.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {subscription.subscription_tier === 'enterprise' ? (
                          <Badge variant="secondary" className="text-xs">
                            <Crown className="h-3 w-3 mr-1" />
                            Included
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            ${app.price}/month
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <CardDescription className="text-sm">
                  {app.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Usage Meter */}
                {subscribed && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Usage this month</span>
                      <span>{app.usage_current.toLocaleString()} / {app.usage_limit.toLocaleString()}</span>
                    </div>
                    <Progress value={usagePercent} className="h-2" />
                  </div>
                )}

                {/* Key Features */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Key Features:</h4>
                  <div className="grid grid-cols-1 gap-1">
                    {app.features.slice(0, 3).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <Check className="h-3 w-3 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Threat Types */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Detects:</h4>
                  <div className="flex flex-wrap gap-1">
                    {app.threatTypes.slice(0, 3).map((threat, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {threat}
                      </Badge>
                    ))}
                    {app.threatTypes.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{app.threatTypes.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-2">
                  {subscribed ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Enable for GPTs</span>
                        <Switch
                          checked={app.enabled}
                          onCheckedChange={(checked) => handleToggleApp(app.id, checked)}
                        />
                      </div>
                      <Button variant="outline" className="w-full" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button 
                        className="w-full" 
                        onClick={() => handleSubscribe(app)}
                        disabled={isLoading}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        {subscription.subscription_tier === 'enterprise' ? 'Activate' : 'Subscribe'} 
                        {subscription.subscription_tier !== 'enterprise' && ` - $${app.price}/mo`}
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          Embed Widget
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          White Label - $35/mo
                        </Button>
                      </div>
                    </div>
                  )}

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Learn More
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                          <Icon className="h-6 w-6 text-red-600" />
                          {app.name}
                        </DialogTitle>
                        <DialogDescription>
                          {app.longDescription}
                        </DialogDescription>
                      </DialogHeader>

                      <Tabs defaultValue="features" className="mt-6">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="features">Features</TabsTrigger>
                          <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
                          <TabsTrigger value="integrations">Integrations</TabsTrigger>
                          <TabsTrigger value="pricing">Pricing</TabsTrigger>
                        </TabsList>

                        <TabsContent value="features" className="space-y-4">
                          <div className="grid gap-3">
                            {app.features.map((feature, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                                <Check className="h-4 w-4 text-green-500" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="capabilities" className="space-y-4">
                          <div className="grid gap-3">
                            {app.capabilities.map((capability, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span>{capability}</span>
                              </div>
                            ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="integrations" className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            {app.integrations.map((integration, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                                <ExternalLink className="h-4 w-4 text-blue-500" />
                                <span>{integration}</span>
                              </div>
                            ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="pricing" className="space-y-4">
                          <div className="space-y-4">
                            <Card>
                              <CardContent className="p-6">
                                <div className="text-center space-y-4">
                                  <div>
                                    <div className="text-3xl font-bold">${app.price}</div>
                                    <div className="text-muted-foreground">per month</div>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-center gap-2">
                                      <Check className="h-4 w-4 text-green-500" />
                                      <span>Full API access</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                      <Check className="h-4 w-4 text-green-500" />
                                      <span>Custom GPT integration</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                      <Check className="h-4 w-4 text-green-500" />
                                      <span>Embeddable widgets</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                      <Check className="h-4 w-4 text-green-500" />
                                      <span>24/7 support</span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            <Card className="border-blue-200 bg-blue-50">
                              <CardContent className="p-6">
                                <div className="text-center space-y-4">
                                  <div>
                                    <div className="text-2xl font-bold">$35</div>
                                    <div className="text-muted-foreground">White Label Version</div>
                                  </div>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-center gap-2">
                                      <Check className="h-4 w-4 text-green-500" />
                                      <span>All standard features</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                      <Check className="h-4 w-4 text-green-500" />
                                      <span>Remove Ultrium branding</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                      <Check className="h-4 w-4 text-green-500" />
                                      <span>Custom company branding</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                      <Check className="h-4 w-4 text-green-500" />
                                      <span>Reseller capabilities</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                      <Check className="h-4 w-4 text-green-500" />
                                      <span>Internal deployment rights</span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            
                            <Card className="border-yellow-200 bg-yellow-50">
                              <CardContent className="p-6">
                                <div className="text-center space-y-2">
                                  <div className="flex items-center justify-center gap-2">
                                    <Crown className="h-5 w-5 text-yellow-600" />
                                    <span className="font-semibold">Enterprise Plan</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    All security apps + white label included at no additional cost
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Integration Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use Security Apps in Your Custom GPTs</CardTitle>
          <CardDescription>
            Once subscribed, these security apps become available as actions in your Custom GPTs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-medium">1</div>
              <div>
                <h4 className="font-medium">Subscribe</h4>
                <p className="text-sm text-muted-foreground">Choose and subscribe to the security apps you need</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-medium">2</div>
              <div>
                <h4 className="font-medium">Enable</h4>
                <p className="text-sm text-muted-foreground">Turn on the apps for your Custom GPTs in the Actions tab</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-medium">3</div>
              <div>
                <h4 className="font-medium">Use</h4>
                <p className="text-sm text-muted-foreground">Your GPT can now scan links, emails, and files automatically</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityAppsMarketplace;