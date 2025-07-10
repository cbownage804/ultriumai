import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, AlertTriangle, TrendingUp, Bell, Activity } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Security Operations Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring and management of your security infrastructure
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">3 critical, 9 medium</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monitored Endpoints</CardTitle>
              <Shield className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,247</div>
              <p className="text-xs text-muted-foreground">98.2% protected</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">12 administrators online</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">99.8%</div>
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>Latest security incidents and responses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">Suspicious login attempt detected</h4>
                    <p className="text-xs text-muted-foreground">Multiple failed login attempts from IP 192.168.1.100</p>
                  </div>
                  <span className="text-xs text-muted-foreground">2 min ago</span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">Unusual network traffic pattern</h4>
                    <p className="text-xs text-muted-foreground">High bandwidth usage detected on endpoint EC2-WEB-01</p>
                  </div>
                  <span className="text-xs text-muted-foreground">15 min ago</span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Shield className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">Security patch applied successfully</h4>
                    <p className="text-xs text-muted-foreground">Windows security update KB5034441 deployed to 45 endpoints</p>
                  </div>
                  <span className="text-xs text-muted-foreground">1 hour ago</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Notifications</CardTitle>
              <CardDescription>Important updates and system messages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Bell className="h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">Scheduled maintenance window</h4>
                    <p className="text-xs text-muted-foreground">System maintenance scheduled for tonight 2:00 AM - 4:00 AM EST</p>
                  </div>
                  <span className="text-xs text-muted-foreground">1 hour ago</span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">Performance optimization completed</h4>
                    <p className="text-xs text-muted-foreground">Database optimization reduced query response time by 35%</p>
                  </div>
                  <span className="text-xs text-muted-foreground">3 hours ago</span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">New team member onboarded</h4>
                    <p className="text-xs text-muted-foreground">Sarah Johnson has been added to the Security Operations team</p>
                  </div>
                  <span className="text-xs text-muted-foreground">5 hours ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
