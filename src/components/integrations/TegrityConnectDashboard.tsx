import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Users, 
  Activity, 
  RefreshCw, 
  MessageSquare,
  CheckCircle,
  ExternalLink,
  TrendingUp,
  Target,
  Star,
  Database,
  Calendar,
  Phone,
  Mail,
  AlertCircle,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TegrityStats {
  totalContacts: number;
  activeLeads: number;
  conversionsThisMonth: number;
  automationRuns: number;
  lastSyncTime: string;
  syncStatus: 'connected' | 'syncing' | 'error';
}

interface RecentActivity {
  id: string;
  type: 'contact_added' | 'lead_converted' | 'automation_triggered' | 'campaign_sent';
  description: string;
  timestamp: string;
  status: 'success' | 'pending' | 'error';
}

const TegrityConnectDashboard: React.FC = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<TegrityStats>({
    totalContacts: 1247,
    activeLeads: 89,
    conversionsThisMonth: 23,
    automationRuns: 156,
    lastSyncTime: new Date().toISOString(),
    syncStatus: 'connected'
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'contact_added',
      description: 'New contact added: John Smith from ABC Corp',
      timestamp: '2024-01-20T10:30:00Z',
      status: 'success'
    },
    {
      id: '2',
      type: 'lead_converted',
      description: 'Lead converted to opportunity: $15,000 MSP contract',
      timestamp: '2024-01-20T09:15:00Z',
      status: 'success'
    },
    {
      id: '3',
      type: 'automation_triggered',
      description: 'Follow-up sequence triggered for 5 prospects',
      timestamp: '2024-01-20T08:45:00Z',
      status: 'success'
    },
    {
      id: '4',
      type: 'campaign_sent',
      description: 'Monthly newsletter sent to 342 contacts',
      timestamp: '2024-01-19T16:20:00Z',
      status: 'success'
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async () => {
    setIsLoading(true);
    setStats(prev => ({ ...prev, syncStatus: 'syncing' }));
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setStats(prev => ({
        ...prev,
        lastSyncTime: new Date().toISOString(),
        syncStatus: 'connected'
      }));
      toast({
        title: "Sync Complete",
        description: "Tegrity Connect data has been synchronized successfully",
      });
    } catch (error) {
      setStats(prev => ({ ...prev, syncStatus: 'error' }));
      toast({
        title: "Sync Failed",
        description: "Failed to sync with Tegrity Connect",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'contact_added': return <Users className="h-4 w-4" />;
      case 'lead_converted': return <Target className="h-4 w-4" />;
      case 'automation_triggered': return <Zap className="h-4 w-4" />;
      case 'campaign_sent': return <MessageSquare className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected': return <Badge className="bg-green-500">Connected</Badge>;
      case 'syncing': return <Badge variant="secondary">Syncing...</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <img 
                src="/lovable-uploads/28348e0f-1c72-435c-b46f-d51c7100ba4f.png" 
                alt="Tegrity Connect" 
                className="h-8 w-auto"
              />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Tegrity Connect Dashboard
                <Badge variant="default" className="bg-primary">⭐ Featured</Badge>
                {getStatusBadge(stats.syncStatus)}
              </CardTitle>
              <CardDescription>
                Complete CRM & Marketing Automation Platform
                <span className="block text-xs text-muted-foreground mt-1">
                  Last sync: {new Date(stats.lastSyncTime).toLocaleString()}
                </span>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Sync
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="https://tegrityconnect.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Portal
              </a>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
                <p className="text-2xl font-bold">{stats.totalContacts.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Leads</p>
                <p className="text-2xl font-bold">{stats.activeLeads}</p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversions (Month)</p>
                <p className="text-2xl font-bold">{stats.conversionsThisMonth}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Automation Runs</p>
                <p className="text-2xl font-bold">{stats.automationRuns}</p>
              </div>
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Dashboard */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                      <div className="p-2 rounded-full bg-primary/10">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={activity.status === 'success' ? 'default' : 'secondary'}>
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Add New Contact
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Zap className="h-4 w-4 mr-2" />
                  Setup Automation
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Follow-up
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Management</CardTitle>
              <CardDescription>Manage your contact database and lead pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold">1,247</div>
                    <div className="text-sm text-muted-foreground">Total Contacts</div>
                    <Progress value={85} className="mt-2" />
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold">89</div>
                    <div className="text-sm text-muted-foreground">Active Leads</div>
                    <Progress value={45} className="mt-2" />
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold">156</div>
                    <div className="text-sm text-muted-foreground">Prospects</div>
                    <Progress value={65} className="mt-2" />
                  </div>
                </div>
                <Button className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage Contacts in Tegrity Connect
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Marketing Campaigns</CardTitle>
              <CardDescription>Track and manage your marketing campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">MSP Monthly Newsletter</h3>
                      <Badge>Active</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">342 recipients</p>
                    <div className="text-sm">
                      <div>Open Rate: 24.5%</div>
                      <div>Click Rate: 8.2%</div>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">New Client Welcome Series</h3>
                      <Badge variant="secondary">Draft</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">5-email sequence</p>
                    <div className="text-sm">
                      <div>Automation Ready</div>
                      <div>23 contacts queued</div>
                    </div>
                  </div>
                </div>
                <Button className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage Campaigns in Tegrity Connect
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Marketing Automation</CardTitle>
              <CardDescription>Automated workflows and sequences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Zap className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">Lead Nurture Sequence</div>
                        <div className="text-sm text-muted-foreground">7-day follow-up series</div>
                      </div>
                    </div>
                    <Badge>Active</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">Client Onboarding</div>
                        <div className="text-sm text-muted-foreground">Welcome & setup automation</div>
                      </div>
                    </div>
                    <Badge>Active</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">Renewal Reminders</div>
                        <div className="text-sm text-muted-foreground">90, 60, 30 day notices</div>
                      </div>
                    </div>
                    <Badge variant="secondary">Paused</Badge>
                  </div>
                </div>
                <Button className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Configure Automations in Tegrity Connect
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>Track your CRM and marketing performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Conversion Funnel</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Leads</span>
                      <span className="font-medium">89</span>
                    </div>
                    <Progress value={100} />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Qualified</span>
                      <span className="font-medium">45</span>
                    </div>
                    <Progress value={50} />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Opportunities</span>
                      <span className="font-medium">23</span>
                    </div>
                    <Progress value={25} />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Closed Won</span>
                      <span className="font-medium">12</span>
                    </div>
                    <Progress value={13} />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold">Campaign Performance</h3>
                  <div className="space-y-3">
                    <div className="p-3 border rounded">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Email Open Rate</span>
                        <span className="text-sm font-bold">24.5%</span>
                      </div>
                      <Progress value={24.5} />
                    </div>
                    
                    <div className="p-3 border rounded">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Click-through Rate</span>
                        <span className="text-sm font-bold">8.2%</span>
                      </div>
                      <Progress value={8.2} />
                    </div>
                    
                    <div className="p-3 border rounded">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Conversion Rate</span>
                        <span className="text-sm font-bold">13.5%</span>
                      </div>
                      <Progress value={13.5} />
                    </div>
                  </div>
                </div>
              </div>
              <Button className="w-full mt-4">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Detailed Analytics in Tegrity Connect
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TegrityConnectDashboard;