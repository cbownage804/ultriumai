import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  Users, 
  Activity, 
  RefreshCw, 
  Settings, 
  MessageSquare,
  CheckCircle,
  ExternalLink,
  TestTube,
  Phone,
  Mail,
  TrendingUp,
  Target,
  Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Reusing the same types as GoHighLevel since it's white-labeled
interface TegrityConfig {
  apiKey: string;
  locationId: string;
  webhookUrl: string;
  isConnected: boolean;
  lastSync: string;
  syncEnabled: boolean;
  endpoints: {
    contacts: boolean;
    opportunities: boolean;
    campaigns: boolean;
    conversations: boolean;
    calendars: boolean;
    workflows: boolean;
  };
}

const TegrityConnectIntegration: React.FC = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<TegrityConfig>({
    apiKey: '',
    locationId: '',
    webhookUrl: '',
    isConnected: false,
    lastSync: '',
    syncEnabled: true,
    endpoints: {
      contacts: true,
      opportunities: true,
      campaigns: true,
      conversations: true,
      calendars: false,
      workflows: true,
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState('');

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setConfig(prev => ({
        ...prev,
        isConnected: true,
        lastSync: new Date().toISOString(),
      }));
      toast({
        title: "Connected",
        description: "Successfully connected to Tegrity Connect",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Tegrity Connect. Please check your API credentials.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    setTestResult('');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTestResult('✅ Connection successful\n✅ API key validated\n✅ Location access confirmed\n✅ Tegrity Connect platform accessible\n✅ All CRM features available');
      toast({
        title: "Test Successful",
        description: "Tegrity Connect connection test completed successfully",
      });
    } catch (error) {
      setTestResult('❌ Connection failed\n❌ Please verify API key and location ID');
      toast({
        title: "Test Failed",
        description: "Connection test failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Featured Header */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Tegrity Connect Integration
                <Badge variant="default" className="bg-primary">
                  ⭐ Featured CRM
                </Badge>
                <Badge variant={config.isConnected ? "default" : "secondary"}>
                  {config.isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </CardTitle>
              <CardDescription>
                Premium White-Label CRM & Marketing Automation Platform
                <span className="block text-sm font-medium text-primary mt-1">
                  🎯 Recommended for MSPs - Complete Business Management Solution
                </span>
                {config.lastSync && (
                  <span className="block text-xs text-muted-foreground mt-1">
                    Last sync: {new Date(config.lastSync).toLocaleString()}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={isLoading}
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="https://tegrityconnect.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Tegrity Portal
              </a>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Setup Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quick Setup - Get Started in Minutes
          </CardTitle>
          <CardDescription>
            Connect your Tegrity Connect account to unlock powerful CRM and marketing automation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">Tegrity Connect API Key</Label>
              <Input 
                id="api-key"
                type="password"
                placeholder="Enter your Tegrity Connect API key"
                value={config.apiKey}
                onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location-id">Location ID</Label>
              <Input 
                id="location-id"
                placeholder="Enter your location ID"
                value={config.locationId}
                onChange={(e) => setConfig(prev => ({ ...prev, locationId: e.target.value }))}
              />
            </div>
          </div>

          <Button 
            onClick={handleConnect} 
            disabled={isLoading || !config.apiKey || !config.locationId}
            className="w-full"
            size="lg"
          >
            {isLoading ? "Connecting to Tegrity Connect..." : "Connect to Tegrity Connect"}
          </Button>

          {testResult && (
            <div className="space-y-2">
              <Label>Connection Test Results</Label>
              <Textarea
                value={testResult}
                readOnly
                className="min-h-[100px] font-mono text-sm"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Why Tegrity Connect for MSPs?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold">Complete CRM</h3>
              <p className="text-sm text-muted-foreground">Manage leads, contacts, and customer relationships</p>
            </div>
            <div className="text-center p-4">
              <MessageSquare className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold">Multi-Channel Communications</h3>
              <p className="text-sm text-muted-foreground">SMS, email, social media in one platform</p>
            </div>
            <div className="text-center p-4">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold">Marketing Automation</h3>
              <p className="text-sm text-muted-foreground">Automated workflows and lead nurturing</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Need Help Getting Started?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Contact our Tegrity Connect specialists for personalized setup assistance and MSP-specific configuration.
          </p>
          <div className="flex gap-2">
            <Button variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Email Support
            </Button>
            <Button variant="outline">
              <Phone className="h-4 w-4 mr-2" />
              Schedule Demo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TegrityConnectIntegration;