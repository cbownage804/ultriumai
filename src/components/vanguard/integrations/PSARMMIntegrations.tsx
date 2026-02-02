import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Network, Shield, CheckCircle, XCircle, RefreshCw, Key, 
  Link, Settings, AlertTriangle, Zap, Database, Cloud
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Integration {
  id: string;
  name: string;
  type: 'psa' | 'rmm';
  logo: string;
  description: string;
  features: string[];
  connected: boolean;
  lastSync?: string;
}

const integrations: Integration[] = [
  {
    id: 'connectwise-manage',
    name: 'ConnectWise Manage',
    type: 'psa',
    logo: '🔗',
    description: 'Sync tickets, customers, and billing from ConnectWise Manage PSA.',
    features: ['Ticket Sync', 'Customer Import', 'Time Entries', 'Billing Integration'],
    connected: false,
  },
  {
    id: 'connectwise-automate',
    name: 'ConnectWise Automate',
    type: 'rmm',
    logo: '🤖',
    description: 'Connect to ConnectWise Automate for device monitoring and remote access.',
    features: ['Device Sync', 'Script Execution', 'Alerts', 'Patch Management'],
    connected: false,
  },
  {
    id: 'autotask',
    name: 'Datto Autotask PSA',
    type: 'psa',
    logo: '📋',
    description: 'Integrate with Autotask for ticket and project management.',
    features: ['Ticket Sync', 'Projects', 'Contracts', 'Resource Management'],
    connected: false,
  },
  {
    id: 'datto-rmm',
    name: 'Datto RMM',
    type: 'rmm',
    logo: '🖥️',
    description: 'Connect Datto RMM for comprehensive endpoint management.',
    features: ['Device Monitoring', 'Patching', 'Scripting', 'Web Remote'],
    connected: false,
  },
  {
    id: 'halo-psa',
    name: 'HaloPSA',
    type: 'psa',
    logo: '⭕',
    description: 'Sync with HaloPSA for ticket and asset management.',
    features: ['Tickets', 'Assets', 'Customers', 'Invoicing'],
    connected: false,
  },
  {
    id: 'ninja-rmm',
    name: 'NinjaRMM',
    type: 'rmm',
    logo: '🥷',
    description: 'Integrate NinjaRMM for device management and monitoring.',
    features: ['Device Sync', 'Alerts', 'Remote Access', 'Patching'],
    connected: false,
  },
];

function IntegrationCard({ 
  integration, 
  onConnect, 
  onDisconnect,
  onConfigure,
}: { 
  integration: Integration; 
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
  onConfigure: (id: string) => void;
}) {
  return (
    <Card className="bg-black/40 border-slate-700/50 hover:border-cyan-500/30 transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{integration.logo}</span>
            <div>
              <CardTitle className="text-lg">{integration.name}</CardTitle>
              <Badge variant="outline" className="mt-1 text-xs">
                {integration.type.toUpperCase()}
              </Badge>
            </div>
          </div>
          {integration.connected ? (
            <Badge className="bg-green-500/20 text-green-400">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="text-slate-400">
              <XCircle className="h-3 w-3 mr-1" />
              Not Connected
            </Badge>
          )}
        </div>
        <CardDescription className="mt-2">
          {integration.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {integration.features.map((feature) => (
            <Badge key={feature} variant="secondary" className="text-xs">
              {feature}
            </Badge>
          ))}
        </div>
        
        {integration.connected && integration.lastSync && (
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
            <RefreshCw className="h-3 w-3" />
            Last synced: {integration.lastSync}
          </div>
        )}
        
        <div className="flex gap-2">
          {integration.connected ? (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onConfigure(integration.id)}
              >
                <Settings className="h-3 w-3 mr-1" />
                Configure
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="text-red-400 hover:text-red-300"
                onClick={() => onDisconnect(integration.id)}
              >
                <XCircle className="h-3 w-3 mr-1" />
                Disconnect
              </Button>
            </>
          ) : (
            <Button 
              size="sm"
              className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300"
              onClick={() => onConnect(integration.id)}
            >
              <Link className="h-3 w-3 mr-1" />
              Connect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ConnectionModal({ 
  integration, 
  onClose, 
  onSave 
}: { 
  integration: Integration | null; 
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [syncEnabled, setSyncEnabled] = useState(true);

  if (!integration) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg bg-slate-900 border-slate-700">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{integration.logo}</span>
            <div>
              <CardTitle>Connect {integration.name}</CardTitle>
              <CardDescription>Enter your API credentials to connect</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>API URL</Label>
            <Input 
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder={`https://your-instance.${integration.id.split('-')[0]}.com/api`}
              className="bg-slate-800 border-slate-700"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Client ID</Label>
            <Input 
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Enter client ID"
              className="bg-slate-800 border-slate-700"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Client Secret</Label>
            <Input 
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="Enter client secret"
              className="bg-slate-800 border-slate-700"
            />
          </div>
          
          <div className="space-y-2">
            <Label>API Key (if applicable)</Label>
            <Input 
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter API key"
              className="bg-slate-800 border-slate-700"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Switch 
                checked={syncEnabled}
                onCheckedChange={setSyncEnabled}
              />
              <Label>Enable automatic sync</Label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={() => onSave({ apiUrl, apiKey, clientId, clientSecret, syncEnabled })}
              className="flex-1 bg-cyan-500 hover:bg-cyan-600"
            >
              <Key className="h-4 w-4 mr-2" />
              Connect
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PSARMMIntegrations() {
  const { toast } = useToast();
  const [allIntegrations, setAllIntegrations] = useState(integrations);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const handleConnect = (id: string) => {
    const integration = allIntegrations.find(i => i.id === id);
    if (integration) {
      setSelectedIntegration(integration);
      setShowModal(true);
    }
  };

  const handleDisconnect = (id: string) => {
    setAllIntegrations(prev => 
      prev.map(i => i.id === id ? { ...i, connected: false, lastSync: undefined } : i)
    );
    toast({
      title: 'Integration Disconnected',
      description: 'The integration has been disconnected successfully.',
    });
  };

  const handleConfigure = (id: string) => {
    const integration = allIntegrations.find(i => i.id === id);
    if (integration) {
      setSelectedIntegration(integration);
      setShowModal(true);
    }
  };

  const handleSave = (data: any) => {
    if (selectedIntegration) {
      setAllIntegrations(prev => 
        prev.map(i => i.id === selectedIntegration.id 
          ? { ...i, connected: true, lastSync: 'Just now' } 
          : i
        )
      );
      toast({
        title: 'Integration Connected',
        description: `${selectedIntegration.name} has been connected successfully.`,
      });
    }
    setShowModal(false);
    setSelectedIntegration(null);
  };

  const psaIntegrations = allIntegrations.filter(i => i.type === 'psa');
  const rmmIntegrations = allIntegrations.filter(i => i.type === 'rmm');
  const connectedCount = allIntegrations.filter(i => i.connected).length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/20">
              <Network className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{allIntegrations.length}</div>
              <div className="text-sm text-slate-400">Available Integrations</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/20">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{connectedCount}</div>
              <div className="text-sm text-slate-400">Connected</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/20">
              <Zap className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">Real-time</div>
              <div className="text-sm text-slate-400">Sync Status</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-800/50">
          <TabsTrigger value="all">All Integrations</TabsTrigger>
          <TabsTrigger value="psa">PSA Tools</TabsTrigger>
          <TabsTrigger value="rmm">RMM Tools</TabsTrigger>
          <TabsTrigger value="connected">Connected</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allIntegrations.map(integration => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onConfigure={handleConfigure}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="psa">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {psaIntegrations.map(integration => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onConfigure={handleConfigure}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rmm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rmmIntegrations.map(integration => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onConfigure={handleConfigure}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="connected">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allIntegrations.filter(i => i.connected).length > 0 ? (
              allIntegrations.filter(i => i.connected).map(integration => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                  onConfigure={handleConfigure}
                />
              ))
            ) : (
              <Card className="col-span-full bg-black/40 border-slate-700/50 p-8 text-center">
                <Network className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">No Connected Integrations</h3>
                <p className="text-slate-400 mb-4">Connect your PSA and RMM tools to sync data automatically.</p>
                <Button onClick={() => setActiveTab('available')}>
                  <Link className="h-4 w-4 mr-2" />
                  Browse Integrations
                </Button>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Connection Modal */}
      {showModal && (
        <ConnectionModal
          integration={selectedIntegration}
          onClose={() => {
            setShowModal(false);
            setSelectedIntegration(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
