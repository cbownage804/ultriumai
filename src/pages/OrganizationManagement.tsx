import { useState } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Users, Key, Settings, Plus, Loader2, BarChart3, ShieldCheck } from 'lucide-react';
import { OrgMembersTab } from '@/components/organization/OrgMembersTab';
import { OrgLicensesTab } from '@/components/organization/OrgLicensesTab';
import { OrgSettingsTab } from '@/components/organization/OrgSettingsTab';
import { OrgAnalyticsCards } from '@/components/organization/OrgAnalyticsCards';
import { OrgEmployeeAccessTab } from '@/components/organization/OrgEmployeeAccessTab';

const OrganizationManagement = () => {
  const { user } = useAuth();
  const { organization, loading, createOrganization } = useOrganization();
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{organization.name}</h1>
          <p className="text-sm text-muted-foreground">Manage your team, licenses, and settings</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="access" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Employee Access
          </TabsTrigger>
          <TabsTrigger value="licenses" className="gap-2">
            <Key className="h-4 w-4" />
            Licenses
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
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
