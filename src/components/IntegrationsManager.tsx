import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Settings, CheckCircle, CreditCard, Mail, MessageSquare, Calendar, BarChart3, FileText, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import StripeIntegration from "./integrations/StripeIntegration";
import ZapierIntegration from "./integrations/ZapierIntegration";
import QuickBooksIntegration from "./integrations/QuickBooksIntegration";
import SlackIntegration from "./integrations/SlackIntegration";
import EmailIntegration from "./integrations/EmailIntegration";
import Office365Integration from "./integrations/Office365Integration";

const IntegrationsManager = () => {
  const { toast } = useToast();
  const [integrations] = useState([
    {
      id: '1',
      name: 'Stripe Payments',
      status: 'connected',
      provider: 'Stripe',
      enabled: true,
      icon: CreditCard,
      category: 'payments'
    },
    {
      id: '2',
      name: 'Zapier Automation',
      status: 'connected',
      provider: 'Zapier',
      enabled: true,
      icon: Zap,
      category: 'automation'
    },
    {
      id: '3',
      name: 'QuickBooks Online',
      status: 'connected',
      provider: 'Intuit',
      enabled: true,
      icon: Building2,
      category: 'accounting'
    },
    {
      id: '4',
      name: 'Slack Notifications',
      status: 'connected',
      provider: 'Slack',
      enabled: true,
      icon: MessageSquare,
      category: 'communication'
    },
    {
      id: '5',
      name: 'Email Marketing',
      status: 'connected',
      provider: 'Resend',
      enabled: true,
      icon: Mail,
      category: 'marketing'
    },
    {
      id: '6',
      name: 'Office 365',
      status: 'connected',
      provider: 'Microsoft',
      enabled: true,
      icon: Calendar,
      category: 'productivity'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-success text-white border-0';
      case 'disconnected': return 'bg-muted text-muted-foreground';
      case 'error': return 'bg-destructive text-white border-0';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Integrations</h2>
          <p className="text-muted-foreground">Connect your MSP platform with external services</p>
        </div>
        <Button>
          <Zap className="h-4 w-4 mr-2" />
          Browse Marketplace
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stripe">Stripe</TabsTrigger>
          <TabsTrigger value="quickbooks">QuickBooks</TabsTrigger>
          <TabsTrigger value="zapier">Zapier</TabsTrigger>
          <TabsTrigger value="slack">Slack</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="office365">Office 365</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <CheckCircle className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Connected</p>
                    <p className="text-2xl font-bold">6</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <Settings className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Available</p>
                    <p className="text-2xl font-bold">12</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Automations</p>
                    <p className="text-2xl font-bold">8</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <BarChart3 className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Events Today</p>
                    <p className="text-2xl font-bold">147</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {integrations.map((integration) => {
              const IconComponent = integration.icon;
              return (
                <Card key={integration.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{integration.name}</h4>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="secondary" 
                              className={getStatusColor(integration.status)}
                            >
                              {integration.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {integration.provider}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Switch checked={integration.enabled} />
                        <Button variant="outline">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="stripe">
          <StripeIntegration />
        </TabsContent>

        <TabsContent value="quickbooks">
          <QuickBooksIntegration />
        </TabsContent>

        <TabsContent value="zapier">
          <ZapierIntegration />
        </TabsContent>

        <TabsContent value="slack">
          <SlackIntegration />
        </TabsContent>

        <TabsContent value="email">
          <EmailIntegration />
        </TabsContent>

        <TabsContent value="office365">
          <Office365Integration />
        </TabsContent>

        <TabsContent value="communication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Additional Communication Integrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Connect with Discord, Microsoft Teams, and other communication platforms.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationsManager;