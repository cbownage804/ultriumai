import { useMemo } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Users, Key, TrendingUp, DollarSign, UserCheck, UserX, Clock,
  CalendarClock, AlertTriangle, UserPlus, Plus, ArrowRight, Shield, Brain, Monitor, Info,
} from 'lucide-react';

const PRODUCT_LABELS: Record<string, string> = {
  safesuite: 'Wrayth',
  ai_studio: 'AI Studio',
  vanguard: 'Vanguard',
};

const PRODUCT_ICONS: Record<string, typeof Shield> = {
  safesuite: Shield,
  ai_studio: Brain,
  vanguard: Monitor,
};

const PRICING: Record<string, Record<string, number>> = {
  safesuite: { pro: 9.99, business: 15, enterprise: 45 },
  ai_studio: { pro: 19.99, business: 39.99, enterprise: 79.99 },
  vanguard: { pro: 29.99, business: 59.99, enterprise: 99.99 },
};

export const OrgAnalyticsCards = () => {
  const { members, licenses, assignments } = useOrganization();

  const stats = useMemo(() => {
    const activeMembers = members.filter(m => m.status === 'active').length;
    const pendingMembers = members.filter(m => m.status === 'pending').length;
    const suspendedMembers = members.filter(m => m.status === 'suspended').length;

    const totalSeats = licenses.reduce((sum, l) => sum + l.total_seats, 0);
    const usedSeats = licenses.reduce((sum, l) => sum + l.used_seats, 0);
    const seatUtilization = totalSeats > 0 ? Math.round((usedSeats / totalSeats) * 100) : 0;

    const monthlyCost = licenses.reduce((sum, l) => {
      const price = PRICING[l.product]?.[l.access_level] || 0;
      const multiplier = l.billing_cycle === 'yearly' ? 0.8 : 1;
      return sum + price * l.total_seats * multiplier;
    }, 0);

    const costPerMember = activeMembers > 0 ? monthlyCost / activeMembers : 0;
    const annualProjected = monthlyCost * 12;

    const costByProduct = licenses.reduce((acc, l) => {
      const label = PRODUCT_LABELS[l.product] || l.product;
      const price = PRICING[l.product]?.[l.access_level] || 0;
      const multiplier = l.billing_cycle === 'yearly' ? 0.8 : 1;
      acc[label] = (acc[label] || 0) + price * l.total_seats * multiplier;
      return acc;
    }, {} as Record<string, number>);

    const unassignedByLicense = licenses.map(l => ({
      label: `${PRODUCT_LABELS[l.product]} ${l.access_level}`,
      product: l.product,
      unassigned: l.total_seats - l.used_seats,
      total: l.total_seats,
    })).filter(l => l.unassigned > 0);

    const now = new Date();
    const renewals = licenses
      .filter(l => l.expires_at)
      .map(l => {
        const expiresAt = new Date(l.expires_at!);
        const daysUntil = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          product: PRODUCT_LABELS[l.product] || l.product,
          productKey: l.product,
          accessLevel: l.access_level,
          seats: l.total_seats,
          expiresAt,
          daysUntil,
          urgency: daysUntil <= 7 ? 'critical' : daysUntil <= 30 ? 'warning' : 'ok',
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);

    const assignedMemberIds = new Set(assignments.map(a => a.member_id));
    const unlicensedMembers = members.filter(
      m => m.status === 'active' && !assignedMemberIds.has(m.id)
    );

    return {
      activeMembers, pendingMembers, suspendedMembers,
      totalSeats, usedSeats, seatUtilization,
      monthlyCost, costPerMember, annualProjected,
      costByProduct, unassignedByLicense,
      renewals, unlicensedMembers,
    };
  }, [members, licenses, assignments]);

  const scrollToTab = (tabValue: string) => {
    const trigger = document.querySelector(`[data-state][value="${tabValue}"]`) as HTMLElement;
    if (trigger) trigger.click();
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => scrollToTab('members')}>
            <UserPlus className="h-4 w-4 mr-1.5" />
            Invite Member
          </Button>
          <Button size="sm" variant="outline" onClick={() => scrollToTab('licenses')}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add License
          </Button>
          <Button size="sm" variant="outline" onClick={() => scrollToTab('access')}>
            <Key className="h-4 w-4 mr-1.5" />
            Manage Access
          </Button>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Active Members', value: String(stats.activeMembers), sub: stats.pendingMembers > 0 ? `+${stats.pendingMembers} pending` : undefined },
            { icon: TrendingUp, label: 'Seat Utilization', value: `${stats.seatUtilization}%`, sub: stats.seatUtilization < 50 ? 'Under-utilized' : stats.seatUtilization > 90 ? 'Near capacity' : undefined },
            { icon: Key, label: 'Seats Used', value: `${stats.usedSeats}/${stats.totalSeats}` },
            { icon: DollarSign, label: 'Monthly Cost', value: `$${stats.monthlyCost.toFixed(0)}`, sub: `$${stats.costPerMember.toFixed(0)}/member` },
          ].map((kpi, i) => (
            <Card key={i}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <kpi.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold leading-tight">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground truncate">{kpi.label}</p>
                    {kpi.sub && <p className="text-[10px] text-muted-foreground">{kpi.sub}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Unlicensed Members Alert */}
        {stats.unlicensedMembers.length > 0 && (
          <Card className="border-destructive/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {stats.unlicensedMembers.length} Member{stats.unlicensedMembers.length !== 1 ? 's' : ''} Without Licenses
              </CardTitle>
              <CardDescription>
                Active members with no product access. Assign licenses so they can use paid features.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {stats.unlicensedMembers.slice(0, 5).map(m => (
                  <div key={m.id} className="flex items-center justify-between py-1.5 px-3 rounded-md bg-muted/50">
                    <span className="text-sm">{m.email}</span>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => scrollToTab('access')}>
                      Assign <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                ))}
                {stats.unlicensedMembers.length > 5 && (
                  <p className="text-xs text-muted-foreground pl-3">
                    +{stats.unlicensedMembers.length - 5} more
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Middle Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Renewal Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                Renewal Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {stats.renewals.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No renewal dates set.</p>
              ) : (
                stats.renewals.map((r, i) => {
                  const Icon = PRODUCT_ICONS[r.productKey] || Key;
                  return (
                    <div key={i} className="flex items-center justify-between gap-2 py-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm truncate capitalize">{r.product} {r.accessLevel}</span>
                        <Badge variant="outline" className="text-[10px] shrink-0">{r.seats} seats</Badge>
                      </div>
                      <Badge
                        variant={r.urgency === 'critical' ? 'destructive' : r.urgency === 'warning' ? 'secondary' : 'outline'}
                        className="shrink-0"
                      >
                        {r.daysUntil <= 0 ? 'Expired' : r.daysUntil === 1 ? 'Tomorrow' : `${r.daysUntil}d`}
                      </Badge>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Cost Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Cost Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(stats.costByProduct).length > 0 ? (
                <div className="space-y-2.5">
                  {Object.entries(stats.costByProduct).map(([product, cost]) => {
                    const pct = stats.monthlyCost > 0 ? (cost / stats.monthlyCost) * 100 : 0;
                    return (
                      <div key={product} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{product}</span>
                          <span className="font-medium">${cost.toFixed(2)}/mo</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">No licenses yet.</p>
              )}

              {stats.monthlyCost > 0 && (
                <div className="border-t border-border pt-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      Cost per member
                      <Tooltip>
                        <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                        <TooltipContent className="text-xs">Total monthly cost ÷ active members</TooltipContent>
                      </Tooltip>
                    </span>
                    <span className="font-medium">${stats.costPerMember.toFixed(2)}/mo</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Projected annual</span>
                    <span className="font-semibold">${stats.annualProjected.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Member Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {[
                { icon: UserCheck, label: 'Active', count: stats.activeMembers, variant: 'default' as const, iconClass: 'text-primary' },
                { icon: Clock, label: 'Pending', count: stats.pendingMembers, variant: 'secondary' as const, iconClass: 'text-muted-foreground' },
                { icon: UserX, label: 'Suspended', count: stats.suspendedMembers, variant: 'destructive' as const, iconClass: 'text-destructive' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <s.icon className={`h-4 w-4 ${s.iconClass}`} />
                    {s.label}
                  </div>
                  <Badge variant={s.variant}>{s.count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Unassigned Seats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {stats.unassignedByLicense.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">All seats assigned.</p>
              ) : (
                stats.unassignedByLicense.map((l, i) => {
                  const Icon = PRODUCT_ICONS[l.product] || Key;
                  return (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm capitalize">{l.label}</span>
                      </div>
                      <Badge variant="outline">{l.unassigned} of {l.total} free</Badge>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
};
