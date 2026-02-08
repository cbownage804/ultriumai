import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Key, Shield, Brain, Monitor, UserPlus, UserMinus } from 'lucide-react';

const PRODUCT_META: Record<string, { label: string; icon: typeof Shield; color: string }> = {
  safesuite: { label: 'SafeSuite', icon: Shield, color: 'text-green-500' },
  ai_studio: { label: 'AI Studio', icon: Brain, color: 'text-purple-500' },
  vanguard: { label: 'Vanguard', icon: Monitor, color: 'text-blue-500' },
};

export const OrgLicensesTab = () => {
  const { licenses, members, assignments, isAdmin, assignLicense, unassignLicense } = useOrganization();

  const activeMembers = members.filter(m => m.status === 'active');

  const getMemberAssignment = (licenseId: string, memberId: string) => {
    return assignments.find(a => a.license_id === licenseId && a.member_id === memberId);
  };

  const getAssignedMembers = (licenseId: string) => {
    return assignments.filter(a => a.license_id === licenseId);
  };

  const getUnassignedMembers = (licenseId: string) => {
    const assignedMemberIds = new Set(getAssignedMembers(licenseId).map(a => a.member_id));
    return activeMembers.filter(m => !assignedMemberIds.has(m.id));
  };

  if (licenses.length === 0) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Key className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>No Licenses Yet</CardTitle>
          <CardDescription>
            Purchase product licenses to assign to your team members. Visit the pricing page for each product to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <a href="/pricing/safesuite">SafeSuite</a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/pricing/ai-studio">AI Studio</a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/pricing/vanguard">Vanguard</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {licenses.map((license) => {
        const meta = PRODUCT_META[license.product] || { label: license.product, icon: Key, color: 'text-foreground' };
        const Icon = meta.icon;
        const seatUsage = (license.used_seats / license.total_seats) * 100;
        const assignedMembers = getAssignedMembers(license.id);
        const unassignedMembers = getUnassignedMembers(license.id);

        return (
          <Card key={license.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${meta.color}`} />
                  {meta.label}
                  <Badge variant="outline" className="capitalize ml-2">{license.access_level}</Badge>
                </CardTitle>
                <div className="text-right">
                  <p className="text-sm font-medium">{license.used_seats} / {license.total_seats} seats</p>
                  <p className="text-xs text-muted-foreground capitalize">{license.billing_cycle}</p>
                </div>
              </div>
              <Progress value={seatUsage} className="h-2" />
              {license.expires_at && (
                <p className="text-xs text-muted-foreground">
                  Renews {new Date(license.expires_at).toLocaleDateString()}
                </p>
              )}
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Assigned members */}
              {assignedMembers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Assigned Members</p>
                  {assignedMembers.map((assignment) => {
                    const member = members.find(m => m.id === assignment.member_id);
                    if (!member) return null;
                    return (
                      <div key={assignment.id} className="flex items-center justify-between py-1.5 px-3 rounded-md bg-muted/50">
                        <span className="text-sm">{member.email}</span>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            onClick={() => unassignLicense(assignment.id)}
                          >
                            <UserMinus className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Assign new member */}
              {isAdmin && license.used_seats < license.total_seats && unassignedMembers.length > 0 && (
                <div className="flex items-center gap-2 pt-2">
                  <Select onValueChange={(memberId) => assignLicense(license.id, memberId)}>
                    <SelectTrigger className="flex-1 h-9">
                      <SelectValue placeholder="Assign a member…" />
                    </SelectTrigger>
                    <SelectContent>
                      {unassignedMembers.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </div>
              )}

              {license.used_seats >= license.total_seats && (
                <p className="text-xs text-amber-500 font-medium">All seats are assigned. Upgrade to add more.</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
