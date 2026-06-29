import { useMemo, useState } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Shield, Brain, Monitor, UserX, Loader2, Search, ShieldCheck, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PRODUCTS = [
  { key: 'safesuite', label: 'Wrayth', Icon: Shield },
  { key: 'ai_studio', label: 'AI Studio', Icon: Brain },
  { key: 'vanguard', label: 'Vanguard', Icon: Monitor },
] as const;

export const OrgEmployeeAccessTab = () => {
  const {
    members, licenses, assignments, isAdmin,
    assignLicense, unassignLicense, offboardMember,
  } = useOrganization();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending'>('all');
  const [toggling, setToggling] = useState<string | null>(null);
  const [offboardTarget, setOffboardTarget] = useState<{ id: string; email: string } | null>(null);
  const [offboarding, setOffboarding] = useState(false);

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

  // Seat summary per product
  const seatSummary = useMemo(() => {
    return PRODUCTS.map(p => {
      const productLicenses = licenses.filter(l => l.product === p.key);
      const total = productLicenses.reduce((s, l) => s + l.total_seats, 0);
      const used = productLicenses.reduce((s, l) => s + l.used_seats, 0);
      return { ...p, total, used, free: total - used };
    });
  }, [licenses]);

  const filteredMembers = useMemo(() => {
    const q = search.toLowerCase();
    return members
      .filter(m => m.status !== 'suspended')
      .filter(m => statusFilter === 'all' || m.status === statusFilter)
      .filter(m => !q || m.email.toLowerCase().includes(q));
  }, [members, search, statusFilter]);

  const handleToggle = async (memberId: string, product: string) => {
    const current = accessMap[memberId]?.[product];
    if (!current) return;
    const key = `${memberId}-${product}`;
    setToggling(key);
    if (current.assigned && current.assignmentId) {
      await unassignLicense(current.assignmentId);
    } else {
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

  const getInitials = (email: string) => email.split('@')[0].slice(0, 2).toUpperCase();

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ShieldCheck className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">Only organization admins can manage employee access.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seat Summary Bar */}
      <div className="grid grid-cols-3 gap-3">
        {seatSummary.map(s => (
          <Card key={s.key}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <s.Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{s.label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold">{s.free}</span>
                <span className="text-xs text-muted-foreground">of {s.total} seats free</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Access Matrix */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Employee Product Access</CardTitle>
              <CardDescription>
                Toggle products per employee. Access syncs to their account immediately.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-28 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 w-48"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <ShieldCheck className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {search ? 'No members match your search.' : 'No active members to manage.'}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      {PRODUCTS.map(p => (
                        <TableHead key={p.key} className="text-center w-28">
                          <div className="flex items-center justify-center gap-1.5">
                            <p.Icon className="h-3.5 w-3.5" />
                            <span className="text-xs">{p.label}</span>
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="w-24" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map(member => {
                      const productCount = PRODUCTS.filter(p => accessMap[member.id]?.[p.key]?.assigned).length;
                      return (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {getInitials(member.email)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{member.email}</p>
                                <div className="flex items-center gap-1.5">
                                  <Badge variant="outline" className="capitalize text-[10px] h-4">{member.role}</Badge>
                                  {productCount === 0 && (
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Info className="h-3 w-3 text-destructive" />
                                      </TooltipTrigger>
                                      <TooltipContent className="text-xs">No products assigned</TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          {PRODUCTS.map(p => {
                            const access = accessMap[member.id]?.[p.key];
                            const isToggling = toggling === `${member.id}-${p.key}`;
                            const noSeats = !access?.assigned && (!availableLicenses[p.key] || availableLicenses[p.key].length === 0);
                            return (
                              <TableCell key={p.key} className="text-center">
                                <div className="flex flex-col items-center gap-0.5">
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
                      );
                    })}
                  </TableBody>
                </Table>
              </TooltipProvider>
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
              This will revoke all product licenses assigned to <strong>{offboardTarget?.email}</strong>, suspend their account, and remove their product access. This can be reversed by reactivating them later.
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
