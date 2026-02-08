import { useMemo } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Users, Key, TrendingUp, DollarSign, UserCheck, UserX, Clock,
  CalendarClock, AlertTriangle, UserPlus, Plus, ArrowRight, Shield, Brain, Monitor,
} from 'lucide-react';

const PRODUCT_LABELS: Record<string, string> = {
  safesuite: 'SafeSuite',
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

    // Cost breakdown by product
    const costByProduct = licenses.reduce((acc, l) => {
      const label = PRODUCT_LABELS[l.product] || l.product;
      const price = PRICING[l.product]?.[l.access_level] || 0;
      const multiplier = l.billing_cycle === 'yearly' ? 0.8 : 1;
      acc[label] = (acc[label] || 0) + price * l.total_seats * multiplier;
      return acc;
    }, {} as Record<string, number>);

    // Unassigned seats per license
    const unassignedByLicense = licenses.map(l => ({
      label: `${PRODUCT_LABELS[l.product]} ${l.access_level}`,
      unassigned: l.total_seats - l.used_seats,
      total: l.total_seats,
    })).filter(l => l.unassigned > 0);

    // License renewal timeline
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

    // Members without any license
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
        <Button size="sm" variant="outline" onClick={() => scrollToTab('licenses')}>
          <Key className="h-4 w-4 mr-1.5" />
          Assign Seats
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeMembers}</p>
                <p className="text-xs text-muted-foreground">Active Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <TrendingUp className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.seatUtilization}%</p>
                <p className="text-xs text-muted-foreground">Seat Utilization</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.usedSeats}/{stats.totalSeats}</p>
                <p className="text-xs text-muted-foreground">Seats Used</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats.monthlyCost.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Est. Monthly Cost</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
              These active members have no product licenses assigned and can't access paid features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.unlicensedMembers.slice(0, 5).map(m => (
                <div key={m.id} className="flex items-center justify-between py-1.5 px-3 rounded-md bg-muted/50">
                  <span className="text-sm">{m.email}</span>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => scrollToTab('licenses')}>
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

      {/* Middle Row: Renewal Timeline + Cost Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* License Renewal Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Renewal Timeline
            </CardTitle>
            <CardDescription>Upcoming license renewals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.renewals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active licenses with renewal dates.</p>
            ) : (
              stats.renewals.map((r, i) => {
                const Icon = PRODUCT_ICONS[r.productKey] || Key;
                return (
                  <div key={i} className="flex items-center justify-between gap-2">
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

        {/* Cost Breakdown & Budgeting */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Cost Breakdown
            </CardTitle>
            <CardDescription>Spending by product & projections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Per-product breakdown */}
            {Object.entries(stats.costByProduct).length > 0 ? (
              <div className="space-y-2">
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
              <p className="text-sm text-muted-foreground">No licenses purchased yet.</p>
            )}

            {/* Summary stats */}
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cost per member</span>
                <span className="font-medium">${stats.costPerMember.toFixed(2)}/mo</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Projected annual</span>
                <span className="font-semibold">${stats.annualProjected.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Member Status + Unassigned Seats */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Member Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <UserCheck className="h-4 w-4 text-primary" />
                Active
              </div>
              <Badge variant="default">{stats.activeMembers}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Pending
              </div>
              <Badge variant="secondary">{stats.pendingMembers}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <UserX className="h-4 w-4 text-destructive" />
                Suspended
              </div>
              <Badge variant="destructive">{stats.suspendedMembers}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unassigned Seats</CardTitle>
            <CardDescription>Licenses with available seats to assign</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.unassignedByLicense.length === 0 ? (
              <p className="text-sm text-muted-foreground">All seats are assigned.</p>
            ) : (
              stats.unassignedByLicense.map((l, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{l.label}</span>
                  <Badge variant="outline">{l.unassigned} of {l.total} free</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};