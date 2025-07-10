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
import { AuditTrailsViewer } from '@/components/admin/AuditTrailsViewer';
import { AdminDashboardOverview } from '@/components/admin/AdminDashboardOverview';
import BulkOperations from '@/components/admin/BulkOperations';
import { SystemMonitoring } from '@/components/admin/SystemMonitoring';
import { GlobalSearch } from '@/components/admin/GlobalSearch';
import { UserActivityDashboard } from '@/components/admin/UserActivityDashboard';
import { RevenueAnalyticsDashboard } from '@/components/admin/RevenueAnalyticsDashboard';
import { SystemHealthMonitoring } from '@/components/admin/SystemHealthMonitoring';
import { WorkflowAutomationManager } from '@/components/admin/WorkflowAutomationManager';
import { MSPClientSupportManager } from '@/components/admin/MSPClientSupportManager';

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
          <TabsList className="grid w-full grid-cols-12">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Search
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Health
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Automation
            </TabsTrigger>
            <TabsTrigger value="msp-support" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              MSP Support
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="gpts" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              GPTs
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Bulk Ops
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Audit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <AdminDashboardOverview onTabChange={setActiveTab} />
          </TabsContent>

          <TabsContent value="search">
            <GlobalSearch />
          </TabsContent>

          <TabsContent value="activity">
            <UserActivityDashboard />
          </TabsContent>

          <TabsContent value="revenue">
            <RevenueAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="health">
            <SystemHealthMonitoring />
          </TabsContent>

          <TabsContent value="automation">
            <WorkflowAutomationManager />
          </TabsContent>

          <TabsContent value="msp-support">
            <MSPClientSupportManager />
          </TabsContent>

          <TabsContent value="users">
            <AdminUsersManager />
          </TabsContent>

          <TabsContent value="subscriptions">
            <AdminSubscriptionsManager />
          </TabsContent>

          <TabsContent value="gpts">
            <AdminGPTsManager />
          </TabsContent>

          <TabsContent value="bulk">
            <BulkOperations />
          </TabsContent>

          <TabsContent value="monitoring">
            <SystemMonitoring />
          </TabsContent>

          <TabsContent value="audit">
            <AuditTrailsViewer />
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default AdminDashboard;