import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  LayoutDashboard,
  Sparkles,
  Shield,
  Zap,
  Settings,
  Users,
  FileText,
  Building2,
  Share2
} from 'lucide-react';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { AdminOverviewTab } from '@/components/admin/unified/AdminOverviewTab';
import { AllUsersAdminTab } from '@/components/admin/unified/AllUsersAdminTab';
import { AIStudioAdminTab } from '@/components/admin/unified/AIStudioAdminTab';
import { SafeSuiteAdminTab } from '@/components/admin/unified/SafeSuiteAdminTab';
import { VanguardAdminTab } from '@/components/admin/unified/VanguardAdminTab';
import { AdminAuditLogTab } from '@/components/admin/unified/AdminAuditLogTab';
import { MSPCapacityReportingTab } from '@/components/admin/unified/MSPCapacityReportingTab';
import { SocialMediaManager } from '@/components/social/SocialMediaManager';

const UnifiedAdminCenter = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdminAccess();
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Admin Center
                </h1>
                <p className="text-sm text-muted-foreground">
                  Unified management for all UltriumAI products
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              Internal Admin
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-background">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="all-users" className="gap-2 data-[state=active]:bg-background">
              <Users className="h-4 w-4" />
              All Users
            </TabsTrigger>
            <TabsTrigger value="ai-studio" className="gap-2 data-[state=active]:bg-background">
              <Sparkles className="h-4 w-4" />
              AI Studio
            </TabsTrigger>
            <TabsTrigger value="safesuite" className="gap-2 data-[state=active]:bg-background">
              <Shield className="h-4 w-4" />
              SafeSuite
            </TabsTrigger>
            <TabsTrigger value="vanguard" className="gap-2 data-[state=active]:bg-background">
              <Zap className="h-4 w-4" />
              Vanguard
            </TabsTrigger>
            <TabsTrigger value="msp-capacity" className="gap-2 data-[state=active]:bg-background">
              <Building2 className="h-4 w-4" />
              MSP Capacity
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-2 data-[state=active]:bg-background">
              <Share2 className="h-4 w-4" />
              Social Media
            </TabsTrigger>
            <TabsTrigger value="audit-log" className="gap-2 data-[state=active]:bg-background">
              <FileText className="h-4 w-4" />
              Audit Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <AdminOverviewTab onNavigateToTab={setActiveTab} />
          </TabsContent>

          <TabsContent value="all-users" className="mt-6">
            <AllUsersAdminTab />
          </TabsContent>

          <TabsContent value="ai-studio" className="mt-6">
            <AIStudioAdminTab />
          </TabsContent>

          <TabsContent value="safesuite" className="mt-6">
            <SafeSuiteAdminTab />
          </TabsContent>

          <TabsContent value="vanguard" className="mt-6">
            <VanguardAdminTab />
          </TabsContent>

          <TabsContent value="msp-capacity" className="mt-6">
            <MSPCapacityReportingTab />
          </TabsContent>

          <TabsContent value="social" className="mt-6">
            <SocialMediaManager />
          </TabsContent>

          <TabsContent value="audit-log" className="mt-6">
            <AdminAuditLogTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default UnifiedAdminCenter;
