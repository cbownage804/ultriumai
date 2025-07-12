import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  FileText,
  MessageSquare,
  Settings,
  BarChart3,
  Scan,
  Brain,
  Globe,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ClientData {
  id: string;
  company_name: string;
  current_users: number;
  max_users: number;
  health_status: string;
  trial_ends_at: string;
  billing_status: string;
  tool_access?: any;
}

interface MSPData {
  brand_name: string;
  brand_color: string;
  logo_url: string;
  contact_email: string;
}

export const CustomerPortal = () => {
  const { clientId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [client, setClient] = useState<ClientData | null>(null);
  const [msp, setMSP] = useState<MSPData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClientData = async () => {
      if (!clientId || !user) {
        console.log('Missing clientId or user:', { clientId, user: !!user });
        // Redirect to client login if not authenticated
        if (!user) {
          window.location.href = `/client-login?client=${clientId}`;
          return;
        }
        return;
      }
      
      try {
        console.log('Loading portal data for client:', clientId);
        
        // First verify user has access to this client
        const { data: clientAccess, error: accessError } = await supabase
          .from('client_users')
          .select('client_id, role, is_active')
          .eq('user_id', user.id)
          .eq('client_id', clientId)
          .eq('is_active', true)
          .single();

        if (accessError || !clientAccess) {
          console.error('Access verification failed:', accessError);
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this client portal.",
            variant: "destructive"
          });
          // Redirect to client login
          window.location.href = `/client-login?client=${clientId}`;
          return;
        }

        console.log('Access verified for user:', user.id);
        
        // Load client data
        const { data: clientData, error: clientError } = await supabase
          .from('msp_clients')
          .select('*')
          .eq('id', clientId)
          .single();

        if (clientError) {
          console.error('Client query error:', clientError);
          throw new Error('Client not found');
        }

        console.log('Client data loaded:', clientData);

        // Then load MSP data for branding
        const { data: mspData, error: mspError } = await supabase
          .from('msps')
          .select('brand_name, brand_color, logo_url, contact_email')
          .eq('id', clientData.msp_id)
          .single();

        if (mspError) {
          console.error('MSP query error:', mspError);
          throw new Error('MSP data not found');
        }

        console.log('MSP data loaded:', mspData);

        setClient(clientData);
        setMSP(mspData);
      } catch (error) {
        console.error('Error loading portal data:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to load portal data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadClientData();
  }, [clientId, user, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!client || !msp) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Portal Not Found</h2>
            <p className="text-muted-foreground">
              The requested portal could not be found or you don't have access to it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const brandColor = msp.brand_color || '#3b82f6';
  const brandName = 'Ultrium'; // Always use Ultrium for the portal

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {msp.logo_url ? (
                <img 
                  src={msp.logo_url} 
                  alt={`${brandName} logo`}
                  className="h-8 w-8 rounded object-cover"
                />
              ) : (
                <Shield className="h-8 w-8" style={{ color: brandColor }} />
              )}
              <div>
                <h1 className="text-xl font-bold" style={{ color: brandColor }}>
                  {brandName} User Portal
                </h1>
                <p className="text-sm text-muted-foreground">{client.company_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={client.billing_status === 'active' ? 'default' : 'secondary'}>
                {client.billing_status}
              </Badge>
              {user && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = `/client-login?client=${clientId}`;
                  }}
                >
                  Sign Out
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Users</p>
                  <p className="text-2xl font-bold">{client.current_users}/{client.max_users}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <Progress 
                value={(client.current_users / client.max_users) * 100} 
                className="mt-2" 
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-lg font-semibold text-success">
                    {client.health_status === 'healthy' ? 'Healthy' : client.health_status}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Trial Ends</p>
                  <p className="text-lg font-semibold">
                    {new Date(client.trial_ends_at).toLocaleDateString()}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Support</p>
                  <p className="text-lg font-semibold">24/7</p>
                </div>
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Security Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Devices Protected</span>
                      <Badge variant="outline">{client.current_users} devices</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Last Scan</span>
                      <span className="text-sm text-muted-foreground">2 hours ago</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Threats Blocked</span>
                      <Badge variant="secondary">0 this week</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm">System health check completed</p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm">Security updates installed</p>
                        <p className="text-xs text-muted-foreground">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* SafeScan Tool */}
              {client.tool_access?.safescan !== false && (
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Scan className="h-5 w-5" style={{ color: brandColor }} />
                      SafeScan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Secure document scanning and analysis
                    </p>
                    <Button 
                      className="w-full" 
                      style={{ backgroundColor: brandColor }}
                      onClick={() => window.open('/safescan', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open SafeScan
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* UltriumGPT Tool */}
              {client.tool_access?.ultraumgpt !== false && (
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" style={{ color: brandColor }} />
                      UltriumGPT
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      AI-powered assistant for your business needs
                    </p>
                    <Button 
                      className="w-full" 
                      style={{ backgroundColor: brandColor }}
                      onClick={() => window.open('/gpt-chat', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open UltriumGPT
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* SafeShield Tool */}
              {client.tool_access?.safeshield === true && (
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" style={{ color: brandColor }} />
                      SafeShield
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Endpoint protection and monitoring
                    </p>
                    <Button 
                      className="w-full" 
                      style={{ backgroundColor: brandColor }}
                      onClick={() => window.open('/safeshield', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open SafeShield
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Dark Web Monitor Tool */}
              {client.tool_access?.darkweb_monitor === true && (
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" style={{ color: brandColor }} />
                      Dark Web Monitor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Monitor for compromised credentials
                    </p>
                    <Button 
                      className="w-full" 
                      style={{ backgroundColor: brandColor }}
                      onClick={() => window.open('/dark-web', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Monitor
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Reports Tool */}
              {client.tool_access?.reports !== false && (
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" style={{ color: brandColor }} />
                      Reports
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Security reports and analytics
                    </p>
                    <Button 
                      className="w-full" 
                      style={{ backgroundColor: brandColor }}
                      onClick={() => window.open('/reports', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Reports
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Status</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Security monitoring and threat protection details will be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Support</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Need help? Contact our support team:</p>
                <Button className="w-full" style={{ backgroundColor: brandColor }}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Open Support Ticket
                </Button>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Email: {msp.contact_email}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Billing and subscription details will be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};