import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plug, Search, CheckCircle, ExternalLink, Settings, Zap, Database, Mail, MessageSquare, Calendar, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  status: 'connected' | 'available' | 'coming_soon';
  documentation?: string;
}

export const APIMarketplace = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const integrations: Integration[] = [
    // PSA Tools
    { id: 'connectwise', name: 'ConnectWise Manage', description: 'Sync tickets, assets, and billing', category: 'psa', icon: '🔧', status: 'available' },
    { id: 'autotask', name: 'Datto Autotask', description: 'PSA integration for tickets and contracts', category: 'psa', icon: '📋', status: 'available' },
    { id: 'halo', name: 'HaloPSA', description: 'Full PSA integration', category: 'psa', icon: '🌟', status: 'available' },
    { id: 'syncro', name: 'Syncro', description: 'RMM and PSA synchronization', category: 'psa', icon: '🔄', status: 'coming_soon' },
    
    // Ticketing
    { id: 'jira', name: 'Jira Service Management', description: 'Create and sync Jira tickets', category: 'ticketing', icon: '🎫', status: 'available' },
    { id: 'servicenow', name: 'ServiceNow', description: 'Enterprise ITSM integration', category: 'ticketing', icon: '⚙️', status: 'available' },
    { id: 'freshdesk', name: 'Freshdesk', description: 'Helpdesk ticket sync', category: 'ticketing', icon: '🎯', status: 'available' },
    { id: 'zendesk', name: 'Zendesk', description: 'Customer support integration', category: 'ticketing', icon: '💬', status: 'coming_soon' },
    
    // Communication
    { id: 'teams', name: 'Microsoft Teams', description: 'Alerts and notifications to Teams', category: 'communication', icon: '👥', status: 'connected' },
    { id: 'slack', name: 'Slack', description: 'Slack channel notifications', category: 'communication', icon: '💬', status: 'available' },
    { id: 'email', name: 'Email (SMTP)', description: 'Custom email notifications', category: 'communication', icon: '📧', status: 'connected' },
    { id: 'pagerduty', name: 'PagerDuty', description: 'On-call incident management', category: 'communication', icon: '🚨', status: 'available' },
    
    // Security
    { id: 'crowdstrike', name: 'CrowdStrike', description: 'EDR data ingestion', category: 'security', icon: '🦅', status: 'available' },
    { id: 'sentinelone', name: 'SentinelOne', description: 'Endpoint security sync', category: 'security', icon: '🛡️', status: 'available' },
    { id: 'defender', name: 'Microsoft Defender', description: 'Defender ATP integration', category: 'security', icon: '🔰', status: 'available' },
    { id: 'sophos', name: 'Sophos Central', description: 'Sophos security integration', category: 'security', icon: '🔒', status: 'coming_soon' },
    
    // Documentation
    { id: 'itglue', name: 'IT Glue', description: 'Documentation sync', category: 'documentation', icon: '📚', status: 'available' },
    { id: 'hudu', name: 'Hudu', description: 'IT documentation platform', category: 'documentation', icon: '📝', status: 'available' },
    { id: 'confluence', name: 'Confluence', description: 'Atlassian wiki integration', category: 'documentation', icon: '📖', status: 'coming_soon' },
  ];

  const categories = [
    { id: 'all', name: 'All', icon: Plug },
    { id: 'psa', name: 'PSA Tools', icon: Settings },
    { id: 'ticketing', name: 'Ticketing', icon: FileText },
    { id: 'communication', name: 'Communication', icon: MessageSquare },
    { id: 'security', name: 'Security', icon: Zap },
    { id: 'documentation', name: 'Documentation', icon: Database },
  ];

  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredIntegrations = integrations.filter(int => {
    const matchesSearch = int.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         int.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || int.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleConnect = (integration: Integration) => {
    if (integration.status === 'coming_soon') {
      toast.info('Coming soon! We\'ll notify you when available.');
    } else if (integration.status === 'connected') {
      toast.info('Already connected');
    } else {
      toast.success(`Opening ${integration.name} configuration...`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500">Connected</Badge>;
      case 'available':
        return <Badge variant="outline">Available</Badge>;
      case 'coming_soon':
        return <Badge variant="secondary">Coming Soon</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            API Marketplace
          </CardTitle>
          <CardDescription>
            Connect Vanguard with your existing tools and services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="flex-wrap mb-6">
              {categories.map(cat => (
                <TabsTrigger key={cat.id} value={cat.id} className="flex items-center gap-1">
                  <cat.icon className="h-4 w-4" />
                  {cat.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredIntegrations.map(integration => (
                <Card key={integration.id} className={integration.status === 'coming_soon' ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{integration.icon}</div>
                        <div>
                          <h4 className="font-medium">{integration.name}</h4>
                          <p className="text-sm text-muted-foreground">{integration.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      {getStatusBadge(integration.status)}
                      <Button
                        size="sm"
                        variant={integration.status === 'connected' ? 'outline' : 'default'}
                        onClick={() => handleConnect(integration)}
                        disabled={integration.status === 'coming_soon'}
                      >
                        {integration.status === 'connected' ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Configure
                          </>
                        ) : integration.status === 'coming_soon' ? (
                          'Coming Soon'
                        ) : (
                          'Connect'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Tabs>

          {filteredIntegrations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No integrations found matching your search
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            API Documentation
          </CardTitle>
          <CardDescription>
            Build custom integrations using our REST API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">REST API</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Full API access for custom integrations
              </p>
              <Button variant="outline" size="sm">View Docs</Button>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Webhooks</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Real-time event notifications
              </p>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">SDK Libraries</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Python, Node.js, and PowerShell
              </p>
              <Button variant="outline" size="sm">Download</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
