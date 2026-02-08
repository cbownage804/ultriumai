import { useState } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Key, Settings, Plus, Loader2, BarChart3, ShieldCheck } from 'lucide-react';
import { OrgMembersTab } from '@/components/organization/OrgMembersTab';
import { OrgLicensesTab } from '@/components/organization/OrgLicensesTab';
import { OrgSettingsTab } from '@/components/organization/OrgSettingsTab';
import { OrgAnalyticsCards } from '@/components/organization/OrgAnalyticsCards';
import { OrgEmployeeAccessTab } from '@/components/organization/OrgEmployeeAccessTab';

const OrganizationManagement = () => {
  const { user } = useAuth();
  const { organization, loading, createOrganization, members, licenses, isMSPAdmin } = useOrganization();
  const [newOrgName, setNewOrgName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newOrgName.trim()) return;
    setCreating(true);
    await createOrganization(newOrgName.trim());
    setNewOrgName('');
    setCreating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-lg">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Create Your Organization</CardTitle>
            <CardDescription>
              Set up an organization to manage team members and product licenses across SafeSuite, AI Studio, and Vanguard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Organization name"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Button onClick={handleCreate} disabled={creating || !newOrgName.trim()} className="w-full">
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Organization
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeCount = members.filter(m => m.status === 'active').length;
  const licenseCount = licenses.length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">{organization.name}</h1>
              {isMSPAdmin && (
                <Badge variant="secondary" className="text-[10px]">MSP Admin</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {activeCount} active member{activeCount !== 1 ? 's' : ''} · {licenseCount} license{licenseCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-1.5">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Members</span>
          </TabsTrigger>
          <TabsTrigger value="access" className="gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Access</span>
          </TabsTrigger>
          <TabsTrigger value="licenses" className="gap-1.5">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">Licenses</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OrgAnalyticsCards />
        </TabsContent>

        <TabsContent value="members">
          <OrgMembersTab />
        </TabsContent>

        <TabsContent value="access">
          <OrgEmployeeAccessTab />
        </TabsContent>

        <TabsContent value="licenses">
          <OrgLicensesTab />
        </TabsContent>

        <TabsContent value="settings">
          <OrgSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrganizationManagement;
