import { useState } from 'react';
import { useAccountType } from '@/hooks/useAccountType';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Building2, CreditCard, Bot, Database, Settings, TrendingUp } from 'lucide-react';
import { AdminUsersManager } from '@/components/admin/AdminUsersManager';
import { AdminMSPsManager } from '@/components/admin/AdminMSPsManager';
import { AdminSubscriptionsManager } from '@/components/admin/AdminSubscriptionsManager';
import { AdminGPTsManager } from '@/components/admin/AdminGPTsManager';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { AdminNotifications } from '@/components/admin/AdminNotifications';
import { DataExporter } from '@/components/admin/DataExporter';

const AdminDashboard = () => {
  const { isUltriumEmployee, loading } = useAccountType();
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isUltriumEmployee) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[80vh]">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                This area is restricted to UltriumAI employees only.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">UltriumAI Employee Management Portal</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <DataExporter entityType="analytics" />
            <AdminNotifications />
            <Badge variant="secondary">
              <Shield className="h-3 w-3 mr-1" />
              Admin Access
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="msps" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              MSPs
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="gpts" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              GPTs
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,247</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active MSPs</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">87</div>
                  <p className="text-xs text-muted-foreground">
                    +3 new this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$124,590</div>
                  <p className="text-xs text-muted-foreground">
                    +8% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Custom GPTs</CardTitle>
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2,847</div>
                  <p className="text-xs text-muted-foreground">
                    +156 created this month
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest platform activity and important events
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New Enterprise customer signed up</p>
                    <p className="text-xs text-muted-foreground">TechCorp Solutions - 2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">MSP upgraded subscription</p>
                    <p className="text-xs text-muted-foreground">SecureIT MSP - 15 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">High volume GPT usage detected</p>
                    <p className="text-xs text-muted-foreground">User: john@example.com - 30 minutes ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <AdminUsersManager />
          </TabsContent>

          <TabsContent value="msps">
            <AdminMSPsManager />
          </TabsContent>

          <TabsContent value="subscriptions">
            <AdminSubscriptionsManager />
          </TabsContent>

          <TabsContent value="gpts">
            <AdminGPTsManager />
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default AdminDashboard;