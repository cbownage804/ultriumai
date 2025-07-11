import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Shield, 
  Monitor, 
  Ticket,
  FileText,
  MessageSquare,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Phone,
  Mail,
  Calendar,
  BarChart3
} from "lucide-react";

interface ClientDashboardData {
  deviceHealth: {
    total: number;
    online: number;
    offline: number;
    issues: number;
  };
  securityStatus: {
    score: number;
    threats: number;
    scansCompleted: number;
    lastScan: string;
  };
  ticketSummary: {
    open: number;
    inProgress: number;
    resolved: number;
    avgResponseTime: number;
  };
  compliance: {
    overall: number;
    frameworks: Array<{
      name: string;
      score: number;
      status: string;
    }>;
  };
}

export const ClientPortal = () => {
  const [data, setData] = useState<ClientDashboardData>({
    deviceHealth: { total: 0, online: 0, offline: 0, issues: 0 },
    securityStatus: { score: 0, threats: 0, scansCompleted: 0, lastScan: '' },
    ticketSummary: { open: 0, inProgress: 0, resolved: 0, avgResponseTime: 0 },
    compliance: { overall: 0, frameworks: [] }
  });
  const [loading, setLoading] = useState(true);
  const [recentTickets, setRecentTickets] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    loadClientData();
  }, []);

  const loadClientData = async () => {
    try {
      setLoading(true);

      // Load device data
      const { data: devices, error: devicesError } = await supabase
        .from('rmm_devices')
        .select('*');

      if (devicesError) throw devicesError;

      // Load ticket data
      const { data: tickets, error: ticketsError } = await supabase
        .from('helpdesk_tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (ticketsError) throw ticketsError;

      // Load security scans
      const { data: scans, error: scansError } = await supabase
        .from('document_scans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (scansError) throw scansError;

      // Load compliance data
      const { data: compliance, error: complianceError } = await supabase
        .from('compliance_status')
        .select('*');

      if (complianceError) throw complianceError;

      // Process data
      const deviceStats = {
        total: devices?.length || 0,
        online: devices?.filter(d => d.status === 'online').length || 0,
        offline: devices?.filter(d => d.status === 'offline').length || 0,
        issues: devices?.filter(d => d.status === 'error').length || 0
      };

      const ticketStats = {
        open: tickets?.filter(t => t.status === 'open').length || 0,
        inProgress: tickets?.filter(t => t.status === 'in_progress').length || 0,
        resolved: tickets?.filter(t => t.status === 'resolved').length || 0,
        avgResponseTime: tickets?.length ? 
          tickets.reduce((sum, ticket) => {
            if (ticket.created_at && ticket.updated_at) {
              const hours = (new Date(ticket.updated_at).getTime() - new Date(ticket.created_at).getTime()) / (1000 * 60 * 60);
              return sum + hours;
            }
            return sum;
          }, 0) / tickets.length : 0
      };

      const securityStats = {
        score: scans?.length ? 
          Math.round(scans.reduce((sum, scan) => {
            // Calculate based on threats found - lower threats = higher score
            const threatScore = scan.threats_detected ? Math.max(0, 100 - (scan.threats_detected * 10)) : 90;
            return sum + threatScore;
          }, 0) / scans.length) : 0,
        threats: scans?.reduce((sum, scan) => sum + (scan.threats_detected || 0), 0) || 0,
        scansCompleted: scans?.length || 0,
        lastScan: scans?.[0]?.created_at || ''
      };

      const complianceStats = {
        overall: compliance?.length ? 
          Math.round(compliance.reduce((sum, item) => sum + (item.score || 0), 0) / compliance.length) : 0,
        frameworks: compliance?.map(item => ({
          name: item.framework_id || 'Unknown Framework',
          score: item.score || 0,
          status: item.status || 'unknown'
        })) || []
      };

      setData({
        deviceHealth: deviceStats,
        securityStatus: securityStats,
        ticketSummary: ticketStats,
        compliance: complianceStats
      });

      setRecentTickets(tickets || []);

      // Load real announcements
      const { data: announcementsData, error: announcementsError } = await supabase
        .from('client_announcements')
        .select('*')
        .eq('is_active', true)
        .lte('scheduled_at', new Date().toISOString())
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('scheduled_at', { ascending: false });

      if (announcementsError) {
        console.error('Error loading announcements:', announcementsError);
        // Fall back to empty array if there's an error
        setAnnouncements([]);
      } else {
        setAnnouncements(announcementsData || []);
      }

    } catch (error) {
      console.error('Error loading client data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async () => {
    try {
      const { error } = await supabase.functions.invoke('email-to-ticket', {
        body: { 
          action: 'create_portal_ticket',
          subject: 'New support request from client portal',
          priority: 'medium'
        }
      });

      if (error) throw error;

      toast({
        title: "Ticket Created",
        description: "Your support ticket has been submitted successfully",
      });
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create support ticket",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Client Portal Dashboard</h1>
          <div className="text-muted-foreground">
            Your IT infrastructure and security overview
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={createTicket}>
            <Ticket className="h-4 w-4 mr-2" />
            Create Ticket
          </Button>
          <Button onClick={loadClientData}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Device Health</CardTitle>
            <Monitor className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.deviceHealth.online}/{data.deviceHealth.total}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="default" className="text-xs">
                {data.deviceHealth.online} online
              </Badge>
              {data.deviceHealth.offline > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {data.deviceHealth.offline} offline
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.securityStatus.score}%</div>
            <Progress value={data.securityStatus.score} className="h-2 mt-2" />
            <div className="text-xs text-muted-foreground mt-1">
              {data.securityStatus.lastScan ? 
                `Last scan: ${new Date(data.securityStatus.lastScan).toLocaleDateString()}` : 
                'No scans completed'
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Support Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.ticketSummary.open}</div>
            <div className="text-xs text-muted-foreground">
              {data.ticketSummary.avgResponseTime > 0 ? 
                `Avg response: ${Math.round(data.ticketSummary.avgResponseTime * 10) / 10}h` : 
                'No response time data'
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.compliance.overall}%</div>
            <div className="text-xs text-muted-foreground">All frameworks</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="tickets">Support</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Recent Announcements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {announcements.length > 0 ? announcements.map((announcement: any) => (
                  <div key={announcement.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{announcement.title}</div>
                      <div className="flex gap-1">
                        <Badge variant={
                          announcement.announcement_type === 'security' ? 'default' :
                          announcement.announcement_type === 'maintenance' ? 'secondary' : 'outline'
                        }>
                          {announcement.announcement_type}
                        </Badge>
                        {announcement.priority !== 'normal' && (
                          <Badge variant={announcement.priority === 'high' ? 'destructive' : 'secondary'}>
                            {announcement.priority}
                          </Badge>
                        )}
                        {announcement.auto_generated && (
                          <Badge variant="outline">AI</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {announcement.content}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {new Date(announcement.scheduled_at).toLocaleDateString()}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No announcements at this time
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Recent Support Tickets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentTickets.length > 0 ? recentTickets.map((ticket: any) => (
                  <div key={ticket.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">#{ticket.ticket_number}</div>
                      <Badge variant={
                        ticket.status === 'open' ? 'destructive' :
                        ticket.status === 'in_progress' ? 'secondary' : 'default'
                      }>
                        {ticket.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {ticket.subject || 'Support Request'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Created: {new Date(ticket.created_at).toLocaleDateString()}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No recent tickets
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Device Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 border rounded-lg">
                  <Monitor className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold text-green-600">{data.deviceHealth.online}</div>
                  <div className="text-sm text-muted-foreground">Online Devices</div>
                </div>
                <div className="text-center p-6 border rounded-lg">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <div className="text-2xl font-bold text-orange-600">{data.deviceHealth.offline}</div>
                  <div className="text-sm text-muted-foreground">Offline Devices</div>
                </div>
                <div className="text-center p-6 border rounded-lg">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                  <div className="text-2xl font-bold text-red-600">{data.deviceHealth.issues}</div>
                  <div className="text-sm text-muted-foreground">Issues Detected</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.securityStatus.scansCompleted > 0 ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Overall Security Score</span>
                        <span className="font-bold">{data.securityStatus.score}%</span>
                      </div>
                      <Progress value={data.securityStatus.score} className="h-2" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Based on {data.securityStatus.scansCompleted} security scan{data.securityStatus.scansCompleted !== 1 ? 's' : ''}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p>No security scans available</p>
                    <p className="text-sm">Security scans will appear here once completed</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.compliance.frameworks.length > 0 ? (
                  data.compliance.frameworks.map((framework, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{framework.name}</div>
                        <div className="text-sm text-muted-foreground">{framework.score}% compliant</div>
                      </div>
                      <Badge variant={framework.status === 'compliant' ? 'default' : 'destructive'}>
                        {framework.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p>No compliance data available</p>
                    <p className="text-sm">Compliance status will appear here once configured</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Support Center
                <Button onClick={createTicket}>
                  <Ticket className="h-4 w-4 mr-2" />
                  New Ticket
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{data.ticketSummary.open}</div>
                  <div className="text-sm text-muted-foreground">Open Tickets</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{data.ticketSummary.inProgress}</div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{data.ticketSummary.resolved}</div>
                  <div className="text-sm text-muted-foreground">Resolved This Month</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="font-medium">Contact Information</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <Phone className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="font-medium">Emergency Line</div>
                      <div className="text-sm text-muted-foreground">+1 (555) 123-4567</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <Mail className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="font-medium">Support Email</div>
                      <div className="text-sm text-muted-foreground">support@ultrium.ai</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    <div>
                      <div className="font-medium">Business Hours</div>
                      <div className="text-sm text-muted-foreground">Mon-Fri 8AM-6PM</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Available Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Monthly Security Report</div>
                      <div className="text-sm text-muted-foreground">Comprehensive security analysis</div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Device Health Report</div>
                      <div className="text-sm text-muted-foreground">System performance overview</div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Compliance Report</div>
                      <div className="text-sm text-muted-foreground">Regulatory compliance status</div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Incident Summary</div>
                      <div className="text-sm text-muted-foreground">Security incidents and responses</div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};