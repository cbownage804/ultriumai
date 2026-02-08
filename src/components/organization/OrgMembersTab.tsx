import { useState, useMemo } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserPlus, Users, Loader2, MoreHorizontal, Trash2, Ban, CheckCircle, Search, Key, Shield, Brain, Monitor } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const PRODUCT_ICONS: Record<string, typeof Shield> = {
  safesuite: Shield,
  ai_studio: Brain,
  vanguard: Monitor,
};

export const OrgMembersTab = () => {
  const {
    members, licenses, assignments, isAdmin, isOwner, inviteMember, removeMember,
    suspendMember, reactivateMember, updateMemberRole,
    organization, canManageMember,
  } = useOrganization();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [inviting, setInviting] = useState(false);
  const [search, setSearch] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ type: 'remove' | 'suspend'; memberId: string; email: string } | null>(null);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setInviting(true);
    const success = await inviteMember(email.trim(), role);
    if (success) setEmail('');
    setInviting(false);
  };

  // Count licenses per member
  const licenseCounts = useMemo(() => {
    const counts: Record<string, string[]> = {};
    for (const a of assignments) {
      const license = licenses.find(l => l.id === a.license_id);
      if (license) {
        if (!counts[a.member_id]) counts[a.member_id] = [];
        counts[a.member_id].push(license.product);
      }
    }
    return counts;
  }, [assignments, licenses]);

  const filteredMembers = useMemo(() => {
    const q = search.toLowerCase();
    return members.filter(m => !q || m.email.toLowerCase().includes(q));
  }, [members, search]);

  const statusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'pending': return 'secondary';
      case 'suspended': return 'destructive';
      default: return 'outline';
    }
  };

  const getInitials = (email: string) => {
    const name = email.split('@')[0];
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Invite */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite Member
            </CardTitle>
            <CardDescription>
              Invite team members by email. They'll get access once they accept.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="email@company.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                className="flex-1"
              />
              <div className="flex gap-2">
                <Select value={role} onValueChange={(v) => setRole(v as 'admin' | 'member')}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleInvite} disabled={inviting || !email.trim()}>
                  {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Invite'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
              <Badge variant="secondary" className="ml-1">{members.length}/{organization?.max_members || 50}</Badge>
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Users className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {search ? 'No members match your search.' : 'No members yet. Invite your first team member above.'}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    {isAdmin && <TableHead className="w-12" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => {
                    const manageable = canManageMember(member);
                    const memberProducts = licenseCounts[member.id] || [];
                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {getInitials(member.email)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{member.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {manageable && isOwner && member.role !== 'owner' ? (
                            <Select
                              value={member.role}
                              onValueChange={(v) => updateMemberRole(member.id, v as 'admin' | 'member')}
                            >
                              <SelectTrigger className="w-28 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="member">Member</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : isAdmin && manageable && member.role !== 'owner' ? (
                            <Select
                              value={member.role}
                              onValueChange={(v) => updateMemberRole(member.id, v as 'admin' | 'member')}
                            >
                              <SelectTrigger className="w-28 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="outline" className="capitalize">{member.role}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <div className="flex items-center gap-1">
                              {memberProducts.length === 0 ? (
                                <span className="text-xs text-muted-foreground">—</span>
                              ) : (
                                [...new Set(memberProducts)].map(p => {
                                  const Icon = PRODUCT_ICONS[p] || Key;
                                  return (
                                    <Tooltip key={p}>
                                      <TooltipTrigger>
                                        <div className="p-1 rounded bg-muted">
                                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent className="text-xs capitalize">{p.replace('_', ' ')}</TooltipContent>
                                    </Tooltip>
                                  );
                                })
                              )}
                            </div>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(member.status) as any} className="capitalize text-xs">
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : '—'}
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            {manageable && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {member.status === 'active' && (
                                    <DropdownMenuItem onClick={() => setConfirmAction({ type: 'suspend', memberId: member.id, email: member.email })}>
                                      <Ban className="h-4 w-4 mr-2" />
                                      Suspend
                                    </DropdownMenuItem>
                                  )}
                                  {member.status === 'suspended' && (
                                    <DropdownMenuItem onClick={() => reactivateMember(member.id)}>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Reactivate
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setConfirmAction({ type: 'remove', memberId: member.id, email: member.email })}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remove
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'remove' ? 'Remove member?' : 'Suspend member?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'remove'
                ? `This will remove ${confirmAction.email} from the organization and revoke all assigned licenses.`
                : `This will suspend ${confirmAction?.email}'s access. Their license assignments will be preserved but inactive.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={confirmAction?.type === 'remove' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
              onClick={() => {
                if (confirmAction?.type === 'remove') removeMember(confirmAction.memberId);
                else if (confirmAction?.type === 'suspend') suspendMember(confirmAction.memberId);
                setConfirmAction(null);
              }}
            >
              {confirmAction?.type === 'remove' ? 'Remove' : 'Suspend'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
