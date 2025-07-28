import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Video, Mail, Users, Settings, ExternalLink, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Office365Config {
  enabled: boolean;
  tenantId: string;
  clientId: string;
  status: 'connected' | 'disconnected' | 'error';
  connectedUser: string;
  permissions: string[];
  syncSettings: {
    calendar: boolean;
    email: boolean;
    teams: boolean;
    contacts: boolean;
  };
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  attendees: number;
  type: 'meeting' | 'maintenance' | 'client-call';
  status: 'confirmed' | 'tentative' | 'cancelled';
}

interface TeamsChannel {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  lastActivity: string;
}

const Office365Integration = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<Office365Config>({
    enabled: false,
    tenantId: '',
    clientId: '',
    status: 'disconnected',
    connectedUser: '',
    permissions: [],
    syncSettings: {
      calendar: true,
      email: false,
      teams: true,
      contacts: true
    }
  });

  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [teamsChannels, setTeamsChannels] = useState<TeamsChannel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadOffice365Config();
    loadCalendarEvents();
    loadTeamsChannels();
  }, []);

  const loadOffice365Config = async () => {
    try {
      const mockConfig: Office365Config = {
        enabled: true,
        tenantId: 'tenant-id-123',
        clientId: 'client-id-456',
        status: 'connected',
        connectedUser: 'admin@msplatform.com',
        permissions: ['Calendars.Read', 'Mail.Read', 'User.Read', 'Team.ReadBasic.All'],
        syncSettings: {
          calendar: true,
          email: false,
          teams: true,
          contacts: true
        }
      };
      setConfig(mockConfig);
    } catch (error) {
      console.error('Failed to load Office 365 config:', error);
    }
  };

  const loadCalendarEvents = async () => {
    try {
      const mockEvents: CalendarEvent[] = [
        {
          id: '1',
          title: 'Client Security Review - TechCorp',
          start: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
          end: new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString(),
          attendees: 4,
          type: 'client-call',
          status: 'confirmed'
        },
        {
          id: '2',
          title: 'Server Maintenance Window',
          start: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
          end: new Date(Date.now() + 1000 * 60 * 60 * 26).toISOString(),
          attendees: 2,
          type: 'maintenance',
          status: 'confirmed'
        },
        {
          id: '3',
          title: 'Team Standup',
          start: new Date(Date.now() + 1000 * 60 * 60 * 24 + 1000 * 60 * 60 * 9).toISOString(),
          end: new Date(Date.now() + 1000 * 60 * 60 * 24 + 1000 * 60 * 60 * 9.5).toISOString(),
          attendees: 8,
          type: 'meeting',
          status: 'confirmed'
        }
      ];
      setUpcomingEvents(mockEvents);
    } catch (error) {
      console.error('Failed to load calendar events:', error);
    }
  };

  const loadTeamsChannels = async () => {
    try {
      const mockChannels: TeamsChannel[] = [
        {
          id: '1',
          name: 'MSP Operations',
          description: 'Main operations channel for MSP team',
          memberCount: 12,
          lastActivity: new Date(Date.now() - 1000 * 60 * 30).toISOString()
        },
        {
          id: '2',
          name: 'Client Alerts',
          description: 'Automated alerts and notifications',
          memberCount: 8,
          lastActivity: new Date(Date.now() - 1000 * 60 * 60).toISOString()
        },
        {
          id: '3',
          name: 'Security Team',
          description: 'Security monitoring and response',
          memberCount: 6,
          lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
        }
      ];
      setTeamsChannels(mockChannels);
    } catch (error) {
      console.error('Failed to load Teams channels:', error);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      // In real implementation, redirect to Microsoft OAuth
      const msAuthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${config.clientId}&response_type=code&redirect_uri=${encodeURIComponent(window.location.origin + '/integrations/office365/callback')}&scope=https://graph.microsoft.com/Calendars.Read%20https://graph.microsoft.com/Mail.Read`;
      
      // For demo, simulate connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      setConfig(prev => ({ 
        ...prev, 
        status: 'connected', 
        enabled: true,
        connectedUser: 'admin@msplatform.com',
        permissions: ['Calendars.Read', 'Mail.Read', 'User.Read']
      }));
      
      toast({
        title: "Office 365 Connected",
        description: "Successfully connected to Microsoft Office 365",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Office 365. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh data
      await loadCalendarEvents();
      await loadTeamsChannels();
      
      toast({
        title: "Sync Complete",
        description: "Office 365 data synchronized successfully",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync Office 365 data",
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

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'client-call': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-orange-100 text-orange-800';
      case 'meeting': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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
                  Office 365 Integration
                  <Badge variant="secondary" className={getStatusColor(config.status)}>
                    {config.status}
                  </Badge>
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  {config.connectedUser || 'No user connected'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {config.status === 'connected' ? (
                <>
                  <Button variant="outline" onClick={handleSync} disabled={isLoading}>
                    {isLoading ? "Syncing..." : "Sync Now"}
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="https://admin.microsoft.com" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Admin Center
                    </a>
                  </Button>
                </>
              ) : (
                <Button onClick={handleConnect} disabled={isLoading}>
                  {isLoading ? "Connecting..." : "Connect to Office 365"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {config.status === 'connected' && (
        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingEvents.map(event => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{event.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{new Date(event.start).toLocaleString()}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{event.attendees}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getEventTypeColor(event.type)}>
                          {event.type.replace('-', ' ')}
                        </Badge>
                        <Badge variant="outline">{event.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Teams Channels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamsChannels.map(channel => (
                    <Card key={channel.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold">{channel.name}</h4>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{channel.memberCount}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {channel.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last activity: {new Date(channel.lastActivity).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Application Permissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {config.permissions.map(permission => (
                    <div key={permission} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-success" />
                        <span className="font-mono text-sm">{permission}</span>
                      </div>
                      <Badge variant="outline" className="text-success">
                        Granted
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Sync Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'calendar', label: 'Calendar Events' },
                    { key: 'email', label: 'Email Messages' },
                    { key: 'teams', label: 'Teams Channels' },
                    { key: 'contacts', label: 'Contact Lists' }
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">{label}</span>
                      <input
                        type="checkbox"
                        checked={config.syncSettings[key as keyof typeof config.syncSettings]}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          syncSettings: { 
                            ...prev.syncSettings, 
                            [key]: e.target.checked 
                          }
                        }))}
                        className="rounded border-gray-300"
                      />
                    </div>
                  ))}
                </div>
                <Button>Save Sync Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {config.status === 'disconnected' && (
        <Card>
          <CardContent className="p-6 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connect to Office 365</h3>
            <p className="text-muted-foreground mb-4">
              Sync your calendar, emails, and Teams data for seamless workflow integration.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button onClick={handleConnect} disabled={isLoading}>
                {isLoading ? "Connecting..." : "Connect Now"}
              </Button>
              <Button variant="outline" asChild>
                <a href="https://office.com" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Learn More
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Office365Integration;