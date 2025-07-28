import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Send, Users, BarChart3, Settings, ExternalLink, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailConfig {
  enabled: boolean;
  provider: 'resend' | 'sendgrid' | 'mailchimp';
  apiKey: string;
  fromEmail: string;
  fromName: string;
  status: 'connected' | 'disconnected' | 'error';
  templates: EmailTemplate[];
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'welcome' | 'notification' | 'marketing' | 'system';
  variables: string[];
}

interface Campaign {
  id: string;
  name: string;
  subject: string;
  recipients: number;
  sent: string;
  openRate: number;
  clickRate: number;
  status: 'sent' | 'draft' | 'scheduled';
}

const EmailIntegration = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<EmailConfig>({
    enabled: false,
    provider: 'resend',
    apiKey: '',
    fromEmail: '',
    fromName: '',
    status: 'disconnected',
    templates: []
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  useEffect(() => {
    loadEmailConfig();
    loadCampaigns();
  }, []);

  const loadEmailConfig = async () => {
    try {
      const mockConfig: EmailConfig = {
        enabled: true,
        provider: 'resend',
        apiKey: '••••••••••••••••',
        fromEmail: 'support@msplatform.com',
        fromName: 'MSP Platform',
        status: 'connected',
        templates: [
          {
            id: '1',
            name: 'Welcome Email',
            subject: 'Welcome to {company_name}!',
            content: 'Dear {client_name},\n\nWelcome to our MSP services! We\'re excited to work with you.',
            type: 'welcome',
            variables: ['company_name', 'client_name', 'account_manager']
          },
          {
            id: '2',
            name: 'Security Alert',
            subject: 'Security Alert: {alert_type}',
            content: 'We detected a {alert_type} on your systems. Please contact us immediately.',
            type: 'notification',
            variables: ['alert_type', 'affected_systems', 'severity']
          },
          {
            id: '3',
            name: 'Monthly Report',
            subject: 'Your Monthly IT Report - {month} {year}',
            content: 'Here\'s your monthly IT security and performance report.',
            type: 'marketing',
            variables: ['month', 'year', 'metrics']
          }
        ]
      };
      setConfig(mockConfig);
      if (mockConfig.templates.length > 0) {
        setSelectedTemplate(mockConfig.templates[0].id);
      }
    } catch (error) {
      console.error('Failed to load email config:', error);
    }
  };

  const loadCampaigns = async () => {
    try {
      const mockCampaigns: Campaign[] = [
        {
          id: '1',
          name: 'Security Awareness Training',
          subject: 'Monthly Security Update - January 2024',
          recipients: 247,
          sent: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          openRate: 78.5,
          clickRate: 23.2,
          status: 'sent'
        },
        {
          id: '2',
          name: 'System Maintenance Notice',
          subject: 'Scheduled Maintenance: February 15th',
          recipients: 189,
          sent: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
          openRate: 92.1,
          clickRate: 15.8,
          status: 'sent'
        },
        {
          id: '3',
          name: 'Client Newsletter',
          subject: 'MSP Updates - Q1 2024',
          recipients: 340,
          sent: '',
          openRate: 0,
          clickRate: 0,
          status: 'draft'
        }
      ];
      setCampaigns(mockCampaigns);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setConfig(prev => ({ ...prev, status: 'connected', enabled: true }));
      
      toast({
        title: "Email Service Connected",
        description: `Successfully connected to ${config.provider}`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect email service. Please check your API key.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail || !selectedTemplate) {
      toast({
        title: "Validation Error",
        description: "Please enter an email address and select a template",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Test Email Sent",
        description: `Test email sent to ${testEmail}`,
      });
    } catch (error) {
      toast({
        title: "Send Failed",
        description: "Failed to send test email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-success text-white border-0';
      case 'error': return 'bg-destructive text-white border-0';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getCampaignStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-success text-white border-0';
      case 'scheduled': return 'bg-warning text-white border-0';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Integration Status Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Email Integration
                  <Badge variant="secondary" className={getStatusColor(config.status)}>
                    {config.status}
                  </Badge>
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  Provider: {config.provider} • From: {config.fromEmail || 'Not configured'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {config.status === 'connected' ? (
                <Button variant="outline" asChild>
                  <a href="https://resend.com/dashboard" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Provider Dashboard
                  </a>
                </Button>
              ) : (
                <Button onClick={handleConnect} disabled={isLoading}>
                  {isLoading ? "Connecting..." : "Connect Email Service"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="test">Test & Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Email Templates</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.templates.map(template => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant="outline">{template.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm text-muted-foreground">Subject</Label>
                    <p className="font-mono text-sm">{template.subject}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Content Preview</Label>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {template.content}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Variables</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.variables.map(variable => (
                        <Badge key={variable} variant="secondary" className="text-xs">
                          {`{${variable}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Email Campaigns</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </div>

          <div className="space-y-4">
            {campaigns.map(campaign => (
              <Card key={campaign.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{campaign.name}</h4>
                        <Badge variant="secondary" className={getCampaignStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{campaign.subject}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{campaign.recipients} recipients</span>
                        </div>
                        {campaign.status === 'sent' && (
                          <>
                            <span>Open Rate: {campaign.openRate}%</span>
                            <span>Click Rate: {campaign.clickRate}%</span>
                            <span>Sent: {new Date(campaign.sent).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {campaign.status === 'draft' && (
                        <Button variant="outline" size="sm">
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email Provider</Label>
                  <Select value={config.provider} onValueChange={(value: 'resend' | 'sendgrid' | 'mailchimp') => 
                    setConfig(prev => ({ ...prev, provider: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resend">Resend</SelectItem>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="mailchimp">Mailchimp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Enter your API key"
                  />
                </div>

                <div className="space-y-2">
                  <Label>From Email</Label>
                  <Input
                    type="email"
                    value={config.fromEmail}
                    onChange={(e) => setConfig(prev => ({ ...prev, fromEmail: e.target.value }))}
                    placeholder="support@yourdomain.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>From Name</Label>
                  <Input
                    value={config.fromName}
                    onChange={(e) => setConfig(prev => ({ ...prev, fromName: e.target.value }))}
                    placeholder="Your Company Name"
                  />
                </div>
              </div>

              <Button>Save Configuration</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Email Delivery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Test Email Address</Label>
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {config.templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSendTestEmail} disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Test Email"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailIntegration;