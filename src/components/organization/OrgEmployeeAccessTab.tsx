import { useMemo, useState } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Shield, Brain, Monitor, UserX, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const PRODUCTS = [
  { key: 'safesuite', label: 'SafeSuite', Icon: Shield },
  { key: 'ai_studio', label: 'AI Studio', Icon: Brain },
  { key: 'vanguard', label: 'Vanguard', Icon: Monitor },
] as const;

export const OrgEmployeeAccessTab = () => {
  const {
    members, licenses, assignments, isAdmin,
    assignLicense, unassignLicense, offboardMember,
  } = useOrganization();

  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);
  const [offboardTarget, setOffboardTarget] = useState<{ id: string; email: string } | null>(null);
  const [offboarding, setOffboarding] = useState(false);

  // Build a lookup: memberId → { product → { assigned: boolean, assignmentId?, licenseId? } }
  const accessMap = useMemo(() => {
    const map: Record<string, Record<string, { assigned: boolean; assignmentId?: string; licenseId?: string; accessLevel?: string }>> = {};

    for (const member of members) {
      map[member.id] = {};
      for (const p of PRODUCTS) {
        map[member.id][p.key] = { assigned: false };
      }
    }

    for (const a of assignments) {
      const license = licenses.find(l => l.id === a.license_id);
      if (!license) continue;
      if (map[a.member_id]) {
        map[a.member_id][license.product] = {
          assigned: true,
          assignmentId: a.id,
          licenseId: license.id,
          accessLevel: license.access_level,
        };
      }
    }

    return map;
  }, [members, licenses, assignments]);

  // Available licenses with free seats per product
  const availableLicenses = useMemo(() => {
    const map: Record<string, { id: string; accessLevel: string; freeSeats: number }[]> = {};
    for (const l of licenses) {
      const free = l.total_seats - l.used_seats;
      if (free > 0) {
        if (!map[l.product]) map[l.product] = [];
        map[l.product].push({ id: l.id, accessLevel: l.access_level, freeSeats: free });
      }
    }
    return map;
  }, [licenses]);

  const filteredMembers = useMemo(() => {
    const q = search.toLowerCase();
    return members
      .filter(m => m.status !== 'suspended')
      .filter(m => !q || m.email.toLowerCase().includes(q));
  }, [members, search]);

  const handleToggle = async (memberId: string, product: string) => {
    const current = accessMap[memberId]?.[product];
    if (!current) return;

    const key = `${memberId}-${product}`;
    setToggling(key);

    if (current.assigned && current.assignmentId) {
      await unassignLicense(current.assignmentId);
    } else {
      // Find first available license for this product
      const available = availableLicenses[product];
      if (available && available.length > 0) {
        await assignLicense(available[0].id, memberId);
      }
    }

    setToggling(null);
  };

  const handleOffboard = async () => {
    if (!offboardTarget) return;
    setOffboarding(true);
    await offboardMember(offboardTarget.id);
    setOffboarding(false);
    setOffboardTarget(null);
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Only organization admins can manage employee access.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Employee Product Access</CardTitle>
          <CardDescription>
            Toggle which products each team member can access. Access is tied to your organization's licenses and available seats.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {filteredMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No active members found.
            </p>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Role</TableHead>
                    {PRODUCTS.map(p => (
                      <TableHead key={p.key} className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <p.Icon className="h-3.5 w-3.5" />
                          <span className="text-xs">{p.label}</span>
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map(member => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs">{member.role}</Badge>
                      </TableCell>
                      {PRODUCTS.map(p => {
                        const access = accessMap[member.id]?.[p.key];
                        const isToggling = toggling === `${member.id}-${p.key}`;
                        const noSeats = !access?.assigned && (!availableLicenses[p.key] || availableLicenses[p.key].length === 0);
                        return (
                          <TableCell key={p.key} className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              {isToggling ? (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              ) : (
                                <Switch
                                  checked={!!access?.assigned}
                                  onCheckedChange={() => handleToggle(member.id, p.key)}
                                  disabled={noSeats && !access?.assigned}
                                />
                              )}
                              {access?.assigned && access.accessLevel && (
                                <span className="text-[10px] text-muted-foreground capitalize">{access.accessLevel}</span>
                              )}
                              {noSeats && !access?.assigned && (
                                <span className="text-[10px] text-destructive">No seats</span>
                              )}
                            </div>
                          </TableCell>
                        );
                      })}
                      <TableCell>
                        {member.role !== 'owner' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            onClick={() => setOffboardTarget({ id: member.id, email: member.email })}
                          >
                            <UserX className="h-3.5 w-3.5 mr-1" />
                            Offboard
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Offboard Confirmation */}
      <AlertDialog open={!!offboardTarget} onOpenChange={(o) => !o && setOffboardTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Offboard employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke all product licenses assigned to <strong>{offboardTarget?.email}</strong>, suspend their account, and remove their product access. This action can be reversed by reactivating the member later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleOffboard}
              disabled={offboarding}
            >
              {offboarding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserX className="h-4 w-4 mr-2" />}
              Offboard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
